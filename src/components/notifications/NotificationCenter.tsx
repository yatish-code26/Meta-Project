import React from 'react';
import { Bell, CheckCheck, AlertTriangle, Shield, CheckCircle2, Clock, X } from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { state, dispatch } = useRouteXStore();

  if (!isOpen) return null;

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-warning flex-shrink-0" />;
      default:
        return <Shield className="w-4 h-4 text-primary flex-shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/20 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden mt-12 animate-in fade-in slide-in-from-top-2 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/40">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="font-['Manrope'] font-bold text-sm text-foreground">
              Simulated Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="text-[12px] font-bold px-1.5 py-0.2 rounded-full bg-destructive text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' })}
                className="text-[12px] font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:bg-secondary text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60 p-1">
          {state.notifications.length > 0 ? (
            state.notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => dispatch({ type: 'MARK_NOTIFICATION_READ', id: notif.id })}
                className={`p-3 rounded-xl transition-colors cursor-pointer text-xs space-y-1.5 ${
                  notif.read ? 'opacity-70 hover:opacity-100 hover:bg-secondary/40' : 'bg-primary/5 hover:bg-primary/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    {getSeverityIcon(notif.severity)}
                    <span>{notif.title}</span>
                  </div>
                  <span className="text-[12px] text-muted-foreground whitespace-nowrap">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-muted-foreground text-[12px] leading-relaxed pl-6">
                  {notif.message}
                </p>

                <div className="pl-6 flex items-center gap-2 text-[12px]">
                  <span className="font-semibold text-primary/80 uppercase tracking-wider text-[12px]">
                    Simulated Alert
                  </span>
                  <span>•</span>
                  <span className="text-muted-foreground capitalize">{notif.category}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No alerts in feed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

