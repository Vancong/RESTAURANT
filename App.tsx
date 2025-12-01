import React, { useState, useEffect } from 'react';
import { initialOrders } from './services/mockData';
import { CartItem, MenuItem, Order, OrderStatus, PaymentMethod, Restaurant, Role, NewRestaurantPayload, RestaurantStatus, OverviewStats, RestaurantRevenueStats, RestaurantStats, StatsPeriod } from './types';
import { Login } from './components/Login';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { RestaurantDashboard } from './components/RestaurantDashboard';
import { CustomerView } from './components/CustomerView';
import { StaffDashboard } from './components/StaffDashboard';
import { ResetPassword } from './components/ResetPassword';

// Trong development mode, luôn dùng localhost. Chỉ dùng VITE_API_BASE_URL khi production
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:5000' 
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
const AUTH_TOKEN_KEY = 'qr_food_order_token';

const App: React.FC = () => {
  // Central State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  
  // Session State
  const [role, setRole] = useState<Role>(Role.GUEST);
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string | null>(null);
  const [customerTable, setCustomerTable] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string>('');

  // Khôi phục trạng thái đăng nhập từ JWT trong localStorage (nếu có)
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;

    try {
      const [, payloadBase64] = token.split('.');
      if (!payloadBase64) throw new Error('Invalid token');

      const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = atob(normalized);
      const payload: { role?: string; restaurantId?: string | null } = JSON.parse(payloadJson);

      if (payload.role === Role.SUPER_ADMIN) {
        setRole(Role.SUPER_ADMIN);
        setCurrentRestaurantId(null);
      } else if (payload.role === Role.RESTAURANT_ADMIN && payload.restaurantId) {
        setRole(Role.RESTAURANT_ADMIN);
        setCurrentRestaurantId(payload.restaurantId);
      } else if (payload.role === Role.STAFF && payload.restaurantId) {
        setRole(Role.STAFF);
        setCurrentRestaurantId(payload.restaurantId);
      } else {
        // Token không hợp lệ cho app này
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, []);

  // "Routing" based on Hash for the demo
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/order')) {
        const params = new URLSearchParams(hash.split('?')[1]);
        const rId = params.get('r');
        const tId = params.get('t');
        if (rId && tId) {
          setCurrentRestaurantId(rId);
          setCustomerTable(tId);
          setRole(Role.CUSTOMER);
          setShowResetPassword(false);
        }
      } else if (hash === '#/reset-password') {
        setShowResetPassword(true);
        setRole(Role.GUEST);
        setCurrentRestaurantId(null);
      } else {
        setShowResetPassword(false);
        // Default to login if not customer flow
        if (role === Role.CUSTOMER) {
             setRole(Role.GUEST);
             setCurrentRestaurantId(null);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check on load

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [role]);

  // Load restaurants from backend
  const fetchRestaurants = async (search?: string, status?: string, sortBy?: string, sortOrder?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status && status !== 'ALL') params.append('status', status);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      const url = `${API_BASE_URL}/api/restaurants${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data: {
        _id: string;
        name: string;
        username: string;
        ownerName: string;
        email: string;
        address: string;
        phone: string;
        status: RestaurantStatus;
        active: boolean;
        bankAccount?: string;
        bankName?: string;
      }[] = await res.json();
      const mapped: Restaurant[] = data.map(r => ({
        id: r._id,
        name: r.name,
        username: r.username,
        ownerName: r.ownerName,
        email: r.email,
        address: r.address,
        phone: r.phone,
        status: r.status,
        active: r.active,
        bankAccount: r.bankAccount,
        bankName: r.bankName
      }));
      setRestaurants(mapped);
    } catch (e) {
      console.error('Không thể tải danh sách nhà hàng từ server', e);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Load menu items when restaurant context changes (restaurant admin hoặc customer)
  useEffect(() => {
    if (!currentRestaurantId) {
      setMenuItems([]);
      return;
    }

    const fetchMenu = async () => {
      try {
        // Admin xem tất cả món (kể cả món hết), khách hàng chỉ thấy món available
        const includeUnavailable = role === Role.RESTAURANT_ADMIN || role === Role.STAFF || role === Role.SUPER_ADMIN;
        const url = `${API_BASE_URL}/api/menu?restaurantId=${currentRestaurantId}${includeUnavailable ? '&includeUnavailable=true' : ''}`;
        const res = await fetch(url);
        if (!res.ok) {
          setMenuItems([]);
          return;
        }
        const data: {
          _id: string;
          restaurantId: string;
          name: string;
          description: string;
          price: number;
          category: string;
          imageUrl: string;
          available: boolean;
        }[] = await res.json();
        const mapped: MenuItem[] = data.map(m => ({
          id: m._id,
          restaurantId: m.restaurantId,
          name: m.name,
          description: m.description,
          price: m.price,
          category: m.category,
          imageUrl: m.imageUrl,
          available: m.available
        }));
        setMenuItems(mapped);
      } catch (err) {
        console.error('Không thể tải menu từ server', err);
        setMenuItems([]);
      }
    };

    fetchMenu();
  }, [currentRestaurantId]);

  // Fetch orders for customer
  useEffect(() => {
    if (role !== Role.CUSTOMER || !currentRestaurantId || !customerTable) {
      return;
    }

    const fetchCustomerOrders = async () => {
      try {
        const url = `${API_BASE_URL}/api/orders?restaurantId=${currentRestaurantId}&tableNumber=${customerTable}`;
        const res = await fetch(url);
        if (!res.ok) return;
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
          customerName: o.customerName
        }));
        setOrders(prev => {
          // Merge với orders hiện tại, ưu tiên orders từ API cho customer
          const otherOrders = prev.filter(o => !(o.restaurantId === currentRestaurantId && o.tableNumber === customerTable));
          return [...otherOrders, ...mapped];
        });
      } catch (err) {
        console.error('Không thể tải đơn hàng từ server', err);
      }
    };

    fetchCustomerOrders();
    // Refresh orders mỗi 3 giây cho customer
    const interval = setInterval(fetchCustomerOrders, 3000);
    return () => clearInterval(interval);
  }, [role, currentRestaurantId, customerTable]);

  // Fetch orders for restaurant admin and staff
  useEffect(() => {
    if ((role !== Role.RESTAURANT_ADMIN && role !== Role.STAFF) || !currentRestaurantId) {
        return;
      }

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/staff/orders`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) return;
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
          paymentMethod: o.paymentMethod as PaymentMethod | undefined,
          confirmedByName: o.confirmedByName,
          updatedByName: o.updatedByName
        }));
        setOrders(mapped);
      } catch (e) {
        console.error('Không thể tải đơn hàng', e);
      }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Refresh mỗi 5 giây
    return () => clearInterval(interval);
  }, [role, currentRestaurantId]);

  // Actions
  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        throw new Error(errBody?.message || 'Sai tên đăng nhập hoặc mật khẩu.');
      }

      const data: {
        token: string;
        user: {
          role: Role;
          restaurantId: string | null;
        };
      } = await response.json();

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);

      if (data.user.role === Role.SUPER_ADMIN) {
        setRole(Role.SUPER_ADMIN);
        setCurrentRestaurantId(null);
      } else if (data.user.role === Role.RESTAURANT_ADMIN && data.user.restaurantId) {
      setRole(Role.RESTAURANT_ADMIN);
        setCurrentRestaurantId(data.user.restaurantId);
      } else if (data.user.role === Role.STAFF && data.user.restaurantId) {
        setRole(Role.STAFF);
        setCurrentRestaurantId(data.user.restaurantId);
      } else {
        throw new Error('Không xác định được quyền truy cập.');
      }

      setLoginError('');
    } catch (error) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setRole(Role.GUEST);
      setCurrentRestaurantId(null);
      setLoginError(error instanceof Error ? error.message : 'Không thể đăng nhập lúc này.');
    }
  };

  const handleLogout = () => {
    setRole(Role.GUEST);
    setCurrentRestaurantId(null);
    setLoginError('');
    localStorage.removeItem(AUTH_TOKEN_KEY);
    window.location.hash = '';
  };

  const addRestaurant = async (data: NewRestaurantPayload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          username: data.username,
          password: data.password,
          ownerName: data.ownerName,
          email: data.email,
          address: data.address,
          phone: data.phone,
          status: data.status
        })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Không thể tạo nhà hàng');
      }

      const created: {
        _id: string;
        name: string;
        username: string;
        ownerName: string;
        email: string;
        address: string;
        phone: string;
        status: RestaurantStatus;
        active: boolean;
      } = await res.json();
      const mapped: Restaurant = {
        id: created._id,
        name: created.name,
        username: created.username,
        ownerName: created.ownerName,
        email: created.email,
        address: created.address,
        phone: created.phone,
        status: created.status,
        active: created.active
      };

      setRestaurants(prev => [mapped, ...prev]);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Không thể tạo nhà hàng');
    }
  };

  const toggleRestaurantStatus = async (id: string) => {
    try {
      const current = restaurants.find(r => r.id === id);
      if (!current) return;
      const nextStatus = !current.active ? RestaurantStatus.ACTIVE : RestaurantStatus.INACTIVE;
      const res = await fetch(`${API_BASE_URL}/api/restaurants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !current.active, status: nextStatus })
      });
      if (!res.ok) throw new Error('Không thể cập nhật trạng thái nhà hàng');
      const updated: {
        _id: string;
        name: string;
        username: string;
        ownerName: string;
        email: string;
        address: string;
        phone: string;
        status: RestaurantStatus;
        active: boolean;
      } = await res.json();
      setRestaurants(prev =>
        prev.map(r =>
          r.id === id
            ? {
                ...r,
                name: updated.name,
                username: updated.username,
                ownerName: updated.ownerName,
                email: updated.email,
                address: updated.address,
                phone: updated.phone,
                status: updated.status,
                active: updated.active
              }
            : r
        )
      );
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Không thể cập nhật trạng thái nhà hàng');
    }
  };

  const addMenuItem = async (data: Omit<MenuItem, 'id'>) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error('Vui lòng đăng nhập lại.');

      const res = await fetch(`${API_BASE_URL}/api/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category,
          imageUrl: data.imageUrl,
          available: data.available
        })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể thêm món');
      }

      const created: {
        _id: string;
        restaurantId: string;
        name: string;
        description: string;
        price: number;
        category: string;
        imageUrl: string;
        available: boolean;
      } = body;

      const mapped: MenuItem = {
        id: created._id,
        restaurantId: created.restaurantId,
        name: created.name,
        description: created.description,
        price: created.price,
        category: created.category,
        imageUrl: created.imageUrl,
        available: created.available
      };

      setMenuItems(prev => [mapped, ...prev]);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error('Vui lòng đăng nhập lại.');
      const res = await fetch(`${API_BASE_URL}/api/menu/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Không thể xóa món');
      }
      setMenuItems(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const updateMenuItem = async (id: string, data: Partial<MenuItem>) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error('Vui lòng đăng nhập lại.');
      const res = await fetch(`${API_BASE_URL}/api/menu/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể cập nhật món');
      }
      const updated: MenuItem = {
        id: body._id,
        restaurantId: body.restaurantId,
        name: body.name,
        description: body.description,
        price: body.price,
        category: body.category,
        imageUrl: body.imageUrl,
        available: body.available
      };
      setMenuItems(prev =>
        prev.map(m => (m.id === id ? updated : m))
      );
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, paymentMethod?: PaymentMethod) => {
    // Cập nhật local state ngay để UI responsive
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status, paymentMethod } : o
    ));
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }
      const body: { status: OrderStatus; paymentMethod?: PaymentMethod } = { status };
      if (paymentMethod) {
        body.paymentMethod = paymentMethod;
      }
      const res = await fetch(`${API_BASE_URL}/api/staff/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Không thể cập nhật đơn hàng');
      }
      const updated = await res.json();
      setOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { 
              ...o, 
              status: updated.status as OrderStatus,
              paymentMethod: updated.paymentMethod as PaymentMethod | undefined,
              confirmedByName: updated.confirmedByName,
              updatedByName: updated.updatedByName
            } 
          : o
      ));
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Không thể cập nhật đơn hàng');
    }
  };

  const updateOrderItems = async (orderId: string, items: CartItem[], note?: string) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }
      const body: { items: CartItem[]; note?: string } = { items };
      if (note !== undefined) {
        body.note = note;
      }
      const res = await fetch(`${API_BASE_URL}/api/staff/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Không thể cập nhật đơn hàng');
      }
      const updated = await res.json();
      const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { 
              ...o, 
              items: updated.items,
              totalAmount,
              note: updated.note,
              updatedByName: updated.updatedByName
            } 
          : o
      ));
      return updated;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const placeOrder = async (items: CartItem[], note: string, customerName: string) => {
    if (!currentRestaurantId || !customerTable) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
      restaurantId: currentRestaurantId,
      tableNumber: customerTable,
      items,
          note,
          customerName
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const errorMessage = body?.message || 'Không thể đặt món';
        alert(errorMessage);
        throw new Error(errorMessage);
      }
      const created = await res.json();
      const newOrder: Order = {
        id: created._id,
        restaurantId: created.restaurantId,
        tableNumber: created.tableNumber,
        items: created.items,
        totalAmount: created.totalAmount,
        status: created.status as OrderStatus,
        timestamp: new Date(created.createdAt).getTime(),
        note: created.note,
        customerName: created.customerName
      };
      setOrders(prev => [newOrder, ...prev]);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Render Logic
  if (role === Role.CUSTOMER && currentRestaurantId) {
    const rest = restaurants.find(r => r.id === currentRestaurantId);
    if (!rest || !rest.active) return <div className="p-8 text-center text-red-600">Nhà hàng không tồn tại hoặc tạm ngưng phục vụ.</div>;
    
    const relevantMenu = menuItems.filter(m => m.restaurantId === currentRestaurantId);
    const existingOrders = orders.filter(o => o.restaurantId === currentRestaurantId && o.tableNumber === customerTable);

    return (
      <CustomerView 
        restaurant={rest}
        tableNumber={customerTable || 'Unknown'}
        menu={relevantMenu}
        onPlaceOrder={placeOrder}
        existingOrders={existingOrders}
      />
    );
  }

  const handleRequestPasswordReset = async (email: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể gửi email đặt lại mật khẩu');
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const resetRestaurantPassword = async (restaurantId: string, newPassword: string) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại để thao tác.');
      }
      const res = await fetch(`${API_BASE_URL}/api/restaurants/${restaurantId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể đặt lại mật khẩu');
      }
      return body;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const updateRestaurant = async (data: Partial<Restaurant> & { emailChangeOtp?: string; bankChangeOtp?: string }) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại.');
      }
      const res = await fetch(`${API_BASE_URL}/api/restaurants/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: data.name,
          ownerName: data.ownerName,
          email: data.email,
          address: data.address,
          phone: data.phone,
          emailChangeOtp: data.emailChangeOtp,
          bankAccount: data.bankAccount,
          bankName: data.bankName,
          bankChangeOtp: data.bankChangeOtp
        })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể cập nhật thông tin nhà hàng');
      }
      const updated: {
        _id: string;
        name: string;
        username: string;
        ownerName: string;
        email: string;
        address: string;
        phone: string;
        status: RestaurantStatus;
        active: boolean;
        bankAccount?: string;
        bankName?: string;
      } = body;
      const mapped: Restaurant = {
        id: updated._id,
        name: updated.name,
        username: updated.username,
        ownerName: updated.ownerName,
        email: updated.email,
        address: updated.address,
        phone: updated.phone,
        status: updated.status,
        active: updated.active,
        bankAccount: updated.bankAccount,
        bankName: updated.bankName
      };
      setRestaurants(prev =>
        prev.map(r => (r.id === mapped.id ? mapped : r))
      );
      return mapped;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
  const updateRestaurantBySuperAdmin = async (restaurantId: string, data: Partial<Restaurant>) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại.');
      }
      const res = await fetch(`${API_BASE_URL}/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: data.name,
          ownerName: data.ownerName,
          email: data.email,
          address: data.address,
          phone: data.phone,
          status: data.status,
          bankAccount: data.bankAccount,
          bankName: data.bankName
        })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể cập nhật thông tin nhà hàng');
      }
      const updated: {
        _id: string;
        name: string;
        username: string;
        ownerName: string;
        email: string;
        address: string;
        phone: string;
        status: RestaurantStatus;
        active: boolean;
        bankAccount?: string;
        bankName?: string;
      } = body;
      const mapped: Restaurant = {
        id: updated._id,
        name: updated.name,
        username: updated.username,
        ownerName: updated.ownerName,
        email: updated.email,
        address: updated.address,
        phone: updated.phone,
        status: updated.status,
        active: updated.active,
        bankAccount: updated.bankAccount,
        bankName: updated.bankName
      };
      setRestaurants(prev =>
        prev.map(r => (r.id === mapped.id ? mapped : r))
      );
      return mapped;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const fetchOverviewStats = async (): Promise<OverviewStats> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/stats/overview`);
      if (!res.ok) {
        throw new Error('Không thể tải thống kê tổng quan');
      }
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const fetchRestaurantStats = async (restaurantId: string, startDate?: string, endDate?: string): Promise<RestaurantRevenueStats> => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `${API_BASE_URL}/api/restaurants/${restaurantId}/stats/revenue${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Không thể tải thống kê doanh thu');
      }
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const fetchMyRestaurantStats = async (period: StatsPeriod, startDate?: string, endDate?: string): Promise<RestaurantStats> => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }

      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `${API_BASE_URL}/api/restaurants/me/stats?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Không thể tải thống kê');
      }
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  if (role === Role.SUPER_ADMIN) {
    return (
      <SuperAdminDashboard 
        restaurants={restaurants}
        onAddRestaurant={addRestaurant}
        onToggleActive={toggleRestaurantStatus}
        onResetRestaurantPassword={resetRestaurantPassword}
        onUpdateRestaurant={updateRestaurantBySuperAdmin}
        onLogout={handleLogout}
        onFetchRestaurants={fetchRestaurants}
        onFetchOverviewStats={fetchOverviewStats}
        onFetchRestaurantStats={fetchRestaurantStats}
      />
    );
  }

  if (role === Role.RESTAURANT_ADMIN && currentRestaurantId) {
    const rest = restaurants.find(r => r.id === currentRestaurantId);
    if (!rest) return <div>Lỗi dữ liệu</div>;

    const myMenu = menuItems.filter(m => m.restaurantId === currentRestaurantId);
    const myOrders = orders.filter(o => o.restaurantId === currentRestaurantId);

    return (
      <RestaurantDashboard 
        restaurant={rest}
        menu={myMenu}
        orders={myOrders}
        onAddMenuItem={addMenuItem}
        onUpdateMenuItem={updateMenuItem}
        onUpdateOrderStatus={updateOrderStatus}
        onUpdateOrderItems={updateOrderItems}
        onDeleteMenuItem={deleteMenuItem}
        onUpdateRestaurant={updateRestaurant}
        onLogout={handleLogout}
        onFetchStats={fetchMyRestaurantStats}
      />
    );
  }

  if (role === Role.STAFF && currentRestaurantId) {
    const rest = restaurants.find(r => r.id === currentRestaurantId);
    if (!rest) return <div>Lỗi dữ liệu</div>;

    return (
      <StaffDashboard
        restaurantId={currentRestaurantId}
        restaurantName={rest.name}
        onLogout={handleLogout}
      />
    );
  }

  if (showResetPassword) {
    return (
      <ResetPassword
        onSuccess={() => {
          setShowResetPassword(false);
          window.location.hash = '';
          setLoginError('');
        }}
        onBack={() => {
          setShowResetPassword(false);
          window.location.hash = '';
        }}
      />
    );
  }

  return <Login onLogin={handleLogin} error={loginError} onRequestPasswordReset={handleRequestPasswordReset} />;
};

export default App;