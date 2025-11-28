import React, { useState, useEffect } from 'react';
import { initialMenu, initialOrders, initialRestaurants } from './services/mockData';
import { AppState, CartItem, MenuItem, Order, OrderStatus, Restaurant, Role } from './types';
import { Login } from './components/Login';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { RestaurantDashboard } from './components/RestaurantDashboard';
import { CustomerView } from './components/CustomerView';

const App: React.FC = () => {
  // Central State (Simulating a DB)
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
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

  // Actions
  const handleLogin = (u: string, p: string) => {
    if (u === 'admin' && p === 'admin') {
      setRole(Role.SUPER_ADMIN);
      setLoginError('');
      return;
    }
    const rest = restaurants.find(r => r.username === u && r.password === p);
    if (rest) {
      if (!rest.active) {
        setLoginError('Tài khoản nhà hàng đã bị khóa.');
        return;
      }
      setRole(Role.RESTAURANT_ADMIN);
      setCurrentRestaurantId(rest.id);
      setLoginError('');
    } else {
      setLoginError('Sai tên đăng nhập hoặc mật khẩu.');
    }
  };

  const handleLogout = () => {
    setRole(Role.GUEST);
    setCurrentRestaurantId(null);
    setLoginError('');
    window.location.hash = '';
  };

  const addRestaurant = (data: Omit<Restaurant, 'id'>) => {
    const newRest: Restaurant = {
      ...data,
      id: `rest_${Date.now()}`
    };
    setRestaurants([...restaurants, newRest]);
  };

  const toggleRestaurantStatus = (id: string) => {
    setRestaurants(restaurants.map(r => r.id === id ? { ...r, active: !r.active } : r));
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