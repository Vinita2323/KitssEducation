// Saves can close an editor before its invoker's loading state clears.
// Wait for that control to become enabled, without stealing subsequent focus.
export function restoreFocus(previous, editor) {
  const idle = () => document.activeElement === document.body ||
    document.activeElement === previous || editor?.contains(document.activeElement);
  if (!previous?.isConnected) {
    const heading = document.querySelector('.kitss-admin main h1');
    if (idle() && heading) { heading.tabIndex = -1; heading.focus(); }
    return;
  }
  const focus = () => {
    if (!idle()) return true;
    if (previous?.isConnected && !previous.matches(':disabled')) {
      previous.focus(); return document.activeElement === previous;
    }
    return false;
  };
  // Synchronous restoration also preserves the invoker across React StrictMode's
  // setup/cleanup/setup check when a dialog first mounts.
  if (focus()) return;
  requestAnimationFrame(() => {
    if (!idle()) return;
    if (focus()) return;
    const observer = new MutationObserver(() => {
      if (focus()) { observer.disconnect(); clearTimeout(timeout); }
    });
    if (previous?.isConnected) observer.observe(previous, { attributes: true, attributeFilter: ['disabled'] });
    const timeout = setTimeout(() => {
      observer.disconnect();
      if (!idle()) return;
      const heading = document.querySelector('.kitss-admin main h1');
      if (heading) { heading.tabIndex = -1; heading.focus(); }
    }, 5000);
  });
}
