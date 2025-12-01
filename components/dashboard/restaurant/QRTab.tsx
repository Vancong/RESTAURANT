import React, { useState } from 'react';
import { Restaurant } from '../../../types';
import { Button } from '../../Button';
import { QrCode, Edit, Trash, Loader2 } from 'lucide-react';
import { useTables } from './hooks/useTables';
import { useQRDownload } from './hooks/useQRDownload';

interface QRTabProps {
  restaurant: Restaurant;
  addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const QRTab: React.FC<QRTabProps> = ({ restaurant, addNotification }) => {
  const [qrTableInput, setQrTableInput] = useState('');
  const [editingTable, setEditingTable] = useState<{ id: string; code: string } | null>(null);
  const [editingTableCode, setEditingTableCode] = useState('');
  const [isSavingTable, setIsSavingTable] = useState(false);
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null);

  const { tables, saveTable, updateTable, deleteTable } = useTables(restaurant.id, addNotification);
  const {
    isDownloadingQr,
    downloadingQrTable,
    qrDownloadProgress,
    downloadQrImage,
    downloadAllQrImages
  } = useQRDownload();

  const getOrderUrl = (tableCode?: string) => {
    const origin = window.location.origin;
    const baseUrl = origin === 'null' ? 'http://localhost:3000' : origin;
    return `${baseUrl}/#/order?r=${restaurant.id}&t=${tableCode || qrTableInput}`;
  };

  const handleSaveTable = async () => {
    if (!qrTableInput.trim()) {
      addNotification('warning', '⚠️ Thông báo', 'Vui lòng nhập số bàn trước khi lưu');
      return;
    }
    try {
      setIsSavingTable(true);
      await saveTable(qrTableInput.trim());
      setQrTableInput('');
    } catch (err) {
      // Error already handled in hook
    } finally {
      setIsSavingTable(false);
    }
  };

  const handleEditTable = (table: { id: string; code: string }) => {
    setEditingTable(table);
    setEditingTableCode(table.code);
  };

  const handleUpdateTable = async () => {
    if (!editingTable || !editingTableCode.trim()) {
      addNotification('warning', '⚠️ Thông báo', 'Vui lòng nhập số bàn');
      return;
    }
    try {
      setIsSavingTable(true);
      await updateTable(editingTable.id, editingTableCode.trim());
      setEditingTable(null);
      setEditingTableCode('');
    } catch (err) {
      // Error already handled in hook
    } finally {
      setIsSavingTable(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    try {
      setDeletingTableId(tableId);
      await deleteTable(tableId);
    } catch (err) {
      // Error already handled in hook
    } finally {
      setDeletingTableId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Tạo mã QR cho bàn</h2>
      
      {/* Form tạo bàn */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <QrCode className="w-5 h-5 mr-2 text-brand-600" /> Tạo mã QR cho bàn
        </h3>
        <p className="text-gray-500 mb-4 text-sm">Nhập số bàn để tạo link/QR code cho khách hàng quét.</p>
        
        <div className="flex space-x-2">
          <input 
            type="text" 
            placeholder="Số bàn (VD: 5, VIP1)" 
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            value={qrTableInput}
            onChange={(e) => setQrTableInput(e.target.value)}
          />
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleSaveTable}
            disabled={isSavingTable}
          >
            {isSavingTable ? 'Đang lưu...' : 'Lưu bàn'}
          </Button>
        </div>

        {qrTableInput && (
          <div className="mt-6 bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col items-center">
            <p className="text-sm text-gray-500 mb-2 w-full text-left font-medium">Link đặt món:</p>
            <div 
              className="w-full bg-white p-3 rounded-lg border border-gray-200 mb-4 flex items-center justify-between group cursor-pointer hover:border-brand-300 transition-colors"
              onClick={() => navigator.clipboard.writeText(getOrderUrl()).then(() => addNotification('success', '✅ Thành công', 'Đã copy link!'))}
              title="Click để copy"
            >
              <code className="text-xs text-brand-600 truncate flex-1">
                {getOrderUrl()}
              </code>
            </div>
            
            <div className="bg-white p-3 border-2 border-brand-500 rounded-xl shadow-sm mb-4 flex flex-col items-center">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getOrderUrl())}`} 
                alt={`QR Code for Table ${qrTableInput}`}
                className="w-48 h-48 object-contain mb-3"
              />
              <Button
                type="button"
                variant="primary"
                disabled={isDownloadingQr}
                onClick={() =>
                  downloadQrImage(
                    `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(getOrderUrl())}`,
                    qrTableInput,
                    restaurant.name,
                    addNotification
                  )
                }
              >
                {isDownloadingQr && downloadingQrTable === qrTableInput ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  'Tải ảnh QR để in'
                )}
              </Button>
            </div>
            
            <div className="font-bold text-gray-900 text-lg">Bàn số {qrTableInput}</div>
            <p className="mt-2 text-sm text-gray-500">In hình này và dán lên bàn</p>
          </div>
        )}
      </div>

      {/* Danh sách bàn đã lưu */}
      {tables.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h3 className="text-lg font-bold">Danh sách bàn đã lưu</h3>
            <div className="flex items-center gap-3">
              {isDownloadingQr && qrDownloadProgress.total > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{qrDownloadProgress.current}</span>
                  <span className="text-gray-400"> / </span>
                  <span>{qrDownloadProgress.total}</span>
                  {downloadingQrTable && (
                    <span className="ml-2 text-brand-600">Đang tải: Bàn {downloadingQrTable}</span>
                  )}
                </div>
              )}
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isDownloadingQr}
                onClick={() => downloadAllQrImages(tables, restaurant.id, restaurant.name, addNotification)}
              >
                {isDownloadingQr ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  'Tải tất cả QR'
                )}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map(table => {
              const origin = window.location.origin;
              const baseUrl = origin === 'null' ? 'http://localhost:3000' : origin;
              const tableUrl = `${baseUrl}/#/order?r=${restaurant.id}&t=${table.code}`;
              const isEditing = editingTable?.id === table.id;
              const isDeleting = deletingTableId === table.id;
              
              return (
                <div key={table.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 uppercase mb-1">Số bàn</p>
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingTableCode}
                            onChange={(e) => setEditingTableCode(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                            placeholder="Số bàn"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleUpdateTable}
                              disabled={isSavingTable}
                              className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-semibold transition-colors"
                            >
                              {isSavingTable ? 'Đang lưu...' : 'Lưu'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTable(null);
                                setEditingTableCode('');
                              }}
                              className="flex-1 px-3 py-1.5 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-sm font-semibold transition-colors"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xl font-bold text-gray-900 truncate">{table.code}</p>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-2 ml-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEditTable(table)}
                          title="Sửa bàn"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteTable(table.id)}
                          disabled={isDeleting}
                          title="Xóa bàn"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {!isEditing && (
                    <>
                      <div className="bg-white p-3 border border-gray-200 rounded-lg mb-3 flex flex-col items-center">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tableUrl)}`}
                          alt={`QR bàn ${table.code}`}
                          className="w-full h-40 object-contain mb-3"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={isDownloadingQr}
                          onClick={() =>
                            downloadQrImage(
                              `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(tableUrl)}`,
                              table.code,
                              restaurant.name,
                              addNotification
                            )
                          }
                        >
                          {isDownloadingQr && downloadingQrTable === table.code ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Đang tải...
                            </>
                          ) : (
                            'Tải ảnh QR để in'
                          )}
                        </Button>
                      </div>
                      <button
                        type="button"
                        className="w-full text-xs text-brand-600 hover:text-brand-800 truncate text-left p-2 bg-white rounded border border-gray-200 hover:border-brand-300 transition-colors"
                        onClick={() => navigator.clipboard.writeText(tableUrl).then(() => addNotification('success', '✅ Thành công', 'Đã copy link bàn!'))}
                        title="Click để copy link"
                      >
                        {tableUrl}
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {tables.length === 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500 text-center py-4">Chưa có bàn nào được tạo</p>
        </div>
      )}
    </div>
  );
};

