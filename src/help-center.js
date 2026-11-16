import { icon } from './icons.js';

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

export function renderHelpContact() {
  return `<section>
    <header class="help-contact-heading">
      <h2 id="dialog-title" tabindex="-1" data-dialog-focus>联系我们</h2>
      <p id="help-contact-subtitle">如有使用问题、账号或订单问题，欢迎联系我们。</p>
    </header>
    <div class="help-contact-wechat">
      <div class="help-contact-qr">
        <img src="/assets/help-qr-placeholder.png" width="192" height="192" alt="" />
        <span>二维码占位</span>
      </div>
      <h3>微信扫码联系客服</h3>
    </div>
    <div class="help-contact-email">
      <span class="help-contact-mail-icon" aria-hidden="true">${icon('mail')}</span>
      <div><h3>官方联系邮箱</h3><p>support@example.com</p></div>
    </div>
  </section>`;
}
