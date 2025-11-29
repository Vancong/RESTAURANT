import { Router } from "express";
import mongoose from "mongoose";
import { Table } from "../models/Table.js";
import { Restaurant } from "../models/Restaurant.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const router = Router();

// Lấy danh sách bàn theo restaurantId (tùy chọn)
router.get("/", async (req, res) => {
  const { restaurantId } = req.query as { restaurantId?: string };

  const filter: any = {};
  if (restaurantId) {
    if (!mongoose.isValidObjectId(restaurantId)) {
      return res
        .status(400)
        .json({ message: "restaurantId không hợp lệ", restaurantId });
    }
    filter.restaurantId = restaurantId;
  }
  const tables = await Table.find(filter).sort({ createdAt: -1 });
  res.json(tables);
});

// Admin nhà hàng lưu số bàn khi tạo QR
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { code } = req.body as { code?: string };
    const authRestaurantId = req.auth?.restaurantId;

    if (!authRestaurantId) {
      return res
        .status(400)
        .json({ message: "Không xác định được nhà hàng từ token" });
    }

    if (!code) {
      return res.status(400).json({ message: "Thiếu số bàn (code)" });
    }

    const restaurant = await Restaurant.findById(authRestaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Nhà hàng không tồn tại" });
    }

    const table = await Table.findOneAndUpdate(
      { restaurantId: authRestaurantId, code },
      { restaurantId: authRestaurantId, code, isActive: true },
      { new: true, upsert: true }
    );

    return res.status(201).json(table);
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Không thể lưu thông tin bàn", error });
  }
});

// Cập nhật số bàn
router.put("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { code } = req.body as { code?: string };
    const authRestaurantId = req.auth?.restaurantId;

    if (!authRestaurantId) {
      return res
        .status(400)
        .json({ message: "Không xác định được nhà hàng từ token" });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID bàn không hợp lệ" });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Thiếu số bàn (code)" });
    }

    const table = await Table.findOne({ _id: id, restaurantId: authRestaurantId });
    if (!table) {
      return res.status(404).json({ message: "Bàn không tồn tại" });
    }

    // Kiểm tra xem code mới có trùng với bàn khác không
    const existingTable = await Table.findOne({
      restaurantId: authRestaurantId,
      code: code.trim(),
      _id: { $ne: id }
    });

    if (existingTable) {
      return res.status(400).json({ message: "Số bàn này đã tồn tại" });
    }

    table.code = code.trim();
    await table.save();

    return res.json(table);
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Không thể cập nhật thông tin bàn", error });
  }
});

// Xóa bàn
router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const authRestaurantId = req.auth?.restaurantId;

    if (!authRestaurantId) {
      return res
        .status(400)
        .json({ message: "Không xác định được nhà hàng từ token" });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID bàn không hợp lệ" });
    }

    const table = await Table.findOneAndDelete({
      _id: id,
      restaurantId: authRestaurantId
    });

    if (!table) {
      return res.status(404).json({ message: "Bàn không tồn tại" });
    }

    return res.json({ message: "Đã xóa bàn thành công" });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Không thể xóa bàn", error });
  }
});

export default router;


