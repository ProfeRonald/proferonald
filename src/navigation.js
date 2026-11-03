export function observeHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const update = () => document.documentElement.style.setProperty('--header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
  update(); const observer = new ResizeObserver(update); observer.observe(header); return observer;
}
