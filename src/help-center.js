// Native details own FAQ expansion/collapse. Category links only reveal their target.
export function initHelpCenter(root) {
  if (!root) return null;
  const questions = new Map([...root.querySelectorAll('.faq-item[id]')].map(item => [item.id,item]));
  const links = [...root.querySelectorAll('[data-help-question]')];
  function reveal(id) {
    const question = questions.get(id);
    if (!question) return false;
    question.open = true;
    return true;
  }
  function revealHash() {
    try { return reveal(decodeURIComponent(window.location.hash.slice(1))); }
    catch { return false; }
  }
  root.addEventListener('click', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || (event.button !== undefined && event.button !== 0)) return;
    const link = event.target.closest('[data-help-question]');
    if (links.includes(link)) reveal(link.dataset.helpQuestion);
    // Let native fragment navigation update the URL and scroll without custom offsets.
  });
  window.addEventListener('hashchange', revealHash);
  revealHash();
  return { reveal };
}
