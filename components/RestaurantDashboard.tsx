import React, { useState } from 'react';
import { Restaurant, MenuItem, Order, OrderStatus } from '../types';
import { Button } from './Button';
import { generateMenuDescription } from '../services/geminiService';
import { LayoutDashboard, UtensilsCrossed, QrCode, LogOut, CheckCircle, Clock, ChefHat, Trash, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface RestaurantDashboardProps {
  restaurant: Restaurant;
  menu: MenuItem[];
  orders: Order[];
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onDeleteMenuItem: (id: string) => void;
  onLogout: () => void;
}

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({
  restaurant,
  menu,
  orders,
  onAddMenuItem,
  onUpdateOrderStatus,
  onDeleteMenuItem,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'qr' | 'stats'>('orders');
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ category: 'Món Chính', available: true });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [qrTableInput, setQrTableInput] = useState('');

  // Stats Logic
  const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.SERVED);
  const revenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const chartData = completedOrders.map(o => ({
      name: `Bàn ${o.tableNumber}`,
      amount: o.totalAmount
  })).slice(-10); // Last 10 orders

  const handleGenerateDescription = async () => {
    if (!newItem.name || !newItem.category) {
      alert("Vui lòng nhập tên món và danh mục trước.");
      return;
    }
    setIsAiLoading(true);
    const desc = await generateMenuDescription(newItem.name, newItem.category);
    setNewItem(prev => ({ ...prev, description: desc }));
    setIsAiLoading(false);
  };

  const handleSubmitMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.name && newItem.price) {
      onAddMenuItem({
        restaurantId: restaurant.id,
        name: newItem.name,
        price: Number(newItem.price),
        description: newItem.description || '',
        category: newItem.category || 'Món Chính',
        imageUrl: newItem.imageUrl || `https://picsum.photos/400/300?random=${Date.now()}`,
        available: true
      });
      setNewItem({ category: 'Món Chính', available: true, name: '', price: 0, description: '' });
      alert("Đã thêm món thành công!");
    }
  };

  const renderStatusBadge = (status: OrderStatus) => {
      const colors = {
          [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
          [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
          [OrderStatus.SERVED]: 'bg-green-100 text-green-800',
          [OrderStatus.COMPLETED]: 'bg-gray-100 text-gray-800',
          [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
      };
      return <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status]}`}>{status}</span>
  }

  // Helper to generate QR URL
  const getOrderUrl = () => {
    const origin = window.location.origin;
    // Handle local development or production fallback
    const baseUrl = origin === 'null' ? 'http://localhost:3000' : origin;
    return `${baseUrl}/#/order?r=${restaurant.id}&t=${qrTableInput}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="bg-white w-full md:w-64 border-r border-gray-200 flex-shrink-0">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-brand-600 truncate">{restaurant.name}</h2>
          <p className="text-xs text-gray-500">Quản lý nhà hàng</p>
        </div>
        <nav className="p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${activeTab === 'orders' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <Clock className="w-5 h-5 mr-3" /> Đơn hàng
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${activeTab === 'menu' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <UtensilsCrossed className="w-5 h-5 mr-3" /> Thực đơn
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${activeTab === 'stats' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> Thống kê
          </button>
          <button 
            onClick={() => setActiveTab('qr')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${activeTab === 'qr' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <QrCode className="w-5 h-5 mr-3" /> Mã QR
          </button>
          <div className="pt-4 mt-4 border-t border-gray-100">
             <button onClick={onLogout} className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                <LogOut className="w-5 h-5 mr-3" /> Đăng xuất
             </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Danh sách đơn hàng</h2>
            <div className="grid grid-cols-1 gap-4">
              {orders.sort((a,b) => b.timestamp - a.timestamp).map(order => (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row justify-between md:items-center">
                  <div className="mb-4 md:mb-0">
                    <div className="flex items-center mb-2">
                        <span className="font-bold text-lg mr-3">Bàn {order.tableNumber}</span>
                        {renderStatusBadge(order.status)}
                        <span className="text-gray-400 text-xs ml-3">{new Date(order.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex items-center">
                            <span className="font-bold mr-2">{item.quantity}x</span> {item.name}
                        </li>
                      ))}
                    </ul>
                    {order.note && <p className="text-xs text-red-500 mt-2 font-medium">Ghi chú: {order.note}</p>}
                    <p className="mt-2 font-bold text-brand-600">Tổng: {order.totalAmount.toLocaleString('vi-VN')}đ</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    {order.status === OrderStatus.PENDING && (
                        <Button size="sm" onClick={() => onUpdateOrderStatus(order.id, OrderStatus.CONFIRMED)}>Nhận đơn</Button>
                    )}
                    {order.status === OrderStatus.CONFIRMED && (
                        <Button size="sm" variant="secondary" onClick={() => onUpdateOrderStatus(order.id, OrderStatus.SERVED)}>Đã ra món</Button>
                    )}
                    {order.status === OrderStatus.SERVED && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onUpdateOrderStatus(order.id, OrderStatus.COMPLETED)}>Thanh toán</Button>
                    )}
                    {(order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) && (
                         <Button size="sm" variant="danger" onClick={() => onUpdateOrderStatus(order.id, OrderStatus.CANCELLED)}>Hủy</Button>
                    )}
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p className="text-gray-500 text-center py-10">Chưa có đơn hàng nào.</p>}
            </div>
          </div>
        )}

        {/* MENU TAB */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                    <ChefHat className="w-5 h-5 mr-2 text-brand-600"/> Thêm món mới
                </h3>
                <form onSubmit={handleSubmitMenu} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tên món</label>
                        <input required className="mt-1 w-full border border-gray-300 rounded-md p-2" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Giá (VND)</label>
                        <input required type="number" className="mt-1 w-full border border-gray-300 rounded-md p-2" value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                        <input required className="mt-1 w-full border border-gray-300 rounded-md p-2" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} list="categories" />
                        <datalist id="categories">
                            <option value="Món Chính" />
                            <option value="Đồ Uống" />
                            <option value="Khai Vị" />
                            <option value="Tráng Miệng" />
                        </datalist>
                    </div>
                    <div className="md:col-span-2">
                         <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                            <button type="button" onClick={handleGenerateDescription} disabled={isAiLoading} className="text-xs text-brand-600 hover:text-brand-800 flex items-center">
                                <Sparkles className="w-3 h-3 mr-1" /> {isAiLoading ? 'Đang viết...' : 'Dùng AI viết mô tả'}
                            </button>
                         </div>
                        <textarea className="w-full border border-gray-300 rounded-md p-2 text-sm" rows={2} value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                        <Button type="submit" className="w-full">Thêm vào thực đơn</Button>
                    </div>
                </form>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {menu.map(item => (
                     <div key={item.id} className="bg-white border rounded-lg p-4 flex flex-col relative group">
                         <img src={item.imageUrl} alt={item.name} className="w-full h-32 object-cover rounded-md mb-3 bg-gray-100" />
                         <h4 className="font-bold text-gray-900">{item.name}</h4>
                         <p className="text-sm text-gray-500 mb-2">{item.price.toLocaleString('vi-VN')}đ</p>
                         <p className="text-xs text-gray-400 line-clamp-2 mb-3 flex-1">{item.description}</p>
                         <Button variant="danger" size="sm" onClick={() => onDeleteMenuItem(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2">
                             <Trash className="w-4 h-4" />
                         </Button>
                         <div className="mt-auto">
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{item.category}</span>
                         </div>
                     </div>
                 ))}
             </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
             <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                         <p className="text-sm text-gray-500">Doanh thu tạm tính</p>
                         <h3 className="text-3xl font-bold text-brand-600">{revenue.toLocaleString('vi-VN')}đ</h3>
                     </div>
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                         <p className="text-sm text-gray-500">Đơn hoàn thành</p>
                         <h3 className="text-3xl font-bold text-blue-600">{completedOrders.length}</h3>
                     </div>
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                         <p className="text-sm text-gray-500">Món đang phục vụ</p>
                         <h3 className="text-3xl font-bold text-gray-800">{menu.length}</h3>
                     </div>
                 </div>

                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
                     <h3 className="text-lg font-bold mb-4">Giá trị đơn hàng gần đây</h3>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis />
                            <Tooltip formatter={(value) => `${Number(value).toLocaleString()}đ`} />
                            <Bar dataKey="amount" fill="#ea580c" radius={[4, 4, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                 </div>
             </div>
        )}

        {/* QR CODE TAB */}
        {activeTab === 'qr' && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-lg mx-auto text-center">
                <QrCode className="w-16 h-16 text-brand-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Tạo mã QR cho bàn</h2>
                <p className="text-gray-500 mb-6">Nhập số bàn để tạo link/QR code cho khách hàng quét.</p>
                
                <div className="flex space-x-2 mb-6">
                    <input 
                        type="text" 
                        placeholder="Số bàn (VD: 5, VIP1)" 
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        value={qrTableInput}
                        onChange={(e) => setQrTableInput(e.target.value)}
                    />
                </div>

                {qrTableInput && (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col items-center">
                        <p className="text-sm text-gray-500 mb-2 w-full text-left font-medium">Link đặt món:</p>
                        <div className="w-full bg-white p-3 rounded-lg border border-gray-200 mb-4 flex items-center justify-between group cursor-pointer hover:border-brand-300 transition-colors"
                             onClick={() => navigator.clipboard.writeText(getOrderUrl()).then(() => alert('Đã copy link!'))}
                             title="Click để copy">
                             <code className="text-xs text-brand-600 truncate flex-1">
                                {getOrderUrl()}
                             </code>
                        </div>
                        
                        <div className="bg-white p-3 border-2 border-brand-500 rounded-xl shadow-sm mb-3">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getOrderUrl())}`} 
                              alt={`QR Code for Table ${qrTableInput}`}
                              className="w-48 h-48 object-contain"
                            />
                        </div>
                        
                        <div className="font-bold text-gray-900 text-lg">Bàn số {qrTableInput}</div>
                        <p className="mt-2 text-sm text-gray-500">In hình này và dán lên bàn</p>
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};