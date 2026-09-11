import React from 'react';
import { SystemNotification } from '../types';
import { X, Bell, AlertTriangle, ShieldAlert, CheckCircle2, Volume2 } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onMarkAllRead: () => void;
  onRequestWebPermission: () => void;
  webPermissionStatus: NotificationPermission | 'unsupported';
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onRequestWebPermission,
  webPermissionStatus,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#0f4c4a] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-300" />
            <h2 className="text-lg font-bold">Trung Tâm Thông Báo Nhắc Nhở</h2>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Web Notification Banner */}
        <div className="bg-amber-50 p-4 border-b border-amber-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-medium">
            <Volume2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {webPermissionStatus === 'granted'
                ? 'Đã bật thông báo trình duyệt tự động'
                : 'Bật thông báo đẩy trên trình duyệt để nhận nhắc nhở khi đến hạn'}
            </span>
          </div>
          {webPermissionStatus !== 'granted' && webPermissionStatus !== 'unsupported' && (
            <button
              onClick={onRequestWebPermission}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[11px] shadow transition cursor-pointer shrink-0 ml-2"
            >
              Cho phép
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold">Hiện tại không có thông báo nhắc nhở nào!</p>
              <p className="text-xs text-slate-400 mt-1">
                Các hồ sơ quá hạn hoặc sắp đến hạn (1-2 ngày) sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-xl border transition flex gap-3 ${
                  notif.type === 'OVERDUE'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {notif.type === 'OVERDUE' ? (
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">{notif.title}</h4>
                    <span className="text-[10px] text-slate-400">{notif.createdAt}</span>
                  </div>
                  <p className="mt-1 leading-relaxed text-slate-700">{notif.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 flex items-center justify-between border-t border-slate-200 text-xs">
          <button
            onClick={onMarkAllRead}
            className="text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
          >
            Đánh dấu tất cả đã đọc
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
