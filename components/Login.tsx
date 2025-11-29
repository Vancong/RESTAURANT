import React, { useState } from 'react';
import { Button } from './Button';
import { ChefHat, Lock, User } from 'lucide-react';

interface LoginProps {
  onLogin: (identifier: string, password: string) => void;
  error?: string;
  onRequestPasswordReset: (email: string) => Promise<void> | void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, error, onRequestPasswordReset }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(identifier, password);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetMessage(null);
    if (!resetEmail) {
      setResetError('Vui lòng nhập email đã đăng ký cho nhà hàng.');
      return;
    }
    try {
      setIsSendingReset(true);
      await onRequestPasswordReset(resetEmail);
      setResetMessage('Đã gửi email chứa mã OTP đổi mật khẩu. Vui lòng kiểm tra hộp thư.');
      setResetEmail('');
      setIsForgotOpen(false);
      // Điều hướng sang trang nhập OTP + mật khẩu mới
      window.location.hash = '#/reset-password';
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Không thể gửi email đặt lại mật khẩu.');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-brand-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Nhà Hàng</h1>
          <p className="text-gray-500 text-sm mt-1">Đăng nhập để vào hệ thống</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập hoặc Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="pl-10 block w-full border border-gray-300 rounded-lg py-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                placeholder="admin hoặc email@domain.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 block w-full border border-gray-300 rounded-lg py-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                placeholder="••••••"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg">
            Đăng nhập
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            onClick={() => setIsForgotOpen(true)}
          >
            Quên mật khẩu?
          </button>
        </div>
        
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>Mặc định: Super Admin (admin/admin)</p>
          <p>Nhà hàng mẫu: admin88/123</p>
        </div>
      </div>

      {isForgotOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nhận mã OTP đổi mật khẩu</h3>
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email nhà hàng</label>
                <input
                  type="email"
                  required
                  className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="email@yourrestaurant.com"
                />
              </div>
              {resetError && <p className="text-sm text-red-600">{resetError}</p>}
              {resetMessage && <p className="text-sm text-green-600">{resetMessage}</p>}
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" type="button" onClick={() => setIsForgotOpen(false)}>
                  Đóng
                </Button>
                <Button type="submit" disabled={isSendingReset}>
                  {isSendingReset ? 'Đang gửi...' : 'Gửi mã OTP'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};