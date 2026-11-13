// 網站現場出題可選的 Claude 模型與思考強度（和 scan-solver 的設定相同）；維護頁、發布與網頁共用。
// fallback：被安全分類器婉拒時由 API 改用備援模型（Claude Haiku 5.5 沒有伺服器端備援）
export const MODELS = [
  { id: 'haiku', model: 'claude-haiku-5-5', label: 'Haiku 5.5', hint: '快速', fallback: false },
  { id: 'sonnet', model: 'claude-sonnet-5-5', label: 'Sonnet 5.5', hint: '平衡', fallback: true },
  { id: 'opus', model: 'claude-opus-5-5', label: 'Opus 5.5', hint: '最強', fallback: true },
];
export const EFFORTS = ['low', 'medium', 'high'];
export const DEFAULT_MODEL = 'haiku';
export const DEFAULT_EFFORT = 'medium';
export const modelInfo = id => MODELS.find(m => m.id === id) || MODELS.find(m => m.id === DEFAULT_MODEL);
// 數學題要自己驗算，和本機預備題庫一樣固定用 high
export const liveEffort = (effort, subject) => subject === 'math' ? 'high' : EFFORTS.includes(effort) ? effort : DEFAULT_EFFORT;
