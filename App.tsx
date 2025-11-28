import React, { useState, useEffect } from 'react';
import { initialMenu, initialOrders } from './services/mockData';
import { CartItem, MenuItem, Order, OrderStatus, Restaurant, Role, NewRestaurantPayload, RestaurantStatus } from './types';
import { Login } from './components/Login';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { RestaurantDashboard } from './components/RestaurantDashboard';
import { CustomerView } from './components/CustomerView';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'qr_food_order_token';

const App: React.FC = () => {
  // Central State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenu);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  
  // Session State
  const [role, setRole] = useState<Role>(Role.GUEST);
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string | null>(null);
  const [customerTable, setCustomerTable] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string>('');

  // "Routing" based on Hash for the demo
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
        }
      } else {
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
  }, []);

  // Load restaurants from backend
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/restaurants`);
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
          active: r.active
        }));
        setRestaurants(mapped);
      } catch (e) {
        console.error('Không thể tải danh sách nhà hàng từ server', e);
      }
    };

    fetchRestaurants();
  }, []);

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

  const addMenuItem = (data: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...data,
      id: `menu_${Date.now()}`
    };
    setMenuItems([...menuItems, newItem]);
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(menuItems.filter(m => m.id !== id));
  }

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const placeOrder = (items: CartItem[], note: string) => {
    if (!currentRestaurantId || !customerTable) return;
    
    const newOrder: Order = {
      id: `order_${Date.now()}`,
      restaurantId: currentRestaurantId,
      tableNumber: customerTable,
      items,
      totalAmount: items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
      status: OrderStatus.PENDING,
      timestamp: Date.now(),
      note
    };
    setOrders([...orders, newOrder]);
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

  if (role === Role.SUPER_ADMIN) {
    return (
      <SuperAdminDashboard 
        restaurants={restaurants}
        onAddRestaurant={addRestaurant}
        onToggleActive={toggleRestaurantStatus}
        onLogout={handleLogout}
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
        onUpdateOrderStatus={updateOrderStatus}
        onDeleteMenuItem={deleteMenuItem}
        onLogout={handleLogout}
      />
    );
  }

  return <Login onLogin={handleLogin} error={loginError} />;
};

export default App;