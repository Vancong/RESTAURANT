import { useState, useEffect, useCallback } from 'react';

// Trong development mode, luôn dùng localhost. Chỉ dùng VITE_API_BASE_URL khi production
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:5000' 
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
const AUTH_TOKEN_KEY = 'qr_food_order_token';

interface Table {
  id: string;
  code: string;
}

interface UseTablesReturn {
  tables: Table[];
  isLoading: boolean;
  fetchTables: () => Promise<void>;
  saveTable: (code: string) => Promise<void>;
  updateTable: (id: string, code: string) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
}

export const useTables = (restaurantId: string, addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void): UseTablesReturn => {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTables = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/tables?restaurantId=${restaurantId}`);
      if (!res.ok) return;
      const data: { _id: string; code: string }[] = await res.json();
      setTables(data.map(t => ({ id: t._id, code: t.code })));
    } catch (err) {
      console.error('Không thể tải danh sách bàn', err);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  const saveTable = async (code: string) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        addNotification('error', '❌ Lỗi', 'Vui lòng đăng nhập lại để lưu số bàn');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: code.trim() })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể lưu thông tin bàn');
      }
      addNotification('success', '✅ Thành công', 'Đã lưu số bàn vào hệ thống');
      await fetchTables();
    } catch (err) {
      addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Không thể lưu số bàn, vui lòng thử lại');
      throw err;
    }
  };

  const updateTable = async (id: string, code: string) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        addNotification('error', '❌ Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/tables/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: code.trim() })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể cập nhật bàn');
      }
      addNotification('success', '✅ Thành công', 'Đã cập nhật số bàn thành công');
      await fetchTables();
    } catch (err) {
      addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Không thể cập nhật bàn');
      throw err;
    }
  };

  const deleteTable = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bàn này?')) {
      return;
    }
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        addNotification('error', '❌ Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/tables/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể xóa bàn');
      }
      addNotification('success', '✅ Thành công', 'Đã xóa bàn thành công');
      await fetchTables();
    } catch (err) {
      addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Không thể xóa bàn');
      throw err;
    }
  };

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return {
    tables,
    isLoading,
    fetchTables,
    saveTable,
    updateTable,
    deleteTable
  };
};

