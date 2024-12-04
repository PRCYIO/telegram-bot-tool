// Ваш телеграм токен от @BotFather
const TOKEN = '111:aaa';
const WEBHOOK = '/endpoint';
// Любые уникальные символы
const SECRET = '111abc';
// Ваш ключ с PR-CY.ru — https://a.pr-cy.ru/settings/api/
const API_KEY = '000';
// Модель ИИ для чата
const MODEL = 'gpt-4o';
// ID вашего ассистента https://pr-cy.ru/ai-tools/my-apps
const APP_ID = 1;

addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === WEBHOOK) {
    event.respondWith(handleWebhook(event));
  } else if (url.pathname === '/registerWebhook') {
    event.respondWith(registerWebhook(event, url, WEBHOOK, SECRET));
  } else if (url.pathname === '/unRegisterWebhook') {
    event.respondWith(unRegisterWebhook(event));
  } else {
    event.respondWith(new Response('No handler for this request'));
  }
});

async function handleWebhook(event) {
  if (event.request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== SECRET) {
    return new Response('Unauthorized', {status: 403});
  }

  const update = await event.request.json();
  event.waitUntil(onUpdate(update));

  return new Response('Ok');
}

async function onUpdate(update) {
  if ('message' in update) {
    await onMessage(update.message);
  }
}

async function createPRCYTask(text) {
  const response = await fetch('https://apis.pr-cy.ru/api/v2.1.0/tool-tasks/', {
    method: 'POST',
    headers: {
      authority: 'apis.pr-cy.ru',
      'Content-Type': 'application/vnd.api+json',
      'Api-Key': API_KEY,
    },
    body: JSON.stringify({
      data: {
        type: 'toolTasks',
        attributes: {
          toolName: 'aiTools',
          params: {
            aiToolId: APP_ID,
            aiToolVersion: 'draft',
            messages: [
              {
                role: 'user',
                text: text,
              },
            ],
            model: MODEL,
          },
        },
      },
    }),
  });

  const data = await response.json();
  return data;
}

async function checkPRCYResult(taskId) {
  const response = await fetch(
    `https://apis.pr-cy.ru/api/v2.1.0/tool-tasks/${taskId}?filter\[since\]=0&include=tests`,
    {
      headers: {
        authority: 'apis.pr-cy.ru',
        'Content-Type': 'application/vnd.api+json',
        'Api-Key': API_KEY,
      },
    }
  );

  const data = await response.json();
  return data;
}

async function onMessage(message) {
  if (message.text.startsWith('/start')) {
    return sendMarkdownV2Text(
      message.chat.id,
      escapeMarkdown('Привет! Я бот тех. поддержка PR-CY. Какой у вас вопрос?')
    );
  } else {
    try {
      // Сохраняем результат отправки сообщения "Думаю..."
      const thinkingMsg = await sendPlainText(message.chat.id, '⏳ Думаю...');

      const responseData = await createPRCYTask(message.text);
      const taskId = responseData.data?.id;

      let result = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        result = await checkPRCYResult(taskId);
        attempts++;

        if (result.included && result.included[0]?.attributes?.results?.message) {
          // Удаляем сообщение "Думаю..." перед отправкой результата
          await deleteMessage(message.chat.id, thinkingMsg.result.message_id);
          await sendPlainText(message.chat.id, result.included[0].attributes.results.message);
          return;
        }
      }

      // Удаляем сообщение "Думаю..." перед отправкой сообщения об ошибке
      await deleteMessage(message.chat.id, thinkingMsg.result.message_id);
      await sendPlainText(message.chat.id, '❌ Превышено время ожидания ответа.');
    } catch (error) {
      console.error('Error:', error);
      return sendPlainText(message.chat.id, '❌ Произошла ошибка при обработке запроса.');
    }
  }
}

async function deleteMessage(chatId, messageId) {
  return (
    await fetch(
      apiUrl('deleteMessage', {
        chat_id: chatId,
        message_id: messageId,
      })
    )
  ).json();
}

async function registerWebhook(event, requestUrl, suffix, secret) {
  const webhookUrl = `${requestUrl.protocol}//${requestUrl.hostname}${suffix}`;
  const r = await (
    await fetch(
      apiUrl('setWebhook', {
        url: webhookUrl,
        secret_token: secret,
      })
    )
  ).json();
  return new Response('ok' in r && r.ok ? 'Ok' : JSON.stringify(r, null, 2));
}

async function unRegisterWebhook(event) {
  const r = await (await fetch(apiUrl('setWebhook', {url: ''}))).json();
  return new Response('ok' in r && r.ok ? 'Ok' : JSON.stringify(r, null, 2));
}

function apiUrl(methodName, params = null) {
  let query = '';
  if (params) {
    query = '?' + new URLSearchParams(params).toString();
  }
  return `https://api.telegram.org/bot${TOKEN}/${methodName}${query}`;
}

async function sendPlainText(chatId, text) {
  return (
    await fetch(
      apiUrl('sendMessage', {
        chat_id: chatId,
        text,
      })
    )
  ).json();
}

async function sendMarkdownV2Text(chatId, text) {
  return (
    await fetch(
      apiUrl('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'MarkdownV2',
      })
    )
  ).json();
}

function escapeMarkdown(str, except = '') {
  const all = '_*[]()~`>#+-=|{}.!\\'.split('').filter((c) => !except.includes(c));
  const regExSpecial = '^$*+?.()|{}[]\\';
  const regEx = new RegExp(
    '[' + all.map((c) => (regExSpecial.includes(c) ? '\\' + c : c)).join('') + ']',
    'gim'
  );
  return str.replace(regEx, '\\$&');
}
