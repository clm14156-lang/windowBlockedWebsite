// Fill these public URLs when the release and checkout are ready.
// Empty values keep the download and membership pages in an explicit preview state.
export const siteConfig = {
  name: '专注时光',
  origin: '',
  downloadUrl: '',
  checkoutUrl: '',
  version: '',
};

export function publicUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
}
