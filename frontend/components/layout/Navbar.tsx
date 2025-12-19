'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, User, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { logoutUser } from '@/lib/store/authSlice';

interface NavbarProps {
    onToggleSidebar: () => void;
}

const notifications = [
    { id: 1, title: 'New Pharmacy Registration', message: 'HealthPlus Pharmacy has registered', time: '5 min ago', read: false },
    { id: 2, title: 'Document Approved', message: 'Return receipt DOC-1025 approved', time: '15 min ago', read: false },
    { id: 3, title: 'Payment Processed', message: 'Payment PAY-5010 completed', time: '1 hour ago', read: true },
    { id: 4, title: 'Shipment Delivered', message: 'Shipment SH-1245 delivered successfully', time: '2 hours ago', read: true },
    { id: 5, title: 'New Marketplace Deal', message: 'Ibuprofen 200mg deal posted', time: '3 hours ago', read: true },
];

export function Navbar({ onToggleSidebar }: NavbarProps) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [notificationsList, setNotificationsList] = useState(notifications);

    const unreadCount = notificationsList.filter((n) => !n.read).length;

    const markAsRead = (id: number) => {
        setNotificationsList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    };

    const handleLogout = async () => {
        await dispatch(logoutUser());
        router.push('/login');
    };

    return (
        <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 h-16">
            <div className="flex items-center justify-between h-full px-4">
                <div className="flex items-center gap-4">
                    <button onClick={onToggleSidebar} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <Menu className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">PA</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">PharmAdmin</span>
                    </div>
                </div>

                <div className="flex-1 max-w-2xl mx-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Search pharmacies, payments, documents..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <Bell className="w-5 h-5 text-gray-700" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>
                            )}
                        </button>
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notificationsList.map((notification) => (
                                        <div key={notification.id} onClick={() => markAsRead(notification.id)} className={cn('px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors', !notification.read && 'bg-blue-50')}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                                                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                                </div>
                                                {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{user?.name || 'Admin User'}</span>
                        </button>
                        {showProfile && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <p className="font-medium text-gray-900">{user?.name || 'Admin User'}</p>
                                    <p className="text-sm text-gray-500">{user?.email || 'admin@pharmadmin.com'}</p>
                                </div>
                                <div className="py-1">
                                    <button onClick={() => setShowProfile(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                                        <Settings className="w-4 h-4" />Settings
                                    </button>
                                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                        <LogOut className="w-4 h-4" />Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
