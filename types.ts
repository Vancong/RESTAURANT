export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RESTAURANT_ADMIN = 'RESTAURANT_ADMIN',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
  GUEST = 'GUEST' // Not logged in yet
}

export enum RestaurantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface Restaurant {
  id: string;
  name: string;
  username: string; // Used for login
  ownerName: string;
  email: string;
  address: string;
  phone: string;
  status: RestaurantStatus;
  active: boolean;
  bankAccount?: string; // Số tài khoản ngân hàng
  bankName?: string; // Tên ngân hàng
}

export interface NewRestaurantPayload {
  name: string;
  username: string;
  password: string;
  ownerName: string;
  email: string;
  address: string;
  phone: string;
  status: RestaurantStatus;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
}

export enum OrderStatus {
  PENDING = 'PENDING', // Mới đặt
  CONFIRMED = 'CONFIRMED', // Bếp đã nhận
  SERVED = 'SERVED', // Đã ra món
  COMPLETED = 'COMPLETED', // Đã thanh toán
  CANCELLED = 'CANCELLED'
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  tableNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  timestamp: number;
  note?: string;
  customerName?: string; // Tên khách hàng
  confirmedByName?: string; // Tên nhân viên đã xác nhận đơn
}

export interface CartItem extends OrderItem {}

// Mock initial data structure
export interface AppState {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  currentUser: {
    role: Role;
    restaurantId?: string; // If role is RESTAURANT_ADMIN
    id?: string; // User ID
  } | null;
}

// Statistics interfaces
export interface OverviewStats {
  totalActive: number;
  totalInactive: number;
  top5Restaurants: Array<{
    id: string;
    name: string;
    revenue: number;
  }>;
}

export interface RestaurantRevenueStats {
  restaurantId: string;
  restaurantName: string;
  totalRevenue: number;
  totalOrders: number;
  chartData: Array<{
    date: string;
    revenue: number;
  }>;
}