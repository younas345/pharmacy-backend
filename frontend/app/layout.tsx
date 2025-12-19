'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { useState } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import StoreProvider from "@/components/providers/StoreProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="en" className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100`}
      >
        <StoreProvider>
          <ProtectedRoute>
            {!isLoginPage && (
              <>
                <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
                <Sidebar isCollapsed={sidebarCollapsed} />
              </>
            )}
            <main
              className={!isLoginPage ? `pt-16 transition-all duration-300 min-h-screen ${sidebarCollapsed ? 'ml-16' : 'ml-64'}` : ''}
            >
              {!isLoginPage && <div className="p-6">{children}</div>}
              {isLoginPage && children}
            </main>
          </ProtectedRoute>
        </StoreProvider>
      </body>
    </html>
  );
}
