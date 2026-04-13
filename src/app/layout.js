import './globals.css';

export const metadata = {
  title: 'CRM Агентов — Панель управления',
  description: 'CRM-система для управления агентами продаж и лидами',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
