export const heroThemes = [
  { id: 'day', label: '白天', background: '/assets/white_background01.png', character: '/assets/juese/white_boy01.png', greeting: '下午好', note: '把这一段时间，留给重要的事。' },
  { id: 'night', label: '夜晚', background: '/assets/dark_background02.png', backgroundWebp: '/assets/dark_background02.webp', character: '/assets/juese/dark_boy01.png', greeting: '晚上好', note: '今天认真付出的你，值得一句辛苦了。' },
];

// Theme and character previews share decoded loading, state and transition handling.
export function initHeroTheme(root, { characters = [], defaultCharacter = characters[0]?.id, initialComparison = false } = {}) {
  if (!root) return null;
  const preview = root.querySelector('[data-hero-theme]');
  const buttons = [...root.querySelectorAll('[data-hero-mode]')];
  const layers = [...root.querySelectorAll('[data-hero-scene]')];
  if (!preview || buttons.length !== heroThemes.length || layers.length !== heroThemes.length) return null;
  const hasCharacters = characters.length > 0;
  const characterButtons = hasCharacters ? [...root.querySelectorAll('[data-character-select]')] : [];
  const characterImages = hasCharacters ? [...root.querySelectorAll('[data-character-image]')] : [];
  const thumbnails = hasCharacters ? [...root.querySelectorAll('[data-theme-thumbnail]')] : [];
  if (hasCharacters && (!characters.some(item => item.id === defaultCharacter) || characterButtons.length !== characters.length)) return null;
  const greeting = root.querySelector('[data-hero-greeting]');
  const note = root.querySelector('[data-hero-greeting-note]');
  const status = root.querySelector('[data-hero-theme-status]');
  let current = 'day', currentCharacter = hasCharacters ? defaultCharacter : null, request = 0;
  let comparing = initialComparison;
  let wanted = { theme: current, character: currentCharacter, comparison: comparing };

  function announceError(message) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('is-error', true);
  }
  function busy(theme = current, character = currentCharacter) {
    buttons.forEach(button => button.setAttribute('aria-busy', String(theme !== current && button.dataset.heroMode === theme)));
    characterButtons.forEach(button => button.setAttribute('aria-busy', String(character !== currentCharacter && button.dataset.characterSelect === character)));
  }
  function render(theme, characterId, announce = true, comparison = comparing) {
    current = theme.id;
    currentCharacter = characterId;
    comparing = comparison;
    preview.dataset.heroTheme = theme.id;
    if (initialComparison) preview.dataset.heroComparison = String(comparing);
    layers.forEach(layer => {
      const active = comparing || layer.dataset.heroScene === theme.id;
      layer.classList.toggle('is-active', active);
      layer.setAttribute('aria-hidden', String(!active));
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.heroMode === theme.id)));
    if (greeting) greeting.textContent = theme.greeting;
    if (note) note.textContent = theme.note;
    const character = characters.find(item => item.id === characterId);
    if (character) {
      preview.dataset.character = character.id;
      preview.setAttribute('aria-label', `${comparing ? '白天与夜晚主题对比' : theme.label+'主题'}，${character.name}专注界面预览`);
      characterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.characterSelect === character.id)));
      characterImages.forEach(image => image.classList.toggle('is-selected', image.dataset.characterImage === character.id));
      thumbnails.forEach(thumbnail => thumbnail.classList.toggle('is-active', thumbnail.dataset.themeThumbnail === theme.id));
    }
    if (status) {
      status.classList.toggle('is-error', false);
      if (announce) status.textContent = character ? `已选择${character.name}，${comparing ? '白天与夜晚主题对比' : theme.label+'主题'}` : `已切换到${theme.label}模式`;
    }
  }
  async function ready(image) {
    if (image.decode) await image.decode();
    else if (!image.complete) await new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', reject, { once: true });
    });
    if (image.naturalWidth === 0) throw new Error('Artwork did not load');
  }
  async function change(themeId, characterId, comparison = wanted.comparison) {
    const theme = heroThemes.find(item => item.id === themeId);
    const character = characters.find(item => item.id === characterId);
    if (!theme || hasCharacters && !character) return false;
    const ticket = ++request;
    const missingTheme = character && (comparison ? heroThemes : [theme]).find(item => !character.artwork[item.id]);
    if (missingTheme) {
      wanted = { theme: current, character: currentCharacter, comparison: comparing };
      busy();
      announceError(`${character.name}暂无${missingTheme.label}素材，请选择其他角色或主题。`);
      return false;
    }
    wanted = { theme: themeId, character: characterId, comparison };
    busy(themeId, characterId);
    if (current === themeId && currentCharacter === characterId && comparing === comparison) return true;
    try {
      const shownLayers = comparison ? layers : layers.filter(item => item.dataset.heroScene === themeId);
      const images = shownLayers.flatMap(layer => [...layer.querySelectorAll('img')].filter(image => !image.dataset?.characterImage || image.dataset.characterImage === characterId));
      if (hasCharacters) {
        if (!images.some(image => image.dataset?.characterImage === characterId)) throw new Error('Character scene is missing');
        thumbnails.filter(thumbnail => comparison || thumbnail.dataset.themeThumbnail === themeId).forEach(thumbnail => images.push(...thumbnail.querySelectorAll('img')));
      }
      await Promise.all(images.map(ready));
      if (ticket !== request) return false;
      render(theme, characterId, true, comparison);
      return true;
    } catch {
      if (ticket === request) {
        wanted = { theme: current, character: currentCharacter, comparison: comparing };
        announceError(`${theme.label}${character ? ` · ${character.name}` : ''}图片暂未加载成功，请重试。`);
      }
      return false;
    } finally {
      if (ticket === request) busy();
    }
  }
  const select = id => change(id, wanted.character, false);
  const selectCharacter = id => change(wanted.theme, id);
  root.addEventListener('click', event => {
    const characterButton = event.target.closest('[data-character-select]');
    const button = event.target.closest('[data-hero-mode]');
    if (characterButtons.includes(characterButton)) void selectCharacter(characterButton.dataset.characterSelect);
    else if (buttons.includes(button)) void select(button.dataset.heroMode);
  });
  root.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    const characterButton = event.target.closest('[data-character-select]');
    const isCharacter = characterButtons.includes(characterButton);
    const button = isCharacter ? characterButton : event.target.closest('[data-hero-mode]');
    const controls = isCharacter ? characterButtons : buttons;
    if (!controls.includes(button)) return;
    event.preventDefault();
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : (controls.indexOf(button) + (event.key === 'ArrowLeft' ? controls.length - 1 : 1)) % controls.length;
    controls[index].focus({ preventScroll: true });
    if (isCharacter) {
      controls[index].scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      void selectCharacter(controls[index].dataset.characterSelect);
    } else void select(controls[index].dataset.heroMode);
  });
  render(heroThemes[0], currentCharacter, false);
  return { select, selectCharacter, getState: () => ({ theme: current, character: currentCharacter }) };
}
