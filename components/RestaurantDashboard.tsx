import React, { useEffect, useState } from 'react';
import { Restaurant, MenuItem, Order, OrderStatus } from '../types';
import { Button } from './Button';
import { Invoice } from './Invoice';
import { generateMenuDescription } from '../services/geminiService';
import { LayoutDashboard, UtensilsCrossed, QrCode, LogOut, Clock, ChefHat, Trash, Sparkles, Lock, X, Plus, Users, Edit, Ban, CheckCircle, Settings, CreditCard, User, Receipt, AlertCircle, CheckCircle2, XCircle, Timer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface RestaurantDashboardProps {
  restaurant: Restaurant;
  menu: MenuItem[];
  orders: Order[];
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  onUpdateMenuItem: (id: string, data: Partial<MenuItem>) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onDeleteMenuItem: (id: string) => Promise<void>;
  onUpdateRestaurant: (data: Partial<Restaurant>) => Promise<Restaurant>;
  onLogout: () => void;
}

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({
  restaurant,
  menu,
  orders,
  onAddMenuItem,
  onUpdateMenuItem,
  onUpdateOrderStatus,
  onDeleteMenuItem,
  onUpdateRestaurant,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'qr' | 'stats' | 'staff' | 'bank' | 'settings'>('orders');
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ category: 'Món Chính', available: true });
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [qrTableInput, setQrTableInput] = useState('');
  const [isChangePwOpen, setIsChangePwOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tables, setTables] = useState<{ id: string; code: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isSavingMenuItem, setIsSavingMenuItem] = useState(false);
  const [deletingMenuId, setDeletingMenuId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [staffList, setStaffList] = useState<{ id: string; username: string; name: string; isActive: boolean; updatedBy: { id: string; username: string } | null }[]>([]);
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<{ id: string; username: string; name: string } | null>(null);
  const [editStaffUsername, setEditStaffUsername] = useState('');
  const [editStaffPassword, setEditStaffPassword] = useState('');
  const [editStaffName, setEditStaffName] = useState('');
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [togglingStaffId, setTogglingStaffId] = useState<string | null>(null);
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
  const [newEmailForChange, setNewEmailForChange] = useState('');
  const [bankAccountInput, setBankAccountInput] = useState(restaurant.bankAccount || '');
  const [bankNameInput, setBankNameInput] = useState(restaurant.bankName || '');
  const [isSavingBank, setIsSavingBank] = useState(false);

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

  // Cập nhật form khi restaurant prop thay đổi
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
      setNewEmailForChange('');
    }
    setBankAccountInput(restaurant.bankAccount || '');
    setBankNameInput(restaurant.bankName || '');
  }, [restaurant, isEditingRestaurant]);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'qr_food_order_token';
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

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

  const handleSubmitMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) {
      alert('Vui lòng nhập tên món và giá');
      return;
    }
    try {
      setIsSavingMenuItem(true);
      await onAddMenuItem({
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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể thêm món');
    } finally {
      setIsSavingMenuItem(false);
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!window.confirm('Xóa món này khỏi thực đơn?')) return;
    try {
      setDeletingMenuId(id);
      await onDeleteMenuItem(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xóa món');
    } finally {
      setDeletingMenuId(null);
    }
  };

  const renderStatusBadge = (status: OrderStatus) => {
    const statusConfig: Record<OrderStatus, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      [OrderStatus.PENDING]: {
        bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
        text: 'text-white',
        icon: <Timer className="w-3 h-3" />,
        label: 'Chờ xử lý'
      },
      [OrderStatus.CONFIRMED]: {
        bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
        text: 'text-white',
        icon: <CheckCircle2 className="w-3 h-3" />,
        label: 'Đã xác nhận'
      },
      [OrderStatus.SERVED]: {
        bg: 'bg-gradient-to-r from-green-500 to-green-600',
        text: 'text-white',
        icon: <UtensilsCrossed className="w-3 h-3" />,
        label: 'Đã ra món'
      },
      [OrderStatus.COMPLETED]: {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
        text: 'text-white',
        icon: <CheckCircle className="w-3 h-3" />,
        label: 'Hoàn thành'
      },
      [OrderStatus.CANCELLED]: {
        bg: 'bg-gradient-to-r from-red-500 to-red-600',
        text: 'text-white',
        icon: <XCircle className="w-3 h-3" />,
        label: 'Đã hủy'
      }
    };
    const config = statusConfig[status];
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} flex items-center gap-1.5 shadow-sm`}>
        {config.icon}
        {config.label}
      </span>
    );
  }

  // Helper to generate QR URL
  const getOrderUrl = () => {
    const origin = window.location.origin;
    // Handle local development or production fallback
    const baseUrl = origin === 'null' ? 'http://localhost:3000' : origin;
    return `${baseUrl}/#/order?r=${restaurant.id}&t=${qrTableInput}`;
  };

  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tables?restaurantId=${restaurant.id}`);
      if (!res.ok) return;
      const data: { _id: string; code: string }[] = await res.json();
      setTables(data.map(t => ({ id: t._id, code: t.code })));
    } catch (err) {
      console.error('Không thể tải danh sách bàn', err);
    }
  };

  const handleSaveTable = async () => {
    if (!qrTableInput.trim()) {
      alert('Vui lòng nhập số bàn trước khi lưu');
      return;
    }
    try {
      const token = localStorage.getItem('qr_food_order_token');
      if (!token) {
        alert('Vui lòng đăng nhập lại để lưu số bàn');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: qrTableInput.trim() })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể lưu thông tin bàn');
      }
      alert('Đã lưu số bàn vào hệ thống');
      fetchTables();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Không thể lưu số bàn, vui lòng thử lại'
      );
    }
  };

  useEffect(() => {
    fetchTables();
  }, [restaurant.id]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories?restaurantId=${restaurant.id}`);
      if (!res.ok) return;
      const data: { _id: string; name: string }[] = await res.json();
      setCategories(data.map(c => ({ id: c._id, name: c.name })));
    } catch (err) {
      console.error('Không thể tải danh mục', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [restaurant.id]);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/staff`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) return;
      const data: { id: string; username: string; name: string; isActive: boolean; updatedBy: { id: string; username: string } | null }[] = await res.json();
      setStaffList(data);
    } catch (err) {
      console.error('Không thể tải danh sách nhân viên', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'staff') {
      fetchStaff();
    }
  }, [activeTab, restaurant.id]);

  const CategoryCreator: React.FC<{ onCreated: () => void }> = ({ onCreated }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      try {
        setLoading(true);
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) throw new Error('Vui lòng đăng nhập lại.');
        const res = await fetch(`${API_BASE_URL}/api/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: name.trim() })
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.message || 'Không thể tạo danh mục');
        }
        setName('');
        onCreated();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Không thể tạo danh mục');
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleCreate} className="space-y-2 mt-3">
        <label className="block text-xs font-medium text-gray-600">Thêm danh mục mới</label>
        <div className="flex space-x-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
            placeholder="VD: Món Chính, Đồ Uống..."
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={loading}>
            <Plus className="w-3 h-3 mr-1" />
            {loading ? 'Đang thêm' : 'Thêm'}
          </Button>
        </div>
      </form>
    );
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
          <button 
            onClick={() => setActiveTab('staff')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${activeTab === 'staff' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <Users className="w-5 h-5 mr-3" /> Nhân viên
          </button>
          <button 
            onClick={() => setActiveTab('bank')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${activeTab === 'bank' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <CreditCard className="w-5 h-5 mr-3" /> Ngân hàng
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${activeTab === 'settings' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <Settings className="w-5 h-5 mr-3" /> Cài đặt
          </button>
          <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
            <button
              onClick={() => setIsChangePwOpen(true)}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              <Lock className="w-5 h-5 mr-3" /> Đổi mật khẩu
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-5 h-5 mr-3" /> Đăng xuất
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* ORDERS TAB */}
        {activeTab === 'orders' && (() => {
          // Phân loại đơn hàng: đang xử lý và đã hoàn thành
          const activeOrders = orders
            .filter(order => order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED)
            .sort((a, b) => {
              // Ưu tiên: PENDING > CONFIRMED > SERVED, sau đó sắp xếp theo thời gian mới nhất
              const statusPriority = {
                [OrderStatus.PENDING]: 3,
                [OrderStatus.CONFIRMED]: 2,
                [OrderStatus.SERVED]: 1
              };
              const priorityDiff = (statusPriority[b.status as keyof typeof statusPriority] || 0) - 
                                   (statusPriority[a.status as keyof typeof statusPriority] || 0);
              if (priorityDiff !== 0) return priorityDiff;
              return b.timestamp - a.timestamp; // Mới nhất trước
            });

          const completedOrders = orders
            .filter(order => order.status === OrderStatus.COMPLETED)
            .sort((a, b) => b.timestamp - a.timestamp); // Mới nhất trước

          const renderOrderCard = (order: Order) => {
            const isPending = order.status === OrderStatus.PENDING;
            const isUrgent = isPending;
            
            return (
              <div 
                key={order.id} 
                className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-l-4 ${
                  isUrgent ? 'border-l-yellow-500 shadow-yellow-100' : 
                  order.status === OrderStatus.CONFIRMED ? 'border-l-blue-500' :
                  order.status === OrderStatus.SERVED ? 'border-l-green-500' :
                  'border-l-gray-300'
                } overflow-hidden group`}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                            isUrgent ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-lg' :
                            'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
                          }`}>
                            {order.tableNumber}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">Bàn {order.tableNumber}</h3>
                            {order.customerName && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 mt-0.5">
                                <User className="w-3.5 h-3.5" />
                                <span className="font-medium">{order.customerName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {renderStatusBadge(order.status)}
                      </div>
                      
                      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 mt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(order.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                        {order.updatedByName && (
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            <span>
                              {order.status === OrderStatus.CONFIRMED ? 'Xác nhận' : 
                               order.status === OrderStatus.SERVED ? 'Ra món' :
                               order.status === OrderStatus.COMPLETED ? 'Thanh toán' :
                               order.status === OrderStatus.CANCELLED ? 'Hủy' : 'Cập nhật'} bởi: <span className="font-semibold text-brand-600">{order.updatedByName}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <ul className="space-y-2">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="bg-white px-2 py-0.5 rounded-md font-bold text-brand-600 text-xs shadow-sm">
                              {item.quantity}x
                            </span>
                            <span className="text-gray-700 font-medium">{item.name}</span>
                          </div>
                          <span className="text-gray-500 font-semibold">
                            {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Note */}
                  {order.note && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-2.5 mb-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-yellow-800 font-medium">Ghi chú: {order.note}</p>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tổng tiền</p>
                      <p className="text-2xl font-bold text-brand-600">
                        {order.totalAmount.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {order.status === OrderStatus.PENDING && (
                        <Button 
                          size="sm" 
                          onClick={() => onUpdateOrderStatus(order.id, OrderStatus.CONFIRMED)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Nhận đơn
                        </Button>
                      )}
                      {order.status === OrderStatus.CONFIRMED && (
                        <>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => onUpdateOrderStatus(order.id, OrderStatus.SERVED)}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
                          >
                            <UtensilsCrossed className="w-4 h-4 mr-1.5" />
                            Đã ra món
                          </Button>
                          <Button 
                            size="sm" 
                            variant="danger" 
                            onClick={() => onUpdateOrderStatus(order.id, OrderStatus.CANCELLED)}
                            className="shadow-md"
                          >
                            <XCircle className="w-4 h-4 mr-1.5" />
                            Hủy
                          </Button>
                        </>
                      )}
                      {order.status === OrderStatus.SERVED && (
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg text-white font-semibold" 
                          onClick={() => {
                            setSelectedOrderForInvoice(order);
                          }}
                        >
                          <Receipt className="w-4 h-4 mr-1.5" />
                          Thanh toán
                        </Button>
                      )}
                      {order.status === OrderStatus.PENDING && (
                        <Button 
                          size="sm" 
                          variant="danger" 
                          onClick={() => onUpdateOrderStatus(order.id, OrderStatus.CANCELLED)}
                          className="shadow-md"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Hủy
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          };

          return (
            <div className="space-y-8">
              {/* Đơn hàng đang xử lý */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-brand-500 to-brand-600 rounded-full"></div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">Đơn hàng đang xử lý</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Theo dõi và xử lý đơn hàng mới</p>
                    </div>
                  </div>
                  {activeOrders.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {activeOrders.length} đơn
                      </span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {activeOrders.length > 0 ? (
                    activeOrders.map(renderOrderCard)
                  ) : (
                    <div className="col-span-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 text-center border-2 border-dashed border-gray-300">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Receipt className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-lg font-medium">Không có đơn hàng đang xử lý</p>
                      <p className="text-gray-400 text-sm mt-1">Tất cả đơn hàng đã được xử lý</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Đơn hàng đã hoàn thành */}
              {completedOrders.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-gradient-to-b from-green-400 to-green-500 rounded-full"></div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Đơn hàng đã hoàn thành</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Lịch sử đơn hàng đã thanh toán</p>
                      </div>
                    </div>
                    <span className="bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm">
                      <CheckCircle className="w-4 h-4" />
                      {completedOrders.length} đơn
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedOrders.map(order => (
                      <div 
                        key={order.id} 
                        className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg hover:border-green-300 transition-all duration-200 overflow-hidden group"
                      >
                        {/* Header với gradient */}
                        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-4 py-3 border-b border-blue-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 flex items-center justify-center font-bold text-white text-base shadow-lg transform hover:scale-105 transition-transform">
                                {order.tableNumber}
                              </div>
                              <div>
                                <h3 className="font-bold text-base text-gray-900">Bàn {order.tableNumber}</h3>
                                {order.customerName && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                                    <User className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="font-medium">{order.customerName}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {renderStatusBadge(order.status)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          {/* Items */}
                          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-3 mb-3 border border-blue-100">
                            <div className="space-y-2.5">
                              {order.items.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm bg-white rounded-lg px-2.5 py-2 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2.5 py-1 rounded-md font-bold text-xs shadow-md">
                                      {item.quantity}x
                                    </span>
                                    <span className="text-gray-800 font-semibold">{item.name}</span>
                                  </div>
                                  <span className="text-gray-600 font-bold text-xs">
                                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                  </span>
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <div className="pt-2 border-t border-blue-200">
                                  <p className="text-xs text-blue-600 font-semibold text-center">
                                    +{order.items.length - 2} món khác
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Note */}
                          {order.note && (
                            <div className="bg-amber-50 border-l-3 border-amber-400 rounded-lg p-2.5 mb-3">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-800 font-medium leading-relaxed">{order.note}</p>
                              </div>
                            </div>
                          )}

                          {/* Footer info */}
                          <div className="flex items-center justify-between text-xs mb-3 pb-3 border-b border-gray-200">
                            <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1.5 rounded-lg">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span className="font-semibold text-gray-700">{new Date(order.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {order.updatedByName && (
                              <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1.5 rounded-lg">
                                <User className="w-3.5 h-3.5 text-green-600" />
                                <span className="font-bold text-green-700">{order.updatedByName}</span>
                              </div>
                            )}
                          </div>

                          {/* Total */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 font-semibold">Tổng tiền</span>
                              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                {order.totalAmount.toLocaleString('vi-VN')}đ
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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
                        <select
                          required
                          className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-white"
                          value={newItem.category || ''}
                          onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                        >
                          <option value="" disabled>Chọn danh mục</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        {categories.length === 0 && (
                          <p className="mt-1 text-xs text-red-500">
                            Chưa có danh mục nào. Vui lòng thêm danh mục ở cột bên cạnh.
                          </p>
                        )}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh món ăn</label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="file"
                          accept="image/*"
                          className="text-sm"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
                              alert('Chưa cấu hình Cloudinary (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET).');
                              return;
                            }
                            try {
                              setIsUploadingImage(true);
                              const formData = new FormData();
                              formData.append('file', file);
                              formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                              const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                                method: 'POST',
                                body: formData
                              });
                              const data = await res.json();
                              if (!res.ok) {
                                throw new Error(data?.error?.message || 'Upload ảnh thất bại');
                              }
                              setNewItem(prev => ({ ...prev, imageUrl: data.secure_url }));
                            } catch (err) {
                              alert(err instanceof Error ? err.message : 'Không thể upload ảnh');
                            } finally {
                              setIsUploadingImage(false);
                            }
                          }}
                        />
                        {isUploadingImage && (
                          <span className="text-xs text-gray-500">Đang upload ảnh...</span>
                        )}
                      </div>
                      {newItem.imageUrl && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Preview:</p>
                          <img
                            src={newItem.imageUrl}
                            alt="Preview món"
                            className="w-32 h-24 object-cover rounded-md border"
                          />
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2">
                        <Button type="submit" className="w-full" disabled={isSavingMenuItem}>
                          {isSavingMenuItem ? 'Đang lưu...' : 'Thêm vào thực đơn'}
                        </Button>
                    </div>
                </form>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
               {/* Danh sách món */}
               <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {menu.map(item => (
                    <div key={item.id} className="bg-white border rounded-lg p-4 flex flex-col relative group">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-32 object-cover rounded-md mb-3 bg-gray-100" />
                        <h4 className="font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                        <p className="text-sm text-gray-500 mb-2">{item.price.toLocaleString('vi-VN')}đ</p>
                        <p className="text-xs text-gray-400 line-clamp-2 mb-3 flex-1">{item.description}</p>
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => setEditingItem(item)}
                          >
                            Sửa
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => handleDeleteMenu(item.id)} 
                            disabled={deletingMenuId === item.id}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="mt-auto">
                           <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{item.category}</span>
                        </div>
                    </div>
                ))}
               </div>

               {/* Cột danh mục */}
               <div className="bg-white border rounded-lg p-4 space-y-3">
                 <h4 className="font-bold text-gray-900 mb-2">Danh mục</h4>
                 <ul className="space-y-1 max-h-48 overflow-y-auto text-sm">
                   {categories.map(cat => (
                     <li key={cat.id} className="flex items-center justify-between">
                       <span>{cat.name}</span>
                     </li>
                   ))}
                   {categories.length === 0 && (
                     <li className="text-xs text-gray-500">Chưa có danh mục.</li>
                   )}
                 </ul>
                 <CategoryCreator onCreated={fetchCategories} />
               </div>
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
                    <Button type="button" variant="secondary" onClick={handleSaveTable}>
                      Lưu bàn
                    </Button>
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

                {tables.length > 0 && (
                  <div className="mt-10 text-left">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">Danh sách bàn đã lưu</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {tables.map(table => {
                        const origin = window.location.origin;
                        const baseUrl = origin === 'null' ? 'http://localhost:3000' : origin;
                        const tableUrl = `${baseUrl}/#/order?r=${restaurant.id}&t=${table.code}`;
                        return (
                          <div key={table.id} className="border rounded-xl p-4 bg-gray-50 flex flex-col space-y-3">
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Số bàn</p>
                              <p className="text-xl font-bold text-gray-900">{table.code}</p>
                            </div>
                            <div className="bg-white p-2 border rounded-lg">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tableUrl)}`}
                                alt={`QR bàn ${table.code}`}
                                className="w-full h-40 object-contain"
                              />
                            </div>
                            <button
                              type="button"
                              className="text-xs text-brand-600 hover:text-brand-800 truncate text-left"
                              onClick={() => navigator.clipboard.writeText(tableUrl).then(() => alert('Đã copy link bàn!'))}
                            >
                              {tableUrl}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
        )}

        {/* BANK TAB */}
        {activeTab === 'bank' && (
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

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <Button
                    onClick={async () => {
                      try {
                        setIsSavingBank(true);
                        await onUpdateRestaurant({ 
                          bankName: bankNameInput,
                          bankAccount: bankAccountInput 
                        });
                        alert('Đã cập nhật thông tin ngân hàng thành công!');
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Không thể cập nhật thông tin ngân hàng');
                      } finally {
                        setIsSavingBank(false);
                      }
                    }}
                    disabled={isSavingBank}
                  >
                    {isSavingBank ? 'Đang lưu...' : 'Lưu thông tin ngân hàng'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
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
                      // Kiểm tra nếu email thay đổi thì cần OTP
                      const emailChanged = restaurantForm.email.toLowerCase() !== restaurant.email.toLowerCase();
                      if (emailChanged && !emailChangeOtp) {
                        alert('Vui lòng nhập mã OTP để xác thực đổi email');
                        setIsSavingRestaurant(false);
                        return;
                      }
                      if (emailChanged && emailChangeOtp.length !== 6) {
                        alert('Mã OTP phải có 6 chữ số');
                        setIsSavingRestaurant(false);
                        return;
                      }
                      
                      // Gọi API với OTP nếu email thay đổi
                      const updateData = { ...restaurantForm };
                      if (emailChanged) {
                        (updateData as any).emailChangeOtp = emailChangeOtp;
                      }
                      
                      await onUpdateRestaurant(updateData);
                      setIsEditingRestaurant(false);
                      setEmailChangeOtp('');
                      setOtpSent(false);
                      setNewEmailForChange('');
                      alert('Đã cập nhật thông tin nhà hàng thành công!');
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Không thể cập nhật thông tin nhà hàng');
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
                          // Reset OTP state nếu email thay đổi
                          if (newEmail.toLowerCase() !== restaurant.email.toLowerCase()) {
                            setOtpSent(false);
                            setEmailChangeOtp('');
                            setNewEmailForChange(newEmail);
                          } else {
                            setOtpSent(false);
                            setEmailChangeOtp('');
                            setNewEmailForChange('');
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
                              onClick={async () => {
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
                                  setNewEmailForChange(restaurantForm.email.trim());
                                  alert('Đã gửi mã OTP đến email hiện tại của nhà hàng. Vui lòng kiểm tra hộp thư.');
                                } catch (err) {
                                  alert(err instanceof Error ? err.message : 'Không thể gửi mã OTP');
                                } finally {
                                  setIsSendingOtp(false);
                                }
                              }}
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
                                onClick={async () => {
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
                                    setEmailChangeOtp('');
                                    alert('Đã gửi lại mã OTP. Vui lòng kiểm tra email.');
                                  } catch (err) {
                                    alert(err instanceof Error ? err.message : 'Không thể gửi lại mã OTP');
                                  } finally {
                                    setIsSendingOtp(false);
                                  }
                                }}
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
          </div>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Quản lý nhân viên</h2>
            
            {/* Form tạo nhân viên */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-brand-600" /> Tạo tài khoản nhân viên
              </h3>
              <form
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newStaffUsername || !newStaffPassword) {
                    alert('Vui lòng nhập đầy đủ username và password');
                    return;
                  }
                  try {
                    setIsCreatingStaff(true);
                    const token = localStorage.getItem(AUTH_TOKEN_KEY);
                    if (!token) {
                      throw new Error('Vui lòng đăng nhập lại');
                    }
                    const res = await fetch(`${API_BASE_URL}/api/staff`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        username: newStaffUsername.trim(),
                        password: newStaffPassword,
                        name: newStaffName.trim()
                      })
                    });
                    const body = await res.json().catch(() => null);
                    if (!res.ok) {
                      throw new Error(body?.message || 'Không thể tạo nhân viên');
                    }
                    alert('Đã tạo tài khoản nhân viên thành công!');
                    setNewStaffUsername('');
                    setNewStaffPassword('');
                    setNewStaffName('');
                    // Refresh danh sách nhân viên
                    await fetchStaff();
                  } catch (err) {
                    alert(err instanceof Error ? err.message : 'Không thể tạo nhân viên');
                  } finally {
                    setIsCreatingStaff(false);
                  }
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên nhân viên</label>
                  <input
                    type="text"
                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                    value={newStaffName}
                    onChange={e => setNewStaffName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    required
                    type="text"
                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                    value={newStaffUsername}
                    onChange={e => setNewStaffUsername(e.target.value)}
                    placeholder="Tên đăng nhập"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    required
                    type="password"
                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                    value={newStaffPassword}
                    onChange={e => setNewStaffPassword(e.target.value)}
                    placeholder="Mật khẩu"
                  />
                </div>
                <div className="md:col-span-3">
                  <Button type="submit" disabled={isCreatingStaff}>
                    {isCreatingStaff ? 'Đang tạo...' : 'Tạo nhân viên'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Danh sách nhân viên */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold mb-4">Danh sách nhân viên</h3>
              {staffList.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Chưa có nhân viên nào</p>
              ) : (
                <div className="space-y-2">
                  {staffList.map(staff => (
                    <div
                      key={staff.id}
                      className={`p-3 rounded-lg border ${
                        staff.isActive ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div>
                            <span className="font-medium text-gray-900">{staff.name || staff.username}</span>
                            {staff.name && (
                              <span className="ml-2 text-sm text-gray-500">({staff.username})</span>
                            )}
                          </div>
                          {staff.isActive ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              Đang hoạt động
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                              Đã khóa
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditingStaff({ id: staff.id, username: staff.username, name: staff.name });
                              setEditStaffUsername(staff.username);
                              setEditStaffName(staff.name);
                              setEditStaffPassword('');
                            }}
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={staff.isActive ? "danger" : "secondary"}
                            onClick={async () => {
                              try {
                                setTogglingStaffId(staff.id);
                                const token = localStorage.getItem(AUTH_TOKEN_KEY);
                                if (!token) {
                                  throw new Error('Vui lòng đăng nhập lại');
                                }
                                const res = await fetch(`${API_BASE_URL}/api/staff/${staff.id}/toggle-active`, {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`
                                  }
                                });
                                const body = await res.json().catch(() => null);
                                if (!res.ok) {
                                  throw new Error(body?.message || 'Không thể cập nhật trạng thái');
                                }
                                await fetchStaff();
                              } catch (err) {
                                alert(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
                              } finally {
                                setTogglingStaffId(null);
                              }
                            }}
                            disabled={togglingStaffId === staff.id}
                            title={staff.isActive ? "Khóa nhân viên" : "Mở khóa nhân viên"}
                          >
                            {togglingStaffId === staff.id ? (
                              '...'
                            ) : staff.isActive ? (
                              <Ban className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {staff.updatedBy && (
                        <p className="text-xs text-gray-500 mt-1">
                          Cập nhật bởi: <span className="font-medium">{staff.updatedBy.username}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Change Password Modal */}
      {isChangePwOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Đổi mật khẩu</h3>
              <button
                onClick={() => {
                  setIsChangePwOpen(false);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!oldPassword || !newPassword || !confirmPassword) {
                  alert('Vui lòng nhập đầy đủ thông tin');
                  return;
                }
                if (newPassword !== confirmPassword) {
                  alert('Mật khẩu mới và xác nhận không khớp');
                  return;
                }
                try {
                  const token = localStorage.getItem('qr_food_order_token');
                  const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ oldPassword, newPassword })
                  });
                  const body = await res.json().catch(() => null);
                  if (!res.ok) {
                    throw new Error(body?.message || 'Không thể đổi mật khẩu');
                  }
                  alert('Đổi mật khẩu thành công');
                  setIsChangePwOpen(false);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                } catch (err) {
                  alert(
                    err instanceof Error ? err.message : 'Không thể đổi mật khẩu, vui lòng thử lại'
                  );
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                <Button type="submit">Lưu mật khẩu mới</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Chỉnh sửa nhân viên</h3>
              <button
                onClick={() => {
                  setEditingStaff(null);
                  setEditStaffUsername('');
                  setEditStaffPassword('');
                  setEditStaffName('');
                }}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editStaffUsername.trim()) {
                  alert('Vui lòng nhập username');
                  return;
                }
                if (editStaffPassword && editStaffPassword.length < 6) {
                  alert('Mật khẩu phải có ít nhất 6 ký tự');
                  return;
                }
                try {
                  setIsSavingStaff(true);
                  const token = localStorage.getItem(AUTH_TOKEN_KEY);
                  if (!token) {
                    throw new Error('Vui lòng đăng nhập lại');
                  }
                  const body: { username?: string; password?: string; name?: string } = {
                    username: editStaffUsername.trim(),
                    name: editStaffName.trim()
                  };
                  if (editStaffPassword) {
                    body.password = editStaffPassword;
                  }
                  const res = await fetch(`${API_BASE_URL}/api/staff/${editingStaff.id}`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(body)
                  });
                  const responseBody = await res.json().catch(() => null);
                  if (!res.ok) {
                    throw new Error(responseBody?.message || 'Không thể cập nhật nhân viên');
                  }
                  alert('Đã cập nhật nhân viên thành công!');
                  setEditingStaff(null);
                  setEditStaffUsername('');
                  setEditStaffPassword('');
                  setEditStaffName('');
                  await fetchStaff();
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Không thể cập nhật nhân viên');
                } finally {
                  setIsSavingStaff(false);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên nhân viên
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editStaffName}
                  onChange={(e) => setEditStaffName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editStaffUsername}
                  onChange={(e) => setEditStaffUsername(e.target.value)}
                  placeholder="Tên đăng nhập"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới (để trống nếu không đổi)
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editStaffPassword}
                  onChange={(e) => setEditStaffPassword(e.target.value)}
                  placeholder="Mật khẩu mới (tùy chọn)"
                />
                <p className="text-xs text-gray-500 mt-1">Chỉ nhập nếu muốn đổi mật khẩu</p>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingStaff(null);
                    setEditStaffUsername('');
                    setEditStaffPassword('');
                    setEditStaffName('');
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSavingStaff}>
                  {isSavingStaff ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Menu Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Sửa món: {editingItem.name}</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setIsSavingEdit(true);
                  await onUpdateMenuItem(editingItem.id, {
                    name: editingItem.name,
                    price: editingItem.price,
                    description: editingItem.description,
                    category: editingItem.category,
                    imageUrl: editingItem.imageUrl,
                    available: editingItem.available,
                  });
                  setIsSavingEdit(false);
                  setEditingItem(null);
                } catch (err) {
                  setIsSavingEdit(false);
                  alert(err instanceof Error ? err.message : 'Không thể cập nhật món');
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên món</label>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={editingItem.name}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : prev)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Giá (VND)</label>
                <input
                  type="number"
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={editingItem.price}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, price: Number(e.target.value) } : prev)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                <select
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-white text-sm"
                  value={editingItem.category}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, category: e.target.value } : prev)}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={editingItem.description}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : prev)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editingItem.available}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, available: e.target.checked } : prev)}
                  />
                  <span>Còn bán</span>
                </label>
                {editingItem.imageUrl && (
                  <img
                    src={editingItem.imageUrl}
                    alt="Ảnh món"
                    className="w-16 h-12 object-cover rounded border"
                  />
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingItem(null)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedOrderForInvoice && (
        <Invoice
          order={selectedOrderForInvoice}
          restaurant={restaurant}
          onClose={() => setSelectedOrderForInvoice(null)}
          onConfirm={() => {
            // Cập nhật status thành COMPLETED khi xác nhận đã in
            onUpdateOrderStatus(selectedOrderForInvoice.id, OrderStatus.COMPLETED);
          }}
        />
      )}
    </div>
  );
};