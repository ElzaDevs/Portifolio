export const topics = Object.freeze({
  backend: { label: 'BACKEND / DA IDEIA À REGRA', text: 'APIs, regras de negócio e organização do código. No Fluxo Inteligente, impacto e urgência ajudam a definir uma prioridade.', href: '#laboratorio', action: 'Experimentar a regra ↗' },
  dados: { label: 'DADOS / CUIDADO COM A INFORMAÇÃO', text: 'SQL e PostgreSQL para organizar informações. Minha experiência administrativa também trouxe atenção à consistência dos registros.', href: '#tecnologias', action: 'Explorar minhas ferramentas ↗' },
  ia: { label: 'IA GENERATIVA / UMA TRILHA DE ESTUDO', text: 'Entender limites, revisar respostas e buscar aplicações responsáveis. Curiosidade para aprender, critério para usar.', href: '#sobre', action: 'Conhecer meu jeito de aprender ↗' },
});

export function mountWords({ document, window }) {
  const on = (element, type, handler, options) => { element.addEventListener(type, handler, options); cleanups.push(() => element.removeEventListener(type, handler, options)); };
  const cleanups = [];
  const name = document.getElementById('name-bloom');
  const hint = document.getElementById('name-hint');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  let bloomTimer;
  const canMove = () => !reduced.matches && !document.body.classList.contains('motion-paused');
  if (name) {
    let index = 0;
    for (const word of name.querySelectorAll('[data-letter-word]')) {
      const characters = Array.from(word.textContent);
      word.replaceChildren(...characters.map(character => {
        const letter = document.createElement('span'); letter.className = 'name-letter'; letter.textContent = character;
        letter.setAttribute('aria-hidden', 'true'); letter.style.setProperty('--letter-index', String(index++));
        return letter;
      }));
    }
    name.disabled = false; hint.hidden = false;
    function clearBloom() { name.classList.remove('is-blooming', 'is-bloomed'); }
    function bloom(announce = true) {
      window.clearTimeout(bloomTimer); clearBloom();
      // Restart only after deliberate hover/click. No infinite text animation.
      if (canMove()) { void name.offsetWidth; name.classList.add('is-blooming'); }
      name.classList.add('is-bloomed');
      if (announce) hint.textContent = 'Uma ideia de cada vez. É assim que o jardim cresce.';
      bloomTimer = window.setTimeout(() => { clearBloom(); hint.textContent = 'Toque no meu nome para fazer as letras florescerem.'; }, 1700);
    }
    on(name, 'click', () => bloom());
    on(name, 'pointerenter', event => { if (event.pointerType === 'mouse' && fine.matches && canMove()) bloom(false); });
    on(reduced, 'change', clearBloom);
    const bodyObserver = new window.MutationObserver(() => { if (!canMove()) clearBloom(); });
    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    cleanups.push(() => { bodyObserver.disconnect(); window.clearTimeout(bloomTimer); });
  }

  const buttons = [...document.querySelectorAll('[data-word-topic]')];
  const note = document.getElementById('word-note');
  function selectTopic(id) {
    const topic = topics[id]; if (!topic || !note) return false;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.wordTopic === id)));
    document.getElementById('word-topic-label').textContent = topic.label;
    document.getElementById('word-topic-text').textContent = topic.text;
    const action = document.getElementById('word-topic-link'); action.textContent = topic.action; action.setAttribute('href', topic.href);
    note.hidden = false;
    return true;
  }
  buttons.forEach(button => on(button, 'click', () => selectTopic(button.dataset.wordTopic)));
  selectTopic('backend');
  document.querySelectorAll('[data-title-project]').forEach(button => { button.disabled = false; on(button, 'click', () => {
    document.dispatchEvent(new window.CustomEvent('portfolio:open-project', { detail: { id: button.dataset.titleProject, returnFocus: button } }));
  }); });

  const headings = [...document.querySelectorAll('main h2')];
  if (window.IntersectionObserver) {
    const observer = new window.IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-inked'); observer.unobserve(entry.target); }
    }), { threshold: 0.4 });
    headings.forEach(heading => observer.observe(heading)); cleanups.push(() => observer.disconnect());
  } else headings.forEach(heading => heading.classList.add('is-inked'));
  return { selectTopic, dispose() { cleanups.forEach(cleanup => cleanup()); } };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  const words = mountWords({ document, window });
  window.addEventListener('pagehide', event => { if (!event.persisted) words.dispose(); });
}
