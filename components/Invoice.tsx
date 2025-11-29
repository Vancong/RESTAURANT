import React, { useState } from 'react';
import { Order, Restaurant, PaymentMethod } from '../types';
import { Printer, X, CheckCircle } from 'lucide-react';
import { Button } from './Button';

interface InvoiceProps {
  order: Order;
  restaurant: Restaurant;
  onClose: () => void;
  onConfirm: (paymentMethod: PaymentMethod) => void; // Xác nhận đã in và hoàn thành đơn hàng với hình thức thanh toán
}

export const Invoice: React.FC<InvoiceProps> = ({ order, restaurant, onClose, onConfirm }) => {
  const [hasPrinted, setHasPrinted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

  const handlePrint = () => {
    window.print();
    setHasPrinted(true);
  };

  // Debug: Kiểm tra dữ liệu
  if (!order || !restaurant) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-6">
          <p className="text-red-600">Lỗi: Thiếu thông tin đơn hàng hoặc nhà hàng</p>
          <Button onClick={onClose} className="mt-4">Đóng</Button>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.timestamp);
  const formattedDate = orderDate.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = orderDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Hàm lấy mã ngân hàng dạng viết tắt cho API vietqr.co
  // Tham khảo: https://vietqr.co/generate
  const getBankCodeForAPI = (bankName: string | undefined): string => {
    if (!bankName) return '';
    
    // Lấy phần đầu của tên ngân hàng (trước dấu ngoặc đơn nếu có)
    const cleanBankName = bankName.split('(')[0].trim();
    const bankNameUpper = cleanBankName.toUpperCase();
    
    const bankCodeMap: Record<string, string> = {
      'VIETCOMBANK': 'vcb',
      'VCB': 'vcb',
      'BIDV': 'bidv',
      'VIETINBANK': 'vietinbank',
      'AGRIBANK': 'agribank',
      'TECHCOMBANK': 'techcombank',
      'ACB': 'acb',
      'VPBANK': 'vpb',
      'VP BANK': 'vpb',
      'MBBANK': 'mb',
      'MB BANK': 'mb',
      'TPBANK': 'tpb',
      'TP BANK': 'tpb',
      'HDBANK': 'hdb',
      'HD BANK': 'hdb',
      'SHB': 'shb',
      'VIB': 'vib',
      'EXIMBANK': 'eximbank',
      'SACOMBANK': 'sacombank',
      'MSB': 'msb',
      'OCB': 'ocb',
      'SEABANK': 'seabank',
      'SEA BANK': 'seabank',
      'PVCOMBANK': 'pvcombank',
      'PVCOM BANK': 'pvcombank',
      'VIETABANK': 'vietabank',
      'VIETA BANK': 'vietabank',
      'BACABANK': 'bacabank',
      'BACA BANK': 'bacabank',
      'NCB': 'ncb',
      'DONGABANK': 'dongabank',
      'DONGA BANK': 'dongabank',
      'GPBANK': 'gpbank',
      'GP BANK': 'gpbank',
      'KIENLONGBANK': 'kienlongbank',
      'KIENLONG BANK': 'kienlongbank',
      'NAMABANK': 'namabank',
      'NAMA BANK': 'namabank',
      'PGBANK': 'pgbank',
      'PG BANK': 'pgbank',
      'PUBLICBANK': 'publicbank',
      'PUBLIC BANK': 'publicbank',
      'AB BANK': 'abbank',
      'ABANK': 'abbank',
      'VIETBANK': 'vietbank',
      'VIET BANK': 'vietbank'
    };
    
    // Tìm mã ngân hàng từ tên (không phân biệt hoa thường)
    for (const [key, code] of Object.entries(bankCodeMap)) {
      if (bankNameUpper.includes(key)) {
        console.log('Matched bank:', key, '->', code, 'from:', bankName);
        return code;
      }
    }
    
    console.warn('Không tìm thấy mã ngân hàng cho:', bankName);
    return '';
  };

  // Tạo URL QR code từ API vietqr.io (API chính thức của VietQR)
  const bankCode = getBankCodeForAPI(restaurant.bankName);
  const accountName = restaurant.name || 'Nha hang'; // Tên tài khoản
  const accountNumber = restaurant.bankAccount || '';
  const amount = Math.round(order.totalAmount); // Số tiền (làm tròn)
  
  // Sử dụng API img.vietqr.io để tạo QR code (API chính thức của VietQR)
  // Format: https://img.vietqr.io/image/{bankCode}-{accountNumber}-{template}.jpg?amount={amount}&addInfo={content}
  // Template: compact, compact2, qr_only, print
  // API này tạo QR code đúng chuẩn VietQR và có thể quét được bằng app ngân hàng
  // Chỉ tạo QR code khi chọn hình thức chuyển khoản
  const qrImageUrl = (paymentMethod === PaymentMethod.BANK_TRANSFER && restaurant.bankAccount && bankCode)
    ? `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(`Ban ${order.tableNumber}`)}`
    : null;

  // Debug
  console.log('QR Code Debug:', {
    bankName: restaurant.bankName,
    bankCode,
    accountNumber,
    accountName,
    amount,
    qrImageUrl
  });

  return (
    <>
      {/* Bản copy cho in - chỉ hiển thị khi in */}
      <div className="invoice-print-only" style={{ display: 'none' }}>
        <div style={{ padding: '2cm', fontFamily: 'Arial, sans-serif' }}>
          {/* Thông tin nhà hàng */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>{restaurant.name}</h1>
            <p style={{ fontSize: '14px', color: '#666' }}>{restaurant.address}</p>
            <p style={{ fontSize: '14px', color: '#666' }}>ĐT: {restaurant.phone}</p>
          </div>

          {/* Thông tin đơn hàng */}
          <div style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '15px 0', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>Bàn số:</span>
              <span style={{ fontWeight: 'bold' }}>{order.tableNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>Ngày:</span>
              <span style={{ fontWeight: 'bold' }}>{formattedDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#666' }}>Giờ:</span>
              <span style={{ fontWeight: 'bold' }}>{formattedTime}</span>
            </div>
          </div>

          {/* Danh sách món */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '10px', fontSize: '14px', fontWeight: 'bold' }}>Tên món</th>
                <th style={{ textAlign: 'center', padding: '10px', fontSize: '14px', fontWeight: 'bold' }}>SL</th>
                <th style={{ textAlign: 'right', padding: '10px', fontSize: '14px', fontWeight: 'bold' }}>Đơn giá</th>
                <th style={{ textAlign: 'right', padding: '10px', fontSize: '14px', fontWeight: 'bold' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontSize: '14px' }}>{item.name}</td>
                  <td style={{ textAlign: 'center', padding: '10px', fontSize: '14px' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '10px', fontSize: '14px' }}>
                    {item.price.toLocaleString('vi-VN')}đ
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Ghi chú nếu có */}
          {order.note && (
            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#fffbf0', border: '1px solid #f0e68c', borderRadius: '5px' }}>
              <p style={{ fontSize: '14px', color: '#856404' }}>
                <span style={{ fontWeight: 'bold' }}>Ghi chú: </span>
                {order.note}
              </p>
            </div>
          )}

          {/* Tổng tiền */}
          <div style={{ borderTop: '2px solid #333', paddingTop: '15px', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Tổng cộng:</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                {order.totalAmount.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          {/* QR Code thanh toán - chỉ hiển thị khi chọn chuyển khoản */}
          {paymentMethod === PaymentMethod.BANK_TRANSFER && restaurant.bankAccount ? (
            qrImageUrl ? (
              <div style={{ marginTop: '30px', textAlign: 'center', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Quét mã QR để thanh toán</p>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                  <img 
                    src={qrImageUrl} 
                    alt="QR Code thanh toán" 
                    style={{ width: '200px', height: '200px', objectFit: 'contain', border: '1px solid #eee' }}
                    onError={(e) => {
                      console.error('Lỗi tải QR code từ vietqr.co, URL:', qrImageUrl);
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.textContent = 'Không thể tải QR code. Vui lòng kiểm tra lại thông tin ngân hàng.';
                      errorDiv.style.color = '#dc2626';
                      errorDiv.style.fontSize = '12px';
                      errorDiv.style.padding = '10px';
                      img.parentElement?.appendChild(errorDiv);
                    }}
                  />
                </div>
                {restaurant.bankName && (
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    Ngân hàng: {restaurant.bankName}
                  </p>
                )}
                <p style={{ fontSize: '12px', color: '#666' }}>
                  STK: {restaurant.bankAccount}
                </p>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  Số tiền: {order.totalAmount.toLocaleString('vi-VN')}đ - Bàn: {order.tableNumber}
                </p>
              </div>
            ) : (
              <div style={{ marginTop: '30px', textAlign: 'center', padding: '20px', border: '1px solid #fbbf24', borderRadius: '8px', backgroundColor: '#fffbeb' }}>
                <p style={{ fontSize: '14px', color: '#92400e', marginBottom: '5px' }}>
                  ⚠️ Không thể tạo QR code
                </p>
                <p style={{ fontSize: '12px', color: '#78350f' }}>
                  Vui lòng kiểm tra lại tên ngân hàng: {restaurant.bankName || 'Chưa cập nhật'}
                </p>
                <p style={{ fontSize: '12px', color: '#78350f', marginTop: '5px' }}>
                  STK: {restaurant.bankAccount}
                </p>
              </div>
            )
          ) : null}

          {/* Footer */}
          <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
            <p>Cảm ơn quý khách đã sử dụng dịch vụ!</p>
            <p style={{ marginTop: '5px' }}>Hẹn gặp lại quý khách lần sau</p>
          </div>
        </div>
      </div>
      
      {/* Overlay cho màn hình */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header với nút đóng */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center print:hidden">
            <h2 className="text-xl font-bold text-gray-900">Hóa đơn</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Nội dung hóa đơn */}
          <div className="p-6">
            {/* Thông tin nhà hàng */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
              <p className="text-sm text-gray-600">{restaurant.address}</p>
              <p className="text-sm text-gray-600">ĐT: {restaurant.phone}</p>
            </div>

            {/* Thông tin đơn hàng */}
            <div className="border-t border-b border-gray-200 py-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Bàn số:</span>
                <span className="font-semibold">{order.tableNumber}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Ngày:</span>
                <span className="font-semibold">{formattedDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Giờ:</span>
                <span className="font-semibold">{formattedTime}</span>
              </div>
            </div>

            {/* Danh sách món */}
            <div className="mb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-semibold text-gray-700">Tên món</th>
                    <th className="text-center py-2 text-sm font-semibold text-gray-700">SL</th>
                    <th className="text-right py-2 text-sm font-semibold text-gray-700">Đơn giá</th>
                    <th className="text-right py-2 text-sm font-semibold text-gray-700">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-3 text-sm text-gray-900">{item.name}</td>
                      <td className="py-3 text-center text-sm text-gray-700">{item.quantity}</td>
                      <td className="py-3 text-right text-sm text-gray-700">
                        {item.price.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-3 text-right text-sm font-semibold text-gray-900">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ghi chú nếu có */}
            {order.note && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Ghi chú: </span>
                  {order.note}
                </p>
              </div>
            )}

            {/* Tổng tiền */}
            <div className="border-t-2 border-gray-300 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Tổng cộng:</span>
                <span className="text-2xl font-bold text-brand-600">
                  {order.totalAmount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            {/* Chọn hình thức thanh toán */}
            <div className="mt-6 p-4 border border-gray-200 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-3">Hình thức thanh toán:</p>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PaymentMethod.CASH}
                    checked={paymentMethod === PaymentMethod.CASH}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mr-2 w-4 h-4 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700">Tiền mặt</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PaymentMethod.BANK_TRANSFER}
                    checked={paymentMethod === PaymentMethod.BANK_TRANSFER}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mr-2 w-4 h-4 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700">Chuyển khoản</span>
                </label>
              </div>
            </div>

            {/* QR Code thanh toán - chỉ hiển thị khi chọn chuyển khoản */}
            {paymentMethod === PaymentMethod.BANK_TRANSFER && restaurant.bankAccount ? (
              qrImageUrl ? (
                <div className="mt-6 p-4 border border-gray-200 rounded-lg text-center">
                  <p className="text-sm font-bold mb-3">Quét mã QR để thanh toán</p>
                  <div className="flex justify-center mb-3">
                    <img 
                      src={qrImageUrl} 
                      alt="QR Code thanh toán" 
                      className="w-48 h-48 object-contain border border-gray-200"
                      onError={(e) => {
                        console.error('Lỗi tải QR code từ vietqr.co, URL:', qrImageUrl);
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'text-red-600 text-xs p-2';
                        errorDiv.textContent = 'Không thể tải QR code. Vui lòng kiểm tra lại thông tin ngân hàng.';
                        img.parentElement?.appendChild(errorDiv);
                      }}
                    />
                  </div>
                  {restaurant.bankName && (
                    <p className="text-xs text-gray-600 mt-2">
                      Ngân hàng: {restaurant.bankName}
                    </p>
                  )}
                  <p className="text-xs text-gray-600">
                    STK: {restaurant.bankAccount}
                  </p>
                  <p className="text-xs text-gray-600">
                    Số tiền: {order.totalAmount.toLocaleString('vi-VN')}đ - Bàn: {order.tableNumber}
                  </p>
                </div>
              ) : (
                <div className="mt-6 p-4 border border-yellow-300 rounded-lg text-center bg-yellow-50">
                  <p className="text-sm text-yellow-800 font-semibold mb-2">
                    ⚠️ Không thể tạo QR code
                  </p>
                  <p className="text-xs text-yellow-700">
                    Vui lòng kiểm tra lại tên ngân hàng: {restaurant.bankName || 'Chưa cập nhật'}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    STK: {restaurant.bankAccount}
                  </p>
                </div>
              )
            ) : null}

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-gray-500">
              <p>Cảm ơn quý khách đã sử dụng dịch vụ!</p>
              <p className="mt-1">Hẹn gặp lại quý khách lần sau</p>
            </div>
          </div>

          {/* Nút in - chỉ hiển thị khi không in */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 print:hidden">
            {!hasPrinted ? (
              <>
                <Button variant="secondary" onClick={onClose} disabled>
                  Đóng
                </Button>
                <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                  <Printer className="w-4 h-4 mr-2" />
                  In hóa đơn
                </Button>
                <p className="text-xs text-gray-500 self-center mr-2">
                  Vui lòng in hóa đơn trước khi hoàn thành đơn hàng
                </p>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={onClose}>
                  Đóng (không hoàn thành)
                </Button>
                <Button 
                  onClick={() => {
                    onConfirm(paymentMethod);
                    onClose();
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Xác nhận đã in và hoàn thành đơn hàng
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CSS cho in */}
      <style>{`
        @media print {
          @page {
            margin: 1.5cm;
            size: A4;
          }
          
          /* Ẩn tất cả trừ nội dung in */
          body * {
            visibility: hidden;
          }
          
          .invoice-print-only,
          .invoice-print-only * {
            visibility: visible !important;
          }
          
          .invoice-print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }
          
          /* Ẩn các phần không cần in */
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};
