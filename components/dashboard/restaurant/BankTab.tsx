import React, { useState, useEffect } from 'react';
import { Restaurant } from '../../../types';
import { Button } from '../../Button';
import { CreditCard } from 'lucide-react';

// Trong development mode, luôn dùng localhost. Chỉ dùng VITE_API_BASE_URL khi production
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:5000' 
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
const AUTH_TOKEN_KEY = 'qr_food_order_token';

// Danh sách các ngân hàng phổ biến ở Việt Nam
const banks = [
  'Vietcombank (Ngân hàng Ngoại thương Việt Nam)',
  'BIDV (Ngân hàng Đầu tư và Phát triển Việt Nam)',
  'Vietinbank (Ngân hàng Công thương Việt Nam)',
  'Agribank (Ngân hàng Nông nghiệp và Phát triển Nông thôn)',
  'Techcombank (Ngân hàng Kỹ thương Việt Nam)',
  'ACB (Ngân hàng Á Châu)',
  'VPBank (Ngân hàng Việt Nam Thịnh Vượng)',
  'MBBank (Ngân hàng Quân đội)',
  'TPBank (Ngân hàng Tiên Phong)',
  'HDBank (Ngân hàng Phát triển Thành phố Hồ Chí Minh)',
  'SHB (Ngân hàng Sài Gòn - Hà Nội)',
  'VIB (Ngân hàng Quốc tế Việt Nam)',
  'Eximbank (Ngân hàng Xuất Nhập khẩu Việt Nam)',
  'Sacombank (Ngân hàng Sài Gòn Thương Tín)',
  'MSB (Ngân hàng Hàng Hải)',
  'OCB (Ngân hàng Phương Đông)',
  'SeABank (Ngân hàng Đông Nam Á)',
  'PVcomBank (Ngân hàng Đại Chúng)',
  'VietABank (Ngân hàng Việt Á)',
  'BacABank (Ngân hàng Bắc Á)',
  'NCB (Ngân hàng Quốc Dân)',
  'DongABank (Ngân hàng Đông Á)',
  'GPBank (Ngân hàng Dầu Khí Toàn Cầu)',
  'Kienlongbank (Ngân hàng Kiên Long)',
  'NamABank (Ngân hàng Nam Á)',
  'PGBank (Ngân hàng Xăng dầu Petrolimex)',
  'PublicBank (Ngân hàng Public Việt Nam)',
  'ABBank (Ngân hàng An Bình)',
  'VietBank (Ngân hàng Việt Nam Thương Tín)',
  'BAOVIET Bank (Ngân hàng Bảo Việt)'
];

interface BankTabProps {
  restaurant: Restaurant;
  onUpdateRestaurant: (data: Partial<Restaurant>) => Promise<Restaurant>;
  addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const BankTab: React.FC<BankTabProps> = ({ restaurant, onUpdateRestaurant, addNotification }) => {
  const [bankAccountInput, setBankAccountInput] = useState(restaurant.bankAccount || '');
  const [bankNameInput, setBankNameInput] = useState(restaurant.bankName || '');
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankChangeOtp, setBankChangeOtp] = useState('');
  const [isSendingBankOtp, setIsSendingBankOtp] = useState(false);
  const [bankOtpSent, setBankOtpSent] = useState(false);

  useEffect(() => {
    setBankAccountInput(restaurant.bankAccount || '');
    setBankNameInput(restaurant.bankName || '');
    setBankChangeOtp('');
    setBankOtpSent(false);
  }, [restaurant]);

  const handleRequestBankOtp = async () => {
    if (!bankAccountInput.trim() || !bankNameInput.trim()) {
      addNotification('warning', '⚠️ Cảnh báo', 'Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng');
      return;
    }
    try {
      setIsSendingBankOtp(true);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }
      const res = await fetch(`${API_BASE_URL}/api/restaurants/me/request-bank-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          newBankAccount: bankAccountInput.trim(),
          newBankName: bankNameInput.trim()
        })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể gửi mã OTP');
      }
      setBankOtpSent(true);
      addNotification('success', '✅ Thành công', 'Đã gửi mã OTP đến email hiện tại của nhà hàng. Vui lòng kiểm tra hộp thư.');
    } catch (err) {
      addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Không thể gửi mã OTP');
    } finally {
      setIsSendingBankOtp(false);
    }
  };

  const handleSaveBank = async () => {
    try {
      const bankAccountChanged = 
        bankAccountInput.trim() !== (restaurant.bankAccount || '').trim() ||
        bankNameInput.trim() !== (restaurant.bankName || '').trim();
      
      if (bankAccountChanged && !bankChangeOtp) {
        addNotification('warning', '⚠️ Cảnh báo', 'Vui lòng nhập mã OTP để xác thực đổi tài khoản ngân hàng');
        return;
      }
      if (bankAccountChanged && bankChangeOtp.length !== 6) {
        addNotification('warning', '⚠️ Cảnh báo', 'Mã OTP phải có 6 chữ số');
        return;
      }

      setIsSavingBank(true);
      const updateData: any = { 
        bankName: bankNameInput.trim(),
        bankAccount: bankAccountInput.trim()
      };
      if (bankAccountChanged && bankChangeOtp) {
        updateData.bankChangeOtp = bankChangeOtp.trim();
      }
      await onUpdateRestaurant(updateData);
      setBankChangeOtp('');
      setBankOtpSent(false);
      addNotification('success', '✅ Cập nhật thành công', 'Đã cập nhật thông tin ngân hàng');
    } catch (err) {
      addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Không thể cập nhật thông tin ngân hàng');
    } finally {
      setIsSavingBank(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Thông tin ngân hàng</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center mb-6">
          <CreditCard className="w-6 h-6 mr-3 text-brand-600" />
          <h3 className="text-lg font-bold">Cấu hình thông tin ngân hàng</h3>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên ngân hàng <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
              value={bankNameInput}
              onChange={(e) => setBankNameInput(e.target.value)}
              required
            >
              <option value="">-- Chọn ngân hàng --</option>
              {banks.map((bank, index) => (
                <option key={index} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Vui lòng chọn ngân hàng nơi bạn mở tài khoản
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tài khoản ngân hàng
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={bankAccountInput}
              onChange={(e) => setBankAccountInput(e.target.value)}
              placeholder="Nhập số tài khoản ngân hàng"
            />
            <p className="text-xs text-gray-500 mt-1">
              Số tài khoản này sẽ được hiển thị trong QR code thanh toán khi khách hàng thanh toán đơn hàng
            </p>
          </div>

          {restaurant.bankName || restaurant.bankAccount ? (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">Thông tin hiện tại:</p>
              {restaurant.bankName && (
                <p className="text-sm text-blue-800 mb-1">
                  <span className="font-semibold">Tên ngân hàng: </span>
                  {restaurant.bankName}
                </p>
              )}
              {restaurant.bankAccount && (
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Số tài khoản: </span>
                  {restaurant.bankAccount}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Chưa có thông tin ngân hàng. Vui lòng nhập thông tin để khách hàng có thể thanh toán qua QR code.
              </p>
            </div>
          )}

          {/* OTP Section - Hiển thị khi thay đổi bank account */}
          {(bankAccountInput.trim() !== (restaurant.bankAccount || '').trim() || 
            bankNameInput.trim() !== (restaurant.bankName || '').trim()) && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-semibold text-yellow-900 mb-2">
                ⚠️ Bạn đang thay đổi tài khoản ngân hàng. Cần xác thực bằng mã OTP.
              </p>
              {!bankOtpSent ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleRequestBankOtp}
                  disabled={isSendingBankOtp || !bankAccountInput.trim() || !bankNameInput.trim()}
                >
                  {isSendingBankOtp ? 'Đang gửi...' : 'Gửi mã OTP xác thực'}
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">
                    Mã OTP đã được gửi đến email hiện tại: <strong>{restaurant.email}</strong>
                  </p>
                  <input
                    type="text"
                    placeholder="Nhập mã OTP 6 chữ số"
                    maxLength={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg tracking-widest"
                    value={bankChangeOtp}
                    onChange={(e) => setBankChangeOtp(e.target.value.replace(/\D/g, ''))}
                  />
                  <button
                    type="button"
                    className="text-xs text-brand-600 hover:text-brand-700"
                    onClick={handleRequestBankOtp}
                  >
                    Gửi lại mã OTP
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={handleSaveBank}
              disabled={isSavingBank}
            >
              {isSavingBank ? 'Đang lưu...' : 'Lưu thông tin ngân hàng'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

