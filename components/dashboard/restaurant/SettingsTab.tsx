import React, { useState, useEffect } from 'react';
import { Restaurant } from '../../../types';
import { Button } from '../../Button';
import { Settings, Edit, Lock, X } from 'lucide-react';

// Trong development mode, luôn dùng localhost. Chỉ dùng VITE_API_BASE_URL khi production
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:5000' 
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
const AUTH_TOKEN_KEY = 'qr_food_order_token';

interface SettingsTabProps {
  restaurant: Restaurant;
  onUpdateRestaurant: (data: Partial<Restaurant>) => Promise<Restaurant>;
  addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ restaurant, onUpdateRestaurant, addNotification }) => {
  const [isEditingRestaurant, setIsEditingRestaurant] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState({
    name: restaurant.name,
    ownerName: restaurant.ownerName,
    email: restaurant.email,
    address: restaurant.address,
    phone: restaurant.phone,
    bankAccount: restaurant.bankAccount || ''
  });
  const [isSavingRestaurant, setIsSavingRestaurant] = useState(false);
  const [emailChangeOtp, setEmailChangeOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isChangePwOpen, setIsChangePwOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!isEditingRestaurant) {
      setRestaurantForm({
        name: restaurant.name,
        ownerName: restaurant.ownerName,
        email: restaurant.email,
        address: restaurant.address,
        phone: restaurant.phone,
        bankAccount: restaurant.bankAccount || ''
      });
      setEmailChangeOtp('');
      setOtpSent(false);
    }
  }, [restaurant, isEditingRestaurant]);

  const handleRequestOtp = async () => {
    try {
      setIsSendingOtp(true);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }
      const res = await fetch(`${API_BASE_URL}/api/restaurants/me/request-email-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newEmail: restaurantForm.email.trim() })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể gửi mã OTP');
      }
      setOtpSent(true);
      addNotification('success', '✅ Thành công', 'Đã gửi mã OTP đến email hiện tại của nhà hàng. Vui lòng kiểm tra hộp thư.');
    } catch (err) {
      addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Không thể gửi mã OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      addNotification('warning', '⚠️ Cảnh báo', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (newPassword !== confirmPassword) {
      addNotification('warning', '⚠️ Cảnh báo', 'Mật khẩu mới không khớp');
      return;
    }
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể đổi mật khẩu');
      }
      addNotification('success', '✅ Thành công', 'Đã đổi mật khẩu thành công');
      setIsChangePwOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Không thể đổi mật khẩu');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Cài đặt</h2>
      
      {/* Thông tin nhà hàng */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center">
            <Settings className="w-5 h-5 mr-2 text-brand-600" /> Thông tin nhà hàng
          </h3>
          {!isEditingRestaurant && (
            <Button
              size="sm"
              onClick={() => {
                setIsEditingRestaurant(true);
                setRestaurantForm({
                  name: restaurant.name,
                  ownerName: restaurant.ownerName,
                  email: restaurant.email,
                  address: restaurant.address,
                  phone: restaurant.phone,
                  bankAccount: restaurant.bankAccount || ''
                });
              }}
            >
              <Edit className="w-4 h-4 mr-2" /> Sửa thông tin
            </Button>
          )}
        </div>

        {isEditingRestaurant ? (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setIsSavingRestaurant(true);
                const emailChanged = restaurantForm.email.toLowerCase() !== restaurant.email.toLowerCase();
                if (emailChanged && !emailChangeOtp) {
                  addNotification('warning', '⚠️ Cảnh báo', 'Vui lòng nhập mã OTP để xác thực đổi email');
                  setIsSavingRestaurant(false);
                  return;
                }
                if (emailChanged && emailChangeOtp.length !== 6) {
                  addNotification('warning', '⚠️ Cảnh báo', 'Mã OTP phải có 6 chữ số');
                  setIsSavingRestaurant(false);
                  return;
                }
                
                const updateData = { ...restaurantForm };
                if (emailChanged) {
                  (updateData as any).emailChangeOtp = emailChangeOtp;
                }
                
                await onUpdateRestaurant(updateData);
                setIsEditingRestaurant(false);
                setEmailChangeOtp('');
                setOtpSent(false);
                addNotification('success', '✅ Cập nhật thành công', 'Đã cập nhật thông tin nhà hàng');
              } catch (err) {
                addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Không thể cập nhật thông tin nhà hàng');
              } finally {
                setIsSavingRestaurant(false);
              }
            }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên nhà hàng
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={restaurantForm.name}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên chủ nhà hàng
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={restaurantForm.ownerName}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, ownerName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="space-y-2">
                <input
                  type="email"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={restaurantForm.email}
                  onChange={(e) => {
                    const newEmail = e.target.value;
                    setRestaurantForm({ ...restaurantForm, email: newEmail });
                    if (newEmail.toLowerCase() !== restaurant.email.toLowerCase()) {
                      setOtpSent(false);
                      setEmailChangeOtp('');
                    } else {
                      setOtpSent(false);
                      setEmailChangeOtp('');
                    }
                  }}
                />
                {restaurantForm.email.toLowerCase() !== restaurant.email.toLowerCase() && (
                  <div className="space-y-2">
                    {!otpSent ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleRequestOtp}
                        disabled={isSendingOtp}
                      >
                        {isSendingOtp ? 'Đang gửi...' : 'Gửi mã OTP xác thực'}
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
                          value={emailChangeOtp}
                          onChange={(e) => setEmailChangeOtp(e.target.value.replace(/\D/g, ''))}
                        />
                        <button
                          type="button"
                          className="text-xs text-brand-600 hover:text-brand-700"
                          onClick={handleRequestOtp}
                        >
                          Gửi lại mã OTP
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={restaurantForm.address}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={restaurantForm.phone}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số tài khoản ngân hàng
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={restaurantForm.bankAccount}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, bankAccount: e.target.value })}
                placeholder="Nhập số tài khoản ngân hàng"
              />
              <p className="text-xs text-gray-500 mt-1">
                Số tài khoản này sẽ được hiển thị trong QR code thanh toán
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditingRestaurant(false);
                  setRestaurantForm({
                    name: restaurant.name,
                    ownerName: restaurant.ownerName,
                    email: restaurant.email,
                    address: restaurant.address,
                    phone: restaurant.phone,
                    bankAccount: restaurant.bankAccount || ''
                  });
                }}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSavingRestaurant}>
                {isSavingRestaurant ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Tên nhà hàng
              </label>
              <p className="text-gray-900 font-medium">{restaurant.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Tên chủ nhà hàng
              </label>
              <p className="text-gray-900 font-medium">{restaurant.ownerName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Email
              </label>
              <p className="text-gray-900 font-medium">{restaurant.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Địa chỉ
              </label>
              <p className="text-gray-900 font-medium">{restaurant.address}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Số điện thoại
              </label>
              <p className="text-gray-900 font-medium">{restaurant.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Số tài khoản ngân hàng
              </label>
              <p className="text-gray-900 font-medium">
                {restaurant.bankAccount || <span className="text-gray-400 italic">Chưa cập nhật</span>}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Username (không thể thay đổi)
              </label>
              <p className="text-gray-900 font-medium">{restaurant.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Trạng thái
              </label>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                restaurant.status === 'ACTIVE' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {restaurant.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Đổi mật khẩu */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center">
            <Lock className="w-5 h-5 mr-2 text-brand-600" /> Mật khẩu
          </h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsChangePwOpen(true)}
          >
            Đổi mật khẩu
          </Button>
        </div>
        <p className="text-sm text-gray-500">Bảo mật tài khoản của bạn bằng mật khẩu mạnh</p>
      </div>

      {/* Change Password Modal */}
      {isChangePwOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Đổi mật khẩu</h3>
              <button
                type="button"
                onClick={() => {
                  setIsChangePwOpen(false);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsChangePwOpen(false);
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Hủy
                </Button>
                <Button type="button" onClick={handleChangePassword}>
                  Đổi mật khẩu
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

