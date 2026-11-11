// Native grouped details handle toggling and keyboard interaction.
export function initHelpCenter(root) {
  if (!root) return null;
  const questions = new Map([...root.querySelectorAll('.faq-item[id]')].map(item => [item.id,item]));
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
  window.addEventListener('hashchange', revealHash);
  revealHash();
  return { reveal };
}
