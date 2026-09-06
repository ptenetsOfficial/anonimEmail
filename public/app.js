const form = document.querySelector('#compose-form');
const status = document.querySelector('#status');
const sender = document.querySelector('#sender');
const connection = document.querySelector('.connection');
const button = form.querySelector('button');

fetch('/api/config')
  .then((response) => response.json())
  .then((config) => {
    if (config.configured) {
      sender.textContent = config.sender;
      connection.classList.add('ready');
    } else {
      sender.textContent = 'нужны настройки .env';
      connection.classList.add('error');
    }
  })
  .catch(() => {
    sender.textContent = 'сервер недоступен';
    connection.classList.add('error');
  });

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  button.disabled = true;
  status.className = 'status';
  status.textContent = 'Отправляем...';

  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Не удалось отправить письмо');
    form.reset();
    status.textContent = 'Письмо отправлено';
  } catch (error) {
    status.className = 'status error';
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});