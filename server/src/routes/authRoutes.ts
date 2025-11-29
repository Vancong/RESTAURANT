import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { User, UserRole } from "../models/User.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { Restaurant } from "../models/Restaurant.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const TOKEN_EXPIRY = process.env.JWT_EXPIRY || "12h";
const RESET_TOKEN_EXP_MINUTES = Number(process.env.RESET_TOKEN_EXP_MINUTES || 15);
const APP_BASE_URL =
  process.env.APP_BASE_URL ||
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  "http://localhost:5173";

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Thiếu username hoặc password" });
  }

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
  }

  const payload = {
    sub: user._id.toString(),
    role: user.role,
    restaurantId: user.restaurantId?.toString() || null
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

  res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      role: user.role as UserRole,
      restaurantId: user.restaurantId || null
    }
  });
});

// Đổi mật khẩu cho user hiện tại (dựa trên JWT)
router.post("/change-password", requireAuth, async (req: AuthRequest, res) => {
  const { oldPassword, newPassword } = req.body as {
    oldPassword?: string;
    newPassword?: string;
  };

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Thiếu oldPassword hoặc newPassword" });
  }

  if (!req.auth?.sub) {
    return res.status(401).json({ message: "Không xác định được người dùng" });
  }

  const user = await User.findById(req.auth.sub);
  if (!user) {
    return res.status(404).json({ message: "User không tồn tại" });
  }

  const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isValid) {
    return res.status(400).json({ message: "Mật khẩu cũ không đúng" });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = passwordHash;
  await user.save();

  return res.json({ message: "Đổi mật khẩu thành công" });
});

router.post("/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      return res.status(400).json({ message: "Thiếu email nhà hàng" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const restaurant = await Restaurant.findOne({ email: normalizedEmail });
    if (!restaurant) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy nhà hàng với email đã cung cấp" });
    }

    const user = await User.findOne({
      restaurantId: restaurant._id,
      role: UserRole.RESTAURANT_ADMIN
    });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản admin của nhà hàng này" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    user.passwordResetToken = undefined;
    user.passwordResetOtp = otpHash;
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_EXP_MINUTES * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail({
      to: restaurant.email,
      restaurantName: restaurant.name,
      ownerName: restaurant.ownerName,
      otp
    });

    return res.json({ message: "Đã gửi email đặt lại mật khẩu" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Không thể gửi email đặt lại mật khẩu" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { otp, email, newPassword } = req.body as {
      otp?: string;
      email?: string;
      newPassword?: string;
    };

    if (!newPassword) {
      return res.status(400).json({ message: "Thiếu mật khẩu mới" });
    }

    let user: Awaited<ReturnType<typeof User.findOne>> | null = null;

    if (otp && email) {
      const normalizedEmail = email.trim().toLowerCase();
      const restaurant = await Restaurant.findOne({ email: normalizedEmail });
      if (!restaurant) {
        return res.status(404).json({ message: "Không tìm thấy nhà hàng với email đã cung cấp" });
      }
      user = await User.findOne({
        restaurantId: restaurant._id,
        role: UserRole.RESTAURANT_ADMIN
      });
      if (
        !user ||
        !user.passwordResetOtp ||
        !user.passwordResetExpires ||
        user.passwordResetExpires < new Date()
      ) {
        return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
      }
      const isOtpValid = await bcrypt.compare(otp, user.passwordResetOtp);
      if (!isOtpValid) {
        return res.status(400).json({ message: "Mã OTP không đúng" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "Cần cung cấp email và OTP để đặt lại mật khẩu" });
    }

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản cần đặt lại mật khẩu" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetOtp = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Không thể đặt lại mật khẩu" });
  }
});

export default router;

