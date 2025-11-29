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

export enum PaymentMethod {
  CASH = 'CASH', // Tiền mặt
  BANK_TRANSFER = 'BANK_TRANSFER' // Chuyển khoản
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
  paymentMethod?: PaymentMethod; // Hình thức thanh toán
  confirmedByName?: string; // Tên nhân viên đã xác nhận đơn
  updatedByName?: string; // Tên người cập nhật đơn hàng (bất kỳ trạng thái nào)
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

export type StatsPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface RestaurantStats {
  period: {
    startDate: string;
    endDate: string;
  };
  previousPeriod: {
    startDate: string;
    endDate: string;
  };
  overview: {
    totalRevenue: number;
    previousRevenue: number;
    revenueChange: number | null; // null if no previous data to compare
    totalOrders: number;
    previousOrders: number;
    ordersChange: number | null; // null if no previous data to compare
    averageOrderValue: number;
    previousAverageOrderValue: number;
    totalCustomers: number;
    cancellationRate: number;
    averageProcessingTime: number;
    topSellingItem: {
      name: string;
      quantity: number;
    } | null;
    peakHour: number;
  };
  revenueByDate: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  revenueByHour: Array<{
    hour: number;
    revenue: number;
    orders: number;
  }>;
  topMenuItems: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  revenueByCategory: Array<{
    category: string;
    revenue: number;
    quantity: number;
  }>;
  revenueByTable: Array<{
    tableNumber: string;
    revenue: number;
    orders: number;
  }>;
  ordersByStatus: {
    pending: number;
    confirmed: number;
    served: number;
    completed: number;
    cancelled: number;
  };
  largestOrders: Array<{
    orderId: string;
    tableNumber: string;
    totalAmount: number;
    customerName?: string;
    createdAt: Date | string;
  }>;
}