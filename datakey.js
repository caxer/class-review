// 網站資料的加密：data.js 的內容先 gzip 壓縮，再用一把隨機的 AES-GCM 256 金鑰（資料金鑰）加密成 data.enc.json（v: 2）。
// 加密後的資料壓不下來，所以要先壓縮；舊的 v: 1（沒有壓縮）照樣解得開。
// 資料金鑰本身用密碼鎖在 key.json（見 keybox.js）；發布的電腦記在 .local/data-key（見 lib/site-key.mjs）。
const b64 = bytes => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
const importKey = (keyB64, usage) => crypto.subtle.importKey('raw', unb64(keyB64), 'AES-GCM', false, [usage]);
const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

export const newDataKey = () => b64(crypto.getRandomValues(new Uint8Array(32)));

export async function encryptData(keyB64, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const packed = await pipe(new TextEncoder().encode(text), new CompressionStream('gzip'));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await importKey(keyB64, 'encrypt'), packed));
  return { v: 2, iv: b64(iv), data: b64(data) };
}

// 金鑰不對（換過金鑰、或內容被改過）時丟出錯誤（OperationError）
export async function decryptData(keyB64, box) {
  if (box?.v !== 1 && box?.v !== 2) throw new Error('網站資料的格式看不懂，請重新整理。');
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, await importKey(keyB64, 'decrypt'), unb64(box.data)));
  return new TextDecoder().decode(box.v === 2 ? await pipe(plain, new DecompressionStream('gzip')) : plain);
}
