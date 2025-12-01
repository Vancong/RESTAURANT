import React, { useState, useEffect } from 'react';
import { Button } from '../../Button';
import { Users, Edit, Ban, CheckCircle, X } from 'lucide-react';
import { useStaff, Staff } from './hooks/useStaff';

interface StaffTabProps {
  addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const StaffTab: React.FC<StaffTabProps> = ({ addNotification }) => {
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editStaffUsername, setEditStaffUsername] = useState('');
  const [editStaffPassword, setEditStaffPassword] = useState('');
  const [editStaffName, setEditStaffName] = useState('');
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [togglingStaffId, setTogglingStaffId] = useState<string | null>(null);

  const { staffList, fetchStaff, createStaff, updateStaff, toggleStaffActive } = useStaff(addNotification);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffUsername || !newStaffPassword) {
      addNotification('warning', '⚠️ Cảnh báo', 'Vui lòng nhập đầy đủ username và password');
      return;
    }
    try {
      setIsCreatingStaff(true);
      await createStaff(newStaffUsername, newStaffPassword, newStaffName);
      setNewStaffUsername('');
      setNewStaffPassword('');
      setNewStaffName('');
    } catch (err) {
      // Error already handled in hook
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editStaffUsername.trim()) {
      addNotification('warning', '⚠️ Cảnh báo', 'Vui lòng nhập username');
      return;
    }
    if (editStaffPassword && editStaffPassword.length < 6) {
      addNotification('warning', '⚠️ Cảnh báo', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    try {
      setIsSavingStaff(true);
      await updateStaff(
        editingStaff.id,
        editStaffUsername,
        editStaffName,
        editStaffPassword || undefined
      );
      setEditingStaff(null);
      setEditStaffUsername('');
      setEditStaffPassword('');
      setEditStaffName('');
    } catch (err) {
      // Error already handled in hook
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleToggleStaff = async (staffId: string) => {
    try {
      setTogglingStaffId(staffId);
      await toggleStaffActive(staffId);
    } catch (err) {
      // Error already handled in hook
    } finally {
      setTogglingStaffId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý nhân viên</h2>
        
        {/* Form tạo nhân viên */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-brand-600" /> Tạo tài khoản nhân viên
          </h3>
          <form
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            onSubmit={handleCreateStaff}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên nhân viên</label>
              <input
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-md p-2"
                value={newStaffName}
                onChange={e => setNewStaffName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                required
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-md p-2"
                value={newStaffUsername}
                onChange={e => setNewStaffUsername(e.target.value)}
                placeholder="Tên đăng nhập"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                required
                type="password"
                className="mt-1 w-full border border-gray-300 rounded-md p-2"
                value={newStaffPassword}
                onChange={e => setNewStaffPassword(e.target.value)}
                placeholder="Mật khẩu"
              />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={isCreatingStaff}>
                {isCreatingStaff ? 'Đang tạo...' : 'Tạo nhân viên'}
              </Button>
            </div>
          </form>
        </div>

        {/* Danh sách nhân viên */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold mb-4">Danh sách nhân viên</h3>
          {staffList.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Chưa có nhân viên nào</p>
          ) : (
            <div className="space-y-2">
              {staffList.map(staff => (
                <div
                  key={staff.id}
                  className={`p-3 rounded-lg border ${
                    staff.isActive ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div>
                        <span className="font-medium text-gray-900">{staff.name || staff.username}</span>
                        {staff.name && (
                          <span className="ml-2 text-sm text-gray-500">({staff.username})</span>
                        )}
                      </div>
                      {staff.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                          Đã khóa
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingStaff(staff);
                          setEditStaffUsername(staff.username);
                          setEditStaffName(staff.name);
                          setEditStaffPassword('');
                        }}
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={staff.isActive ? "danger" : "secondary"}
                        onClick={() => handleToggleStaff(staff.id)}
                        disabled={togglingStaffId === staff.id}
                        title={staff.isActive ? "Khóa nhân viên" : "Mở khóa nhân viên"}
                      >
                        {togglingStaffId === staff.id ? (
                          '...'
                        ) : staff.isActive ? (
                          <Ban className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {staff.updatedBy && (
                    <p className="text-xs text-gray-500 mt-1">
                      Cập nhật bởi: <span className="font-medium">{staff.updatedBy.username}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Chỉnh sửa nhân viên</h3>
              <button
                onClick={() => {
                  setEditingStaff(null);
                  setEditStaffUsername('');
                  setEditStaffPassword('');
                  setEditStaffName('');
                }}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleUpdateStaff}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên nhân viên
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editStaffName}
                  onChange={(e) => setEditStaffName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editStaffUsername}
                  onChange={(e) => setEditStaffUsername(e.target.value)}
                  placeholder="Tên đăng nhập"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới (để trống nếu không đổi)
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editStaffPassword}
                  onChange={(e) => setEditStaffPassword(e.target.value)}
                  placeholder="Mật khẩu mới (tùy chọn)"
                />
                <p className="text-xs text-gray-500 mt-1">Chỉ nhập nếu muốn đổi mật khẩu</p>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingStaff(null);
                    setEditStaffUsername('');
                    setEditStaffPassword('');
                    setEditStaffName('');
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSavingStaff}>
                  {isSavingStaff ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

