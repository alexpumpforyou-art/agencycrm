'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo">🔒</div>
        <h1>Регистрация закрыта</h1>
        <p className="subtitle">Аккаунты агентов создаются администратором</p>
        <p className="text-center text-sm mt-16">
          <a href="/login">Перейти к входу</a>
        </p>
      </div>
    </div>
  );
}
