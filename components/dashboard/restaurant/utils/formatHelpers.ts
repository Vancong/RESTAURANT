// Helper function để format giá tiền theo định dạng Việt Nam (dấu phẩy ngăn cách)
export const formatPrice = (price: number | string): string => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Helper function để parse giá từ string đã format về number (loại bỏ dấu phẩy)
export const parsePrice = (priceString: string): number => {
  // Loại bỏ tất cả dấu phẩy và khoảng trắng
  const cleaned = priceString.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Helper function để format ngày thân thiện: "Hôm nay", "Hôm qua", "Thứ X", hoặc "DD/MM/YYYY"
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const orderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  // So sánh ngày (bỏ qua giờ)
  if (orderDate.getTime() === today.getTime()) {
    return `Hôm nay, ${timeStr}`;
  } else if (orderDate.getTime() === yesterday.getTime()) {
    return `Hôm qua, ${timeStr}`;
  } else {
    // Kiểm tra xem có phải trong tuần này không (7 ngày gần nhất)
    const diffTime = today.getTime() - orderDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays < 7) {
      // Trong tuần này, hiển thị thứ
      const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
      const dayName = dayNames[date.getDay()];
      return `${dayName}, ${timeStr}`;
    } else {
      // Xa hơn, hiển thị ngày đầy đủ
      return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${timeStr}`;
    }
  }
};

// Helper function để format ngày ngắn gọn (chỉ ngày, không có giây)
export const formatDateShort = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const orderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  
  if (orderDate.getTime() === today.getTime()) {
    return `Hôm nay, ${timeStr}`;
  } else if (orderDate.getTime() === yesterday.getTime()) {
    return `Hôm qua, ${timeStr}`;
  } else {
    const diffTime = today.getTime() - orderDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays < 7) {
      const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
      const dayName = dayNames[date.getDay()];
      return `${dayName}, ${timeStr}`;
    } else {
      return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${timeStr}`;
    }
  }
};

