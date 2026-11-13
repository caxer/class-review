// 網站現場出題：學生按「開始測驗」時，用官方 SDK 從瀏覽器直接呼叫 Claude API 出新的相似題（做法和 scan-solver 相同）。
// API 設定（key、模型、思考強度）跟網站資料一起加密，輸入網站密碼解開後才拿得到；本機預覽沒有設定，只用預備題庫。
// 出題指示和本機預備題庫共用 practice.js，出來的題目格式也相同。
import Anthropic from './vendor/anthropic-sdk.js';
import { PRACTICE, practiceParts, cleanPractice, extractJson } from './practice.js';
import { modelInfo, liveEffort } from './models.js';

const FALLBACK = { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' };
const fail = (message, code = '') => Object.assign(new Error(message), { code });

// 這一科可以現場出的題型
export const liveCategories = subject => Object.keys(PRACTICE[subject] || {});

// 把 want 題分給幾個「單元＋題型」，最多同時送 4 個請求；閱讀題一次至少一篇文章 3 題
export function planJobs(slots, want) {
  const chosen = slots.slice(0, Math.min(slots.length, want, 4));
  return chosen.map((slot, i) => {
    const share = Math.floor(want / chosen.length) + (i < want % chosen.length ? 1 : 0);
    return { ...slot, count: PRACTICE[slot.subject][slot.category].passages ? Math.max(3, share) : share };
  });
}

// 一次出題的 Messages API 參數：單元內容與解析規則放 system（同一單元同一題型可以快取），這次要出的題目放 user
export function buildRequest({ ai, subject, data, category, count }) {
  const parts = practiceParts(subject, data, category, count);
  return {
    model: modelInfo(ai.model).model,
    max_tokens: 32000,
    output_config: { effort: liveEffort(ai.effort, subject) },
    system: [{ type: 'text', text: `${parts.context}\n${parts.rules}`, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: parts.task }],
  };
}

function apiFailure(e) {
  if (e instanceof Anthropic.APIUserAbortError) return fail('已經停止出題。', 'aborted');
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) return fail('API key 已經失效，請家長到維護頁重新設定並發布', 'key');
  if (e instanceof Anthropic.NotFoundError) return fail('這把 API key 不能使用設定的模型', 'key');
  if (e instanceof Anthropic.RateLimitError) return fail('Claude 的用量暫時滿了', 'busy');
  if (e instanceof Anthropic.BadRequestError) return fail(`Claude 不接受這次的請求：${e.error?.error?.message || e.message}`, 'request');
  if (e instanceof Anthropic.APIConnectionError) return fail('連不到 Claude', 'offline');
  if (e instanceof Anthropic.APIError) {
    if (e.status === 402) return fail('Claude API 帳戶的額度或付款有問題', 'key');
    if (e.status === 529 || e.status >= 500) return fail('Claude 現在很忙', 'busy');
    return fail(`Claude 回應錯誤（${e.status ?? '串流中斷'}）`, 'api');
  }
  return e;
}

// 出一批題目 → { questions, passages, model, usage }；onText 每次拿到目前為止的回覆全文
export async function generatePractice({ ai, subject, data, category, count, signal, onText }) {
  const info = modelInfo(ai.model);
  const params = buildRequest({ ai, subject, data, category, count });
  const client = new Anthropic({ apiKey: ai.apiKey, dangerouslyAllowBrowser: true });
  const stream = info.fallback ? client.beta.messages.stream({ ...params, ...FALLBACK }, { signal }) : client.messages.stream(params, { signal });
  let text = '';
  stream.on('text', delta => { text += delta; onText?.(text); });
  let message;
  try { message = await stream.finalMessage(); }
  catch (e) { throw apiFailure(e); }
  if (message.stop_reason === 'refusal') throw fail('Claude 沒有出這一批題目', 'refused');
  if (message.stop_reason === 'max_tokens') throw fail('Claude 的回覆被截斷', 'truncated');
  // 題目 id 以 v 開頭，和預備題庫的 x1、x2… 分開；同一台裝置上不會重複
  const tag = `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const made = cleanPractice(extractJson(text), { subject, category, data, tag, id: n => `${tag}-${n}` });
  if (!made.questions.length) throw fail('這批沒有可用的新題目', 'empty');
  return { questions: made.questions, passages: made.passages, model: message.model, usage: message.usage };
}
