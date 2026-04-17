// instrumentation.js — запускается при старте сервера
export async function register() {
  // Только на сервере, не в edge
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Проверяем созвоны каждые 10 минут
    setInterval(async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const secret = process.env.CRON_SECRET || 'crm-reminder-2024';
        await fetch(`${baseUrl}/api/cron/reminders?secret=${secret}`);
        console.log('[Reminders] Check done at', new Date().toLocaleString('ru-RU', { timeZone: process.env.TZ || 'Asia/Yekaterinburg' }));
      } catch (e) {
        console.error('[Reminders] Error:', e.message);
      }
    }, 10 * 60 * 1000); // каждые 10 минут

    console.log('[Reminders] Timer started — checking every 10 min');
  }
}
