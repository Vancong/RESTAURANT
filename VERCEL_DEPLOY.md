# Hướng dẫn Deploy Frontend lên Vercel

## Bước 1: Chuẩn bị

1. Đảm bảo đã deploy backend lên Render và có URL (ví dụ: `https://qr-food-order-api.onrender.com`)
2. Đảm bảo code đã được push lên GitHub

## Bước 2: Deploy trên Vercel

### Cách 1: Deploy qua Vercel Dashboard (Khuyến nghị)

1. Truy cập [Vercel](https://vercel.com) và đăng nhập
2. Click **"Add New..."** → **"Project"**
3. Import repository `Vancong/RESTAURANT` từ GitHub
4. Điền thông tin:

   **Project Name**: `qr-food-order` (hoặc tên bạn muốn)

   **Framework Preset**: `Vite` (Vercel sẽ tự detect)

   **Root Directory**: Để trống (hoặc `./` nếu repo root là RESTAURANT)

   **Build Command**: `npm run build` (mặc định)

   **Output Directory**: `dist` (mặc định)

   **Install Command**: `npm install` (mặc định)

5. **Environment Variables**: Click "Add" và thêm:

   ```
   VITE_API_BASE_URL = https://your-backend.onrender.com
   ```
   (Thay bằng URL backend Render của bạn)

   Nếu dùng Cloudinary:
   ```
   VITE_CLOUDINARY_CLOUD_NAME = your-cloud-name
   VITE_CLOUDINARY_UPLOAD_PRESET = your-upload-preset
   ```

   Nếu dùng Google GenAI:
   ```
   VITE_API_KEY = your-google-api-key
   ```

6. Click **"Deploy"**

7. Đợi build (2-5 phút)

8. Lấy URL của frontend (ví dụ: `https://qr-food-order.vercel.app`)

### Cách 2: Deploy qua Vercel CLI

```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd RESTAURANT
vercel

# Set environment variables
vercel env add VITE_API_BASE_URL
# Nhập: https://your-backend.onrender.com

# Deploy production
vercel --prod
```

## Bước 3: Cập nhật Backend URL

Sau khi có URL Vercel, quay lại Render và cập nhật:
- `FRONTEND_URL` = URL Vercel của bạn
- `APP_BASE_URL` = URL Vercel của bạn

## Bước 4: Test

1. Truy cập URL Vercel
2. Test đăng nhập
3. Test các chức năng kết nối với backend

## Troubleshooting

### Lỗi build TypeScript:
- ✅ Đã fix: Exclude `server/` folder khỏi TypeScript compilation
- ✅ Đã fix: Thêm `@types/node` vào devDependencies
- ✅ Đã fix: Sửa `mockData.ts` dùng enum thay vì string literal

### Lỗi 404 khi refresh trang:
- ✅ Đã fix: File `vercel.json` có `rewrites` để handle hash routing

### Lỗi CORS:
- Đảm bảo backend đã set `FRONTEND_URL` = URL Vercel
- Kiểm tra backend có cho phép origin của Vercel

### Lỗi kết nối API:
- Kiểm tra `VITE_API_BASE_URL` đúng chưa
- Kiểm tra backend đã chạy chưa (test `/api/health`)
- Kiểm tra CORS trên backend

## Files đã tạo/sửa:

1. ✅ `vercel.json` - Cấu hình Vercel
2. ✅ `.vercelignore` - Ignore server folder
3. ✅ `tsconfig.json` - Exclude server folder
4. ✅ `package.json` - Thêm `@types/node`
5. ✅ `services/mockData.ts` - Sửa dùng enum

## Lưu ý:

- Vercel sẽ tự động deploy khi push code lên GitHub (nếu đã connect)
- Mỗi branch sẽ có preview URL riêng
- Production URL sẽ là URL chính của project

