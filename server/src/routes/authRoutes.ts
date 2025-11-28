import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User, UserRole } from "../models/User.js";

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

export default router;

