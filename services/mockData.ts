import { Restaurant, MenuItem, Order, OrderStatus } from '../types';

export const initialRestaurants: Restaurant[] = [
  {
    id: 'rest_001',
    name: 'Phở Gia Truyền 88',
    username: 'admin88',
    password: '123',
    active: true
  },
  {
    id: 'rest_002',
    name: 'Burger Phố',
    username: 'burger',
    password: '123',
    active: true
  }
];

export const initialMenu: MenuItem[] = [
  {
    id: 'menu_1',
    restaurantId: 'rest_001',
    name: 'Phở Bò Tái Nạm',
    description: 'Nước dùng hầm xương ngọt thanh, thịt bò tươi mềm, bánh phở dai ngon.',
    price: 50000,
    category: 'Món Chính',
    imageUrl: 'https://picsum.photos/400/300?random=1',
    available: true
  },
  {
    id: 'menu_2',
    restaurantId: 'rest_001',
    name: 'Quẩy Giòn',
    description: 'Quẩy nóng hổi, giòn tan, ăn kèm phở là hết ý.',
    price: 5000,
    category: 'Ăn Kèm',
    imageUrl: 'https://picsum.photos/400/300?random=2',
    available: true
  },
  {
    id: 'menu_3',
    restaurantId: 'rest_001',
    name: 'Trà Đá',
    description: 'Thức uống giải khát mát lạnh quen thuộc.',
    price: 3000,
    category: 'Đồ Uống',
    imageUrl: 'https://picsum.photos/400/300?random=3',
    available: true
  },
  {
    id: 'menu_4',
    restaurantId: 'rest_002',
    name: 'Burger Bò Phô Mai',
    description: 'Thịt bò nướng lửa hồng, phô mai tan chảy béo ngậy.',
    price: 85000,
    category: 'Burger',
    imageUrl: 'https://picsum.photos/400/300?random=4',
    available: true
  }
];

export const initialOrders: Order[] = [
    {
        id: 'order_1',
        restaurantId: 'rest_001',
        tableNumber: '5',
        items: [
            { menuItemId: 'menu_1', name: 'Phở Bò Tái Nạm', price: 50000, quantity: 2 }
        ],
        totalAmount: 100000,
        status: OrderStatus.SERVED,
        timestamp: Date.now() - 1000000,
        note: 'Không hành'
    }
];