export const projectMedia = Object.freeze({
  fluxo: [{ src: 'assets/fluxo-capa.webp', alt: 'Capa conceitual do Fluxo Inteligente, com caderno financeiro e fichas organizadas em um ateliê verde', width: 1672, height: 941, caption: 'Capa criada para o Fluxo Inteligente neste portfólio. Arte conceitual; não é uma captura do sistema.', source: 'https://github.com/ElzaDevs/fluxo_inteligente', sourceLabel: 'Conhecer o código no GitHub ↗' }],
  lacrei: [{ src: 'assets/lacrei-logo.jpeg', alt: 'Logo da Lacrei Saúde usado no repositório do desafio técnico', width: 133, height: 121, caption: 'Logo presente no repositório do desafio técnico de front-end.', source: 'https://github.com/ElzaDevs/lacrei-saude-frontend/blob/master/public/imagens/lacrei_logo.jpeg' }],
  mentalist: [
    { src: 'assets/mentalist-banner.webp', alt: 'Banner de The Mentalist com Patrick Jane e a equipe CBI', width: 1983, height: 793, caption: 'Banner publicado no repositório The Mentalist — CBI Selection.', source: 'https://github.com/ElzaDevs/The-Mentalist-CBI-Selection/blob/main/assets/banner-mentalista.jpg.png' },
    { src: 'assets/mentalist-github.webp', alt: 'Capa de The Mentalist com Patrick Jane e elementos de investigação', width: 1672, height: 940, caption: 'Segunda arte publicada no mesmo repositório do projeto.', source: 'https://github.com/ElzaDevs/The-Mentalist-CBI-Selection/blob/main/assets/patrick_mentalista.png' },
  ],
  doctorx: [{ src: 'assets/doctorx-preview.png', alt: 'Prévia do Doctor X com tela de acesso e temática médica em fundo escuro', width: 704, height: 395, caption: 'Prévia visual enviada pela autora. Projeto de Power BI em desenvolvimento.' }],
  atlas: [{ src: 'assets/atlas-logo.png', alt: 'Logotipo Atlas Skills em branco e roxo sobre fundo escuro, com três quadrados ascendentes', width: 151, height: 117, caption: 'Identidade visual do Atlas Skills, enviada pela autora.', source: 'https://github.com/EduardaAndrade16/Atlas-Skills', sourceLabel: 'Ver repositório da equipe ↗' }],
});

export function mountGallery({ document, window }) {
  const cleanups = [];
  const on = (target, type, fn) => { target.addEventListener(type, fn); cleanups.push(() => target.removeEventListener(type, fn)); };
  document.querySelectorAll('[data-cover-controls]').forEach(element => { element.hidden = false; });
  document.querySelectorAll('[data-cover-flip]').forEach(button => on(button, 'click', () => {
    const id = button.dataset.coverFlip;
    const stage = document.getElementById(`cover-stage-${id}`);
    const flipped = stage.classList.toggle('is-flipped');
    const front = document.getElementById(`cover-front-${id}`);
    const back = document.getElementById(`cover-back-${id}`);
    // Visibility is explicit: never expose the back of a transformed text surface.
    front.hidden = flipped; back.hidden = !flipped;
    front.setAttribute('aria-hidden', String(flipped)); back.setAttribute('aria-hidden', String(!flipped));
    stage.classList.remove('is-turning');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reduced && !document.body.classList.contains('motion-paused')) { void stage.offsetWidth; stage.classList.add('is-turning'); }
    button.setAttribute('aria-pressed', String(flipped));
    button.querySelector('span').textContent = flipped ? 'Voltar à capa' : 'Por trás do projeto';
  }));
  const dialog = document.getElementById('art-dialog');
  const image = document.getElementById('art-image');
  const caption = document.getElementById('art-caption');
  const counter = document.getElementById('art-counter');
  const next = document.getElementById('art-next');
  const previous = document.getElementById('art-previous');
  const close = document.getElementById('art-close');
  const source = document.getElementById('art-source');
  let media = [], current = 0, trigger;
  function showImage() {
    const item = media[current]; if (!item) return;
    image.src = item.src; image.alt = item.alt; image.width = item.width; image.height = item.height;
    caption.textContent = item.caption; source.hidden = !item.source;
    if (item.source) source.setAttribute('href', item.source); else source.removeAttribute('href');
    source.textContent = item.sourceLabel ?? 'Ver imagem no GitHub ↗';
    counter.textContent = `${current + 1} de ${media.length}`;
    previous.hidden = next.hidden = media.length < 2;
  }
  function change(delta) { if (!media.length) return; current = (current + delta + media.length) % media.length; showImage(); }
  function openMedia(id, returnFocus) {
    const items = projectMedia[id]; if (!items?.length) return false;
    media = items; current = 0; trigger = returnFocus; showImage(); dialog.showModal(); document.body.classList.add('dialog-open'); close.focus(); return true;
  }
  document.querySelectorAll('[data-art-open]').forEach(button => on(button, 'click', () => openMedia(button.dataset.artOpen, button)));
  on(next, 'click', () => change(1)); on(previous, 'click', () => change(-1)); on(close, 'click', () => dialog.close());
  on(dialog, 'keydown', event => { if (event.altKey || event.ctrlKey || event.metaKey) return; if (event.key === 'ArrowRight') { event.preventDefault(); change(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); change(-1); } });
  on(dialog, 'close', () => { if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open'); trigger?.focus(); });
  on(dialog, 'click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  return { openMedia, dispose() { cleanups.forEach(cleanup => cleanup()); } };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  const gallery = mountGallery({ document, window });
  window.addEventListener('pagehide', event => { if (!event.persisted) gallery.dispose(); });
}
