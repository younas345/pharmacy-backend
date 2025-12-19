'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Building2,
    Truck,
    ShoppingCart,
    Package,
    FileText,
    CreditCard,
    BarChart3,
    Settings,
    Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarLinks = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/pharmacies', icon: Building2, label: 'Pharmacies' },
    { href: '/distributors', icon: Truck, label: 'Distributors' },
    { href: '/marketplace', icon: ShoppingCart, label: 'Marketplace' },
    { href: '/shipments', icon: Package, label: 'Shipments' },
    { href: '/documents', icon: FileText, label: 'Documents' },
    { href: '/payments', icon: CreditCard, label: 'Payments' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/settings', icon: Settings, label: 'Settings' },
    { href: '/admins', icon: Users, label: 'Admins' },
];

interface SidebarProps {
    isCollapsed: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                'bg-[#1e293b] text-[#cbd5e1] h-screen fixed left-0 top-16 transition-all duration-300 z-40',
                isCollapsed ? 'w-16' : 'w-64'
            )}
        >
            <div className="p-4">
                <nav className="space-y-1">
                    {sidebarLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                                    'hover:bg-[#334155]',
                                    isActive && 'bg-[#334155] text-[#4CAF50]',
                                    isCollapsed && 'justify-center'
                                )}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!isCollapsed && (
                                    <span className="text-sm font-medium">{link.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
