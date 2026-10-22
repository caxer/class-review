// Synchronize Tabler's color mode before paint; works under HTTP and file://.
(() => {
  const root = document.documentElement;
  const media = matchMedia('(prefers-color-scheme: dark)');
  const sync = () => {
    const mode = root.dataset.theme;
    root.dataset.bsTheme = mode === 'light' || mode === 'dark' ? mode : media.matches ? 'dark' : 'light';
  };
  sync();
  media.addEventListener('change', sync);
  new MutationObserver(sync).observe(root, {attributes:true, attributeFilter:['data-theme']});
})();
