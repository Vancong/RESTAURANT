import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Restaurant, MenuItem, Order, OrderStatus, PaymentMethod, RestaurantStats, StatsPeriod, CartItem } from '../types';
import { Button } from './Button';
import { Invoice } from './Invoice';
import { ToastContainer, ToastNotification } from './Toast';
import { QRTab } from './dashboard/restaurant/QRTab';
import { SettingsTab } from './dashboard/restaurant/SettingsTab';
import { BankTab } from './dashboard/restaurant/BankTab';
import { StaffTab } from './dashboard/restaurant/StaffTab';
import { MenuTab } from './dashboard/restaurant/MenuTab';
import { LayoutDashboard, UtensilsCrossed, QrCode, LogOut, Clock, Trash, X, Users, Edit, CheckCircle, Settings, CreditCard, User, Receipt, AlertCircle, CheckCircle2, XCircle, Timer, Loader2, Menu } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';

interface RestaurantDashboardProps {
  restaurant: Restaurant;
  menu: MenuItem[];
  orders: Order[];
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  onUpdateMenuItem: (id: string, data: Partial<MenuItem>) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, paymentMethod?: PaymentMethod) => void;
  onUpdateOrderItems: (orderId: string, items: CartItem[], note?: string) => Promise<void>;
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
  onUpdateOrderItems,
  onDeleteMenuItem,
  onUpdateRestaurant,
  onLogout,
  onFetchStats
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'qr' | 'stats' | 'staff' | 'bank' | 'settings'>('orders');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrderItems, setEditingOrderItems] = useState<CartItem[]>([]);
  const [editingOrderNote, setEditingOrderNote] = useState<string>('');

  // Notification state
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: number;
  }>>([]);
  // Use refs to track notifications to avoid re-render loops
  const notifiedOrderIdsRef = useRef<Set<string>>(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Stats state
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statsData, setStatsData] = useState<RestaurantStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);


// Helper function để format giá tiền theo định dạng Việt Nam (dấu phẩy ngăn cách)
const formatPrice = (price: number | string): string => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Helper function để format ngày thân thiện: "Hôm nay", "Hôm qua", "Thứ X", hoặc "DD/MM/YYYY"
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const orderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  // So sánh ngày (bỏ qua giờ)
  if (orderDate.getTime() === today.getTime()) {
    return `Hôm nay, ${timeStr}`;
  } else if (orderDate.getTime() === yesterday.getTime()) {
    return `Hôm qua, ${timeStr}`;
  } else {
    // Kiểm tra xem có phải trong tuần này không (7 ngày gần nhất)
    const diffTime = today.getTime() - orderDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays < 7) {
      // Trong tuần này, hiển thị thứ
      const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
      const dayName = dayNames[date.getDay()];
      return `${dayName}, ${timeStr}`;
    } else {
      // Xa hơn, hiển thị ngày đầy đủ
      return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${timeStr}`;
    }
  }
};

// Helper function để format ngày ngắn gọn (chỉ ngày, không có giây)
const formatDateShort = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const orderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  
  if (orderDate.getTime() === today.getTime()) {
    return `Hôm nay, ${timeStr}`;
  } else if (orderDate.getTime() === yesterday.getTime()) {
    return `Hôm qua, ${timeStr}`;
  } else {
    const diffTime = today.getTime() - orderDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays < 7) {
      const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
      const dayName = dayNames[date.getDay()];
      return `${dayName}, ${timeStr}`;
    } else {
      return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${timeStr}`;
    }
  }
};

  // Stats Logic (legacy - for backward compatibility)
  // const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.SERVED);
  // const revenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  // const chartData = completedOrders.map(o => ({
  //     name: `Bàn ${o.tableNumber}`,
  //     amount: o.totalAmount
  // })).slice(-10); // Last 10 orders

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




  // Notification logic
  const addNotification = useCallback((type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const notification: ToastNotification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: Date.now()
    };
    setNotifications(prev => [...prev, notification]);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Audio notification for new orders - "reng reng" sound
  const playNotificationSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio API không được hỗ trợ');
        return;
      }
      
      const audioContext = new AudioContextClass();
      
      // Resume nếu bị suspended (do browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
          console.warn('Không thể resume AudioContext');
        });
      }
      
      const now = audioContext.currentTime;
      
      // Tạo âm thanh "reng reng" với 2 lần lặp lại, mỗi lần có 3 nốt nhạc
      const ringPattern = [
        { start: 0, duration: 0.15, frequencies: [1000, 1200, 1500] },
        { start: 0.2, duration: 0.15, frequencies: [1000, 1200, 1500] },
        { start: 0.5, duration: 0.15, frequencies: [1000, 1200, 1500] },
        { start: 0.7, duration: 0.15, frequencies: [1000, 1200, 1500] }
      ];
      
      ringPattern.forEach((ring) => {
        ring.frequencies.forEach((freq) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Cấu hình âm thanh
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
          
          const startTime = now + ring.start;
          const endTime = startTime + ring.duration;
          
          // Fade in/out nhanh cho mỗi nốt
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
          gainNode.gain.linearRampToValueAtTime(0.15, endTime - 0.02);
          gainNode.gain.linearRampToValueAtTime(0, endTime);
          
          oscillator.start(startTime);
          oscillator.stop(endTime);
        });
      });
    } catch (err) {
      console.warn('Không thể phát âm thanh thông báo:', err);
    }
  }, []);

  // Track orders for notifications
  const previousOrdersRef = useRef<Order[]>([]);
  const isInitializedRef = useRef(false);
  
  useEffect(() => {
    // Khởi tạo lần đầu: nếu chưa có previousOrders và đã có orders, set ngay mà không thông báo
    if (!isInitializedRef.current && orders.length > 0) {
      previousOrdersRef.current = orders;
      // Đánh dấu tất cả orders hiện tại là đã được thông báo để tránh spam khi refresh
      orders.forEach(order => {
        notifiedOrderIdsRef.current.add(order.id);
        if (order.status === OrderStatus.CANCELLED) {
          notifiedOrderIdsRef.current.add(`cancelled-${order.id}`);
        }
        if (order.status === OrderStatus.COMPLETED) {
          notifiedOrderIdsRef.current.add(`completed-${order.id}`);
        }
        if (order.status === OrderStatus.PENDING) {
          const orderAge = Date.now() - order.timestamp;
          const tenMinutes = 10 * 60 * 1000;
          if (orderAge > tenMinutes) {
            notifiedOrderIdsRef.current.add(`long-pending-${order.id}`);
          }
        }
      });
      isInitializedRef.current = true;
      return; // Không thông báo gì khi khởi tạo
    }
    
    // Check for new orders
    const previousOrderIds = new Set(previousOrdersRef.current.map(o => o.id));
    const newOrders = orders.filter(o => !previousOrderIds.has(o.id));
    
    newOrders.forEach(order => {
      if (!notifiedOrderIdsRef.current.has(order.id)) {
        if (order.status === OrderStatus.PENDING) {
          addNotification(
            'info',
            '🔔 Đơn hàng mới',
            `Bàn ${order.tableNumber} - ${order.totalAmount.toLocaleString('vi-VN')}đ${order.customerName ? ` - ${order.customerName}` : ''}`
          );
          playNotificationSound();
          notifiedOrderIdsRef.current.add(order.id);
        } else if (order.status === OrderStatus.CANCELLED) {
          addNotification(
            'error',
            '❌ Đơn hàng bị hủy',
            `Bàn ${order.tableNumber} đã bị hủy${order.customerName ? ` - ${order.customerName}` : ''}`
          );
          notifiedOrderIdsRef.current.add(order.id);
        }
      }
    });

    // Check for order status changes
    previousOrdersRef.current.forEach(prevOrder => {
      const currentOrder = orders.find(o => o.id === prevOrder.id);
      if (currentOrder && currentOrder.status !== prevOrder.status) {
        if (currentOrder.status === OrderStatus.CANCELLED && !notifiedOrderIdsRef.current.has(`cancelled-${currentOrder.id}`)) {
          addNotification(
            'error',
            '❌ Đơn hàng bị hủy',
            `Bàn ${currentOrder.tableNumber} đã bị hủy${currentOrder.customerName ? ` - ${currentOrder.customerName}` : ''}`
          );
          notifiedOrderIdsRef.current.add(`cancelled-${currentOrder.id}`);
        } else if (currentOrder.status === OrderStatus.COMPLETED && prevOrder.status !== OrderStatus.COMPLETED && !notifiedOrderIdsRef.current.has(`completed-${currentOrder.id}`)) {
          addNotification(
            'success',
            '✅ Đơn hàng hoàn thành',
            `Bàn ${currentOrder.tableNumber} đã hoàn thành - ${currentOrder.totalAmount.toLocaleString('vi-VN')}đ`
          );
          notifiedOrderIdsRef.current.add(`completed-${currentOrder.id}`);
        }
      }
    });

    // Check for long pending orders (> 10 minutes)
    const now = Date.now();
    orders.forEach(order => {
      if (order.status === OrderStatus.PENDING) {
        const orderAge = now - order.timestamp;
        const tenMinutes = 10 * 60 * 1000;
        if (orderAge > tenMinutes && !notifiedOrderIdsRef.current.has(`long-pending-${order.id}`)) {
          const minutes = Math.floor(orderAge / 60000);
          addNotification(
            'warning',
            '⏰ Đơn hàng chờ lâu',
            `Bàn ${order.tableNumber} đã chờ ${minutes} phút - Cần xử lý ngay!`
          );
          notifiedOrderIdsRef.current.add(`long-pending-${order.id}`);
        }
      }
    });

    previousOrdersRef.current = orders;
  }, [orders, addNotification, playNotificationSound]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-amber-50/20 flex flex-col md:flex-row relative">
      <ToastContainer notifications={notifications} onClose={removeNotification} />
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(prev => !prev)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white rounded-lg p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`bg-white w-full md:w-72 border-r border-orange-100 flex-shrink-0 shadow-lg fixed md:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 border-b border-orange-100 bg-gradient-to-r from-brand-600 to-brand-700">
          <h2 className="text-2xl font-bold text-white truncate drop-shadow-md">{restaurant.name}</h2>
          <p className="text-xs text-orange-100 mt-1 font-medium">Quản lý nhà hàng</p>
        </div>
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-120px)]">
          <button 
            onClick={() => {
              setActiveTab('orders');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'orders' 
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200 scale-105' 
                : 'text-gray-700 hover:bg-orange-50 hover:shadow-md hover:scale-[1.02]'
            }`}
          >
            <Clock className={`w-5 h-5 mr-3 ${activeTab === 'orders' ? 'text-white' : 'text-brand-600'}`} /> Đơn hàng
          </button>
          <button 
            onClick={() => {
              setActiveTab('menu');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'menu' 
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200 scale-105' 
                : 'text-gray-700 hover:bg-orange-50 hover:shadow-md hover:scale-102'
            }`}
          >
            <UtensilsCrossed className={`w-5 h-5 mr-3 ${activeTab === 'menu' ? 'text-white' : 'text-brand-600'}`} /> Thực đơn
          </button>
          <button 
            onClick={() => {
              setActiveTab('stats');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'stats' 
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200 scale-105' 
                : 'text-gray-700 hover:bg-orange-50 hover:shadow-md hover:scale-102'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 mr-3 ${activeTab === 'stats' ? 'text-white' : 'text-brand-600'}`} /> Thống kê
          </button>
          <button 
            onClick={() => {
              setActiveTab('qr');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'qr' 
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200 scale-105' 
                : 'text-gray-700 hover:bg-orange-50 hover:shadow-md hover:scale-102'
            }`}
          >
            <QrCode className={`w-5 h-5 mr-3 ${activeTab === 'qr' ? 'text-white' : 'text-brand-600'}`} /> Mã QR
          </button>
          <button 
            onClick={() => {
              setActiveTab('staff');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'staff' 
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200 scale-105' 
                : 'text-gray-700 hover:bg-orange-50 hover:shadow-md hover:scale-102'
            }`}
          >
            <Users className={`w-5 h-5 mr-3 ${activeTab === 'staff' ? 'text-white' : 'text-brand-600'}`} /> Nhân viên
          </button>
            <button
            onClick={() => {
              setActiveTab('bank');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'bank' 
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200 scale-105' 
                : 'text-gray-700 hover:bg-orange-50 hover:shadow-md hover:scale-102'
            }`}
          >
            <CreditCard className={`w-5 h-5 mr-3 ${activeTab === 'bank' ? 'text-white' : 'text-brand-600'}`} /> Ngân hàng
            </button>
            <button
            onClick={() => {
              setActiveTab('settings');
              setIsMobileMenuOpen(false);
            }}
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
              onClick={() => {
                onLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:shadow-md rounded-xl transition-all duration-200"
            >
              <LogOut className="w-5 h-5 mr-3" /> Đăng xuất
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-16 md:pt-4">
        
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
                          <span>{formatDate(order.timestamp)}</span>
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
                    {/* Nút sửa đơn - chỉ hiển thị khi đơn chưa hoàn thành hoặc hủy */}
                    {(order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED) && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => {
                          setEditingOrderId(order.id);
                          setEditingOrderItems([...order.items]);
                          setEditingOrderNote(order.note || '');
                        }}
                        className="shadow-md"
                      >
                        <Edit className="w-4 h-4 mr-1.5" />
                        Sửa đơn
                      </Button>
                    )}
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
                                <span className="font-semibold text-gray-700">{formatDateShort(order.timestamp)}</span>
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
                                <span className="font-semibold text-gray-700">{formatDateShort(order.timestamp)}</span>
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

        {/* Edit Order Modal */}
        {editingOrderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Edit className="w-6 h-6 mr-2 text-brand-600" />
                  Sửa đơn hàng
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Món đã đặt</label>
                  <div className="space-y-2">
                    {editingOrderItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.price.toLocaleString('vi-VN')}đ/đơn vị</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                const newItems = [...editingOrderItems];
                                if (newItems[idx].quantity > 1) {
                                  newItems[idx].quantity -= 1;
                                  setEditingOrderItems(newItems);
                                } else {
                                  newItems.splice(idx, 1);
                                  setEditingOrderItems(newItems);
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
                            >
                              −
                            </button>
                            <span className="w-12 text-center font-bold">{item.quantity}</span>
                            <button
                              onClick={() => {
                                const newItems = [...editingOrderItems];
                                newItems[idx].quantity += 1;
                                setEditingOrderItems(newItems);
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg font-bold text-brand-600 hover:bg-gray-50"
                            >
                              +
                            </button>
                            <button
                              onClick={() => {
                                const newItems = editingOrderItems.filter((_, i) => i !== idx);
                                setEditingOrderItems(newItems);
                              }}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <Trash className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thêm món mới</label>
                    <select
                      onChange={(e) => {
                        const menuItemId = e.target.value;
                        if (menuItemId && menuItemId !== '') {
                          const menuItem = menu.find(m => m.id === menuItemId);
                          if (menuItem && !editingOrderItems.find(i => i.menuItemId === menuItemId)) {
                            setEditingOrderItems([...editingOrderItems, {
                              menuItemId: menuItem.id,
                              name: menuItem.name,
                              price: menuItem.price,
                              quantity: 1
                            }]);
                            e.target.value = ''; // Reset select
                          }
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      defaultValue=""
                    >
                      <option value="">-- Chọn món để thêm --</option>
                      {menu
                        .filter(m => m.available && !editingOrderItems.find(i => i.menuItemId === m.id))
                        .map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} - {item.price.toLocaleString('vi-VN')}đ
                          </option>
                        ))}
                    </select>
                    {menu.filter(m => m.available && !editingOrderItems.find(i => i.menuItemId === m.id)).length === 0 && (
                      <p className="mt-2 text-sm text-gray-500">Đã thêm tất cả món có sẵn</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                  <textarea
                    value={editingOrderNote}
                    onChange={(e) => setEditingOrderNote(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    rows={3}
                    placeholder="Ghi chú cho đơn hàng..."
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">Tổng tiền:</span>
                    <span className="text-2xl font-bold text-brand-600">
                      {editingOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingOrderId(null);
                    setEditingOrderItems([]);
                    setEditingOrderNote('');
                  }}
                >
                  Hủy
                </Button>
                <Button
                  onClick={async () => {
                    if (editingOrderItems.length === 0) {
                      alert('Đơn hàng phải có ít nhất 1 món');
                      return;
                    }
                    try {
                      await onUpdateOrderItems(editingOrderId, editingOrderItems, editingOrderNote);
                      setEditingOrderId(null);
                      setEditingOrderItems([]);
                      setEditingOrderNote('');
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Không thể cập nhật đơn hàng');
                    }
                  }}
                  disabled={editingOrderItems.length === 0}
                >
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MENU TAB */}
        {activeTab === 'menu' && (
          <MenuTab
            restaurant={restaurant}
            menu={menu}
            onAddMenuItem={onAddMenuItem}
            onUpdateMenuItem={onUpdateMenuItem}
            onDeleteMenuItem={onDeleteMenuItem}
            addNotification={addNotification}
          />
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
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
                      <input
                        type="date"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
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
                <Button
                  onClick={loadStats}
                  disabled={isLoadingStats || (statsPeriod === 'custom' && (!customStartDate || !customEndDate))}
                  className="px-6 py-2"
                >
                  {isLoadingStats ? 'Đang tải...' : 'Xem thống kê'}
                </Button>
              </div>
            </div>

            {/* Stats Content */}
            {isLoadingStats ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              </div>
            ) : statsError ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                <p>{statsError}</p>
              </div>
            ) : !statsData ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-500">
                <p>Chọn kỳ thống kê và nhấn "Xem thống kê" để xem dữ liệu</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <p className="text-sm opacity-90 mb-1">Tổng doanh thu</p>
                    <p className="text-3xl font-bold">{formatPrice(statsData.overview.totalRevenue)}₫</p>
                    <p className="text-sm mt-2 opacity-75">{statsData.overview.totalOrders} đơn hàng</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <p className="text-sm opacity-90 mb-1">Giá trị trung bình</p>
                    <p className="text-3xl font-bold">{formatPrice(statsData.overview.averageOrderValue)}₫</p>
                    <p className="text-sm mt-2 opacity-75">Trên {statsData.overview.totalOrders} đơn</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                    <p className="text-sm opacity-90 mb-1">Tổng số bàn</p>
                    <p className="text-3xl font-bold">{statsData.revenueByTable.length}</p>
                    <p className="text-sm mt-2 opacity-75">Bàn đã phục vụ</p>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold mb-4">Doanh thu theo giờ</h3>
                    <LineChart width={400} height={200} data={statsData.revenueByHour}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `${formatPrice(value)}₫`} />
                      <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} />
                    </LineChart>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold mb-4">Số đơn hàng theo giờ</h3>
                    <BarChart width={400} height={200} data={statsData.revenueByHour}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#f97316" />
                    </BarChart>
                  </div>
                </div>

                {/* Top Items */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold mb-4">Top món bán chạy</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Món</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Số lượng</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Doanh thu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData.topMenuItems.map((item, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatPrice(item.revenue)}₫</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Tables */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold mb-4">Top bàn doanh thu cao</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bàn</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Số đơn</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Doanh thu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData.revenueByTable.map((table, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">Bàn {table.tableNumber}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{table.orders}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatPrice(table.revenue)}₫</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold mb-4">Đơn hàng gần đây</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Thời gian</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bàn</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Tổng tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData.largestOrders.map((order, index) => {
                          const orderDate = typeof order.createdAt === 'string' 
                            ? new Date(order.createdAt).getTime() 
                            : order.createdAt instanceof Date 
                              ? order.createdAt.getTime() 
                              : 0;
                          return (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{formatDateShort(orderDate)}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">Bàn {order.tableNumber}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Hoàn thành</span>
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatPrice(order.totalAmount)}₫</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QR TAB */}
        {activeTab === 'qr' && (
          <QRTab restaurant={restaurant} addNotification={addNotification} />
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <SettingsTab
            restaurant={restaurant}
            onUpdateRestaurant={onUpdateRestaurant}
            addNotification={addNotification}
          />
        )}

        {/* BANK TAB */}
        {activeTab === 'bank' && (
          <BankTab
            restaurant={restaurant}
            onUpdateRestaurant={onUpdateRestaurant}
            addNotification={addNotification}
          />
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
          <StaffTab addNotification={addNotification} />
        )}

      </main>

      {/* Invoice Modal */}
      {selectedOrderForInvoice && (
        <Invoice
          order={selectedOrderForInvoice}
          restaurant={restaurant}
          onClose={() => setSelectedOrderForInvoice(null)}
          onConfirm={(paymentMethod) => {
            onUpdateOrderStatus(selectedOrderForInvoice.id, OrderStatus.COMPLETED, paymentMethod);
          }}
        />
      )}
    </div>
  );
};
            