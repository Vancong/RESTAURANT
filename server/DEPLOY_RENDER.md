# Hướng dẫn Deploy Backend lên Render

## 📋 Bước 1: Chuẩn bị

### 1.1. Đảm bảo code đã push lên GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 1.2. Chuẩn bị thông tin cần thiết:
- ✅ MongoDB Atlas connection string
- ✅ JWT Secret key (tạo một chuỗi ngẫu nhiên dài)
- ✅ (Optional) SMTP credentials nếu muốn dùng email reset password

---

## 🚀 Bước 2: Tạo tài khoản Render

1. Truy cập: https://render.com
2. Click **"Get Started for Free"**
3. Đăng ký bằng GitHub (khuyến nghị) hoặc email
4. Xác nhận email nếu cần

---

## 🔧 Bước 3: Tạo Web Service

### 3.1. Tạo service mới
1. Trên Dashboard, click **"New +"**
2. Chọn **"Web Service"**
3. Chọn **"Build and deploy from a Git repository"**
4. Kết nối GitHub nếu chưa kết nối:
   - Click **"Connect account"**
   - Authorize Render truy cập repositories
   - Chọn repository chứa code

### 3.2. Chọn repository
- Chọn repository của bạn
- Click **"Connect"**

### 3.3. Cấu hình service

**Basic Settings:**
- **Name**: `qr-food-order-api` (hoặc tên bạn muốn)
- **Region**: Chọn gần nhất (Singapore, Mumbai, hoặc Frankfurt)
- **Branch**: `main` (hoặc branch bạn muốn deploy)
- **Root Directory**: `server` ⚠️ **QUAN TRỌNG**

**Build & Deploy:**
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Plan:**
- Chọn **Free** (đủ cho dự án nhỏ)
- Hoặc **Starter** ($7/tháng) nếu cần performance tốt hơn

---

## 🔐 Bước 4: Thiết lập Environment Variables

Click vào tab **"Environment"** và thêm các biến sau:

### Biến bắt buộc:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/nhahang?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_super_secret_key_at_least_32_characters_long
JWT_EXPIRY=12h
```

### Biến tùy chọn (cho email service):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
MAIL_FROM=noreply@yourdomain.com
```

**Lưu ý:**
- `JWT_SECRET`: Tạo một chuỗi ngẫu nhiên dài (ít nhất 32 ký tự)
  - Có thể dùng: `openssl rand -base64 32` (trên Mac/Linux)
  - Hoặc tạo online: https://randomkeygen.com/
- `MONGODB_URI`: Lấy từ MongoDB Atlas Dashboard
  - Atlas → Clusters → Connect → Connect your application
  - Copy connection string và thay `<password>` bằng password thật

---

## 🎯 Bước 5: Deploy

1. Click **"Create Web Service"**
2. Render sẽ tự động:
   - Clone code từ GitHub
   - Install dependencies
   - Build TypeScript
   - Start server
3. Chờ deploy hoàn tất (thường 2-5 phút)
4. Xem logs để kiểm tra:
   - Click vào service → tab **"Logs"**
   - Tìm dòng: `✅ MongoDB connected`
   - Tìm dòng: `🚀 Server is running on...`

---

## ✅ Bước 6: Kiểm tra

### 6.1. Lấy URL
- Render sẽ cung cấp URL: `https://qr-food-order-api.onrender.com`
- (URL có thể khác tùy tên service bạn đặt)

### 6.2. Test API
Mở browser hoặc dùng curl:

```bash
# Test health endpoint
curl https://qr-food-order-api.onrender.com/api/health

# Kết quả mong đợi:
# {"status":"ok","uptime":123.456}
```

### 6.3. Test MongoDB connection
Kiểm tra logs trên Render:
- Nếu thấy `✅ MongoDB connected` → OK
- Nếu thấy lỗi → Kiểm tra lại `MONGODB_URI`

---

## 🔧 Bước 7: Cấu hình CORS (Quan trọng!)

Sau khi deploy frontend, bạn cần cập nhật CORS trên backend.

### Sửa file `server/src/index.ts`:

```typescript
import cors from "cors";

// Thay dòng này:
// app.use(cors());

// Bằng:
app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',  // URL frontend của bạn
    'http://localhost:5173',              // Cho development
  ],
  credentials: true
}));
```

Sau đó commit và push lại:
```bash
git add server/src/index.ts
git commit -m "Update CORS for production"
git push
```

Render sẽ tự động redeploy.

---

## 🐛 Troubleshooting

### Lỗi: "Build failed"

**Nguyên nhân:**
- Root Directory sai
- Build command sai
- TypeScript errors

**Giải pháp:**
1. Kiểm tra Root Directory = `server`
2. Xem logs để tìm lỗi cụ thể
3. Test build local: `cd server && npm run build`

### Lỗi: "MongoDB connection error"

**Nguyên nhân:**
- `MONGODB_URI` sai
- MongoDB Atlas chưa whitelist IP

**Giải pháp:**
1. Kiểm tra `MONGODB_URI` trên Render dashboard
2. Vào MongoDB Atlas → Network Access
3. Thêm IP: `0.0.0.0/0` (cho phép mọi IP) hoặc IP của Render
4. Render IPs thường là dynamic, nên dùng `0.0.0.0/0` cho test

### Lỗi: "Port already in use"

**Nguyên nhân:**
- Render tự động set PORT, không cần hardcode

**Giải pháp:**
- Đảm bảo code dùng `process.env.PORT || 5000` (đã đúng rồi)

### Service bị sleep (Free plan)

**Vấn đề:**
- Free plan sẽ sleep sau 15 phút không có traffic
- Lần request đầu tiên sau khi sleep sẽ chậm (~30s)

**Giải pháp:**
- Upgrade lên Starter plan ($7/tháng)
- Hoặc dùng service như UptimeRobot để ping định kỳ

---

## 📝 Checklist

- [ ] Code đã push lên GitHub
- [ ] Đã tạo tài khoản Render
- [ ] Đã tạo Web Service
- [ ] Root Directory = `server`
- [ ] Build Command = `npm install && npm run build`
- [ ] Start Command = `npm start`
- [ ] Đã thêm tất cả Environment Variables
- [ ] Deploy thành công
- [ ] Test `/api/health` endpoint
- [ ] MongoDB connected (kiểm tra logs)
- [ ] Đã lưu URL backend để dùng cho frontend

---

## 🎉 Hoàn thành!

Sau khi deploy thành công, bạn sẽ có:
- ✅ Backend URL: `https://qr-food-order-api.onrender.com`
- ✅ API endpoints hoạt động
- ✅ MongoDB connected
- ✅ Sẵn sàng cho frontend kết nối

**Bước tiếp theo:** Deploy frontend và cập nhật `VITE_API_BASE_URL`!

---

## 💡 Tips

1. **Auto-deploy**: Render tự động deploy khi push code lên GitHub
2. **Custom domain**: Có thể thêm custom domain trên Render (cần upgrade plan)
3. **Logs**: Luôn check logs khi có vấn đề
4. **Environment**: Có thể tạo nhiều environment (staging, production)

