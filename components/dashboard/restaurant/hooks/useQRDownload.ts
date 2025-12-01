import { useState } from 'react';

interface UseQRDownloadReturn {
  isDownloadingQr: boolean;
  downloadingQrTable: string | null;
  qrDownloadProgress: { current: number; total: number };
  downloadQrImage: (qrImageUrl: string, tableCode: string, restaurantName: string, addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void) => Promise<void>;
  downloadAllQrImages: (tables: { id: string; code: string }[], restaurantId: string, restaurantName: string, addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void) => Promise<void>;
  setDownloadingQrTable: (table: string | null) => void;
  setQrDownloadProgress: (progress: { current: number; total: number }) => void;
}

export const useQRDownload = (): UseQRDownloadReturn => {
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);
  const [downloadingQrTable, setDownloadingQrTable] = useState<string | null>(null);
  const [qrDownloadProgress, setQrDownloadProgress] = useState({ current: 0, total: 0 });

  const downloadQrImage = async (
    qrImageUrl: string,
    tableCode: string,
    restaurantName: string,
    addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void
  ) => {
    if (isDownloadingQr) return;
    
    setIsDownloadingQr(true);
    setDownloadingQrTable(tableCode);
    
    try {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Không thể tải ảnh QR'));
        img.src = qrImageUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Không thể tạo canvas');
      }

      const padding = 40;
      const qrSize = 400;
      const width = qrSize + padding * 2;
      const height = qrSize + padding * 2 + 140;

      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const qrX = (width - qrSize) / 2;
      const qrY = padding;
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = '#111827';
      ctx.textAlign = 'center';

      ctx.font = 'bold 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(restaurantName || 'Nhà hàng', width / 2, qrY + qrSize + 40);

      ctx.font = 'bold 32px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = '#ea580c';
      ctx.fillText(`Bàn ${tableCode}`, width / 2, qrY + qrSize + 80);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `qr-ban-${tableCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await new Promise(resolve => setTimeout(resolve, 300));
      
      addNotification('success', '✅ Tải thành công', `Đã tải QR code cho bàn ${tableCode}`);
    } catch (err) {
      console.error('Lỗi khi xuất ảnh QR', err);
      addNotification('error', '❌ Lỗi', err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo ảnh QR. Vui lòng thử lại.');
    } finally {
      setIsDownloadingQr(false);
      setDownloadingQrTable(null);
    }
  };

  const downloadAllQrImages = async (
    tables: { id: string; code: string }[],
    restaurantId: string,
    restaurantName: string,
    addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void
  ) => {
    if (!tables.length) {
      addNotification('warning', '⚠️ Thông báo', 'Chưa có bàn nào để tải QR');
      return;
    }

    if (isDownloadingQr) return;

    setIsDownloadingQr(true);
    setQrDownloadProgress({ current: 0, total: tables.length });

    try {
      const origin = window.location.origin;
      const baseUrl = origin === 'null' ? 'http://localhost:3000' : origin;

      let successCount = 0;

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        setDownloadingQrTable(table.code);
        setQrDownloadProgress({ current: i + 1, total: tables.length });
        
        const tableUrl = `${baseUrl}/#/order?r=${restaurantId}&t=${table.code}`;
        
        try {
          await new Promise<void>((resolve) => {
            const img = document.createElement('img');
            img.crossOrigin = 'anonymous';
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(tableUrl)}`;

            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                resolve(undefined);
                return;
              }

              const padding = 40;
              const qrSize = 400;
              const width = qrSize + padding * 2;
              const height = qrSize + padding * 2 + 140;

              canvas.width = width;
              canvas.height = height;

              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, width, height);

              const qrX = (width - qrSize) / 2;
              const qrY = padding;
              ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

              ctx.fillStyle = '#111827';
              ctx.textAlign = 'center';

              ctx.font = 'bold 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
              ctx.fillText(restaurantName || 'Nhà hàng', width / 2, qrY + qrSize + 40);

              ctx.font = 'bold 32px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
              ctx.fillStyle = '#ea580c';
              ctx.fillText(`Bàn ${table.code}`, width / 2, qrY + qrSize + 80);

              const link = document.createElement('a');
              link.href = canvas.toDataURL('image/png');
              link.download = `qr-ban-${table.code}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              successCount++;

              setTimeout(() => {
                resolve(undefined);
              }, 400);
            };

            img.onerror = () => {
              console.error(`Không thể tải QR cho bàn ${table.code}`);
              resolve(undefined);
            };
          });
        } catch (err) {
          console.error(`Lỗi khi tải QR cho bàn ${table.code}:`, err);
        }
      }

      if (successCount === tables.length) {
        addNotification('success', '✅ Hoàn thành', `Đã tải thành công ${successCount} ảnh QR code!`);
      } else {
        addNotification('warning', '⚠️ Hoàn thành một phần', `Đã tải ${successCount}/${tables.length} ảnh QR. Một số file có thể gặp lỗi.`);
      }
    } catch (err) {
      console.error('Lỗi khi tải QR:', err);
      addNotification('error', '❌ Lỗi', 'Có lỗi xảy ra khi tải QR. Vui lòng thử lại.');
    } finally {
      setIsDownloadingQr(false);
      setDownloadingQrTable(null);
      setQrDownloadProgress({ current: 0, total: 0 });
    }
  };

  return {
    isDownloadingQr,
    downloadingQrTable,
    qrDownloadProgress,
    downloadQrImage,
    downloadAllQrImages,
    setDownloadingQrTable,
    setQrDownloadProgress
  };
};

