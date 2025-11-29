# Hướng dẫn Deploy QR Food Order Pro

## Tổng quan

Dự án này cần deploy 2 phần:
1. **Frontend** (React + Vite) - Giao diện người dùng
2. **Backend** (Node.js + Express) - API server
3. **Database** (MongoDB) - Đã có MongoDB Atlas URI

---

## 🎯 Lựa chọn nền tảng deploy (Khuyến nghị)

### Option 1: Deploy đơn giản nhất (Miễn phí)

- **Frontend**: [Vercel](https://vercel.com) hoặc [Netlify](https://netlify.com)
- **Backend**: [Railway](https://railway.app) hoặc [Render](https://render.com)
- **Database**: MongoDB Atlas (đã có)

### Option 2: Deploy cùng nền tảng

- **Cả Frontend + Backend**: [Vercel](https://vercel.com) (hỗ trợ cả frontend và serverless functions)
- **Database**: MongoDB Atlas

### Option 3: VPS tự quản lý

- **VPS**: DigitalOcean, AWS EC2, Azure VM, Vultr
- **Database**: MongoDB Atlas hoặc MongoDB trên VPS

---

## 📋 Hướng dẫn deploy chi tiết

### A. Deploy Backend (Server)

#### A1. Deploy trên Railway (Khuyến nghị - Dễ nhất)

1. **Đăng ký tài khoản**: https://railway.app (dùng GitHub login)

2. **Tạo project mới**:
   - Click "New Project"
   - Chọn "Deploy from GitHub repo"
   - Chọn repository của bạn

3. **Cấu hình**:
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Port: Railway tự động detect

4. **Thiết lập Environment Variables**:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://cong113377:yKZf988eXonTbJ3B@cluster0.7mpkliv.mongodb.net/nhahang?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your_super_secret_key_change_this
   JWT_EXPIRY=12h
   NODE_ENV=production
   ```

5. **Deploy**: Railway tự động deploy khi push code lên GitHub

6. **Lấy URL**: Railway sẽ cung cấp URL như `https://your-app.railway.app`

---

#### A2. Deploy trên Render

1. **Đăng ký**: https://render.com

2. **Tạo Web Service**:
   - New → Web Service
   - Connect GitHub repo
   - Settings:
     - **Name**: `qr-food-order-api`
     - **Root Directory**: `server`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm p`

3. **Environment Variables**:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your_secret_key
   JWT_EXPIRY=12h
   NODE_ENV=production
   ```

4. **Deploy**: Render tự động deploy

---

#### A3. Deploy trên Vercel (Serverless)

1. **Cài đặt Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Tạo file `vercel.json` trong thư mục `server`**:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/index.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/index.ts"
       }
     ]
   }
   ```

3. **Deploy**:
   ```bash
   cd server
   vercel
   ```

4. **Thiết lập Environment Variables** trên Vercel dashboard

---

### B. Deploy Frontend

#### B1. Deploy trên Vercel (Khuyến nghị)

1. **Đăng ký**: https://vercel.com (dùng GitHub login)

2. **Import project**:
   - Click "Add New Project"
   - Import GitHub repository
   - Root Directory: để trống (hoặc `RESTAURANT` nếu repo ở thư mục con)

3. **Cấu hình Build**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://your-backend-url.railway.app
   VITE_GEMINI_API_KEY=your_gemini_api_key (nếu có)
   ```

5. **Deploy**: Vercel tự động deploy

---

#### B2. Deploy trên Netlify

1. **Đăng ký**: https://netlify.com

2. **Tạo site mới**:
   - New site from Git
   - Connect GitHub
   - Build settings:
     - **Base directory**: `RESTAURANT` (nếu cần)
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`

3. **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://your-backend-url
   VITE_GEMINI_API_KEY=your_key
   ```

4. **Deploy**: Netlify tự động deploy

---

#### B3. Deploy trên Cloudflare Pages

1. **Đăng ký**: https://pages.cloudflare.com

2. **Connect GitHub** và chọn repository

3. **Build settings**:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`

4. **Environment Variables**: Thêm trong Settings → Environment Variables

---

### C. Cấu hình sau khi deploy

#### 1. Cập nhật CORS trên Backend

Đảm bảo backend cho phép frontend domain:

```typescript
// server/src/index.ts
app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',
    'https://your-frontend.netlify.app',
    'http://localhost:5173' // cho development
  ],
  credentials: true
}));
```

#### 2. Cập nhật MongoDB Atlas Whitelist

1. Vào MongoDB Atlas Dashboard
2. Network Access → Add IP Address
3. Thêm IP của server (hoặc `0.0.0.0/0` để cho phép mọi IP - chỉ dùng cho test)

#### 3. Cập nhật Frontend API URL

Trong file `.env.production` hoặc trên hosting platform:
```
VITE_API_BASE_URL=https://your-backend-url.railway.app
```

---

## 🚀 Quick Start (Railway + Vercel)

### Backend trên Railway:

1. Đăng ký Railway → New Project → GitHub
2. Chọn repo → Root Directory: `server`
3. Thêm Environment Variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRY=12h`
   - `PORT=5000`
4. Deploy → Copy URL (ví dụ: `https://api.railway.app`)

### Frontend trên Vercel:

1. Đăng ký Vercel → Import Project → GitHub
2. Framework: Vite
3. Environment Variables:
   - `VITE_API_BASE_URL=https://api.railway.app`
4. Deploy → Copy URL (ví dụ: `https://app.vercel.app`)

### Cập nhật CORS:

Sửa `server/src/index.ts`:
```typescript
app.use(cors({
  origin: ['https://app.vercel.app', 'http://localhost:5173']
}));
```

---

## 📝 Checklist trước khi deploy

- [ ] Đổi `JWT_SECRET` thành giá trị bảo mật
- [ ] Kiểm tra MongoDB Atlas connection string
- [ ] Cấu hình CORS cho frontend domain
- [ ] Thiết lập environment variables trên hosting
- [ ] Test API endpoints sau khi deploy
- [ ] Kiểm tra frontend kết nối được với backend
- [ ] Tạo Super Admin account sau khi deploy

---

## 🔐 Environment Variables

### Backend (Server) - Tạo file `server/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/nhahang?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRY=12h

# Email Service (Optional - cho tính năng reset password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
MAIL_FROM=noreply@yourdomain.com
```

**Lưu ý**: 
- `JWT_SECRET`: Nên dùng chuỗi ngẫu nhiên dài (ít nhất 32 ký tự)
- `MONGODB_URI`: Lấy từ MongoDB Atlas Dashboard
- Email: Nếu dùng Gmail, cần tạo App Password (không dùng mật khẩu thường)

### Frontend - Tạo file `.env` hoặc `.env.production`:

```env
# Backend API URL
VITE_API_BASE_URL=https://your-backend-url.railway.app

# Google Gemini API Key (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Lưu ý**: 
- Tất cả biến môi trường frontend phải bắt đầu bằng `VITE_`
- Sau khi thay đổi `.env`, cần rebuild: `npm run build`

---

## 🔧 Troubleshooting

### Backend không kết nối được MongoDB
- Kiểm tra MongoDB Atlas whitelist IP
- Kiểm tra connection string có đúng không
- Kiểm tra username/password trong connection string

### Frontend không gọi được API
- Kiểm tra CORS settings trên backend
- Kiểm tra `VITE_API_BASE_URL` có đúng không
- Kiểm tra network tab trong browser console

### Build failed
- Kiểm tra Node.js version (nên dùng 18+)
- Kiểm tra dependencies có đầy đủ không
- Xem build logs trên hosting platform

---

## 💰 Chi phí ước tính

### Miễn phí (Free Tier):
- **Vercel**: Free cho personal projects
- **Netlify**: Free tier rộng rãi
- **Railway**: $5 credit/tháng (đủ cho dự án nhỏ)
- **Render**: Free tier có giới hạn
- **MongoDB Atlas**: Free tier 512MB

### Trả phí (khi cần scale):
- Railway: ~$5-20/tháng
- Render: ~$7-25/tháng
- VPS: ~$5-50/tháng tùy cấu hình

---

## 🎯 Khuyến nghị cuối cùng

**Cho dự án nhỏ/vừa:**
- Frontend: **Vercel** (miễn phí, dễ dùng)
- Backend: **Railway** (dễ setup, $5 credit/tháng)

**Cho dự án lớn:**
- Frontend: **Vercel** hoặc **Cloudflare Pages**
- Backend: **AWS**, **DigitalOcean**, hoặc **VPS tự quản lý**

