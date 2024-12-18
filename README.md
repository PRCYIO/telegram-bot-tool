# AI Telegram Bot

## Описание

Данный проект позволяет создать Telegram-бота, который взаимодействует с вашим ассистентом, созданным на платформе [PR-CY](https://pr-cy.ru/ai-tools/my-apps). Бот будет хоститься на сервисе Cloudflare.

## Установка и настройка

### Шаг 1: Создание ассистента

1. Перейдите на [PR-CY](https://pr-cy.ru/ai-tools/my-apps).
2. Создайте ассистента, укажите роль, можете загрузить базу данных.
3. Убедитесь, что ассистент работает корректно в веб-интерфейсе.

### Шаг 2: Создание воркера на Cloudflare

1. Войдите в свой аккаунт Cloudflare.
2. Перейдите в раздел **Workers & Pages**.
3. На странице **Overview** нажмите кнопку **Create**.
4. Введите название вашего воркера (это имя не повлияет на функциональность).
5. Нажмите **Deploy**.

### Шаг 3: Настройка кода

1. Откройте код в index.js.
2. Вставьте его в редактор вашего воркера на Cloudflare.
3. Заполните переменные:

   - `TOKEN`: Токен вашего Telegram-бота от BotFather
   - `SECRET`: Любой ваш секретный ключ
   - `API_KEY`: Ваш ключ от PR-CY
   - `MODEL`: Выберите модель ИИ для чата
   - `APP_ID`: Ваш ID ассистента в ИИ приложениях.

### Шаг 4: Регистрация вебхука

1. Перейдите по URL вашего приложения: `https://имя.workers.dev/registerWebhook`.
2. Откройте ваш бот в Telegram и проверьте его работу.

## Замечания

- Вы можете создавать любых ботов под свои нужды и делиться ими с командой.
- Имейте в виду, что использование бота будет расходовать ваши лимиты.
- API доступно только на тарифе - Агенство.

