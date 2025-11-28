import React, { useState } from 'react';
import { NewRestaurantPayload, Restaurant, RestaurantStatus } from '../types';
import { Button } from './Button';
import { Plus, Store, Power, KeyRound } from 'lucide-react';

interface SuperAdminDashboardProps {
  restaurants: Restaurant[];
  onAddRestaurant: (r: NewRestaurantPayload) => void;
  onToggleActive: (id: string) => void;
  onResetRestaurantPassword: (id: string, newPassword: string) => Promise<any>;
  onLogout: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  restaurants,
  onAddRestaurant,
  onToggleActive,
  onResetRestaurantPassword,
  onLogout
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const initialForm: NewRestaurantPayload = {
    name: '',
    username: '',
    password: '',
    ownerName: '',
    email: '',
    address: '',
    phone: '',
    status: RestaurantStatus.ACTIVE
  };
  const [newRest, setNewRest] = useState<NewRestaurantPayload>(initialForm);
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRestaurant(newRest);
    setIsModalOpen(false);
    setNewRest(initialForm);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
               <Store className="w-6 h-6 text-brand-600 mr-2" />
               <span className="font-bold text-xl text-gray-900">Admin Tổng</span>
            </div>
            <div className="flex items-center">
               <Button variant="ghost" onClick={onLogout}>Đăng xuất</Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Danh sách nhà hàng</h2>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Thêm Nhà Hàng
          </Button>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {restaurants.map((rest) => (
              <li key={rest.id}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {rest.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-brand-600 truncate">{rest.name}</div>
                      <div className="flex items-center text-sm text-gray-500">
                         <span className="mr-2">User: {rest.username}</span>
                      </div>
                      <p className="text-xs text-gray-500">Chủ: {rest.ownerName}</p>
                      <p className="text-xs text-gray-500">Email: {rest.email}</p>
                      <p className="text-xs text-gray-500">Địa chỉ: {rest.address}</p>
                      <p className="text-xs text-gray-500">Liên hệ: {rest.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rest.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {rest.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setResetTarget({ id: rest.id, name: rest.name })}
                      title="Đặt lại mật khẩu admin nhà hàng"
                    >
                      <KeyRound className="w-4 h-4 text-indigo-500" />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => onToggleActive(rest.id)}
                      title={rest.active ? "Khóa nhà hàng" : "Mở khóa nhà hàng"}
                    >
                       <Power className={`w-4 h-4 ${rest.active ? 'text-red-500' : 'text-green-500'}`} />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Thêm nhà hàng mới</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên nhà hàng</label>
                <input 
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.name}
                  onChange={e => setNewRest({...newRest, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên người chủ</label>
                <input
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.ownerName}
                  onChange={e => setNewRest({ ...newRest, ownerName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email nhà hàng</label>
                <input
                  required
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.email}
                  onChange={e => setNewRest({ ...newRest, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên đăng nhập (Admin nhà hàng)</label>
                <input 
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.username}
                  onChange={e => setNewRest({...newRest, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu khởi tạo</label>
                <input 
                  required
                  type="password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.password}
                  onChange={e => setNewRest({...newRest, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Địa chỉ nhà hàng</label>
                <input
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.address}
                  onChange={e => setNewRest({ ...newRest, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Số điện thoại liên hệ</label>
                <input
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.phone}
                  onChange={e => setNewRest({ ...newRest, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng thái nhà hàng</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.status}
                  onChange={e => setNewRest({ ...newRest, status: e.target.value as RestaurantStatus })}
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm khóa</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">Hủy</Button>
                <Button type="submit">Tạo mới</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">
              Đặt lại mật khẩu - {resetTarget.name}
            </h3>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!resetPassword || !resetConfirm) {
                  alert('Vui lòng nhập đủ mật khẩu mới và xác nhận');
                  return;
                }
                if (resetPassword !== resetConfirm) {
                  alert('Mật khẩu xác nhận không khớp');
                  return;
                }
                try {
                  setIsResetLoading(true);
                  await onResetRestaurantPassword(resetTarget.id, resetPassword);
                  alert('Đã đặt lại mật khẩu cho nhà hàng');
                  setResetPassword('');
                  setResetConfirm('');
                  setResetTarget(null);
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu');
                } finally {
                  setIsResetLoading(false);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                <input
                  type="password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setResetTarget(null);
                    setResetPassword('');
                    setResetConfirm('');
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isResetLoading}>
                  {isResetLoading ? 'Đang xử lý...' : 'Lưu mật khẩu mới'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};