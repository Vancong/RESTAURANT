import { useState, useEffect, useCallback } from 'react';

// Trong development mode, luôn dùng localhost. Chỉ dùng VITE_API_BASE_URL khi production
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:5000' 
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
const AUTH_TOKEN_KEY = 'qr_food_order_token';

export interface Category {
  id: string;
  name: string;
}

interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  fetchCategories: () => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string, categoryName: string, menuItemCount: number) => Promise<void>;
}

export const useCategories = (
  restaurantId: string,
  addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void
): UseCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/categories?restaurantId=${restaurantId}`);
      if (!res.ok) return;
      const data: { _id: string; name: string }[] = await res.json();
      setCategories(data.map(c => ({ id: c._id, name: c.name })));
    } catch (err) {
      console.error('Không thể tải danh mục', err);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  const createCategory = async (name: string) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại.');
      }
      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: name.trim() })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const errorMsg = body?.message || 'Không thể tạo danh mục';
        throw new Error(errorMsg);
      }
      addNotification('success', '✅ Thành công', 'Đã tạo danh mục mới');
      await fetchCategories();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tạo danh mục';
      addNotification('error', '❌ Lỗi', errorMessage);
      throw err;
    }
  };

  const updateCategory = async (id: string, name: string) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại.');
      }
      const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: name.trim() })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể cập nhật danh mục');
      }
      addNotification('success', '✅ Thành công', 'Đã cập nhật danh mục');
      await fetchCategories();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật danh mục';
      addNotification('error', '❌ Lỗi', errorMessage);
      throw err;
    }
  };

  const deleteCategory = async (id: string, categoryName: string, menuItemCount: number) => {
    if (menuItemCount > 0) {
      addNotification('warning', '⚠️ Cảnh báo', `Không thể xóa danh mục "${categoryName}" vì có ${menuItemCount} món đang sử dụng danh mục này. Vui lòng chuyển các món sang danh mục khác trước.`);
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${categoryName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại.');
      }
      const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể xóa danh mục');
      }
      addNotification('success', '✅ Thành công', 'Đã xóa danh mục');
      await fetchCategories();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa danh mục';
      addNotification('error', '❌ Lỗi', errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
};

