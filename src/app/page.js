'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          if (data.user.role === 'ADMIN') {
            router.replace('/admin');
          } else {
            router.replace('/dashboard');
          }
        } else {
          router.replace('/login');
        }
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  return (
    <div className="loading-page">
      <div className="spinner" style={{ width: 40, height: 40 }}></div>
    </div>
  );
}
