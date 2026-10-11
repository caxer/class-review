// 發布版網頁的入口：網站資料是加密的，先輸入密碼解開資料金鑰，解密 data.enc.json，再執行主程式。
// 解開的資料金鑰記在這台裝置的瀏覽器，之後打開不用再輸入；網站資料換金鑰時才會再問一次。
// 主程式在 index.html 裡是 <script type="text/plain" id="app-main">（scripts/build-site.mjs 轉的），這裡解開後才執行。
import { unlockText } from './keybox.js';
import { decryptData } from './datakey.js';

const STORE = 'class-review.data-key';
const stored = () => { try { return localStorage.getItem(STORE) || ''; } catch { return ''; } };
const remember = key => { try { localStorage.setItem(STORE, key); } catch { /* 無痕視窗：這次開著時有效 */ } };
const forget = () => { try { localStorage.removeItem(STORE); } catch { /* 沒有儲存空間 */ } };

async function getJson(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`讀不到 ${path}（${res.status}）`);
  return res.json();
}

function start(data) {
  window.__CLASS_SHARE__ = data;
  const main = document.getElementById('app-main');
  const script = document.createElement('script');
  script.textContent = main.textContent;
  main.after(script);
  document.getElementById('unlock')?.remove();
}

async function open(key) {
  const text = await decryptData(key, await getJson('data.enc.json'));
  return JSON.parse(text);
}

function showForm(message = '') {
  const box = document.createElement('div');
  box.id = 'unlock';
  box.innerHTML = `<style>
#unlock { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 16px; background: var(--bg, #eaf6f4); font-family: var(--font-ui, system-ui, sans-serif); color: var(--ink, #1f3436); }
#unlock form { width: min(100%, 380px); display: grid; gap: 12px; padding: 24px 20px; border-radius: var(--r-card, 20px); background: var(--paper, #fff); border: 1px solid var(--line, #cfe3e0); }
#unlock h1 { margin: 0; font-size: 1.4rem; text-align: center; }
#unlock p { margin: 0; color: var(--muted, #5d7476); font-size: .9rem; text-align: center; }
#unlock .row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
#unlock input { min-width: 0; min-height: 46px; padding: 8px 12px; border: 1.5px solid var(--line, #cfe3e0); border-radius: var(--r-btn, 14px); background: var(--bg, #eaf6f4); color: inherit; font: inherit; font-size: max(16px, 1em); }
#unlock input:focus-visible { outline: 2px solid var(--accent, #0d7f86); outline-offset: 1px; }
#unlock button { min-height: 46px; padding: 6px 18px; border: 0; border-radius: var(--r-btn, 14px); background: var(--accent, #0d7f86); color: var(--accent-ink, #fff); font: inherit; font-weight: 700; cursor: pointer; }
#unlock button:disabled { opacity: .6; }
#unlock .error { color: var(--red, #e5534b); }
</style>
<form>
  <h1>興儒私中班</h1>
  <p>輸入密碼開始複習</p>
  <div class="row">
    <input type="password" id="unlock-password" autocomplete="current-password" aria-label="密碼" required>
    <button type="submit" id="unlock-submit">進入</button>
  </div>
  <p class="error" id="unlock-error" role="alert"${message ? '' : ' hidden'}></p>
</form>`;
  document.body.append(box);
  box.querySelector('#unlock-error').textContent = message;
  const form = box.querySelector('form'), button = box.querySelector('#unlock-submit'), error = box.querySelector('#unlock-error');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    button.disabled = true;
    button.textContent = '解鎖中…';
    error.hidden = true;
    try {
      const file = await getJson('key.json');
      const password = box.querySelector('#unlock-password').value;
      // 舊版 key.json 還有管理員那份，管理員密碼也能進入
      const secrets = await unlockText(file.user, password).catch(e => file.admin ? unlockText(file.admin, password) : Promise.reject(e));
      const { dataKey } = JSON.parse(secrets);
      const data = await open(dataKey);
      remember(dataKey);
      start(data);
    } catch (err) {
      error.hidden = false;
      error.textContent = /密碼不對/.test(err.message) ? '密碼不對。' : `打不開網站資料：${err.message}`;
    } finally { button.disabled = false; button.textContent = '進入'; }
  });
  box.querySelector('#unlock-password').focus();
}

const key = stored();
if (key) {
  open(key).then(start, err => {
    // 解不開才代表換了金鑰；連不上網路時保留記住的金鑰
    if (err?.name === 'OperationError') { forget(); showForm('網站資料換了新的密碼設定，請重新輸入密碼。'); }
    else showForm(`讀不到網站資料，請確認網路後重新整理。（${err.message}）`);
  });
} else showForm();
