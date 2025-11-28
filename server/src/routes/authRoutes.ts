import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User, UserRole } from "../models/User.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const TOKEN_EXPIRY = process.env.JWT_EXPIRY || "12h";

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

export default router;

