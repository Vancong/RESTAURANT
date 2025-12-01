import { useState, useCallback } from 'react';

// Trong development mode, luôn dùng localhost. Chỉ dùng VITE_API_BASE_URL khi production
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:5000' 
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
const AUTH_TOKEN_KEY = 'qr_food_order_token';

export interface Staff {
  id: string;
  username: string;
  name: string;
  isActive: boolean;
  updatedBy: { id: string; username: string } | null;
}

interface UseStaffReturn {
  staffList: Staff[];
  isLoading: boolean;
  fetchStaff: () => Promise<void>;
  createStaff: (username: string, password: string, name?: string) => Promise<void>;
  updateStaff: (id: string, username: string, name: string, password?: string) => Promise<void>;
  toggleStaffActive: (id: string) => Promise<void>;
}

export const useStaff = (
  addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void
): UseStaffReturn => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/staff`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) return;
      const data = await res.json();
      setStaffList(data);
    } catch (err) {
      console.error('Không thể tải danh sách nhân viên', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createStaff = async (username: string, password: string, name?: string) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }
      const res = await fetch(`${API_BASE_URL}/api/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
          name: name?.trim()
        })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể tạo nhân viên');
      }
      addNotification('success', '✅ Tạo nhân viên thành công', `Đã tạo tài khoản nhân viên: ${name?.trim() || username.trim()}`);
      await fetchStaff();
    } catch (err) {
      addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Không thể tạo nhân viên');
      throw err;
    }
  };

  const updateStaff = async (id: string, username: string, name: string, password?: string) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }
      const body: any = {
        username: username.trim(),
        name: name.trim()
      };
      if (password) {
        body.password = password;
      }
      const res = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const responseBody = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(responseBody?.message || 'Không thể cập nhật nhân viên');
      }
      addNotification('success', '✅ Thành công', 'Đã cập nhật thông tin nhân viên');
      await fetchStaff();
    } catch (err) {
      addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Không thể cập nhật nhân viên');
      throw err;
    }
  };

  const toggleStaffActive = async (id: string) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }
      const res = await fetch(`${API_BASE_URL}/api/staff/${id}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Không thể cập nhật trạng thái');
      }
      await fetchStaff();
    } catch (err) {
      addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
      throw err;
    }
  };

  return {
    staffList,
    isLoading,
    fetchStaff,
    createStaff,
    updateStaff,
    toggleStaffActive
  };
};

