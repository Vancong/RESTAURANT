import { Router } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Restaurant, RestaurantStatus } from "../models/Restaurant.js";
import { User, UserRole } from "../models/User.js";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth.js";
import { sendNewRestaurantWelcomeEmail, sendEmailChangeOTP } from "../services/emailService.js";
import { EmailChangeToken } from "../models/EmailChangeToken.js";
import fetch from "node-fetch";

const router = Router();
const APP_BASE_URL =
  process.env.APP_BASE_URL ||
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  "http://localhost:5173";

// Lấy danh sách nhà hàng
router.get("/", async (_req, res) => {
  const restaurants = await Restaurant.find().sort({ createdAt: -1 });
  res.json(restaurants);
});

// Tạo nhà hàng mới + tài khoản admin nhà hàng
router.post("/", async (req, res) => {
  try {
    const {
      name,
      username,
      password,
      ownerName,
      email,
      address,
      phone,
      status
    } = req.body;

    if (
      !name ||
      !username ||
      !password ||
      !ownerName ||
      !email ||
      !address ||
      !phone ||
      !status
    ) {
      return res.status(400).json({
        message:
          "Thiếu thông tin bắt buộc (name, username, password, ownerName, email, address, phone, status)."
      });
    }

    if (!Object.values(RestaurantStatus).includes(status as RestaurantStatus)) {
      return res.status(400).json({ message: "Trạng thái nhà hàng không hợp lệ" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username đã tồn tại" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingEmailRestaurant = await Restaurant.findOne({
      email: normalizedEmail
    });
    if (existingEmailRestaurant) {
      return res.status(400).json({ message: "Email nhà hàng đã tồn tại" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const normalizedStatus =
      status === RestaurantStatus.INACTIVE ? RestaurantStatus.INACTIVE : RestaurantStatus.ACTIVE;

    const restaurant = await Restaurant.create({
      name,
      username,
      ownerName,
      email: normalizedEmail,
      address,
      phone,
      status: normalizedStatus,
      active: normalizedStatus === RestaurantStatus.ACTIVE
    });

    await User.create({
      username,
      passwordHash,
      role: UserRole.RESTAURANT_ADMIN,
      restaurantId: restaurant._id
    });

    try {
      await sendNewRestaurantWelcomeEmail({
        to: normalizedEmail,
        restaurantName: name,
        ownerName,
        username,
        password,
        dashboardUrl: APP_BASE_URL
      });
    } catch (mailError) {
      console.error("Không thể gửi email chào mừng nhà hàng mới", mailError);
    }

    res.status(201).json(restaurant);
  } catch (error) {
    res.status(400).json({ message: "Không thể tạo nhà hàng", error });
  }
});

// Restaurant Admin yêu cầu gửi OTP để đổi email
router.post(
  "/me/request-email-change",
  requireAuth,
  requireRole([UserRole.RESTAURANT_ADMIN] as string[]),
  async (req: AuthRequest, res) => {
    try {
      const restaurantId = req.auth?.restaurantId;
      if (!restaurantId) {
        return res.status(403).json({ message: "Không xác định được nhà hàng" });
      }

      const { newEmail } = req.body as { newEmail?: string };
      if (!newEmail) {
        return res.status(400).json({ message: "Thiếu email mới" });
      }

      const normalizedNewEmail = newEmail.trim().toLowerCase();

      // Kiểm tra email mới có trùng với nhà hàng khác không
      const existingRestaurant = await Restaurant.findOne({
        email: normalizedNewEmail,
        _id: { $ne: restaurantId }
      });
      if (existingRestaurant) {
        return res.status(400).json({ message: "Email đã được sử dụng bởi nhà hàng khác" });
      }

      // Lấy thông tin restaurant hiện tại
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Không tìm thấy nhà hàng" });
      }

      // Kiểm tra email mới có khác email cũ không
      if (restaurant.email.toLowerCase() === normalizedNewEmail) {
        return res.status(400).json({ message: "Email mới phải khác email hiện tại" });
      }

      // Tạo OTP 6 chữ số
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Lưu OTP vào database (hết hạn sau 15 phút)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // Xóa các OTP cũ chưa dùng của restaurant này
      await EmailChangeToken.deleteMany({
        restaurantId: new mongoose.Types.ObjectId(restaurantId),
        used: false
      });

      await EmailChangeToken.create({
        restaurantId: new mongoose.Types.ObjectId(restaurantId),
        newEmail: normalizedNewEmail,
        otp,
        expiresAt,
        used: false
      });

      // Gửi email chứa OTP đến email hiện tại
      try {
        await sendEmailChangeOTP({
          to: restaurant.email,
          restaurantName: restaurant.name,
          ownerName: restaurant.ownerName,
          otp,
          newEmail: normalizedNewEmail
        });
      } catch (mailError) {
        console.error("Không thể gửi email OTP đổi email", mailError);
        return res.status(500).json({
          message: "Không thể gửi email OTP. Vui lòng thử lại sau."
        });
      }

      return res.json({
        message: "Đã gửi mã OTP đến email hiện tại của nhà hàng"
      });
    } catch (error) {
      console.error("Lỗi khi xử lý yêu cầu đổi email", error);
      return res.status(500).json({
        message: "Không thể xử lý yêu cầu đổi email"
      });
    }
  }
);

// Restaurant Admin cập nhật thông tin nhà hàng của mình
router.patch(
  "/me",
  requireAuth,
  requireRole([UserRole.RESTAURANT_ADMIN] as string[]),
  async (req: AuthRequest, res) => {
    try {
      const restaurantId = req.auth?.restaurantId;
      if (!restaurantId) {
        return res.status(403).json({ message: "Không xác định được nhà hàng" });
      }

      const { name, ownerName, email, address, phone, emailChangeOtp, bankAccount, bankName } = req.body as {
        name?: string;
        ownerName?: string;
        email?: string;
        address?: string;
        phone?: string;
        emailChangeOtp?: string;
        bankAccount?: string;
        bankName?: string;
      };

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name.trim();
      if (ownerName !== undefined) updates.ownerName = ownerName.trim();
      if (address !== undefined) updates.address = address.trim();
      if (phone !== undefined) updates.phone = phone.trim();
      if (bankAccount !== undefined) updates.bankAccount = bankAccount.trim();
      if (bankName !== undefined) updates.bankName = bankName.trim();

      // Xử lý đổi email - yêu cầu OTP
      if (email !== undefined) {
        const normalizedEmail = email.trim().toLowerCase();
        
        // Lấy restaurant hiện tại
        const currentRestaurant = await Restaurant.findById(restaurantId);
        if (!currentRestaurant) {
          return res.status(404).json({ message: "Không tìm thấy nhà hàng" });
        }

        // Nếu email mới khác email cũ, yêu cầu OTP
        if (currentRestaurant.email.toLowerCase() !== normalizedEmail) {
          if (!emailChangeOtp) {
            return res.status(400).json({ 
              message: "Cần mã OTP để đổi email. Vui lòng yêu cầu gửi OTP trước." 
            });
          }

          // Kiểm tra email có trùng với nhà hàng khác không
          const existingRestaurant = await Restaurant.findOne({
            email: normalizedEmail,
            _id: { $ne: restaurantId }
          });
          if (existingRestaurant) {
            return res.status(400).json({ message: "Email đã được sử dụng bởi nhà hàng khác" });
          }

          // Xác thực OTP
          const tokenDoc = await EmailChangeToken.findOne({
            restaurantId: new mongoose.Types.ObjectId(restaurantId),
            newEmail: normalizedEmail,
            otp: emailChangeOtp,
            used: false,
            expiresAt: { $gt: new Date() }
          });

          if (!tokenDoc) {
            return res.status(400).json({
              message: "Mã OTP không hợp lệ hoặc đã hết hạn"
            });
          }

          // Đánh dấu OTP đã dùng
          tokenDoc.used = true;
          await tokenDoc.save();
        }

        updates.email = normalizedEmail;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "Không có thông tin nào để cập nhật" });
      }

      const restaurant = await Restaurant.findByIdAndUpdate(restaurantId, updates, {
        new: true
      });

      if (!restaurant) {
        return res.status(404).json({ message: "Không tìm thấy nhà hàng" });
      }

      res.json(restaurant);
    } catch (error) {
      res.status(400).json({ message: "Không thể cập nhật thông tin nhà hàng", error });
    }
  }
);

// Super Admin yêu cầu gửi OTP để đổi email nhà hàng
router.post(
  "/:id/request-email-change",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { newEmail } = req.body as { newEmail?: string };
      if (!newEmail) {
        return res.status(400).json({ message: "Thiếu email mới" });
      }

      const normalizedNewEmail = newEmail.trim().toLowerCase();

      // Kiểm tra email mới có trùng với nhà hàng khác không
      const existingRestaurant = await Restaurant.findOne({
        email: normalizedNewEmail,
        _id: { $ne: id }
      });
      if (existingRestaurant) {
        return res.status(400).json({ message: "Email đã được sử dụng bởi nhà hàng khác" });
      }

      // Lấy thông tin restaurant hiện tại
      const restaurant = await Restaurant.findById(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Không tìm thấy nhà hàng" });
      }

      // Kiểm tra email mới có khác email cũ không
      if (restaurant.email.toLowerCase() === normalizedNewEmail) {
        return res.status(400).json({ message: "Email mới phải khác email hiện tại" });
      }

      // Tạo OTP 6 chữ số
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Lưu OTP vào database (hết hạn sau 15 phút)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // Xóa các OTP cũ chưa dùng của restaurant này
      await EmailChangeToken.deleteMany({
        restaurantId: new mongoose.Types.ObjectId(id),
        used: false
      });

      await EmailChangeToken.create({
        restaurantId: new mongoose.Types.ObjectId(id),
        newEmail: normalizedNewEmail,
        otp,
        expiresAt,
        used: false
      });

      // Gửi email chứa OTP đến email hiện tại
      try {
        await sendEmailChangeOTP({
          to: restaurant.email,
          restaurantName: restaurant.name,
          ownerName: restaurant.ownerName,
          otp,
          newEmail: normalizedNewEmail
        });
      } catch (mailError) {
        console.error("Không thể gửi email OTP đổi email", mailError);
        return res.status(500).json({
          message: "Không thể gửi email OTP. Vui lòng thử lại sau."
        });
      }

      return res.json({
        message: "Đã gửi mã OTP đến email hiện tại của nhà hàng"
      });
    } catch (error) {
      console.error("Lỗi khi xử lý yêu cầu đổi email", error);
      return res.status(500).json({
        message: "Không thể xử lý yêu cầu đổi email"
      });
    }
  }
);

// Cập nhật nhà hàng - cho Super Admin (có thể cập nhật tất cả thông tin)
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      ownerName,
      email,
      address,
      phone,
      status,
      active
    } = req.body;

    const updates: Record<string, unknown> = {};

    // Cập nhật thông tin cơ bản
    if (name !== undefined) updates.name = name.trim();
    if (ownerName !== undefined) updates.ownerName = ownerName.trim();
    if (address !== undefined) updates.address = address.trim();
    if (phone !== undefined) updates.phone = phone.trim();

    // Cập nhật email (Super Admin không cần OTP, đổi trực tiếp)
    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      
      // Kiểm tra email có trùng với nhà hàng khác không
      const existingRestaurant = await Restaurant.findOne({
        email: normalizedEmail,
        _id: { $ne: id }
      });
      if (existingRestaurant) {
        return res.status(400).json({ message: "Email đã được sử dụng bởi nhà hàng khác" });
      }

      updates.email = normalizedEmail;
    }

    // Cập nhật status và active
    if (typeof status === "string") {
      if (!Object.values(RestaurantStatus).includes(status as RestaurantStatus)) {
        return res.status(400).json({ message: "Trạng thái nhà hàng không hợp lệ" });
      }
      updates.status = status;
      updates.active = status === RestaurantStatus.ACTIVE;
    } else if (typeof active === "boolean" && status === undefined) {
      updates.active = active;
      updates.status = active ? RestaurantStatus.ACTIVE : RestaurantStatus.INACTIVE;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Không có thông tin nào để cập nhật" });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(id, updates, {
      new: true
    });
    if (!restaurant) {
      return res.status(404).json({ message: "Không tìm thấy nhà hàng" });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(400).json({ message: "Không thể cập nhật nhà hàng", error });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Không tìm thấy nhà hàng" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: "Không thể xóa nhà hàng", error });
  }
});

// Super Admin đặt lại mật khẩu admin nhà hàng
router.post(
  "/:id/reset-password",
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  async (req, res) => {
    try {
      const { newPassword } = req.body as { newPassword?: string };
      if (!newPassword) {
        return res.status(400).json({ message: "Thiếu mật khẩu mới" });
      }

      const restaurant = await Restaurant.findById(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: "Không tìm thấy nhà hàng" });
      }

      const user = await User.findOne({
        restaurantId: restaurant._id,
        role: UserRole.RESTAURANT_ADMIN
      });

      if (!user) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy tài khoản admin nhà hàng" });
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      await user.save();

      return res.json({
        message: "Đã đặt lại mật khẩu cho nhà hàng",
        restaurantId: restaurant._id,
        username: user.username
      });
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Không thể đặt lại mật khẩu", error });
    }
  }
);

// Endpoint để tạo QR code từ API vietqr.co
router.post("/generate-qr", async (req, res) => {
  try {
    const { bankCode, accountNumber, accountName, amount } = req.body;

    if (!bankCode || !accountNumber || !accountName) {
      return res.status(400).json({ 
        message: "Thiếu thông tin: bankCode, accountNumber, accountName" 
      });
    }

    // Gọi API của vietqr.co với payload đúng format
    const response = await fetch("https://vietqr.co/livewire/message/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Livewire": "true",
      },
      body: JSON.stringify({
        fingerprint: {
          id: `qr-${Date.now()}`,
          name: "generate",
          locale: "vi",
          path: "generate",
          method: "GET",
          v: "acj"
        },
        serverMemo: {
          children: [],
          errors: []
        },
        updates: [{
          type: "callMethod",
          payload: {
            id: `method-${Date.now()}`,
            method: "generate",
            params: [bankCode, accountNumber, accountName, amount || null]
          }
        }]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Lỗi khi gọi API vietqr.co:", error);
    res.status(500).json({ 
      message: "Không thể tạo QR code", 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

export default router;

