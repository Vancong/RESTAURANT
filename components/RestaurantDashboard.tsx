import React, { useEffect, useState } from 'react';
import { Restaurant, MenuItem, Order, OrderStatus, PaymentMethod, RestaurantStats, StatsPeriod } from '../types';
import { Button } from './Button';
import { Invoice } from './Invoice';
import { generateMenuDescription } from '../services/geminiService';
import { LayoutDashboard, UtensilsCrossed, QrCode, LogOut, Clock, ChefHat, Trash, Sparkles, Lock, X, Plus, Users, Edit, Ban, CheckCircle, Settings, CreditCard, User, Receipt, AlertCircle, CheckCircle2, XCircle, Timer, Eye, EyeOff, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users as UsersIcon, XCircle as XCircleIcon, Activity, Award, Zap, Tag, FolderOpen, FileText, Image, Upload, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

interface RestaurantDashboardProps {
  restaurant: Restaurant;
  menu: MenuItem[];
  orders: Order[];
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  onUpdateMenuItem: (id: string, data: Partial<MenuItem>) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, paymentMethod?: PaymentMethod) => void;
  onDeleteMenuItem: (id: string) => Promise<void>;
  onUpdateRestaurant: (data: Partial<Restaurant>) => Promise<Restaurant>;
  onLogout: () => void;
  onFetchStats?: (period: StatsPeriod, startDate?: string, endDate?: string) => Promise<RestaurantStats>;
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
  onLogout,
  onFetchStats
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'qr' | 'stats' | 'staff' | 'bank' | 'settings'>('orders');
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ category: 'Món Chính', available: true });
  const [priceDisplay, setPriceDisplay] = useState<string>('');
  const [editingPriceDisplay, setEditingPriceDisplay] = useState<string>('');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [qrTableInput, setQrTableInput] = useState('');
  const [isChangePwOpen, setIsChangePwOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tables, setTables] = useState<{ id: string; code: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string>('');
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
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

  // Stats state
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statsData, setStatsData] = useState<RestaurantStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

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

// Helper function để format giá tiền theo định dạng Việt Nam (dấu phẩy ngăn cách)
const formatPrice = (price: number | string): string => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Helper function để parse giá từ string đã format về number (loại bỏ dấu phẩy)
const parsePrice = (priceString: string): number => {
  // Loại bỏ tất cả dấu phẩy và khoảng trắng
  const cleaned = priceString.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

  // Stats Logic (legacy - for backward compatibility)
  const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.SERVED);
  const revenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const chartData = completedOrders.map(o => ({
      name: `Bàn ${o.tableNumber}`,
      amount: o.totalAmount
  })).slice(-10); // Last 10 orders

  // Fetch stats when period changes
  useEffect(() => {
    if (onFetchStats && activeTab === 'stats') {
      loadStats();
    }
  }, [statsPeriod, customStartDate, customEndDate, activeTab]);

  const loadStats = async () => {
    if (!onFetchStats) return;
    try {
      setIsLoadingStats(true);
      setStatsError(null);
      const startDate = statsPeriod === 'custom' ? customStartDate : undefined;
      const endDate = statsPeriod === 'custom' ? customEndDate : undefined;
      const data = await onFetchStats(statsPeriod, startDate, endDate);
      setStatsData(data);
    } catch (err) {
      console.error('Error loading stats:', err);
      setStatsError(err instanceof Error ? err.message : 'Không thể tải thống kê');
    } finally {
      setIsLoadingStats(false);
    }
  };

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
    const parsedPrice = priceDisplay ? parsePrice(priceDisplay) : (newItem.price || 0);
    if (!newItem.name || !parsedPrice || parsedPrice <= 0) {
      alert('Vui lòng nhập tên món và giá hợp lệ');
      return;
    }
    try {
      setIsSavingMenuItem(true);
      await onAddMenuItem({
        restaurantId: restaurant.id,
        name: newItem.name,
        price: parsedPrice,
        description: newItem.description || '',
        category: newItem.category || 'Món Chính',
        imageUrl: newItem.imageUrl || `https://picsum.photos/400/300?random=${Date.now()}`,
        available: true
      });
      setNewItem({ category: 'Món Chính', available: true, name: '', price: 0, description: '' });
      setPriceDisplay('');
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

  const updateCategory = async (id: string, newName: string) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error('Vui lòng đăng nhập lại.');
      
      const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName.trim() })
      });
      
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể cập nhật danh mục');
      }
      
      setEditingCategoryId(null);
      setEditingCategoryName('');
      fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể cập nhật danh mục');
      throw err;
    }
  };

  const deleteCategory = async (id: string, categoryName: string) => {
    // Kiểm tra xem có món nào trong danh mục này không
    const itemsInCategory = menu.filter(item => item.category === categoryName);
    if (itemsInCategory.length > 0) {
      alert(`Không thể xóa danh mục "${categoryName}" vì có ${itemsInCategory.length} món đang sử dụng danh mục này. Vui lòng chuyển các món sang danh mục khác trước.`);
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${categoryName}"?`)) {
      return;
    }

    try {
      setDeletingCategoryId(id);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error('Vui lòng đăng nhập lại.');
      
      const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Không thể xóa danh mục');
      }
      
      fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xóa danh mục');
    } finally {
      setDeletingCategoryId(null);
    }
  };

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
    const [error, setError] = useState<string>('');

    // Kiểm tra danh mục trùng (không phân biệt hoa thường)
    const normalizedName = name.trim().toLowerCase();
    const isDuplicate = categories.some(
      cat => cat.name.trim().toLowerCase() === normalizedName
    );
    const isValid = name.trim() && !isDuplicate;

    const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      const trimmedName = name.trim();
      
      // Validation
      if (!trimmedName) {
        setError('Vui lòng nhập tên danh mục');
        return;
      }

      // Kiểm tra trùng
      const normalizedTrimmed = trimmedName.toLowerCase();
      const duplicate = categories.find(
        cat => cat.name.trim().toLowerCase() === normalizedTrimmed
      );
      
      if (duplicate) {
        setError(`Danh mục "${duplicate.name}" đã tồn tại!`);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) throw new Error('Vui lòng đăng nhập lại.');
        
        const res = await fetch(`${API_BASE_URL}/api/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: trimmedName })
        });
        
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          // Kiểm tra nếu server trả về lỗi trùng
          const errorMsg = body?.message || 'Không thể tạo danh mục';
          if (errorMsg.toLowerCase().includes('đã tồn tại') || errorMsg.toLowerCase().includes('duplicate') || errorMsg.toLowerCase().includes('exists')) {
            setError(`Danh mục "${trimmedName}" đã tồn tại!`);
          } else {
            throw new Error(errorMsg);
          }
          return;
        }
        
        setName('');
        setError('');
        onCreated();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể tạo danh mục';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    // Reset error khi người dùng nhập
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
      if (error) setError('');
    };

    return (
      <form onSubmit={handleCreate} className="space-y-3 pt-4 border-t border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Thêm danh mục mới
        </label>
        
        <div className="space-y-2">
        <div className="flex space-x-2">
            <div className="flex-1 relative">
          <input
            type="text"
                className={`flex-1 w-full border-2 rounded-xl px-4 py-2.5 text-sm focus:ring-4 transition-all duration-200 bg-white ${
                  error || isDuplicate
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : isValid
                    ? 'border-green-300 focus:border-brand-500 focus:ring-brand-100'
                    : 'border-gray-200 focus:border-brand-500 focus:ring-brand-100'
                }`}
            placeholder="VD: Món Chính, Đồ Uống..."
            value={name}
                onChange={handleNameChange}
                disabled={loading}
              />
              {isValid && !error && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              )}
              {(isDuplicate || error) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
              )}
            </div>
            <Button 
              type="submit" 
              size="sm" 
              disabled={loading || !isValid || isDuplicate}
              className="px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Đang thêm
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Thêm
                </>
              )}
          </Button>
          </div>
          
          {/* Hiển thị thông báo lỗi hoặc cảnh báo */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}
          
          {isDuplicate && !error && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl animate-fade-in">
              <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-orange-700 font-medium">
                Danh mục "{categories.find(cat => cat.name.trim().toLowerCase() === normalizedName)?.name}" đã tồn tại!
              </p>
            </div>
          )}
          
          {isValid && !error && !isDuplicate && (
            <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-green-700 font-medium">
                Sẵn sàng thêm danh mục mới
              </p>
            </div>
          )}
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-amber-50/20 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="bg-gradient-to-b from-white to-orange-50/50 w-full md:w-72 border-r border-orange-100 flex-shrink-0 shadow-lg">
        <div className="p-6 border-b border-orange-100 bg-gradient-to-r from-brand-600 to-brand-700">
          <h2 className="text-2xl font-bold text-white truncate drop-shadow-md">{restaurant.name}</h2>
          <p className="text-xs text-orange-100 mt-1 font-medium">Quản lý nhà hàng</p>
        </div>
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'orders' 
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200 scale-105' 
                : 'text-gray-700 hover:bg-orange-50 hover:shadow-md hover:scale-[1.02]'
            }`}
          >
            <Clock className={`w-5 h-5 mr-3 ${activeTab === 'orders' ? 'text-white' : 'text-brand-600'}`} /> Đơn hàng
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'menu' 
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200 scale-105' 
                : 'text-gray-700 hover:bg-orange-50 hover:shadow-md hover:scale-102'
            }`}
          >
            <UtensilsCrossed className={`w-5 h-5 mr-3 ${activeTab === 'menu' ? 'text-white' : 'text-brand-600'}`} /> Thực đơn
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'stats' 
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200 scale-105' 
                : 'text-gray-700 hover:bg-orange-50 hover:shadow-md hover:scale-102'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 mr-3 ${activeTab === 'stats' ? 'text-white' : 'text-brand-600'}`} /> Thống kê
          </button>
          <button 
            onClick={() => setActiveTab('qr')}
            className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'qr' 
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200 scale-105' 
                : 'text-gray-700 hover:bg-orange-50 hover:shadow-md hover:scale-102'
            }`}
          >
            <QrCode className={`w-5 h-5 mr-3 ${activeTab === 'qr' ? 'text-white' : 'text-brand-600'}`} /> Mã QR
          </button>
          <button 
            onClick={() => setActiveTab('staff')}
            className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'staff' 
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200 scale-105' 
                : 'text-gray-700 hover:bg-orange-50 hover:shadow-md hover:scale-102'
            }`}
          >
            <Users className={`w-5 h-5 mr-3 ${activeTab === 'staff' ? 'text-white' : 'text-brand-600'}`} /> Nhân viên
          </button>
          <button 
            onClick={() => setActiveTab('bank')}
            className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'bank' 
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200 scale-105' 
                : 'text-gray-700 hover:bg-orange-50 hover:shadow-md hover:scale-102'
            }`}
          >
            <CreditCard className={`w-5 h-5 mr-3 ${activeTab === 'bank' ? 'text-white' : 'text-brand-600'}`} /> Ngân hàng
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'settings' 
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200 scale-105' 
                : 'text-gray-700 hover:bg-orange-50 hover:shadow-md hover:scale-102'
            }`}
          >
            <Settings className={`w-5 h-5 mr-3 ${activeTab === 'settings' ? 'text-white' : 'text-brand-600'}`} /> Cài đặt
          </button>
          <div className="pt-4 mt-4 border-t border-orange-200 space-y-2">
            <button
              onClick={() => setIsChangePwOpen(true)}
              className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:shadow-md rounded-xl transition-all duration-200"
            >
              <Lock className="w-5 h-5 mr-3 text-gray-500" /> Đổi mật khẩu
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:shadow-md rounded-xl transition-all duration-200"
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

          const cancelledOrders = orders
            .filter(order => order.status === OrderStatus.CANCELLED)
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
                          <span>{new Date(order.timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(order.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                        {order.status === OrderStatus.COMPLETED && order.paymentMethod && (
                          <div className="flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>
                              Thanh toán: <span className="font-semibold text-brand-600">
                                {order.paymentMethod === PaymentMethod.CASH ? 'Tiền mặt' : 'Chuyển khoản'}
                              </span>
                            </span>
                          </div>
                        )}
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
                            {formatPrice(item.price * item.quantity)}₫
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
                        {formatPrice(order.totalAmount)}₫
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
                                    {formatPrice(item.price * item.quantity)}₫
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
                          <div className="space-y-2 mb-3 pb-3 border-b border-gray-200">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1.5 rounded-lg">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span className="font-semibold text-gray-700">{new Date(order.timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(order.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              {order.updatedByName && (
                                <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1.5 rounded-lg">
                                  <User className="w-3.5 h-3.5 text-green-600" />
                                  <span className="font-bold text-green-700">{order.updatedByName}</span>
                                </div>
                              )}
                            </div>
                            {order.paymentMethod && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 font-medium">Hình thức thanh toán:</span>
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs ${
                                  order.paymentMethod === PaymentMethod.CASH
                                    ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}>
                                  <CreditCard className={`w-3.5 h-3.5 ${
                                    order.paymentMethod === PaymentMethod.CASH ? 'text-purple-600' : 'text-indigo-600'
                                  }`} />
                                  <span>
                                    {order.paymentMethod === PaymentMethod.CASH ? '💵 Tiền mặt' : '🏦 Chuyển khoản'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Total */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 font-semibold">Tổng tiền</span>
                              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                {formatPrice(order.totalAmount)}₫
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Đơn hàng đã hủy */}
              {cancelledOrders.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-gradient-to-b from-red-400 to-red-500 rounded-full"></div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Đơn hàng đã hủy</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Lịch sử đơn hàng đã bị hủy</p>
                      </div>
                    </div>
                    <span className="bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm">
                      <XCircle className="w-4 h-4" />
                      {cancelledOrders.length} đơn
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cancelledOrders.map(order => (
                      <div 
                        key={order.id} 
                        className="bg-white rounded-xl shadow-md border-2 border-red-200 hover:shadow-lg hover:border-red-300 transition-all duration-200 overflow-hidden group opacity-75"
                      >
                        {/* Header với gradient màu đỏ */}
                        <div className="bg-gradient-to-r from-red-50 via-red-50 to-red-100 px-4 py-3 border-b-2 border-red-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 via-red-500 to-red-600 flex items-center justify-center font-bold text-white text-base shadow-lg">
                                {order.tableNumber}
                              </div>
                              <div>
                                <h3 className="font-bold text-base text-gray-900">Bàn {order.tableNumber}</h3>
                                {order.customerName && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                                    <User className="w-3.5 h-3.5 text-red-600" />
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
                          <div className="bg-gradient-to-br from-gray-50 to-red-50 rounded-lg p-3 mb-3 border border-red-100">
                            <div className="space-y-2.5">
                              {order.items.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm bg-white rounded-lg px-2.5 py-2 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2.5 py-1 rounded-md font-bold text-xs shadow-md">
                                      {item.quantity}x
                                    </span>
                                    <span className="text-gray-800 font-semibold line-through">{item.name}</span>
                                  </div>
                                  <span className="text-gray-600 font-bold text-xs line-through">
                                    {formatPrice(item.price * item.quantity)}₫
                                  </span>
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <div className="pt-2 border-t border-red-200">
                                  <p className="text-xs text-red-600 font-semibold text-center">
                                    +{order.items.length - 2} món khác
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Note */}
                          {order.note && (
                            <div className="bg-red-50 border-l-3 border-red-400 rounded-lg p-2.5 mb-3">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-red-800 font-medium leading-relaxed">{order.note}</p>
                              </div>
                            </div>
                          )}

                          {/* Footer info */}
                          <div className="space-y-2 mb-3 pb-3 border-b border-red-200">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1.5 rounded-lg">
                                <Clock className="w-3.5 h-3.5 text-red-600" />
                                <span className="font-semibold text-gray-700">{new Date(order.timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(order.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              {order.updatedByName && (
                                <div className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1.5 rounded-lg">
                                  <User className="w-3.5 h-3.5 text-red-600" />
                                  <span className="font-bold text-red-700">{order.updatedByName}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Total */}
                          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-3 border border-red-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 font-semibold">Tổng tiền</span>
                              <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent line-through">
                                {formatPrice(order.totalAmount)}₫
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
             {/* Form thêm món mới - Redesigned với icon và layout đẹp hơn */}
             <div className="bg-gradient-to-br from-white via-white to-orange-50/30 p-8 rounded-2xl shadow-xl border border-orange-100 backdrop-blur-sm">
                <div className="flex items-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 flex items-center justify-center mr-4 shadow-lg shadow-brand-200/50 ring-4 ring-brand-100">
                    <ChefHat className="w-7 h-7 text-white"/>
                    </div>
                    <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Thêm món mới</h3>
                    <p className="text-sm text-gray-500">Điền thông tin để thêm món vào thực đơn</p>
                    </div>
                </div>
                
                <form onSubmit={handleSubmitMenu} className="space-y-6">
                    {/* Row 1: Tên món và Giá */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Tên món */}
                      <div className="space-y-2 group">
                        <label className="flex items-center text-sm font-semibold text-gray-700">
                          <Tag className="w-4 h-4 mr-2 text-brand-600" />
                          Tên món <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Tag className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                          </div>
                          <input 
                            required 
                            className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all duration-200 bg-white hover:border-gray-300" 
                            placeholder="VD: Phở bò tái chín"
                            value={newItem.name || ''} 
                            onChange={e => setNewItem({...newItem, name: e.target.value})} 
                          />
                        </div>
                      </div>
                      
                      {/* Giá */}
                      <div className="space-y-2 group">
                        <label className="flex items-center text-sm font-semibold text-gray-700">
                          <DollarSign className="w-4 h-4 mr-2 text-brand-600" />
                          Giá (VND) <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                          </div>
                          <input 
                            required 
                            type="text" 
                            className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all duration-200 bg-white hover:border-gray-300" 
                            placeholder="VD: 45,000"
                            value={priceDisplay} 
                            onChange={(e) => {
                              // Lấy giá trị input và loại bỏ tất cả ký tự không phải số
                              const rawValue = e.target.value.replace(/[^0-9]/g, '');
                              
                              // Nếu có giá trị số, format ngay lập tức
                              if (rawValue) {
                                const parsed = parseInt(rawValue, 10);
                                if (!isNaN(parsed) && parsed > 0) {
                                  const formatted = formatPrice(parsed);
                                  setPriceDisplay(formatted);
                                  setNewItem({...newItem, price: parsed});
                                } else {
                                  setPriceDisplay('');
                                  setNewItem({...newItem, price: undefined});
                                }
                              } else {
                                setPriceDisplay('');
                                setNewItem({...newItem, price: undefined});
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Danh mục */}
                    <div className="space-y-2 group">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        <FolderOpen className="w-4 h-4 mr-2 text-brand-600" />
                        Danh mục <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                          <FolderOpen className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                        </div>
                        <select
                          required
                          className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all duration-200 appearance-none hover:border-gray-300 cursor-pointer"
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
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                        {categories.length === 0 && (
                        <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                          <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-orange-700 font-medium">
                            Chưa có danh mục nào. Vui lòng thêm danh mục ở cột bên phải.
                          </p>
                        </div>
                        )}
                    </div>

                    {/* Row 3: Mô tả */}
                    <div className="space-y-2 group">
                      <div className="flex justify-between items-center">
                        <label className="flex items-center text-sm font-semibold text-gray-700">
                          <FileText className="w-4 h-4 mr-2 text-brand-600" />
                          Mô tả
                        </label>
                        <button 
                          type="button" 
                          onClick={handleGenerateDescription} 
                          disabled={isAiLoading} 
                          className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Sparkles className={`w-3 h-3 mr-1 ${isAiLoading ? 'animate-spin' : ''}`} /> 
                          {isAiLoading ? 'Đang viết...' : 'Dùng AI viết mô tả'}
                            </button>
                         </div>
                      <div className="relative">
                        <div className="absolute top-3 left-4 pointer-events-none">
                          <FileText className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                    </div>
                        <textarea 
                          className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all duration-200 bg-white resize-none hover:border-gray-300" 
                          rows={3} 
                          placeholder="Mô tả chi tiết về món ăn..."
                          value={newItem.description || ''} 
                          onChange={e => setNewItem({...newItem, description: e.target.value})} 
                        />
                      </div>
                    </div>

                    {/* Row 4: Upload ảnh */}
                    <div className="space-y-3">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        <Image className="w-4 h-4 mr-2 text-brand-600" />
                        Ảnh món ăn
                      </label>
                      
                      {!newItem.imageUrl ? (
                        <div className="flex items-center gap-4">
                          <label 
                            htmlFor="image-upload"
                            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl cursor-pointer hover:from-brand-600 hover:to-brand-700 transition-all duration-200 shadow-lg shadow-brand-200 hover:shadow-xl"
                          >
                            <Upload className="w-5 h-5 mr-2" />
                            Chọn ảnh
                        <input
                              id="image-upload"
                          type="file"
                          accept="image/*"
                              className="hidden"
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
                          </label>
                        {isUploadingImage && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                              Đang upload ảnh...
                            </div>
                        )}
                          <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 10MB</p>
                      </div>
                      ) : (
                        <div className="relative group/image-preview">
                          <div className="relative rounded-2xl overflow-hidden border-2 border-brand-200 shadow-lg">
                          <img
                            src={newItem.imageUrl}
                            alt="Preview món"
                              className="w-full h-64 object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/image-preview:opacity-100 transition-opacity duration-300"></div>
                            <button
                              type="button"
                              onClick={() => setNewItem(prev => ({ ...prev, imageUrl: undefined }))}
                              className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg hover:scale-110 transition-all duration-200 opacity-0 group-hover/image-preview:opacity-100"
                            >
                              <X className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => document.getElementById('image-upload')?.click()}
                              className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-brand-600 rounded-lg px-4 py-2 font-semibold text-sm hover:bg-white shadow-lg opacity-0 group-hover/image-preview:opacity-100 transition-all duration-200"
                            >
                              <Image className="w-4 h-4 inline mr-2" />
                              Đổi ảnh
                            </button>
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
                                  alert('Chưa cấu hình Cloudinary.');
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
                                  if (!res.ok) throw new Error(data?.error?.message || 'Upload thất bại');
                                  setNewItem(prev => ({ ...prev, imageUrl: data.secure_url }));
                                } catch (err) {
                                  alert(err instanceof Error ? err.message : 'Không thể upload ảnh');
                                } finally {
                                  setIsUploadingImage(false);
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full py-4 text-lg font-bold bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 hover:from-brand-600 hover:via-brand-700 hover:to-brand-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                        disabled={isSavingMenuItem}
                      >
                        {isSavingMenuItem ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Đang lưu...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <Plus className="w-5 h-5 mr-2" />
                            Thêm vào thực đơn
                          </span>
                        )}
                        </Button>
                    </div>
                </form>
             </div>

             {/* Phần quản lý danh mục - Section riêng */}
             <div className="bg-gradient-to-br from-white via-white to-orange-50/30 p-6 rounded-2xl shadow-xl border border-orange-100">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center">
                   <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center mr-4 shadow-lg shadow-brand-200/50">
                     <Receipt className="w-6 h-6 text-white"/>
                          </div>
                   <div>
                     <h3 className="text-xl font-bold text-gray-900">Quản lý danh mục</h3>
                     <p className="text-sm text-gray-500">Tổ chức món ăn theo danh mục</p>
                   </div>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                 {categories.length === 0 ? (
                   <div className="col-span-full text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                     <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                     <p className="text-sm text-gray-500 font-medium">Chưa có danh mục nào</p>
                   </div>
                 ) : (
                   categories.map(cat => {
                     const itemCount = menu.filter(item => item.category === cat.name).length;
                     const isEditing = editingCategoryId === cat.id;
                     const isDeleting = deletingCategoryId === cat.id;
                     
                     return (
                       <div
                         key={cat.id}
                         className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:shadow-md transition-all duration-200 group"
                       >
                         {isEditing ? (
                           // Form chỉnh sửa inline
                           <form
                             onSubmit={async (e) => {
                               e.preventDefault();
                               const trimmedName = editingCategoryName.trim();
                               if (!trimmedName) {
                                 alert('Tên danh mục không được để trống');
                                 return;
                               }
                               
                               // Kiểm tra trùng với danh mục khác
                               const duplicate = categories.find(
                                 c => c.id !== cat.id && c.name.trim().toLowerCase() === trimmedName.toLowerCase()
                               );
                               if (duplicate) {
                                 alert(`Danh mục "${trimmedName}" đã tồn tại!`);
                                 return;
                               }
                               
                               try {
                                 await updateCategory(cat.id, trimmedName);
                               } catch (err) {
                                 // Error đã được xử lý trong updateCategory
                               }
                             }}
                             className="space-y-2"
                           >
                             <input
                               type="text"
                               className="w-full border-2 border-brand-300 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                               value={editingCategoryName}
                               onChange={(e) => setEditingCategoryName(e.target.value)}
                               autoFocus
                               onBlur={() => {
                                 if (editingCategoryName.trim() === cat.name.trim()) {
                                   setEditingCategoryId(null);
                                   setEditingCategoryName('');
                                 }
                               }}
                             />
                             <div className="flex gap-2">
                          <Button 
                                 type="submit"
                            size="sm"
                                 className="flex-1 px-3 py-1.5 text-xs"
                               >
                                 <CheckCircle className="w-3 h-3 mr-1" />
                                 Lưu
                               </Button>
                               <Button
                                 type="button"
                                 size="sm"
                                 variant="secondary"
                                 onClick={() => {
                                   setEditingCategoryId(null);
                                   setEditingCategoryName('');
                                 }}
                                 className="px-3 py-1.5 text-xs"
                               >
                                 <X className="w-3 h-3" />
                               </Button>
                             </div>
                           </form>
                         ) : (
                           // Hiển thị bình thường với nút sửa/xóa
                           <div className="flex items-center justify-between gap-2">
                             <div className="flex items-center gap-3 flex-1 min-w-0">
                               <div className="w-3 h-3 rounded-full bg-brand-500 group-hover:bg-brand-600 transition-colors flex-shrink-0"></div>
                               <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-700 transition-colors truncate">
                                 {cat.name}
                               </span>
                             </div>
                             <div className="flex items-center gap-2 flex-shrink-0">
                               <span className="inline-flex items-center justify-center px-2.5 py-1 bg-gradient-to-r from-brand-50 to-orange-50 text-brand-700 text-xs font-bold rounded-full border border-brand-200">
                                 {itemCount}
                               </span>
                               <button
                                 onClick={() => {
                                   setEditingCategoryId(cat.id);
                                   setEditingCategoryName(cat.name);
                                 }}
                                 className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                 title="Sửa danh mục"
                               >
                                 <Edit className="w-4 h-4" />
                               </button>
                               <button
                                 onClick={() => deleteCategory(cat.id, cat.name)}
                                 disabled={isDeleting}
                                 className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                 title="Xóa danh mục"
                               >
                                 {isDeleting ? (
                                   <Loader2 className="w-4 h-4 animate-spin" />
                                 ) : (
                                   <Trash className="w-4 h-4" />
                                 )}
                               </button>
                             </div>
                           </div>
                         )}
                       </div>
                     );
                   })
                 )}
               </div>
               
               <CategoryCreator onCreated={fetchCategories} />
             </div>

             {/* Danh sách món - Toàn bộ chiều rộng */}
             <div className="mb-4">
               <h3 className="text-xl font-bold text-gray-900">Danh sách món ({menu.length})</h3>
               <p className="text-sm text-gray-500">Quản lý các món trong thực đơn</p>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
               {menu.length === 0 ? (
                 <div className="col-span-full text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                   <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                   <p className="text-gray-500 font-medium">Chưa có món nào trong thực đơn</p>
                   <p className="text-sm text-gray-400 mt-1">Thêm món mới ở phía trên</p>
                 </div>
               ) : (
                 menu.map(item => (
                      <div 
                        key={item.id} 
                        className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 group ${
                          !item.available 
                            ? 'opacity-70 border-red-200 bg-gradient-to-br from-red-50 to-white' 
                            : 'border-transparent hover:border-brand-200'
                        }`}
                      >
                        {/* Badge hết món */}
                        {!item.available && (
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-lg">
                            ⛔ Hết món
                          </div>
                        )}
                        
                        {/* Ảnh món */}
                        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                          {/* Action buttons overlay */}
                          <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                            onClick={() => {
                              const newAvailable = !item.available;
                              onUpdateMenuItem(item.id, { available: newAvailable });
                            }}
                              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-lg transition-all duration-200"
                            title={item.available ? "Ẩn món (hết hàng)" : "Hiện món (còn hàng)"}
                          >
                              {item.available ? <EyeOff className="w-4 h-4 text-gray-700" /> : <Eye className="w-4 h-4 text-green-600" />}
                            </button>
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setEditingPriceDisplay(formatPrice(item.price));
                              }}
                              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-lg transition-all duration-200"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                            onClick={() => handleDeleteMenu(item.id)} 
                            disabled={deletingMenuId === item.id}
                              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-lg transition-all duration-200 disabled:opacity-50"
                              title="Xóa món"
                          >
                              <Trash className="w-4 h-4 text-red-600" />
                            </button>
                        </div>
                        </div>
                        
                        {/* Nội dung */}
                        <div className="p-5">
                          <h4 className="font-bold text-lg text-gray-900 line-clamp-1 mb-2">{item.name}</h4>
                          <p className="text-xl font-bold text-brand-600 mb-3">{formatPrice(item.price)}₫</p>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[2.5rem]">{item.description || 'Chưa có mô tả'}</p>
                          
                          {/* Footer với danh mục và trạng thái */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-brand-50 to-orange-50 text-brand-700 text-xs font-semibold rounded-full border border-brand-200">
                              {item.category}
                            </span>
                           {item.available ? (
                              <span className="inline-flex items-center text-xs text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">
                               <CheckCircle className="w-3 h-3 mr-1" />
                               Còn hàng
                             </span>
                           ) : (
                              <span className="inline-flex items-center text-xs text-red-600 font-semibold bg-red-50 px-3 py-1 rounded-full">
                               <XCircle className="w-3 h-3 mr-1" />
                               Hết hàng
                             </span>
                           )}
                        </div>
                    </div>
               </div>
                    ))
                 )}
             </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
             <div className="space-y-6">
            {/* Filter UI */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chọn kỳ thống kê</label>
                  <select
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    value={statsPeriod}
                    onChange={(e) => setStatsPeriod(e.target.value as StatsPeriod)}
                  >
                    <option value="today">Hôm nay</option>
                    <option value="week">Tuần này</option>
                    <option value="month">Tháng này</option>
                    <option value="year">Năm này</option>
                    <option value="custom">Tùy chọn</option>
                  </select>
                </div>
                {statsPeriod === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
                      <input
                        type="date"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
                      <input
                        type="date"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
                <Button onClick={loadStats} disabled={isLoadingStats || (statsPeriod === 'custom' && (!customStartDate || !customEndDate))}>
                  {isLoadingStats ? 'Đang tải...' : 'Tải thống kê'}
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {isLoadingStats && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                <p className="mt-2 text-gray-500">Đang tải thống kê...</p>
              </div>
            )}

            {/* Error State */}
            {statsError && !isLoadingStats && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{statsError}</p>
              </div>
            )}

            {/* Stats Content */}
            {!isLoadingStats && !statsError && statsData && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Doanh thu tổng */}
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-500">Doanh thu tổng</p>
                      <DollarSign className="w-5 h-5 text-green-600" />
                     </div>
                    <h3 className="text-3xl font-bold text-brand-600 mb-1">
                      {formatPrice(statsData.overview.totalRevenue)}₫
                    </h3>
                    {statsData.overview.revenueChange !== null && statsData.overview.revenueChange !== 0 && (
                      <div className={`flex items-center text-sm ${statsData.overview.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {statsData.overview.revenueChange > 0 ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {Math.abs(statsData.overview.revenueChange).toFixed(1)}% so với kỳ trước
                      </div>
                    )}
                    {statsData.overview.revenueChange === null && statsData.overview.totalRevenue > 0 && (
                      <div className="flex items-center text-sm text-blue-600">
                        <Sparkles className="w-4 h-4 mr-1" />
                        Không có dữ liệu kỳ trước
                      </div>
                    )}
                  </div>

                  {/* Tổng đơn hàng */}
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-500">Tổng đơn hàng</p>
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                     </div>
                    <h3 className="text-3xl font-bold text-blue-600 mb-1">{statsData.overview.totalOrders}</h3>
                    {statsData.overview.ordersChange !== null && statsData.overview.ordersChange !== 0 && (
                      <div className={`flex items-center text-sm ${statsData.overview.ordersChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {statsData.overview.ordersChange > 0 ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {Math.abs(statsData.overview.ordersChange).toFixed(1)}% so với kỳ trước
                      </div>
                    )}
                    {statsData.overview.ordersChange === null && statsData.overview.totalOrders > 0 && (
                      <div className="flex items-center text-sm text-blue-600">
                        <Sparkles className="w-4 h-4 mr-1" />
                        Không có dữ liệu kỳ trước
                      </div>
                    )}
                  </div>

                  {/* Doanh thu trung bình/đơn */}
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-500">Doanh thu TB/đơn</p>
                      <Activity className="w-5 h-5 text-purple-600" />
                     </div>
                    <h3 className="text-3xl font-bold text-purple-600 mb-1">
                      {formatPrice(statsData.overview.averageOrderValue)}₫
                    </h3>
                    {statsData.overview.previousAverageOrderValue > 0 && (
                      <div className={`flex items-center text-sm ${
                        statsData.overview.averageOrderValue > statsData.overview.previousAverageOrderValue ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {statsData.overview.averageOrderValue > statsData.overview.previousAverageOrderValue ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {Math.abs(((statsData.overview.averageOrderValue - statsData.overview.previousAverageOrderValue) / statsData.overview.previousAverageOrderValue) * 100).toFixed(1)}% so với kỳ trước
                      </div>
                    )}
                 </div>

                  {/* Số khách hàng */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-500">Số khách hàng</p>
                      <UsersIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-indigo-600">{statsData.overview.totalCustomers}</h3>
                  </div>

                  {/* Tỷ lệ hủy đơn */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-500">Tỷ lệ hủy đơn</p>
                      <XCircleIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-red-600">{statsData.overview.cancellationRate.toFixed(1)}%</h3>
                  </div>

                  {/* Thời gian xử lý trung bình */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-500">Thời gian xử lý TB</p>
                      <Timer className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-orange-600">{statsData.overview.averageProcessingTime} phút</h3>
                  </div>

                  {/* Món bán chạy nhất */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-500">Món bán chạy nhất</p>
                      <Award className="w-5 h-5 text-yellow-600" />
                    </div>
                    {statsData.overview.topSellingItem ? (
                      <>
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{statsData.overview.topSellingItem.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{statsData.overview.topSellingItem.quantity} phần</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
                    )}
                  </div>

                  {/* Giờ cao điểm */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-500">Giờ cao điểm</p>
                      <Zap className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-amber-600">{statsData.overview.peakHour}:00</h3>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Doanh thu theo ngày (Line Chart) */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold mb-4">Doanh thu theo ngày</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={statsData.revenueByDate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} />
                            <YAxis />
                        <Tooltip 
                          formatter={(value: number) => `${formatPrice(value)}₫`}
                          labelFormatter={(label) => new Date(label).toLocaleDateString('vi-VN')}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Doanh thu theo giờ (Area Chart) */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold mb-4">Doanh thu theo giờ</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={statsData.revenueByHour}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `${formatPrice(value)}₫`} />
                        <Area type="monotone" dataKey="revenue" stroke="#4F46E5" fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top 10 món bán chạy (Horizontal Bar Chart) */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold mb-4">Top 10 món bán chạy</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statsData.topMenuItems.slice(0, 10).reverse()} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => `${value} phần`} />
                        <Bar dataKey="quantity" fill="#ea580c" radius={[0, 4, 4, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                 </div>

                  {/* Phân bổ theo danh mục (Pie Chart) */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold mb-4">Phân bổ theo danh mục</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statsData.revenueByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {statsData.revenueByCategory.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={['#4F46E5', '#ea580c', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${formatPrice(value)}₫`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tables Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top món bán chạy table */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-4">
                      <h3 className="text-lg font-bold text-white">Top món bán chạy</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên món</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {statsData.topMenuItems.slice(0, 10).map((item, index) => (
                            <tr key={item.menuItemId} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatPrice(item.revenue)}₫</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Top bàn table */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                      <h3 className="text-lg font-bold text-white">Top bàn</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số bàn</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số đơn</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {statsData.revenueByTable.slice(0, 10).map((table, index) => (
                            <tr key={table.tableNumber} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">Bàn {table.tableNumber}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 text-right">{table.orders}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatPrice(table.revenue)}₫</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Đơn hàng lớn nhất table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                    <h3 className="text-lg font-bold text-white">Đơn hàng lớn nhất</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bàn</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {statsData.largestOrders.slice(0, 10).map((order, index) => (
                          <tr key={order.orderId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">Bàn {order.tableNumber}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{order.customerName || 'Khách vãng lai'}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatPrice(order.totalAmount)}₫</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Empty State */}
            {!isLoadingStats && !statsError && !statsData && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                <p className="text-gray-500">Chưa có dữ liệu thống kê. Vui lòng chọn kỳ thống kê và nhấn "Tải thống kê".</p>
              </div>
            )}
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
                onClick={() => {
                  setEditingItem(null);
                  setEditingPriceDisplay('');
                }}
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
                  // Parse giá từ display value
                  const parsedPrice = editingPriceDisplay ? parsePrice(editingPriceDisplay) : editingItem.price;
                  if (!parsedPrice || parsedPrice <= 0) {
                    alert('Giá không hợp lệ');
                    setIsSavingEdit(false);
                    return;
                  }
                  await onUpdateMenuItem(editingItem.id, {
                    name: editingItem.name,
                    price: parsedPrice,
                    description: editingItem.description,
                    category: editingItem.category,
                    imageUrl: editingItem.imageUrl,
                    available: editingItem.available,
                  });
                  setIsSavingEdit(false);
                  setEditingItem(null);
                  setEditingPriceDisplay('');
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
                  type="text"
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm"
                  placeholder="VD: 45,000"
                  value={editingPriceDisplay}
                  onChange={(e) => {
                    // Lấy giá trị input và loại bỏ tất cả ký tự không phải số
                    const rawValue = e.target.value.replace(/[^0-9]/g, '');
                    
                    // Nếu có giá trị số, format ngay lập tức
                    if (rawValue) {
                      const parsed = parseInt(rawValue, 10);
                      if (!isNaN(parsed) && parsed > 0) {
                        const formatted = formatPrice(parsed);
                        setEditingPriceDisplay(formatted);
                        setEditingItem(prev => prev ? { ...prev, price: parsed } : prev);
                      } else {
                        setEditingPriceDisplay('');
                        setEditingItem(prev => prev ? prev : null);
                      }
                    } else {
                      setEditingPriceDisplay('');
                      setEditingItem(prev => prev ? prev : null);
                    }
                  }}
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
          onConfirm={(paymentMethod) => {
            // Cập nhật status thành COMPLETED khi xác nhận đã in với hình thức thanh toán
            onUpdateOrderStatus(selectedOrderForInvoice.id, OrderStatus.COMPLETED, paymentMethod);
          }}
        />
      )}
    </div>
  );
};