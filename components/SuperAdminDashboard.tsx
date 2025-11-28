import React, { useState } from 'react';
import { Restaurant } from '../types';
import { Button } from './Button';
import { Plus, Trash2, Edit, Store, Power } from 'lucide-react';

interface SuperAdminDashboardProps {
  restaurants: Restaurant[];
  onAddRestaurant: (r: Omit<Restaurant, 'id'>) => void;
  onToggleActive: (id: string) => void;
  onLogout: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  restaurants,
  onAddRestaurant,
  onToggleActive,
  onLogout
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRest, setNewRest] = useState({ name: '', username: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRestaurant({ ...newRest, active: true });
    setIsModalOpen(false);
    setNewRest({ name: '', username: '', password: '' });
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
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rest.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {rest.active ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
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
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">Hủy</Button>
                <Button type="submit">Tạo mới</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};