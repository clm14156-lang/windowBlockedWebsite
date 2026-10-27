// Native buttons, roving focus and one accessible panel; no scroll interception.
export function initProductTabs(root, tabSelector, panelSelector, { onSelect } = {}) {
  if (!root) return null;
  const tabs = [...root.querySelectorAll(tabSelector)];
  const panels = [...root.querySelectorAll(panelSelector)];
  if (!tabs.length || tabs.length !== panels.length) return null;
  let current = 0;
  function select(index, focus = false) {
    current = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, i) => {
      const active = i === current;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.classList.toggle('is-active', active);
      panels[i].classList.toggle('is-active', active);
      panels[i].setAttribute('aria-hidden', String(!active));
      panels[i].inert = !active;
    });
    onSelect?.(current);
    if (focus) tabs[current].focus({ preventScroll: true });
  }
  root.addEventListener('click', event => {
    const tab = event.target.closest(tabSelector);
    if (tabs.includes(tab)) select(tabs.indexOf(tab));
  });
  root.addEventListener('keydown', event => {
    const tab = event.target.closest(tabSelector);
    if (!tabs.includes(tab) || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    event.preventDefault();
    select(event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : current + (['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1), true);
  });
  select(0);
  return { select };
}
