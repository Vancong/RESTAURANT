import React, { useState } from 'react';
import { Restaurant, MenuItem } from '../../../types';
import { Button } from '../../Button';
import { ChefHat, Tag, DollarSign, FolderOpen, FileText, Image, Upload, Loader2, Plus, X, Receipt, AlertCircle, CheckCircle, Edit, Trash, UtensilsCrossed, Eye, EyeOff, XCircle, Sparkles } from 'lucide-react';
import { generateMenuDescription } from '../../../services/geminiService';
import { formatPrice, parsePrice } from './utils/formatHelpers';
import { useCategories } from './hooks/useCategories';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

interface MenuTabProps {
  restaurant: Restaurant;
  menu: MenuItem[];
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  onUpdateMenuItem: (id: string, data: Partial<MenuItem>) => Promise<void>;
  onDeleteMenuItem: (id: string) => Promise<void>;
  addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

const CategoryCreator: React.FC<{ 
  categories: { id: string; name: string }[];
  onCreated: () => void;
  addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}> = ({ categories, onCreated, addNotification }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const normalizedName = name.trim().toLowerCase();
  const isDuplicate = categories.some(cat => cat.name.trim().toLowerCase() === normalizedName);
  const isValid = name.trim() && !isDuplicate;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Vui lòng nhập tên danh mục');
      return;
    }

    const normalizedTrimmed = trimmedName.toLowerCase();
    const duplicate = categories.find(cat => cat.name.trim().toLowerCase() === normalizedTrimmed);
    
    if (duplicate) {
      setError(`Danh mục "${duplicate.name}" đã tồn tại!`);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('qr_food_order_token');
      if (!token) throw new Error('Vui lòng đăng nhập lại.');
      
      const res = await fetch(`${import.meta.env.DEV ? 'http://localhost:5000' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000')}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: trimmedName })
      });
      
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const errorMsg = body?.message || 'Không thể tạo danh mục';
        if (errorMsg.toLowerCase().includes('đã tồn tại') || errorMsg.toLowerCase().includes('duplicate') || errorMsg.toLowerCase().includes('exists')) {
          setError(`Danh mục "${trimmedName}" đã tồn tại!`);
        } else {
          throw new Error(errorMsg);
        }
        return;
      }
      
      setName('');
      setError('');
      addNotification('success', '✅ Thành công', 'Đã tạo danh mục mới');
      onCreated();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tạo danh mục';
      setError(errorMessage);
      addNotification('error', '❌ Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCreate} className="space-y-3 pt-4 border-t border-gray-200">
      <label className="block text-sm font-semibold text-gray-700 mb-2">Thêm danh mục mới</label>
      <div className="space-y-2">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              className={`flex-1 w-full border-2 rounded-xl px-4 py-2.5 text-sm focus:ring-4 transition-all duration-200 bg-white ${
                error || isDuplicate
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                  : isValid
                  ? 'border-green-300 focus:border-brand-500 focus:ring-brand-100'
                  : 'border-gray-200 focus:border-brand-500 focus:ring-brand-100'
              }`}
              placeholder="VD: Món Chính, Đồ Uống..."
              value={name}
              onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
              disabled={loading}
            />
            {isValid && !error && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            )}
            {(isDuplicate || error) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
            )}
          </div>
          <Button type="submit" size="sm" disabled={loading || !isValid || isDuplicate} className="px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Đang thêm
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                Thêm
              </>
            )}
          </Button>
        </div>
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}
        {isDuplicate && !error && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl animate-fade-in">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-700 font-medium">
              Danh mục "{categories.find(cat => cat.name.trim().toLowerCase() === normalizedName)?.name}" đã tồn tại!
            </p>
          </div>
        )}
        {isValid && !error && !isDuplicate && (
          <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-700 font-medium">Sẵn sàng thêm danh mục mới</p>
          </div>
        )}
      </div>
    </form>
  );
};

export const MenuTab: React.FC<MenuTabProps> = ({ restaurant, menu, onAddMenuItem, onUpdateMenuItem, onDeleteMenuItem, addNotification }) => {
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ category: 'Món Chính', available: true });
  const [priceDisplay, setPriceDisplay] = useState<string>('');
  const [isSavingMenuItem, setIsSavingMenuItem] = useState(false);
  const [deletingMenuId, setDeletingMenuId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingPriceDisplay, setEditingPriceDisplay] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string>('');

  const { categories, fetchCategories, updateCategory, deleteCategory } = useCategories(restaurant.id, addNotification);

  const handleGenerateDescription = async () => {
    if (!newItem.name || !newItem.category) {
      addNotification('warning', '⚠️ Cảnh báo', 'Vui lòng nhập tên món và danh mục trước.');
      return;
    }
    setIsAiLoading(true);
    try {
      const desc = await generateMenuDescription(newItem.name, newItem.category);
      setNewItem((prev: Partial<MenuItem>) => ({ ...prev, description: desc }));
    } catch (err) {
      addNotification('error', '❌ Lỗi', 'Không thể tạo mô tả bằng AI');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmitMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = priceDisplay ? parsePrice(priceDisplay) : (newItem.price || 0);
    if (!newItem.name || !parsedPrice || parsedPrice <= 0) {
      addNotification('warning', '⚠️ Cảnh báo', 'Vui lòng nhập tên món và giá hợp lệ');
      return;
    }
    try {
      setIsSavingMenuItem(true);
      await onAddMenuItem({
        restaurantId: restaurant.id,
        name: newItem.name,
        price: parsedPrice,
        description: newItem.description || '',
        category: newItem.category || 'Món Chính',
        imageUrl: newItem.imageUrl || `https://picsum.photos/400/300?random=${Date.now()}`,
        available: true
      });
      setNewItem({ category: 'Món Chính', available: true, name: '', price: 0, description: '' });
      setPriceDisplay('');
      addNotification('success', '✅ Thành công', 'Đã thêm món thành công!');
    } catch (err) {
      addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Không thể thêm món');
    } finally {
      setIsSavingMenuItem(false);
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!window.confirm('Xóa món này khỏi thực đơn?')) return;
    try {
      setDeletingMenuId(id);
      await onDeleteMenuItem(id);
      addNotification('success', '✅ Thành công', 'Đã xóa món thành công');
    } catch (err) {
      addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Không thể xóa món');
    } finally {
      setDeletingMenuId(null);
    }
  };

  const handleUploadImage = async (file: File, isEditing: boolean = false) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      addNotification('error', '❌ Lỗi', 'Chưa cấu hình Cloudinary (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET).');
      return;
    }
    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Upload ảnh thất bại');
      
      if (isEditing && editingItem) {
        setEditingItem({ ...editingItem, imageUrl: data.secure_url });
      } else {
        setNewItem((prev: Partial<MenuItem>) => ({ ...prev, imageUrl: data.secure_url }));
      }
    } catch (err) {
      addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Không thể upload ảnh');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* Form thêm món mới */}
        <div className="bg-gradient-to-br from-white via-white to-orange-50/30 p-8 rounded-2xl shadow-xl border border-orange-100 backdrop-blur-sm">
          <div className="flex items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 flex items-center justify-center mr-4 shadow-lg shadow-brand-200/50 ring-4 ring-brand-100">
              <ChefHat className="w-7 h-7 text-white"/>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Thêm món mới</h3>
              <p className="text-sm text-gray-500">Điền thông tin để thêm món vào thực đơn</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmitMenu} className="space-y-6">
            {/* Row 1: Tên món và Giá */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2 group">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Tag className="w-4 h-4 mr-2 text-brand-600" />
                  Tên món <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Tag className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                  </div>
                  <input 
                    required 
                    className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all duration-200 bg-white hover:border-gray-300" 
                    placeholder="VD: Phở bò tái chín"
                    value={newItem.name || ''} 
                    onChange={e => setNewItem({...newItem, name: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="space-y-2 group">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <DollarSign className="w-4 h-4 mr-2 text-brand-600" />
                  Giá (VND) <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                  </div>
                  <input 
                    required 
                    type="text" 
                    className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all duration-200 bg-white hover:border-gray-300" 
                    placeholder="VD: 45,000"
                    value={priceDisplay} 
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, '');
                      if (rawValue) {
                        const parsed = parseInt(rawValue, 10);
                        if (!isNaN(parsed) && parsed > 0) {
                          setPriceDisplay(formatPrice(parsed));
                          setNewItem({...newItem, price: parsed});
                        } else {
                          setPriceDisplay('');
                          setNewItem({...newItem, price: undefined});
                        }
                      } else {
                        setPriceDisplay('');
                        setNewItem({...newItem, price: undefined});
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Danh mục */}
            <div className="space-y-2 group">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <FolderOpen className="w-4 h-4 mr-2 text-brand-600" />
                Danh mục <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <FolderOpen className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <select
                  required
                  className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all duration-200 appearance-none hover:border-gray-300 cursor-pointer"
                  value={newItem.category || ''}
                  onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                >
                  <option value="" disabled>Chọn danh mục</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {categories.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-orange-700 font-medium">
                    Chưa có danh mục nào. Vui lòng thêm danh mục ở cột bên phải.
                  </p>
                </div>
              )}
            </div>

            {/* Row 3: Mô tả */}
            <div className="space-y-2 group">
              <div className="flex justify-between items-center">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <FileText className="w-4 h-4 mr-2 text-brand-600" />
                  Mô tả
                </label>
                <button 
                  type="button" 
                  onClick={handleGenerateDescription} 
                  disabled={isAiLoading} 
                  className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className={`w-3 h-3 mr-1 ${isAiLoading ? 'animate-spin' : ''}`} /> 
                  {isAiLoading ? 'Đang viết...' : 'Dùng AI viết mô tả'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute top-3 left-4 pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <textarea 
                  className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all duration-200 bg-white resize-none hover:border-gray-300" 
                  rows={3} 
                  placeholder="Mô tả chi tiết về món ăn..."
                  value={newItem.description || ''} 
                  onChange={e => setNewItem({...newItem, description: e.target.value})} 
                />
              </div>
            </div>

            {/* Row 4: Upload ảnh */}
            <div className="space-y-3">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <Image className="w-4 h-4 mr-2 text-brand-600" />
                Ảnh món ăn
              </label>
              
              {!newItem.imageUrl ? (
                <div className="flex items-center gap-4">
                  <label 
                    htmlFor="image-upload"
                    className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl cursor-pointer hover:from-brand-600 hover:to-brand-700 transition-all duration-200 shadow-lg shadow-brand-200 hover:shadow-xl"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Chọn ảnh
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(file);
                      }}
                    />
                  </label>
                  {isUploadingImage && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                      <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                      Đang upload ảnh...
                    </div>
                  )}
                  <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 10MB</p>
                </div>
              ) : (
                <div className="relative group/image-preview">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-brand-200 shadow-lg">
                    <img src={newItem.imageUrl} alt="Preview món" className="w-full h-64 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/image-preview:opacity-100 transition-opacity duration-300"></div>
                    <button
                      type="button"
                      onClick={() => setNewItem((prev: Partial<MenuItem>) => ({ ...prev, imageUrl: undefined }))}
                      className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg hover:scale-110 transition-all duration-200 opacity-0 group-hover/image-preview:opacity-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-brand-600 rounded-lg px-4 py-2 font-semibold text-sm hover:bg-white shadow-lg opacity-0 group-hover/image-preview:opacity-100 transition-all duration-200"
                    >
                      <Image className="w-4 h-4 inline mr-2" />
                      Đổi ảnh
                    </button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(file);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full py-4 text-lg font-bold bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 hover:from-brand-600 hover:via-brand-700 hover:to-brand-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                disabled={isSavingMenuItem}
              >
                {isSavingMenuItem ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang lưu...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm vào thực đơn
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Phần quản lý danh mục */}
        <div className="bg-gradient-to-br from-white via-white to-orange-50/30 p-6 rounded-2xl shadow-xl border border-orange-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center mr-4 shadow-lg shadow-brand-200/50">
                <Receipt className="w-6 h-6 text-white"/>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Quản lý danh mục</h3>
                <p className="text-sm text-gray-500">Tổ chức món ăn theo danh mục</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {categories.length === 0 ? (
              <div className="col-span-full text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">Chưa có danh mục nào</p>
              </div>
            ) : (
              categories.map(cat => {
                const itemCount = menu.filter(item => item.category === cat.name).length;
                const isEditing = editingCategoryId === cat.id;
                
                return (
                  <div key={cat.id} className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:shadow-md transition-all duration-200 group">
                    {isEditing ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const trimmedName = editingCategoryName.trim();
                          if (!trimmedName) {
                            addNotification('warning', '⚠️ Cảnh báo', 'Tên danh mục không được để trống');
                            return;
                          }
                          const duplicate = categories.find(c => c.id !== cat.id && c.name.trim().toLowerCase() === trimmedName.toLowerCase());
                          if (duplicate) {
                            addNotification('warning', '⚠️ Cảnh báo', `Danh mục "${trimmedName}" đã tồn tại!`);
                            return;
                          }
                          try {
                            await updateCategory(cat.id, trimmedName);
                            setEditingCategoryId(null);
                            setEditingCategoryName('');
                          } catch (err) {
                            // Error handled in hook
                          }
                        }}
                        className="space-y-2"
                      >
                        <input
                          type="text"
                          className="w-full border-2 border-brand-300 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          autoFocus
                          onBlur={() => {
                            if (editingCategoryName.trim() === cat.name.trim()) {
                              setEditingCategoryId(null);
                              setEditingCategoryName('');
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" className="flex-1 px-3 py-1.5 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Lưu
                          </Button>
                          <Button 
                            type="button"
                            size="sm" 
                            variant="secondary"
                            onClick={() => {
                              setEditingCategoryId(null);
                              setEditingCategoryName('');
                            }}
                            className="px-3 py-1.5 text-xs"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-3 h-3 rounded-full bg-brand-500 group-hover:bg-brand-600 transition-colors flex-shrink-0"></div>
                          <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-700 transition-colors truncate">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-gradient-to-r from-brand-50 to-orange-50 text-brand-700 text-xs font-bold rounded-full border border-brand-200">
                            {itemCount}
                          </span>
                          <button
                            onClick={() => {
                              setEditingCategoryId(cat.id);
                              setEditingCategoryName(cat.name);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Sửa danh mục"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCategory(cat.id, cat.name, itemCount)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Xóa danh mục"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          <CategoryCreator categories={categories} onCreated={fetchCategories} addNotification={addNotification} />
        </div>

        {/* Danh sách món */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900">Danh sách món ({menu.length})</h3>
          <p className="text-sm text-gray-500">Quản lý các món trong thực đơn</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {menu.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
              <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Chưa có món nào trong thực đơn</p>
              <p className="text-sm text-gray-400 mt-1">Thêm món mới ở phía trên</p>
            </div>
          ) : (
            menu.map(item => (
              <div 
                key={item.id} 
                className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 group relative ${
                  !item.available 
                    ? 'opacity-70 border-red-200 bg-gradient-to-br from-red-50 to-white' 
                    : 'border-transparent hover:border-brand-200'
                }`}
              >
                {!item.available && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-lg">
                    ⛔ Hết món
                  </div>
                )}
                
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => onUpdateMenuItem(item.id, { available: !item.available })}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-lg transition-all duration-200"
                      title={item.available ? "Ẩn món (hết hàng)" : "Hiện món (còn hàng)"}
                    >
                      {item.available ? <EyeOff className="w-4 h-4 text-gray-700" /> : <Eye className="w-4 h-4 text-green-600" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setEditingPriceDisplay(formatPrice(item.price));
                      }}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-lg transition-all duration-200"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(item.id)} 
                      disabled={deletingMenuId === item.id}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-lg transition-all duration-200 disabled:opacity-50"
                      title="Xóa món"
                    >
                      <Trash className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                
                <div className="p-5">
                  <h4 className="font-bold text-lg text-gray-900 line-clamp-1 mb-2">{item.name}</h4>
                  <p className="text-xl font-bold text-brand-600 mb-3">{formatPrice(item.price)}₫</p>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[2.5rem]">{item.description || 'Chưa có mô tả'}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-brand-50 to-orange-50 text-brand-700 text-xs font-semibold rounded-full border border-brand-200">
                      {item.category}
                    </span>
                    {item.available ? (
                      <span className="inline-flex items-center text-xs text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Còn hàng
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs text-red-600 font-semibold bg-red-50 px-3 py-1 rounded-full">
                        <XCircle className="w-3 h-3 mr-1" />
                        Hết hàng
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Menu Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Sửa món: {editingItem.name}</h3>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setEditingPriceDisplay('');
                }}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setIsSavingEdit(true);
                  const parsedPrice = editingPriceDisplay ? parsePrice(editingPriceDisplay) : editingItem.price;
                  if (!parsedPrice || parsedPrice <= 0) {
                    addNotification('warning', '⚠️ Cảnh báo', 'Giá không hợp lệ');
                    setIsSavingEdit(false);
                    return;
                  }
                  await onUpdateMenuItem(editingItem.id, {
                    name: editingItem.name,
                    price: parsedPrice,
                    description: editingItem.description,
                    category: editingItem.category,
                    imageUrl: editingItem.imageUrl,
                    available: editingItem.available,
                  });
                  setIsSavingEdit(false);
                  setEditingItem(null);
                  setEditingPriceDisplay('');
                  addNotification('success', '✅ Thành công', 'Đã cập nhật món thành công');
                } catch (err) {
                  setIsSavingEdit(false);
                  addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Không thể cập nhật món');
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên món</label>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={editingItem.name}
                  onChange={e => setEditingItem((prev: MenuItem | null) => prev ? { ...prev, name: e.target.value } : prev)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Giá (VND)</label>
                <input
                  type="text"
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm"
                  placeholder="VD: 45,000"
                  value={editingPriceDisplay}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, '');
                    if (rawValue) {
                      const parsed = parseInt(rawValue, 10);
                      if (!isNaN(parsed) && parsed > 0) {
                        setEditingPriceDisplay(formatPrice(parsed));
                        setEditingItem((prev: MenuItem | null) => prev ? { ...prev, price: parsed } : prev);
                      } else {
                        setEditingPriceDisplay('');
                      }
                    } else {
                      setEditingPriceDisplay('');
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                <select
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-white text-sm"
                  value={editingItem.category}
                  onChange={e => setEditingItem((prev: MenuItem | null) => prev ? { ...prev, category: e.target.value } : prev)}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={editingItem.description}
                  onChange={e => setEditingItem((prev: MenuItem | null) => prev ? { ...prev, description: e.target.value } : prev)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editingItem.available}
                    onChange={e => setEditingItem((prev: MenuItem | null) => prev ? { ...prev, available: e.target.checked } : prev)}
                  />
                  <span>Còn bán</span>
                </label>
                {editingItem.imageUrl && (
                  <img src={editingItem.imageUrl} alt="Ảnh món" className="w-16 h-12 object-cover rounded border" />
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => { setEditingItem(null); setEditingPriceDisplay(''); }}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

