// 網站資料的加密：data.js 的內容用一把隨機的 AES-GCM 256 金鑰（資料金鑰）加密成 data.enc.json。
// 資料金鑰本身用密碼鎖在 key.json（見 keybox.js）；發布的電腦記在 .local/data-key（見 scripts/site-key.mjs）。
const b64 = bytes => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
const importKey = (keyB64, usage) => crypto.subtle.importKey('raw', unb64(keyB64), 'AES-GCM', false, [usage]);

export const newDataKey = () => b64(crypto.getRandomValues(new Uint8Array(32)));

export async function encryptData(keyB64, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await importKey(keyB64, 'encrypt'), new TextEncoder().encode(text)));
  return { v: 1, iv: b64(iv), data: b64(data) };
}

// 金鑰不對（換過金鑰、或內容被改過）時丟出錯誤
export async function decryptData(keyB64, box) {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, await importKey(keyB64, 'decrypt'), unb64(box.data));
  return new TextDecoder().decode(plain);
}
