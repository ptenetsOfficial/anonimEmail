# anonimEmail

Локальный интерфейс для отправки писем через Gmail SMTP.

## Запуск

1. Создайте App Password в Google Account: **Security → 2-Step Verification → App passwords**.
2. Запишите данные в `.env`:

	```env
	EMAIL_USER=your-gmail@gmail.com
	EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
	```

3. Установите зависимости и запустите приложение:

	```bash
	npm install
	npm start
	```

4. Откройте `http://localhost:3000`.

Обычный пароль от Gmail не подходит: нужен именно App Password при включённой двухэтапной аутентификации. Файл `.env` игнорируется Git и не отправляется в репозиторий.

## Постоянный публичный запуск

Для работы без Codespace подключите этот GitHub-репозиторий к Render как **Web Service**. Файл `render.yaml` уже настроит сборку Docker-приложения. В настройках сервиса добавьте переменные `EMAIL_USER` и `EMAIL_PASSWORD`, затем Render выдаст публичный адрес вида `https://anonim-email.onrender.com`.
