import { Router } from "express";
import bcrypt from "bcryptjs";
import { User, UserRole } from "../models/User.js";
import { Order, OrderStatus, PaymentMethod } from "../models/Order.js";
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
  const userId = req.auth?.sub;
  const userRole = req.auth?.role;
  const { id } = req.params;
  const { status, paymentMethod, items, note } = req.body as { 
    status?: string; 
    paymentMethod?: string;
    items?: Array<{ menuItemId: string; name: string; price: number; quantity: number }>;
    note?: string;
  };

  if (!restaurantId) {
    return res.status(403).json({ message: "Không xác định được nhà hàng" });
  }

  // Kiểm tra đơn hàng tồn tại và lấy trạng thái hiện tại
  const existingOrder = await Order.findOne({ _id: id, restaurantId });
  if (!existingOrder) {
    return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  }

  // Nếu có items, cập nhật items (chỉ admin mới được sửa)
  if (items && Array.isArray(items)) {
    if (userRole !== UserRole.RESTAURANT_ADMIN) {
      return res.status(403).json({ message: "Chỉ admin nhà hàng mới được sửa món trong đơn hàng" });
    }
    // Không cho sửa nếu đơn đã hoàn thành hoặc đã hủy
    if (existingOrder.status === OrderStatus.COMPLETED || existingOrder.status === OrderStatus.CANCELLED) {
      return res.status(400).json({ message: "Không thể sửa đơn hàng đã hoàn thành hoặc đã hủy" });
    }
    // Validate items
    if (items.length === 0) {
      return res.status(400).json({ message: "Đơn hàng phải có ít nhất 1 món" });
    }
    for (const item of items) {
      if (!item.menuItemId || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ message: "Thông tin món không hợp lệ" });
      }
    }
  }

  // Nếu có status, validate và kiểm tra quyền
  if (status) {
    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      return res.status(400).json({ message: "Trạng thái đơn hàng không hợp lệ" });
    }

    // Nhân viên (STAFF) chỉ được phép xác nhận đơn (PENDING -> CONFIRMED)
    if (userRole === UserRole.STAFF) {
      if (status !== OrderStatus.CONFIRMED) {
        return res.status(403).json({ message: "Nhân viên chỉ được phép xác nhận đơn hàng" });
      }
      if (existingOrder.status !== OrderStatus.PENDING) {
        return res.status(403).json({ message: "Chỉ có thể xác nhận đơn hàng đang chờ xử lý" });
      }
    }
  }

  // Lấy thông tin người cập nhật để lưu tên
  let updatedByName = "";
  let confirmedByName = "";
  if (userId) {
    const user = await User.findById(userId).select("name username");
    if (user) {
      const userName = user.name || user.username || "";
      updatedByName = userName;
      // Lưu confirmedByName riêng cho trạng thái CONFIRMED
      if (status === OrderStatus.CONFIRMED) {
        confirmedByName = userName;
      }
    }
  }

  const updateData: any = {};
  
  // Cập nhật status nếu có
  if (status) {
    updateData.status = status as OrderStatus;
  }
  
  // Cập nhật items nếu có
  if (items && Array.isArray(items)) {
    updateData.items = items;
    // Tính lại totalAmount
    updateData.totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
  
  // Cập nhật note nếu có
  if (note !== undefined) {
    updateData.note = note?.trim() || "";
  }
  
  // Lưu hình thức thanh toán khi hoàn thành đơn hàng
  if (status === OrderStatus.COMPLETED && paymentMethod) {
    if (paymentMethod === "CASH" || paymentMethod === "BANK_TRANSFER") {
      updateData.paymentMethod = paymentMethod;
    } else {
      return res.status(400).json({ message: "Hình thức thanh toán không hợp lệ" });
    }
  }
  
  // Lưu thông tin người cập nhật cho mọi trạng thái
  if (userId) {
    updateData.updatedBy = new mongoose.Types.ObjectId(userId);
    updateData.updatedByName = updatedByName;
  }
  
  // Lưu thông tin nhân viên khi xác nhận đơn (CONFIRMED)
  if (status === OrderStatus.CONFIRMED && userId) {
    updateData.confirmedBy = new mongoose.Types.ObjectId(userId);
    updateData.confirmedByName = confirmedByName;
  }

  const order = await Order.findOneAndUpdate(
    { _id: id, restaurantId },
    updateData,
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

