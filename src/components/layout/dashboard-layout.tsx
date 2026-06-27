'use client';

import dynamic from 'next/dynamic';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

// Ленивая загрузка AppGuide — не критичен для первого рендера
const AppGuide = dynamic(() => import('@/components/ui/app-guide').then(m => ({ default: m.AppGuide })), {
  ssr: false,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, setUser } = useAuthStore();
  const { setTheme } = useThemeStore();

  // Auth check выполняется в middleware — здесь только загрузка данных пользователя
  // без блокировки рендера (пользователь уже прошёл middleware-проверку)
  useEffect(() => {
    if (!user) {
      fetch('/api/auth/me')
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data) {
            setUser(data.data);
          }
        })
        .catch(() => {});
    }
  }, [user, setUser]);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored) setTheme(stored as 'light' | 'dark');
  }, [setTheme]);

  return (
    <div className="min-h-screen" style={{background: 'var(--gradient-background)'}}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6">
          <Breadcrumbs />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      <AppGuide />
    </div>
  );
}
