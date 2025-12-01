# Checklist Test Sau Khi Refactor

## ✅ 1. Kiểm tra Compilation
- [x] `npm run build` - Build thành công không có lỗi
- [ ] `npm run dev` - Dev server chạy bình thường

## 🔍 2. Kiểm tra TypeScript
- [x] Không có lỗi TypeScript
- [x] Không có unused imports/variables

## 🧪 3. Test Chức Năng Chính

### **Restaurant Dashboard - Orders Tab**
- [ ] Hiển thị danh sách đơn hàng đang xử lý
- [ ] Hiển thị danh sách đơn hàng đã hoàn thành
- [ ] Hiển thị danh sách đơn hàng đã hủy
- [ ] Click "Nhận đơn" - chuyển trạng thái từ PENDING → CONFIRMED
- [ ] Click "Đã ra món" - chuyển trạng thái từ CONFIRMED → SERVED
- [ ] Click "Thanh toán" - mở modal invoice
- [ ] Click "Hủy" - hủy đơn hàng
- [ ] Click "Sửa đơn" - mở modal edit order
  - [ ] Thêm món mới vào đơn
  - [ ] Tăng/giảm số lượng món
  - [ ] Xóa món khỏi đơn
  - [ ] Sửa ghi chú
  - [ ] Lưu thay đổi thành công

### **Restaurant Dashboard - Menu Tab**
- [ ] Form thêm món mới hiển thị đúng
- [ ] Thêm món mới thành công
- [ ] Upload ảnh món ăn
- [ ] Dùng AI viết mô tả
- [ ] Hiển thị danh sách món đã thêm
- [ ] Click "Sửa" món - mở modal edit
- [ ] Sửa thông tin món thành công
- [ ] Click "Xóa" món - xóa món thành công
- [ ] Toggle "Còn hàng/Hết hàng"
- [ ] Quản lý danh mục:
  - [ ] Thêm danh mục mới
  - [ ] Sửa tên danh mục
  - [ ] Xóa danh mục
  - [ ] Hiển thị số món trong mỗi danh mục

### **Restaurant Dashboard - Stats Tab**
- [ ] Chọn kỳ thống kê (Hôm nay, Tuần này, Tháng này, Năm này, Tùy chọn)
- [ ] Click "Xem thống kê" - hiển thị dữ liệu
- [ ] Hiển thị Overview Cards (Tổng doanh thu, Giá trị trung bình, Tổng số bàn)
- [ ] Hiển thị chart "Doanh thu theo giờ"
- [ ] Hiển thị chart "Số đơn hàng theo giờ"
- [ ] Hiển thị bảng "Top món bán chạy"
- [ ] Hiển thị bảng "Top bàn doanh thu cao"
- [ ] Hiển thị bảng "Đơn hàng gần đây"

### **Restaurant Dashboard - QR Tab**
- [ ] Hiển thị danh sách bàn
- [ ] Tạo bàn mới
- [ ] Sửa thông tin bàn
- [ ] Xóa bàn
- [ ] Tải QR code từng bàn
- [ ] Tải tất cả QR code
- [ ] Hiển thị loading khi đang tải
- [ ] Toast notification khi tải thành công/thất bại

### **Restaurant Dashboard - Staff Tab**
- [ ] Hiển thị danh sách nhân viên
- [ ] Tạo tài khoản nhân viên mới
- [ ] Sửa thông tin nhân viên
- [ ] Toggle trạng thái active/inactive
- [ ] Thông báo khi nhân viên mới đăng ký

### **Restaurant Dashboard - Bank Tab**
- [ ] Hiển thị thông tin ngân hàng
- [ ] Sửa thông tin ngân hàng
- [ ] Xác thực OTP khi thay đổi thông tin

### **Restaurant Dashboard - Settings Tab**
- [ ] Hiển thị thông tin nhà hàng
- [ ] Sửa thông tin nhà hàng
- [ ] Đổi mật khẩu
- [ ] Đổi email (với OTP)

## 🎨 4. Kiểm tra UI/UX
- [ ] Sidebar navigation hoạt động đúng
- [ ] Mobile menu hoạt động đúng (responsive)
- [ ] Toast notifications hiển thị đúng
- [ ] Loading states hiển thị đúng
- [ ] Modal mở/đóng đúng cách
- [ ] Không có lỗi console

## 🔗 5. Kiểm tra Navigation
- [ ] Chuyển tab Orders → Menu
- [ ] Chuyển tab Menu → Stats
- [ ] Chuyển tab Stats → QR
- [ ] Chuyển tab QR → Staff
- [ ] Chuyển tab Staff → Bank
- [ ] Chuyển tab Bank → Settings
- [ ] Click "Đăng xuất" - logout thành công

## 📱 6. Kiểm tra Responsive
- [ ] Desktop view (>= 1024px) - hiển thị đúng
- [ ] Tablet view (768px - 1023px) - hiển thị đúng
- [ ] Mobile view (< 768px) - hiển thị đúng
- [ ] Mobile menu button hoạt động

## 🚀 7. Kiểm tra Performance
- [ ] Không có memory leak
- [ ] Component re-render hợp lý
- [ ] Images load đúng cách
- [ ] API calls không bị duplicate

## 🐛 8. Kiểm tra Edge Cases
- [ ] Xử lý khi không có dữ liệu (empty state)
- [ ] Xử lý khi API error
- [ ] Xử lý khi network timeout
- [ ] Validation form (required fields, invalid input)

## 📝 Ghi chú
- Chạy test trên cả development và production build
- Test trên nhiều trình duyệt (Chrome, Firefox, Safari, Edge)
- Test với dữ liệu thực và dữ liệu mock
- Kiểm tra console để tìm warnings/errors

