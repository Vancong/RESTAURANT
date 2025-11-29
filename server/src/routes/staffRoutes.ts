import { Router } from "express";
import bcrypt from "bcryptjs";
import { User, UserRole } from "../models/User.js";
import { Order, OrderStatus } from "../models/Order.js";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth.js";
import mongoose from "mongoose";

const router = Router();

// Lấy danh sách nhân viên của nhà hàng
router.get("/", requireAuth, requireRole([UserRole.RESTAURANT_ADMIN] as string[]), async (req: AuthRequest, res) => {
  const restaurantId = req.auth?.restaurantId;
  if (!restaurantId) {
    return res.status(403).json({ message: "Không xác định được nhà hàng" });
  }
  const staffList = await User.find({
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
    role: UserRole.STAFF
  })
    .select("_id username role isActive name updatedBy")
    .populate("updatedBy", "username");
  res.json(staffList.map(s => ({
    id: s._id,
    username: s.username,
    role: s.role,
    isActive: s.isActive ?? true,
    name: s.name || "",
    updatedBy: s.updatedBy ? {
      id: (s.updatedBy as any)._id,
      username: (s.updatedBy as any).username
    } : null
  })));
});

// Admin nhà hàng tạo tài khoản nhân viên
router.post("/", requireAuth, requireRole([UserRole.RESTAURANT_ADMIN] as string[]), async (req: AuthRequest, res) => {
  const { username, password, name } = req.body as { username?: string; password?: string; name?: string };
  const restaurantId = req.auth?.restaurantId;
  const adminId = req.auth?.sub;

  if (!username || !password) {
    return res.status(400).json({ message: "Thiếu username hoặc password" });
  }

  if (!restaurantId) {
    return res.status(403).json({ message: "Không xác định được nhà hàng" });
  }

  if (!adminId) {
    return res.status(403).json({ message: "Không xác định được admin" });
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: "Username đã tồn tại" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const staff = await User.create({
    username,
    passwordHash,
    role: UserRole.STAFF,
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
    name: name?.trim() || "",
    updatedBy: new mongoose.Types.ObjectId(adminId)
  });

  const updatedByUser = await User.findById(adminId).select("username");

  res.status(201).json({
    id: staff._id,
    username: staff.username,
    role: staff.role,
    restaurantId: staff.restaurantId,
    name: staff.name || "",
    updatedBy: updatedByUser ? {
      id: updatedByUser._id,
      username: updatedByUser.username
    } : null
  });
});

// Nhân viên xem danh sách đơn hàng của nhà hàng
router.get("/orders", requireAuth, requireRole([UserRole.STAFF, UserRole.RESTAURANT_ADMIN] as string[]), async (req: AuthRequest, res) => {
  const restaurantId = req.auth?.restaurantId;
  if (!restaurantId) {
    return res.status(403).json({ message: "Không xác định được nhà hàng" });
  }

  const orders = await Order.find({ restaurantId })
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(orders);
});

// Nhân viên xác nhận đơn (chuyển status)
router.patch("/orders/:id", requireAuth, requireRole([UserRole.STAFF, UserRole.RESTAURANT_ADMIN] as string[]), async (req: AuthRequest, res) => {
  const restaurantId = req.auth?.restaurantId;
  const { id } = req.params;
  const { status } = req.body as { status?: string };

  if (!restaurantId) {
    return res.status(403).json({ message: "Không xác định được nhà hàng" });
  }

  if (!status || !Object.values(OrderStatus).includes(status as OrderStatus)) {
    return res.status(400).json({ message: "Trạng thái đơn hàng không hợp lệ" });
  }

  const order = await Order.findOneAndUpdate(
    { _id: id, restaurantId },
    { status: status as OrderStatus },
    { new: true }
  );

  if (!order) {
    return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  }

  res.json(order);
});

// Khóa/mở khóa nhân viên
router.patch("/:id/toggle-active", requireAuth, requireRole([UserRole.RESTAURANT_ADMIN] as string[]), async (req: AuthRequest, res) => {
  const restaurantId = req.auth?.restaurantId;
  const { id } = req.params;

  if (!restaurantId) {
    return res.status(403).json({ message: "Không xác định được nhà hàng" });
  }

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "ID nhân viên không hợp lệ" });
  }

  try {
    const staff = await User.findOne({
      _id: id,
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
      role: UserRole.STAFF
    });

    if (!staff) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    staff.isActive = !(staff.isActive ?? true);
    await staff.save();

    res.json({
      id: staff._id,
      username: staff.username,
      role: staff.role,
      isActive: staff.isActive
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi cập nhật trạng thái nhân viên", error });
  }
});

// Cập nhật username/password/name nhân viên
router.patch("/:id", requireAuth, requireRole([UserRole.RESTAURANT_ADMIN] as string[]), async (req: AuthRequest, res) => {
  const restaurantId = req.auth?.restaurantId;
  const adminId = req.auth?.sub;
  const { id } = req.params;
  const { username, password, name } = req.body as { username?: string; password?: string; name?: string };

  if (!restaurantId) {
    return res.status(403).json({ message: "Không xác định được nhà hàng" });
  }

  if (!adminId) {
    return res.status(403).json({ message: "Không xác định được admin" });
  }

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "ID nhân viên không hợp lệ" });
  }

  if (!username && !password && !name) {
    return res.status(400).json({ message: "Cần cung cấp username, password hoặc name để cập nhật" });
  }

  try {
    const staff = await User.findOne({
      _id: id,
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
      role: UserRole.STAFF
    });

    if (!staff) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    if (username && username.trim() !== staff.username) {
      // Kiểm tra username mới có trùng không
      const existingUser = await User.findOne({ username: username.trim() });
      if (existingUser && existingUser._id.toString() !== id) {
        return res.status(400).json({ message: "Username đã tồn tại" });
      }
      staff.username = username.trim();
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      staff.passwordHash = passwordHash;
    }

    if (name !== undefined) {
      staff.name = name.trim() || "";
    }

    // Cập nhật updatedBy
    staff.updatedBy = new mongoose.Types.ObjectId(adminId);

    await staff.save();

    const updatedByUser = await User.findById(adminId).select("username");

    res.json({
      id: staff._id,
      username: staff.username,
      role: staff.role,
      isActive: staff.isActive ?? true,
      name: staff.name || "",
      updatedBy: updatedByUser ? {
        id: updatedByUser._id,
        username: updatedByUser.username
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi cập nhật nhân viên", error });
  }
});

export default router;

