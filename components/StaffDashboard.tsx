import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { Button } from './Button';
import { CheckCircle } from 'lucide-react';

interface StaffDashboardProps {
  restaurantId: string;
  restaurantName: string;
  onLogout: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'qr_food_order_token';

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  restaurantId,
  restaurantName,
  onLogout
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/api/staff/orders`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        throw new Error('Không thể tải danh sách đơn hàng');
      }
      const data = await res.json();
      const mapped: Order[] = data.map((o: any) => ({
        id: o._id,
        restaurantId: o.restaurantId,
        tableNumber: o.tableNumber,
        items: o.items,
        totalAmount: o.totalAmount,
        status: o.status as OrderStatus,
        timestamp: new Date(o.createdAt).getTime(),
        note: o.note,
        customerName: o.customerName,
        confirmedByName: o.confirmedByName,
        updatedByName: o.updatedByName
      }));
      setOrders(mapped);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Không thể tải đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Refresh mỗi 5 giây
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }
      const res = await fetch(`${API_BASE_URL}/api/staff/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Không thể cập nhật đơn hàng');
      }
      await fetchOrders(); // Refresh lại danh sách
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể cập nhật đơn hàng');
    }
  };

  const renderStatusBadge = (status: OrderStatus) => {
    const colors = {
      [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
      [OrderStatus.SERVED]: 'bg-green-100 text-green-800',
      [OrderStatus.COMPLETED]: 'bg-gray-100 text-gray-800',
      [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="font-bold text-xl text-gray-900">{restaurantName}</span>
              <span className="ml-3 text-sm text-gray-500">- Nhân viên</span>
            </div>
            <div className="flex items-center">
              <Button variant="ghost" onClick={onLogout}>Đăng xuất</Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Danh sách đơn hàng</h2>
          <p className="text-sm text-gray-500 mt-1">Danh sách sẽ tự động cập nhật mỗi 5 giây</p>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Đang tải...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {orders
              .filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED)
              .sort((a, b) => b.timestamp - a.timestamp)
              .map(order => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-wrap">
                      <span className="font-bold text-lg">Bàn {order.tableNumber}</span>
                      {order.customerName && (
                        <span className="text-sm text-gray-600">- Khách: <span className="font-semibold text-brand-600">{order.customerName}</span></span>
                      )}
                      {renderStatusBadge(order.status)}
                      <span className="text-gray-400 text-xs">
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </span>
                      {order.updatedByName && (
                        <span className="text-xs text-gray-500">
                          {order.status === OrderStatus.CONFIRMED ? 'Xác nhận' : 
                           order.status === OrderStatus.SERVED ? 'Ra món' :
                           order.status === OrderStatus.COMPLETED ? 'Thanh toán' :
                           order.status === OrderStatus.CANCELLED ? 'Hủy' : 'Cập nhật'} bởi: <span className="font-semibold text-brand-600">{order.updatedByName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="text-sm text-gray-600 space-y-1 mb-3">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex items-center">
                        <span className="font-bold mr-2">{item.quantity}x</span> {item.name}
                      </li>
                    ))}
                  </ul>

                  {order.note && (
                    <p className="text-xs text-red-500 mt-2 font-medium">Ghi chú: {order.note}</p>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="font-bold text-brand-600">
                      Tổng: {order.totalAmount.toLocaleString('vi-VN')}đ
                    </p>
                    <div className="flex space-x-2">
                      {order.status === OrderStatus.PENDING && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(order.id, OrderStatus.CONFIRMED)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Nhận đơn
                        </Button>
                      )}
                      {order.status !== OrderStatus.PENDING && order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED && (
                        <span className="text-sm text-gray-500 italic">Chờ admin xử lý</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            {orders.filter(
              o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED
            ).length === 0 && (
              <p className="text-gray-500 text-center py-10">Chưa có đơn hàng nào.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

