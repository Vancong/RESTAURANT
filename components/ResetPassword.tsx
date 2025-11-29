import React, { useState } from 'react';
import { Button } from './Button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface ResetPasswordProps {
  initialToken?: string | null; // không dùng nữa, chỉ giữ để không phá props
  onSuccess: () => void;
  onBack: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({
  onSuccess,
  onBack
}) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword.length < 6) {
      setError('Mật khẩu mới cần ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Record<string, string> = { newPassword };

      if (!email || !otp) {
        setError('Vui lòng nhập email và mã OTP.');
        setIsSubmitting(false);
        return;
      }
      payload.email = email;
      payload.otp = otp;

      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Không thể đặt lại mật khẩu.');
      }
      setMessage('Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Đặt lại mật khẩu bằng OTP</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Nhập email nhà hàng, mã OTP được gửi tới email đó và mật khẩu mới.
        </p>

        <form onSubmit={submitReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email nhà hàng</label>
            <input
              type="email"
              className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@yourrestaurant.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã OTP</label>
            <input
              className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="6 chữ số"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <input
              type="password"
              className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <input
              type="password"
              className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <div className="flex justify-between items-center pt-2">
            <Button type="button" variant="secondary" onClick={onBack}>
              Quay lại đăng nhập
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

