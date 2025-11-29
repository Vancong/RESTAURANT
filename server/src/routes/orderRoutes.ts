import { Router } from "express";
import { Order, OrderStatus } from "../models/Order.js";
import mongoose from "mongoose";
import { Restaurant } from "../models/Restaurant.js";
import { sendNewOrderNotification } from "../services/emailService.js";

const router = Router();

// Khách hàng đặt món (không cần auth)
router.post("/", async (req, res) => {
  const { restaurantId, tableNumber, items, note, customerName } = req.body as {
    restaurantId?: string;
    tableNumber?: string;
    items?: Array<{ menuItemId: string; name: string; price: number; quantity: number }>;
    note?: string;
    customerName?: string;
  };

  if (!restaurantId || !tableNumber || !items || items.length === 0) {
    return res.status(400).json({ message: "Thiếu thông tin đơn hàng" });
  }

  if (!mongoose.isValidObjectId(restaurantId)) {
    return res.status(400).json({ message: "restaurantId không hợp lệ" });
  }

  // Kiểm tra xem bàn có đang được sử dụng không (có đơn hàng chưa hoàn thành)
  const activeOrders = await Order.find({
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
    tableNumber,
    status: {
      $in: [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.SERVED
      ]
    }
  });

  if (activeOrders.length > 0) {
    return res.status(400).json({ 
      message: "Bàn này đã có khách, vui lòng chọn bàn khác" 
    });
  }

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await Order.create({
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
    tableNumber,
    items,
    totalAmount,
    status: OrderStatus.PENDING,
    note,
    customerName: customerName?.trim()
  });

  // Trả response ngay lập tức để khách hàng nhận được xác nhận nhanh
  res.status(201).json(order);

  // Gửi email thông báo đơn hàng mới cho chủ quán ở background (không chặn response)
  // Fire and forget - không await để không làm chậm response
  (async () => {
    try {
      const restaurant = await Restaurant.findById(restaurantId);
      if (restaurant && restaurant.email) {
        await sendNewOrderNotification({
          to: restaurant.email,
          restaurantName: restaurant.name,
          ownerName: restaurant.ownerName,
          orderId: order._id.toString(),
          tableNumber,
          items: items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          totalAmount,
          note,
          orderTime: order.createdAt || new Date()
        });
      }
    } catch (emailError) {
      // Không làm gián đoạn việc tạo đơn hàng nếu gửi email thất bại
      console.error("Không thể gửi email thông báo đơn hàng mới", emailError);
    }
  })();
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

