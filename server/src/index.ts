import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://congthang.netlify.app',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL,
  process.env.NETLIFY_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => origin.includes(allowed))) {
      return callback(null, true);
    }
    
    // For production, allow common frontend hosting domains
    if (process.env.NODE_ENV === 'production') {
      if (origin.includes('vercel.app') || 
          origin.includes('netlify.app') || 
          origin.includes('github.io') ||
          origin.includes('cloudflarepages.app')) {
        return callback(null, true);
      }
    }
    
    // Allow all origins for development/testing (remove in strict production)
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/orders", orderRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
});

