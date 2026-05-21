// src/pages/api/callback.ts
// Серверный endpoint для формы «Обратный звонок»
// Работает только при output: 'hybrid' + @astrojs/node

export const prerender = false;

import type { APIRoute } from 'astro';

const TG_TOKEN    = import.meta.env.TG_BOT_TOKEN       ?? '';
const TG_CHAT     = import.meta.env.TG_CHAT_ID         ?? '';
const RC_SECRET   = import.meta.env.RECAPTCHA_SECRET   ?? '';
const RC_MIN_SCORE = 0.4; // минимальный score reCAPTCHA v3

// ── Helpers ──────────────────────────────────────────────

function getDigits(s: string): string {
  return s.replace(/\D/g, '');
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!RC_SECRET) return true; // если ключ не задан — пропускаем
  if (!token)     return false;
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({ secret: RC_SECRET, response: token }),
    });
    const data = await res.json() as { success: boolean; score?: number; action?: string };
    return data.success && (data.score ?? 0) >= RC_MIN_SCORE;
  } catch {
    return false;
  }
}

async function sendTelegram(phone: string): Promise<boolean> {
  if (!TG_TOKEN || !TG_CHAT) {
    console.error('[callback] TG_BOT_TOKEN или TG_CHAT_ID не заданы в .env');
    return false;
  }
  const text = [
    '📞 *Заявка на обратный звонок*',
    '',
    `Телефон: \`${phone}\``,
    '',
    `Сайт: thepetcare.ru`,
  ].join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'Markdown' }),
    });
    const data = await res.json() as { ok: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

// ── Handler ───────────────────────────────────────────────

export const POST: APIRoute = async ({ request }) => {
  // Парсим тело
  let body: { phone?: string; recaptchaToken?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const phone           = (body.phone           ?? '').trim();
  const recaptchaToken  = (body.recaptchaToken   ?? '').trim();

  // Валидация номера
  if (getDigits(phone).length < 11) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_phone' }), {
      status: 422, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Проверка reCAPTCHA
  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) {
    return new Response(JSON.stringify({ ok: false, error: 'captcha_failed' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Отправка в Telegram
  const sent = await sendTelegram(phone);
  if (!sent) {
    return new Response(JSON.stringify({ ok: false, error: 'telegram_error' }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
