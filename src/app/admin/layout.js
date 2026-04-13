'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data.user || data.user.role !== 'ADMIN') {
          router.replace(data.user ? '/dashboard' : '/login');
          return;
        }
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  if (loading) {
    return <div className="loading-page"><div className="spinner" style={{ width: 40, height: 40 }}></div></div>;
  }

  const navItems = [
    { href: '/admin', label: '📊 Обзор', exact: true },
    { href: '/admin/agents', label: '👥 Агенты' },
    { href: '/admin/leads', label: '📋 Все лиды' },
    { href: '/admin/materials', label: '📦 Материалы' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>⚡ CRM Admin</h2>
          <div className="agent-code">{user?.email}</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <button
                key={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => router.push(item.href)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-link" onClick={handleLogout}>🚪 Выйти</button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
