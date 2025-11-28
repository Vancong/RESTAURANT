export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RESTAURANT_ADMIN = 'RESTAURANT_ADMIN',
  CUSTOMER = 'CUSTOMER',
  GUEST = 'GUEST' // Not logged in yet
}

export interface Restaurant {
  id: string;
  name: string;
  username: string; // Used for login
  password: string; // Used for login (simplified for demo)
  active: boolean;
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