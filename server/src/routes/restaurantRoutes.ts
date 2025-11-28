import { Router } from "express";
import bcrypt from "bcryptjs";
import { Restaurant } from "../models/Restaurant.js";
import { User, UserRole } from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Lấy danh sách nhà hàng
router.get("/", async (_req, res) => {
  const restaurants = await Restaurant.find().sort({ createdAt: -1 });
  res.json(restaurants);
});

// Tạo nhà hàng mới + tài khoản admin nhà hàng
router.post("/", async (req, res) => {
  try {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return res
        .status(400)
        .json({ message: "Thiếu name/username/password khi tạo nhà hàng" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username đã tồn tại" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const restaurant = await Restaurant.create({
      name,
      username,
      active: true
    });

    await User.create({
      username,
      passwordHash,
      role: UserRole.RESTAURANT_ADMIN,
      restaurantId: restaurant._id
    });

    res.status(201).json(restaurant);
  } catch (error) {
    res.status(400).json({ message: "Không thể tạo nhà hàng", error });
  }
});

// Cập nhật nhà hàng (ví dụ toggle active)
router.patch("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
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

export default router;

