import React, { useState, useMemo } from 'react';
import { MenuItem, Restaurant, CartItem, Order, OrderStatus } from '../types';
import { Button } from './Button';
import { ShoppingBag, X, ChefHat, Sparkles, Clock, MapPin, QrCode, Plus, ChevronRight, Phone } from 'lucide-react';
import { suggestChefRecommendation } from '../services/geminiService';

interface CustomerViewProps {
  restaurant: Restaurant;
  tableNumber: string;
  menu: MenuItem[];
  onPlaceOrder: (items: CartItem[], note: string, customerName: string) => void;
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
  const [customerName, setCustomerName] = useState('');
  const [chefSuggestion, setChefSuggestion] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(menu.map(item => item.category));
    return ['ALL', ...Array.from(cats)];
  }, [menu]);

  // Filter menu: chỉ hiển thị món available và theo category
  const availableMenu = menu.filter(item => item.available);
  const filteredMenu = activeCategory === 'ALL' 
    ? availableMenu 
    : availableMenu.filter(item => item.category === activeCategory);

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
      const cartNames = cart.map(c => c.name);
      const suggestion = await suggestChefRecommendation(menu, cartNames);
      if (suggestion) setChefSuggestion(suggestion);
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      alert('Vui lòng nhập tên của bạn');
      return;
    }
    if (isPlacingOrder) {
      return; // Prevent spam clicking
    }
    try {
      setIsPlacingOrder(true);
      await onPlaceOrder(cart, orderNote, customerName.trim());
      setCart([]);
      setOrderNote('');
      setCustomerName('');
      setIsCartOpen(false);
      setChefSuggestion('');
      alert("✅ Đã gửi đơn hàng thành công! Bếp đang chuẩn bị.");
    } catch (err) {
      // Hiển thị alert cho mọi lỗi
      const errorMessage = err instanceof Error ? err.message : 'Không thể đặt món. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Group existing orders by status
  const pendingOrders = existingOrders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);

  // Group menu by category for section headers
  const menuByCategory = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};
    filteredMenu.forEach(item => {
      const cat = item.category || 'Khác';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return grouped;
  }, [filteredMenu]);

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 pb-24">
      {/* Compact Header với thông tin nhà hàng */}
      <header className="bg-white sticky top-0 z-10 shadow-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Tên nhà hàng và badge đơn hàng */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{restaurant.name}</h1>
            {pendingOrders.length > 0 && (
              <div className="bg-[#F97316] text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-md">
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                {pendingOrders.length} đơn
              </div>
            )}
          </div>

          {/* Thông tin nhà hàng - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-sm">
            {/* Địa chỉ */}
            {restaurant.address && (
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                <span className="line-clamp-2">{restaurant.address}</span>
              </div>
            )}
            
            {/* Số điện thoại */}
            {restaurant.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <a href={`tel:${restaurant.phone}`} className="hover:text-[#F97316] transition-colors">
                  {restaurant.phone}
                </a>
              </div>
            )}

            {/* Bàn số */}
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">Bàn: </span>
              <span className="font-bold text-[#F97316]">Bàn {tableNumber}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Categories Scroller - Active màu cam, Inactive trắng */}
      <div className="max-w-4xl mx-auto px-4 mt-3 mb-2">
        <div className="overflow-x-auto no-scrollbar flex space-x-2 pb-2">
          {categories.map((cat, index) => (
            <React.Fragment key={cat}>
              <button
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeCategory === cat 
                    ? 'bg-[#F97316] text-white shadow-md' 
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {cat === 'ALL' ? 'Tất cả' : cat}
              </button>
              {index < categories.length - 1 && categories.length > 4 && (
                <ChevronRight className="w-4 h-4 text-gray-400 self-center flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Menu Grid - 2 cột layout với section headers */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        {activeCategory === 'ALL' ? (
          // Hiển thị theo category với section headers
          Object.entries(menuByCategory).map(([category, items]) => (
            <div key={category} className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 px-2">{category}</h2>
              <div className="grid grid-cols-2 gap-3">
                {items.map(item => (
                  <div 
                    key={item.id} 
                    className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 relative"
                  >
                    {/* Image */}
                    <div className="w-full aspect-square bg-gray-100 relative overflow-hidden">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                      />
                      {!item.available && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            Hết món
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-3 pb-12">
                      <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-600 font-semibold mb-2">
                        {item.price.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    
                    {/* Nút tròn màu cam ở góc dưới phải */}
                    <button 
                      disabled={!item.available}
                      onClick={() => addToCart(item)}
                      className="absolute bottom-3 right-3 w-10 h-10 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-full shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          // Hiển thị một category cụ thể
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 px-2">
              {activeCategory}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {filteredMenu.map(item => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 relative"
                >
                  {/* Image */}
                  <div className="w-full aspect-square bg-gray-100 relative overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                    />
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          Hết món
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-3 pb-12">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-600 font-semibold mb-2">
                      {item.price.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  
                  {/* Nút tròn màu cam ở góc dưới phải */}
                  <button 
                    disabled={!item.available}
                    onClick={() => addToCart(item)}
                    className="absolute bottom-3 right-3 w-10 h-10 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-full shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {filteredMenu.length === 0 && (
          <div className="text-center py-16">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Không có món nào trong danh mục này</p>
          </div>
        )}
      </main>

      {/* Floating Cart Button - Style mới với màu cam */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-20 flex justify-center">
            <div className="w-full max-w-4xl flex flex-col gap-3">
                {/* AI Chef Tip Bubble */}
                {chefSuggestion && (
                     <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white p-4 rounded-2xl shadow-2xl text-sm flex items-start backdrop-blur-sm border border-white/20">
                        <Sparkles className="w-6 h-6 mr-3 shrink-0 text-yellow-300" />
                        <div className="flex-1">
                            <span className="font-bold block text-xs uppercase tracking-wider mb-1.5">✨ Gợi ý từ Bếp Trưởng AI</span>
                            <p className="leading-relaxed">{chefSuggestion}</p>
                        </div>
                        <button onClick={() => setChefSuggestion('')} className="ml-2 text-white/80 rounded-full p-1">
                          <X className="w-5 h-5" />
                        </button>
                     </div>
                )}

              <button 
                onClick={() => setIsCartOpen(true)}
                className="bg-[#F97316] hover:bg-[#EA580C] text-white w-full rounded-2xl shadow-2xl p-5 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl font-bold text-lg shadow-inner">
                    {cartCount}
                  </div>
                  <div>
                    <span className="font-semibold text-lg block">Xem giỏ hàng</span>
                    <span className="text-xs text-white/80">{cart.length} món</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-2xl block">{cartTotal.toLocaleString('vi-VN')}đ</span>
                  <span className="text-xs text-white/80">Tổng tiền</span>
                </div>
              </button>
            </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-xl sm:rounded-xl h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col shadow-lg">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <h2 className="text-xl font-bold flex items-center text-gray-900">
                <ShoppingBag className="w-5 h-5 mr-2 text-[#F97316]" /> 
                Giỏ hàng
                <span className="ml-2 bg-[#F97316] text-white px-2 py-1 rounded text-xs font-bold">
                  {cartCount}
                </span>
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)} 
                className="p-2"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map(item => {
                const menuItem = menu.find(m => m.id === item.menuItemId);
                return (
                <div 
                  key={item.menuItemId} 
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {/* Hình ảnh món */}
                    {menuItem?.imageUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img 
                          src={menuItem.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-base mb-1 truncate">{item.name}</h4>
                      <p className="text-[#F97316] font-semibold text-sm">{item.price.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.menuItemId)}
                      className="text-gray-400 p-2 flex-shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-2">
                      <button 
                        onClick={() => updateQuantity(item.menuItemId, -1)} 
                        className="w-8 h-8 flex items-center justify-center bg-white rounded font-bold text-gray-700 text-lg"
                      >
                        −
                      </button>
                      <span className="font-bold text-base text-gray-900 w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.menuItemId, 1)} 
                        className="w-8 h-8 flex items-center justify-center bg-white text-[#F97316] rounded font-bold text-lg"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-600 block">Thành tiền</span>
                      <span className="font-bold text-[#F97316] text-base">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
                );
              })}
              
              {/* Form */}
              <div className="pt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nhập tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="VD: Nguyễn Văn A"
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#F97316] focus:border-[#F97316]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú cho nhà bếp
                    </label>
                    <textarea 
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="VD: Không cay, ít đường..."
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#F97316] focus:border-[#F97316] resize-none"
                      rows={2}
                    />
                  </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex justify-between items-center mb-3">
                <span className="text-base font-semibold text-gray-700">Tổng cộng</span>
                <span className="text-xl font-bold text-[#F97316]">
                  {cartTotal.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <Button 
                onClick={handleCheckout} 
                className="w-full py-3 text-base font-bold bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 disabled:cursor-not-allowed" 
                size="lg"
                disabled={isPlacingOrder || cart.length === 0}
              >
                {isPlacingOrder ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  'Xác nhận đặt món'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};