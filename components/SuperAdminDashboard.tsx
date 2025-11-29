import React, { useState, useEffect } from 'react';
import { NewRestaurantPayload, Restaurant, RestaurantStatus, OverviewStats, RestaurantRevenueStats } from '../types';
import { Button } from './Button';
import { Plus, Store, Power, KeyRound, Edit, X, BarChart3, List, Search, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface SuperAdminDashboardProps {
  restaurants: Restaurant[];
  onAddRestaurant: (r: NewRestaurantPayload) => void;
  onToggleActive: (id: string) => void;
  onResetRestaurantPassword: (id: string, newPassword: string) => Promise<any>;
  onUpdateRestaurant: (id: string, data: Partial<Restaurant>) => Promise<Restaurant>;
  onLogout: () => void;
  onFetchRestaurants: (search?: string, status?: string, sortBy?: string, sortOrder?: string) => void;
  onFetchOverviewStats: () => Promise<OverviewStats>;
  onFetchRestaurantStats: (restaurantId: string, startDate?: string, endDate?: string) => Promise<RestaurantRevenueStats>;
}

type TabType = 'statistics' | 'revenue' | 'list';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  restaurants,
  onAddRestaurant,
  onToggleActive,
  onResetRestaurantPassword,
  onUpdateRestaurant,
  onLogout,
  onFetchRestaurants,
  onFetchOverviewStats,
  onFetchRestaurantStats
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('statistics');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const initialForm: NewRestaurantPayload = {
    name: '',
    username: '',
    password: '',
    ownerName: '',
    email: '',
    address: '',
    phone: '',
    status: RestaurantStatus.ACTIVE
  };
  const [newRest, setNewRest] = useState<NewRestaurantPayload>(initialForm);
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    ownerName: '',
    email: '',
    address: '',
    phone: '',
    status: RestaurantStatus.ACTIVE as RestaurantStatus
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Statistics state
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [restaurantStats, setRestaurantStats] = useState<RestaurantRevenueStats | null>(null);
  const [isLoadingRestaurantStats, setIsLoadingRestaurantStats] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFetchRestaurants(searchQuery, statusFilter, sortBy, sortOrder);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, sortBy, sortOrder]);

  // Load overview stats
  useEffect(() => {
    if (activeTab === 'statistics') {
      loadOverviewStats();
    }
  }, [activeTab]);

  // Load restaurant stats when selection or filter changes
  useEffect(() => {
    if (selectedRestaurantId && activeTab === 'revenue') {
      loadRestaurantStats();
    }
  }, [selectedRestaurantId, timeFilter, customStartDate, customEndDate, activeTab]);

  const loadOverviewStats = async () => {
    try {
      setIsLoadingStats(true);
      const stats = await onFetchOverviewStats();
      setOverviewStats(stats);
    } catch (err) {
      console.error('Không thể tải thống kê tổng quan', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadRestaurantStats = async () => {
    if (!selectedRestaurantId) return;
    try {
      setIsLoadingRestaurantStats(true);
      let startDate: string | undefined;
      let endDate: string | undefined;

      const now = new Date();
      if (timeFilter === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDate = today.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
      } else if (timeFilter === 'week') {
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        startDate = monday.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
      } else if (timeFilter === 'month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
      } else if (timeFilter === 'custom') {
        startDate = customStartDate;
        endDate = customEndDate;
      }

      const stats = await onFetchRestaurantStats(selectedRestaurantId, startDate, endDate);
      setRestaurantStats(stats);
    } catch (err) {
      console.error('Không thể tải thống kê doanh thu', err);
    } finally {
      setIsLoadingRestaurantStats(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRestaurant(newRest);
    setIsModalOpen(false);
    setNewRest(initialForm);
    onFetchRestaurants();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Store className="w-6 h-6 text-brand-600 mr-2" />
              <span className="font-bold text-xl text-gray-900">Admin Tổng</span>
            </div>
            <div className="flex items-center">
              <Button variant="ghost" onClick={onLogout}>Đăng xuất</Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('statistics')}
                className={`${
                  activeTab === 'statistics'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Thống kê
              </button>
              <button
                onClick={() => setActiveTab('revenue')}
                className={`${
                  activeTab === 'revenue'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Thống kê doanh thu nhà hàng
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`${
                  activeTab === 'list'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <List className="w-4 h-4 mr-2" />
                Danh sách nhà hàng
              </button>
            </nav>
          </div>
        </div>

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="px-4 sm:px-0 space-y-6">
            {/* Overview Stats Cards */}
            {isLoadingStats ? (
              <div className="text-center py-8">Đang tải thống kê...</div>
            ) : overviewStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <Store className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Tổng nhà hàng đang hoạt động</dt>
                          <dd className="text-lg font-medium text-gray-900">{overviewStats.totalActive}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                        <Store className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Tổng nhà hàng tạm khóa</dt>
                          <dd className="text-lg font-medium text-gray-900">{overviewStats.totalInactive}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Top 5 Restaurants */}
            {overviewStats && overviewStats.top5Restaurants.length > 0 && (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Top 5 nhà hàng doanh thu cao nhất</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                  {overviewStats.top5Restaurants.map((rest, index) => (
                    <li key={rest.id}>
                      <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                            {index + 1}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-brand-600">{rest.name}</div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(rest.revenue)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="px-4 sm:px-0 space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Thống kê doanh thu nhà hàng</h3>
              </div>
              <div className="px-4 py-5 sm:px-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chọn nhà hàng</label>
                  <select
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    value={selectedRestaurantId}
                    onChange={(e) => setSelectedRestaurantId(e.target.value)}
                  >
                    <option value="">-- Chọn nhà hàng --</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lọc thời gian</label>
                  <select
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as any)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="today">Hôm nay</option>
                    <option value="week">Tuần này</option>
                    <option value="month">Tháng này</option>
                    <option value="custom">Tùy chọn</option>
                  </select>
                </div>
                {timeFilter === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
                      <input
                        type="date"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
                      <input
                        type="date"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {isLoadingRestaurantStats ? (
                  <div className="text-center py-8">Đang tải thống kê...</div>
                ) : restaurantStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">Tổng doanh thu</div>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(restaurantStats.totalRevenue)}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">Số đơn hàng</div>
                        <div className="text-2xl font-bold text-gray-900">{restaurantStats.totalOrders}</div>
                      </div>
                    </div>
                    {restaurantStats.chartData.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-4">Biểu đồ doanh thu theo ngày</h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={restaurantStats.chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Bar dataKey="revenue" fill="#4F46E5" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ) : selectedRestaurantId ? (
                  <div className="text-center py-8 text-gray-500">Không có dữ liệu thống kê</div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* List Tab */}
        {activeTab === 'list' && (
          <div className="px-4 sm:px-0 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Danh sách nhà hàng</h2>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Thêm Nhà Hàng
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="bg-white shadow rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tên, email, địa chỉ..."
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <select
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value={RestaurantStatus.ACTIVE}>Đang hoạt động</option>
                    <option value={RestaurantStatus.INACTIVE}>Tạm khóa</option>
                  </select>
                </div>
                <div>
                  <select
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="createdAt">Ngày tạo</option>
                    <option value="name">Tên</option>
                    <option value="status">Trạng thái</option>
                  </select>
                </div>
                <div>
                  <select
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  >
                    <option value="desc">Giảm dần</option>
                    <option value="asc">Tăng dần</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Restaurant List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {restaurants.length === 0 ? (
                  <li className="px-4 py-8 text-center text-gray-500">Không tìm thấy nhà hàng nào</li>
                ) : (
                  restaurants.map((rest) => (
                    <li key={rest.id}>
                      <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                            {rest.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-brand-600 truncate">{rest.name}</div>
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="mr-2">User: {rest.username}</span>
                            </div>
                            <p className="text-xs text-gray-500">Chủ: {rest.ownerName}</p>
                            <p className="text-xs text-gray-500">Email: {rest.email}</p>
                            <p className="text-xs text-gray-500">Địa chỉ: {rest.address}</p>
                            <p className="text-xs text-gray-500">Liên hệ: {rest.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rest.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {rest.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingRestaurant(rest);
                              setEditForm({
                                name: rest.name,
                                ownerName: rest.ownerName,
                                email: rest.email,
                                address: rest.address,
                                phone: rest.phone,
                                status: rest.status
                              });
                            }}
                            title="Sửa thông tin nhà hàng"
                          >
                            <Edit className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setResetTarget({ id: rest.id, name: rest.name })}
                            title="Đặt lại mật khẩu admin nhà hàng"
                          >
                            <KeyRound className="w-4 h-4 text-indigo-500" />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => onToggleActive(rest.id)}
                            title={rest.active ? "Khóa nhà hàng" : "Mở khóa nhà hàng"}
                          >
                            <Power className={`w-4 h-4 ${rest.active ? 'text-red-500' : 'text-green-500'}`} />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Thêm nhà hàng mới</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên nhà hàng</label>
                <input 
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.name}
                  onChange={e => setNewRest({...newRest, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên người chủ</label>
                <input
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.ownerName}
                  onChange={e => setNewRest({ ...newRest, ownerName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email nhà hàng</label>
                <input
                  required
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.email}
                  onChange={e => setNewRest({ ...newRest, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên đăng nhập (Admin nhà hàng)</label>
                <input 
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.username}
                  onChange={e => setNewRest({...newRest, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu khởi tạo</label>
                <input 
                  required
                  type="password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.password}
                  onChange={e => setNewRest({...newRest, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Địa chỉ nhà hàng</label>
                <input
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.address}
                  onChange={e => setNewRest({ ...newRest, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Số điện thoại liên hệ</label>
                <input
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.phone}
                  onChange={e => setNewRest({ ...newRest, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng thái nhà hàng</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={newRest.status}
                  onChange={e => setNewRest({ ...newRest, status: e.target.value as RestaurantStatus })}
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm khóa</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">Hủy</Button>
                <Button type="submit">Tạo mới</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">
              Đặt lại mật khẩu - {resetTarget.name}
            </h3>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!resetPassword || !resetConfirm) {
                  alert('Vui lòng nhập đủ mật khẩu mới và xác nhận');
                  return;
                }
                if (resetPassword !== resetConfirm) {
                  alert('Mật khẩu xác nhận không khớp');
                  return;
                }
                try {
                  setIsResetLoading(true);
                  await onResetRestaurantPassword(resetTarget.id, resetPassword);
                  alert('Đã đặt lại mật khẩu cho nhà hàng');
                  setResetPassword('');
                  setResetConfirm('');
                  setResetTarget(null);
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu');
                } finally {
                  setIsResetLoading(false);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                <input
                  type="password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setResetTarget(null);
                    setResetPassword('');
                    setResetConfirm('');
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isResetLoading}>
                  {isResetLoading ? 'Đang xử lý...' : 'Lưu mật khẩu mới'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Restaurant Modal */}
      {editingRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Sửa thông tin nhà hàng</h3>
              <button
                onClick={() => {
                  setEditingRestaurant(null);
                  setEditForm({
                    name: '',
                    ownerName: '',
                    email: '',
                    address: '',
                    phone: '',
                    status: RestaurantStatus.ACTIVE
                  });
                }}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editingRestaurant) return;
                try {
                  setIsSavingEdit(true);
                  await onUpdateRestaurant(editingRestaurant.id, editForm);
                  alert('Đã cập nhật thông tin nhà hàng thành công!');
                  setEditingRestaurant(null);
                  setEditForm({
                    name: '',
                    ownerName: '',
                    email: '',
                    address: '',
                    phone: '',
                    status: RestaurantStatus.ACTIVE
                  });
                  onFetchRestaurants();
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Không thể cập nhật thông tin nhà hàng');
                } finally {
                  setIsSavingEdit(false);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên nhà hàng</label>
                <input
                  required
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên chủ nhà hàng</label>
                <input
                  required
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={editForm.ownerName}
                  onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  required
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                <input
                  required
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <input
                  required
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as RestaurantStatus })}
                >
                  <option value={RestaurantStatus.ACTIVE}>Đang hoạt động</option>
                  <option value={RestaurantStatus.INACTIVE}>Tạm khóa</option>
                </select>
              </div>
              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-2">
                  Username: <span className="font-medium">{editingRestaurant.username}</span> (không thể thay đổi)
                </p>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingRestaurant(null);
                    setEditForm({
                      name: '',
                      ownerName: '',
                      email: '',
                      address: '',
                      phone: '',
                      status: RestaurantStatus.ACTIVE
                    });
                  }}
                >
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
    </div>
  );
};
