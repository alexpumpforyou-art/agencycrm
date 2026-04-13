export async function sendTelegramNotification(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  
  if (!token || !chatId) {
    console.log('[Telegram] Bot not configured, skipping notification:', message);
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!res.ok) {
      console.error('[Telegram] Failed to send message:', await res.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Telegram] Error:', error);
    return false;
  }
}

export function formatNewLeadMessage(lead, agentCode) {
  return [
    '🔔 <b>Новый лид!</b>',
    '',
    `👤 Имя: ${lead.name}`,
    `📱 Связь: ${lead.contactMethod}`,
    `💼 Проект: ${lead.projectDescription || '—'}`,
    `💰 Бюджет: ${lead.budget || '—'}`,
    '',
    `🔗 Агент: <b>${agentCode}</b>`,
    `📅 ${new Date().toLocaleString('ru-RU')}`,
  ].join('\n');
}
