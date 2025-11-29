# Hướng dẫn Deploy Backend lên Render

## Bước 1: Chuẩn bị MongoDB Atlas

1. Đăng ký tài khoản tại [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Tạo cluster mới (chọn free tier M0)
3. Tạo database user (Database Access)
4. Whitelist IP: Thêm `0.0.0.0/0` để cho phép kết nối từ mọi nơi (hoặc IP của Render)
5. Lấy connection string: 
   - Click "Connect" → "Connect your application"
   - Copy connection string, thay `<password>` và `<dbname>`
   - Ví dụ: `mongodb+srv://username:password@cluster.mongodb.net/qrfoodorder?retryWrites=true&w=majority`

## Bước 2: Deploy lên Render

### Điền form tạo Web Service:

1. **Source Code**: Chọn repo `Vancong/RESTAURANT`

2. **Name**: `qr-food-order-api` (hoặc tên bạn muốn)

3. **Region**: Singapore (Southeast Asia) - giữ nguyên

4. **Branch**: `main` - giữ nguyên

5. **Root Directory**: `server` ⚠️ **QUAN TRỌNG**: Điền `server` để Render biết build từ thư mục server

6. **Build Command**: 
   ```
   npm install && npm run build
   ```

7. **Start Command**: 
   ```
   npm start
   ```

8. **Instance Type**: Chọn **Free** (hoặc Starter nếu muốn không bị sleep)

### Environment Variables:

Click "Add Environment Variable" và thêm các biến sau:

| Tên biến | Giá trị | Ghi chú |
|----------|---------|---------|
| `MONGODB_URI` | `mongodb+srv://...` | Connection string từ MongoDB Atlas |
| `JWT_SECRET` | Random string dài | Ví dụ: `my-super-secret-jwt-key-2024-production` |
| `JWT_EXPIRY` | `12h` | Thời gian hết hạn token |
| `NODE_ENV` | `production` | Môi trường production |
| `PORT` | `5000` | Port mặc định (Render tự set, nhưng có thể set để chắc chắn) |
| `FRONTEND_URL` | `https://your-app.vercel.app` | URL frontend trên Vercel (sẽ set sau khi deploy frontend) |
| `APP_BASE_URL` | `https://your-app.vercel.app` | Tương tự FRONTEND_URL |
| `SMTP_HOST` | `smtp.gmail.com` | Nếu dùng Gmail |
| `SMTP_PORT` | `587` | Port SMTP |
| `SMTP_USER` | `your-email@gmail.com` | Email gửi thư |
| `SMTP_PASS` | `your-app-password` | App password (không phải mật khẩu thường) |
| `MAIL_FROM` | `your-email@gmail.com` | Email hiển thị người gửi |

**Lưu ý về Gmail SMTP:**
- Cần bật 2-Step Verification
- Tạo App Password: Google Account → Security → App passwords
- Dùng App Password thay vì mật khẩu thường

### Sau khi điền xong:

1. Click **"Create Web Service"**
2. Render sẽ tự động build và deploy
3. Đợi build xong (khoảng 2-5 phút)
4. Lấy URL của service (ví dụ: `https://qr-food-order-api.onrender.com`)

## Bước 3: Test API

Sau khi deploy xong, test endpoint:

```bash
curl https://your-service.onrender.com/api/health
```

Kết quả mong đợi:
```json
{"status":"ok","uptime":123.456}
```

## Bước 4: Tạo Super Admin

Sau khi deploy, bạn cần tạo Super Admin đầu tiên. Có 2 cách:

### Cách 1: Dùng Render Shell (nếu có paid plan)
```bash
npm run seed:super-admin -- admin admin123
```

### Cách 2: Tạo script và chạy local (khuyến nghị)
1. Clone repo về máy
2. Tạo file `.env` trong `server/` với các biến từ Render
3. Chạy:
```bash
cd server
npm install
npm run seed:super-admin -- admin admin123
```

## Bước 5: Cập nhật Frontend URL

Sau khi deploy frontend lên Vercel, quay lại Render và cập nhật:
- `FRONTEND_URL` = URL Vercel của bạn
- `APP_BASE_URL` = URL Vercel của bạn

## Troubleshooting

### Lỗi build:
- Kiểm tra Root Directory đã set là `server` chưa
- Kiểm tra Build Command: `npm install && npm run build`

### Lỗi kết nối MongoDB:
- Kiểm tra MONGODB_URI đúng format chưa
- Kiểm tra IP whitelist trên MongoDB Atlas
- Kiểm tra username/password đúng chưa

### Lỗi CORS:
- Đảm bảo đã set `FRONTEND_URL` hoặc `APP_BASE_URL`
- Kiểm tra server/src/index.ts có cấu hình CORS đúng

### Service bị sleep (Free tier):
- Free tier sẽ sleep sau 15 phút không dùng
- Lần request đầu sau khi sleep sẽ mất 30-60 giây để wake up
- Nâng cấp lên Starter ($7/tháng) để không bị sleep

## Lưu ý quan trọng:

1. **Root Directory phải là `server`** - Nếu không Render sẽ không tìm thấy package.json
2. **MONGODB_URI** - Phải là connection string đầy đủ từ MongoDB Atlas
3. **JWT_SECRET** - Phải là string ngẫu nhiên, dài, bảo mật
4. **FRONTEND_URL** - Set sau khi deploy frontend, để CORS và email links hoạt động đúng

