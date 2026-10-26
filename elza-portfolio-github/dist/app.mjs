import { projects, matchesFilter, projectCountLabel } from './projects.mjs';
import { mountTheme } from './theme.mjs';

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
function closeMenu(restoreFocus = false) {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
  if (restoreFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header-inner')) closeMenu();
});
window.matchMedia('(min-width: 821px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const theme=mountTheme({document,window});

const cards = [...document.querySelectorAll('.project-card')];
document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('.filter').forEach(item => {
      const active = item === button;
      item.setAttribute('aria-pressed', String(active));
      item.classList.toggle('active', active);
    });
    let visible = 0;
    cards.forEach(card => {
      card.hidden = !matchesFilter(card.dataset.tags, filter);
      if (!card.hidden) visible++;
    });
    document.querySelector('#filter-result').textContent = projectCountLabel(visible);
  });
});

const dialog = document.querySelector('#project-dialog');
let dialogTrigger;
const populateText = (id, value) => { document.getElementById(id).textContent = value; };
function showProjectDialog(id, trigger) {
    const project = projects[id];
    if (!project) return;
    dialogTrigger = trigger;
    populateText('dialog-title', project.title);
    populateText('dialog-eyebrow', project.category);
    populateText('dialog-summary', project.summary);
    populateText('dialog-problem', project.problem);
    populateText('dialog-status', project.status);
    populateText('dialog-problem-title', project.problemTitle ?? 'O problema');
    populateText('dialog-learning-title', project.learningTitle ?? 'O que estou praticando');
    const imageWrap = document.querySelector('#dialog-image-wrap');
    const projectImage = document.querySelector('#dialog-image');
    imageWrap.hidden = !project.image;
    if (project.image) {
      projectImage.src = project.image.src;
      projectImage.alt = project.image.alt;
      projectImage.width = project.image.width;
      projectImage.height = project.image.height;
      populateText('dialog-image-caption', project.image.caption);
    } else {
      projectImage.removeAttribute('src');
      projectImage.alt = '';
      populateText('dialog-image-caption', '');
    }
    for (const [id, values] of [['dialog-learning', project.learning], ['dialog-tags', project.tags]]) {
      const container = document.getElementById(id);
      container.replaceChildren(...values.map(value => {
        const item = document.createElement('li');
        item.textContent = value;
        return item;
      }));
    }
    const repo = document.querySelector('#dialog-repo');
    repo.hidden = !project.repo;
    if (project.repo) repo.href = project.repo;
    else repo.removeAttribute('href');
    document.querySelector('#dialog-pending').hidden = Boolean(project.repo);
    document.querySelector('#dialog-pending').textContent = project.pendingLink ?? 'O link do repositório deste projeto ainda precisa ser confirmado.';
    dialog.showModal();
    document.body.classList.add('dialog-open');
    document.querySelector('#dialog-close').focus();
}
document.querySelectorAll('.project-open').forEach(button => {
  button.addEventListener('click', () => showProjectDialog(button.dataset.project, button));
});
document.addEventListener('portfolio:open-project', event => {
  showProjectDialog(event.detail?.id, event.detail?.returnFocus);
});
document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  dialogTrigger?.focus();
});

document.querySelector('#copy-email').addEventListener('click', async () => {
  const feedback = document.querySelector('#copy-feedback');
  const email = document.querySelector('#email-link').getAttribute('href').slice(7);
  try {
    await navigator.clipboard.writeText(email);
    feedback.textContent = 'E-mail copiado. Até já!';
  } catch {
    feedback.textContent = 'Não foi possível copiar automaticamente. Selecione o e-mail acima ou clique para abrir seu aplicativo de e-mail.';
  }
});

if ('IntersectionObserver' in window) {
  const sectionLinks = [...navigation.querySelectorAll('a')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        sectionLinks.forEach(link => {
          if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    });
  }, { rootMargin: '-20% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
}
