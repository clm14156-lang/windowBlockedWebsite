// Fill these public URLs when the release and checkout are ready.
// Empty values keep the download and membership pages in an explicit preview state.
export const siteConfig = {
  name: '专注时光',
  origin: '',
  downloadUrl: '',
  checkoutUrl: '',
  version: '',
  accountApiBaseUrl: '',
};

export function accountApiOrigin(value, allowLoopbackHttp = false) {
  try {
    const url = new URL(value);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(allowLoopbackHttp && loopback && url.protocol === 'http:')) return '';
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return '';
    return url.origin;
  } catch { return ''; }
}

export function publicUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
}
