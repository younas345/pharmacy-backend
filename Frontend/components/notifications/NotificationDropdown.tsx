"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils/format';
import { mockNotifications, getUnreadCount } from '@/data/mockNotifications';
import type { Notification } from '@/types';
import Link from 'next/link';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'credit_received':
        return '💰';
      case 'shipment_update':
        return '🚚';
      case 'order_status':
        return '📦';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'credit_received':
        return 'bg-green-100 text-green-800';
      case 'shipment_update':
        return 'bg-blue-100 text-blue-800';
      case 'order_status':
        return 'bg-purple-100 text-purple-800';
      case 'system':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const recentNotifications = notifications.slice(0, 5);
  const unreadNotifications = recentNotifications.filter(n => !n.read);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[10px] text-white font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Mark all as read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-accent transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDateTime(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-xs h-6"
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Mark as read
                            </Button>
                          )}
                          {notification.actionUrl && (
                            <Link href={notification.actionUrl} onClick={() => setIsOpen(false)}>
                              <Button variant="ghost" size="sm" className="text-xs h-6">
                                View
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t">
            <Link href="/notifications" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full" size="sm">
                View All Notifications
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

