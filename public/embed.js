/**
 * ============================================
 *  CRM EMBED КОД — ДЛЯ ВАШЕГО САЙТА
 * ============================================
 * 
 * Вставьте этот скрипт на страницу вашего сайта,
 * где расположена контактная форма.
 * 
 * Скрипт автоматически:
 * 1. Считывает параметр ?a=XXXXX из URL (код агента)
 * 2. Сохраняет его в localStorage (чтобы не потерять при навигации)
 * 3. При отправке формы — шлёт данные в CRM через webhook
 * 
 * НАСТРОЙКА:
 * - Замените CRM_URL на реальный URL вашей CRM
 * - Настройте ID полей формы (см. комментарии ниже)
 */

(function() {
  // ⚡ ЗАМЕНИТЕ НА URL ВАШЕЙ CRM НА RAILWAY
  var CRM_URL = 'https://YOUR-CRM-APP.railway.app';

  // Считываем код агента из URL (?a=12345)
  var params = new URLSearchParams(window.location.search);
  var agentCode = params.get('a');
  
  if (agentCode) {
    localStorage.setItem('crm_agent', agentCode);
    console.log('[CRM] Агент:', agentCode);
  }

  /**
   * Отправка лида в CRM
   * Вызовите эту функцию при отправке вашей формы
   * 
   * @param {object} data - Данные лида
   * @param {string} data.name - Имя клиента
   * @param {string} data.contactMethod - Способ связи (телефон, email, telegram и т.д.)
   * @param {string} data.projectDescription - Описание проекта
   * @param {string} data.budget - Бюджет
   */
  window.sendLeadToCRM = function(data) {
    var savedAgent = localStorage.getItem('crm_agent');
    
    var payload = {
      name: data.name || '',
      contactMethod: data.contactMethod || '',
      projectDescription: data.projectDescription || '',
      budget: data.budget || '',
      agentCode: savedAgent || '',
    };

    fetch(CRM_URL + '/api/leads/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    .then(function(res) { return res.json(); })
    .then(function(result) {
      console.log('[CRM] Лид отправлен:', result);
    })
    .catch(function(err) {
      console.error('[CRM] Ошибка отправки:', err);
    });
  };

  /**
   * === ПРИМЕР ИСПОЛЬЗОВАНИЯ ===
   * 
   * Вариант 1: Вызов вручную при submit формы
   * 
   *   document.getElementById('my-form').addEventListener('submit', function(e) {
   *     e.preventDefault();
   *     sendLeadToCRM({
   *       name: document.getElementById('name').value,
   *       contactMethod: document.getElementById('phone').value,
   *       projectDescription: document.getElementById('project').value,
   *       budget: document.getElementById('budget').value,
   *     });
   *     alert('Спасибо! Мы свяжемся с вами.');
   *   });
   * 
   * Вариант 2: Автопривязка к форме по ID
   *   - Раскомментируйте код ниже
   *   - Укажите ID вашей формы и полей
   */

  // --- АВТО-ПРИВЯЗКА (раскомментируйте если нужно) ---
  // document.addEventListener('DOMContentLoaded', function() {
  //   var form = document.getElementById('contact-form');
  //   if (!form) return;
  //   
  //   form.addEventListener('submit', function(e) {
  //     e.preventDefault();
  //     sendLeadToCRM({
  //       name: form.querySelector('[name="name"]').value,
  //       contactMethod: form.querySelector('[name="phone"]').value,
  //       projectDescription: form.querySelector('[name="project"]').value,
  //       budget: form.querySelector('[name="budget"]').value,
  //     });
  //     form.reset();
  //     alert('Спасибо! Мы свяжемся с вами.');
  //   });
  // });

})();
