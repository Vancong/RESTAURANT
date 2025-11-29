import { Router } from "express";
import { Order, OrderStatus } from "../models/Order.js";
import mongoose from "mongoose";

const router = Router();

// Khách hàng đặt món (không cần auth)
router.post("/", async (req, res) => {
  const { restaurantId, tableNumber, items, note } = req.body as {
    restaurantId?: string;
    tableNumber?: string;
    items?: Array<{ menuItemId: string; name: string; price: number; quantity: number }>;
    note?: string;
  };

  if (!restaurantId || !tableNumber || !items || items.length === 0) {
    return res.status(400).json({ message: "Thiếu thông tin đơn hàng" });
  }

  if (!mongoose.isValidObjectId(restaurantId)) {
    return res.status(400).json({ message: "restaurantId không hợp lệ" });
  }

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await Order.create({
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
    tableNumber,
    items,
    totalAmount,
    status: OrderStatus.PENDING,
    note
  });

  res.status(201).json(order);
});

// Lấy đơn hàng theo restaurantId và tableNumber (cho khách xem)
router.get("/", async (req, res) => {
  const { restaurantId, tableNumber } = req.query as { restaurantId?: string; tableNumber?: string };

  if (!restaurantId || !tableNumber) {
    return res.status(400).json({ message: "Thiếu restaurantId hoặc tableNumber" });
  }

  if (!mongoose.isValidObjectId(restaurantId)) {
    return res.status(400).json({ message: "restaurantId không hợp lệ" });
  }

  const orders = await Order.find({
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
    tableNumber
  }).sort({ createdAt: -1 });

  res.json(orders);
});

export default router;

