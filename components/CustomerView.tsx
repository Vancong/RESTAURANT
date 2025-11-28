import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, Restaurant, CartItem, Order, OrderStatus } from '../types';
import { Button } from './Button';
import { ShoppingBag, X, ChefHat, Sparkles, Clock, MapPin } from 'lucide-react';
import { suggestChefRecommendation } from '../services/geminiService';

interface CustomerViewProps {
  restaurant: Restaurant;
  tableNumber: string;
  menu: MenuItem[];
  onPlaceOrder: (items: CartItem[], note: string) => void;
  existingOrders: Order[];
}

export const CustomerView: React.FC<CustomerViewProps> = ({ 
  restaurant, 
  tableNumber, 
  menu, 
  onPlaceOrder,
  existingOrders
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [orderNote, setOrderNote] = useState('');
  const [chefSuggestion, setChefSuggestion] = useState<string>('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(menu.map(item => item.category));
    return ['ALL', ...Array.from(cats)];
  }, [menu]);

  const filteredMenu = activeCategory === 'ALL' 
    ? menu 
    : menu.filter(item => item.category === activeCategory);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
    
    // Trigger AI suggestion if cart has items
    if (Math.random() > 0.6) { // Don't annoy user every time
         handleGetSuggestion();
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.menuItemId !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.menuItemId === itemId) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const handleGetSuggestion = async () => {
      if (cart.length === 0) return;
      setIsLoadingSuggestion(true);
      const cartNames = cart.map(c => c.name);
      const suggestion = await suggestChefRecommendation(menu, cartNames);
      if (suggestion) setChefSuggestion(suggestion);
      setIsLoadingSuggestion(false);
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    onPlaceOrder(cart, orderNote);
    setCart([]);
    setOrderNote('');
    setIsCartOpen(false);
    setChefSuggestion('');
    alert("Đã gửi đơn hàng thành công! Bếp đang chuẩn bị.");
  };

  // Group existing orders by status
  const pendingOrders = existingOrders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{restaurant.name}</h1>
            <div className="flex items-center text-xs text-gray-500">
               <MapPin className="w-3 h-3 mr-1" />
               <span>Bàn số: {tableNumber}</span>
            </div>
          </div>
          {pendingOrders.length > 0 && (
             <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {pendingOrders.length} đơn đang chờ
             </div>
          )}
        </div>
        
        {/* Categories Scroller */}
        <div className="max-w-3xl mx-auto px-4 pb-2 overflow-x-auto no-scrollbar flex space-x-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat 
                  ? 'bg-brand-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'ALL' ? 'Tất cả' : cat}
            </button>
          ))}
        </div>
      </header>

      {/* Menu Grid */}
      <main className="max-w-3xl mx-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredMenu.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-row h-32 sm:h-auto sm:flex-col border border-gray-100">
              <div className="w-32 sm:w-full h-full sm:h-48 bg-gray-200 relative shrink-0">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                {!item.available && (
                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-bold">Hết món</div>
                )}
              </div>
              <div className="flex-1 p-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-brand-600">{item.price.toLocaleString('vi-VN')}đ</span>
                  <button 
                    disabled={!item.available}
                    onClick={() => addToCart(item)}
                    className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center hover:bg-brand-200 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-20 flex justify-center">
            <div className="w-full max-w-3xl flex flex-col gap-2">
                {/* AI Chef Tip Bubble */}
                {chefSuggestion && (
                     <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-3 rounded-lg shadow-lg text-sm flex items-start animate-fade-in-up">
                        <Sparkles className="w-5 h-5 mr-2 shrink-0 text-yellow-300" />
                        <div>
                            <span className="font-bold block text-xs uppercase tracking-wider mb-1">Gợi ý từ Bếp Trưởng AI</span>
                            {chefSuggestion}
                        </div>
                        <button onClick={() => setChefSuggestion('')} className="ml-auto text-white/80 hover:text-white"><X className="w-4 h-4" /></button>
                     </div>
                )}

              <button 
                onClick={() => setIsCartOpen(true)}
                className="bg-brand-600 text-white w-full rounded-xl shadow-lg p-4 flex items-center justify-between hover:bg-brand-700 transition-all transform hover:scale-[1.02]"
              >
                <div className="flex items-center">
                  <div className="bg-white/20 px-3 py-1 rounded-lg font-bold mr-3">{cartCount}</div>
                  <span className="font-medium">Xem giỏ hàng</span>
                </div>
                <span className="font-bold text-lg">{cartTotal.toLocaleString('vi-VN')}đ</span>
              </button>
            </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50 rounded-t-2xl">
              <h2 className="text-xl font-bold flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2" /> Giỏ hàng
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-200 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.map(item => (
                <div key={item.menuItemId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.price.toLocaleString('vi-VN')}đ</p>
                  </div>
                  <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.menuItemId, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm font-bold text-gray-600">-</button>
                    <span className="font-medium w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.menuItemId, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm font-bold text-gray-600">+</button>
                  </div>
                </div>
              ))}
              
              <div className="pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú cho nhà bếp</label>
                  <textarea 
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="VD: Không cay, ít đường, dị ứng đậu phộng..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    rows={3}
                  />
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
              <div className="flex justify-between mb-4 text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-brand-600">{cartTotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <Button onClick={handleCheckout} className="w-full py-4 text-lg shadow-xl" size="lg">
                Xác nhận đặt món
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};