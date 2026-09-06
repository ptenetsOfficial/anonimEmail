const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

const port = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, 'public');

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Слишком большой запрос'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Некорректный JSON'));
      }
    });
    request.on('error', reject);
  });
}

function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function handleSend(request, response) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return sendJson(response, 500, {
      error: 'Добавьте EMAIL_USER и EMAIL_PASSWORD в файл .env'
    });
  }

  let data;
  try {
    data = await readBody(request);
  } catch (error) {
    return sendJson(response, 400, { error: error.message });
  }

  const recipient = String(data.recipient || '').trim();
  const subject = String(data.subject || '').trim();
  const message = String(data.message || '').trim();

  if (!isEmail(recipient)) {
    return sendJson(response, 400, { error: 'Укажите корректный email получателя' });
  }
  if (!subject || subject.length > 200) {
    return sendJson(response, 400, { error: 'Тема обязательна и не должна быть длиннее 200 символов' });
  }
  if (!message || message.length > 50_000) {
    return sendJson(response, 400, { error: 'Сообщение обязательно и не должно быть длиннее 50 000 символов' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipient,
      subject,
      text: message
    });
    return sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error('SMTP error:', error.message);
    return sendJson(response, 502, {
      error: 'Gmail не принял письмо. Проверьте App Password и настройки аккаунта.'
    });
  }
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/api/config') {
    return sendJson(response, 200, {
      configured: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
      sender: process.env.EMAIL_USER || ''
    });
  }

  if (request.method === 'POST' && request.url === '/api/send') {
    return handleSend(request, response);
  }

  const requestedPath = request.url === '/' ? '/index.html' : request.url;
  const filePath = path.normalize(path.join(publicDir, requestedPath));
  if (!filePath.startsWith(publicDir)) {
    return sendJson(response, 404, { error: 'Not found' });
  }

  fs.readFile(filePath, (error, file) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return response.end('Not found');
    }
    const contentTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
    response.writeHead(200, { 'Content-Type': `${contentTypes[path.extname(filePath)] || 'application/octet-stream'}; charset=utf-8` });
    response.end(file);
  });
});

server.listen(port, () => {
  console.log(`Gmail sender is running at http://localhost:${port}`);
});