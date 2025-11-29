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
  }).select("_id username role isActive");
  res.json(staffList.map(s => ({ id: s._id, username: s.username, role: s.role, isActive: s.isActive ?? true })));
});

// Admin nhà hàng tạo tài khoản nhân viên
router.post("/", requireAuth, requireRole([UserRole.RESTAURANT_ADMIN] as string[]), async (req: AuthRequest, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  const restaurantId = req.auth?.restaurantId;

  if (!username || !password) {
    return res.status(400).json({ message: "Thiếu username hoặc password" });
  }

  if (!restaurantId) {
    return res.status(403).json({ message: "Không xác định được nhà hàng" });
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
    restaurantId: new mongoose.Types.ObjectId(restaurantId)
  });

  res.status(201).json({
    id: staff._id,
    username: staff.username,
    role: staff.role,
    restaurantId: staff.restaurantId
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

// Cập nhật username/password nhân viên
router.patch("/:id", requireAuth, requireRole([UserRole.RESTAURANT_ADMIN] as string[]), async (req: AuthRequest, res) => {
  const restaurantId = req.auth?.restaurantId;
  const { id } = req.params;
  const { username, password } = req.body as { username?: string; password?: string };

  if (!restaurantId) {
    return res.status(403).json({ message: "Không xác định được nhà hàng" });
  }

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "ID nhân viên không hợp lệ" });
  }

  if (!username && !password) {
    return res.status(400).json({ message: "Cần cung cấp username hoặc password để cập nhật" });
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

    await staff.save();

    res.json({
      id: staff._id,
      username: staff.username,
      role: staff.role,
      isActive: staff.isActive ?? true
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi cập nhật nhân viên", error });
  }
});

export default router;

