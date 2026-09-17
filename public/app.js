const API = '/api/events';
const now = new Date();
// Compare date-only values in the visitor's local calendar, without UTC date shifts.
const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
const byId = (id) => document.getElementById(id);
const create = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const dateLabel = (value) => new Date(value + 'T00:00:00').toLocaleDateString('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});
const statusLabel = (value) => value < today ? 'Past' : 'Upcoming';
const amount = (value) => '$' + Number(value).toLocaleString('en-AU', { maximumFractionDigits: 2 });
const ticketLabel = (value) => Number(value) === 0 ? 'Free entry' : amount(value) + ' donation ticket';
const progressPercent = (event) => Math.min(100, Math.round((Number(event.current_progress) / Number(event.charity_goal)) * 100));

async function getJson(url) {
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Request failed with ' + response.status);
  return payload;
}

function eventImage(event, className, eager = false) {
  const image = create('img', className);
  image.src = event.image_path || 'assets/event-learning.jpg';
  image.alt = event.name + ' community event';
  image.loading = eager ? 'eager' : 'lazy';
  return image;
}

function statusBadge(event) {
  const status = statusLabel(event.event_date);
  return create('span', 'status-badge ' + status.toLowerCase(), status);
}

function progressBar(event, className = '') {
  const track = create('div', ('progress-track ' + className).trim());
  const bar = create('span');
  bar.style.width = progressPercent(event) + '%';
  track.append(bar);
  return track;
}

function eventCard(event) {
  const article = create('article', 'event-card');
  const media = create('div', 'event-card-media');
  media.append(eventImage(event, 'event-card-image'), statusBadge(event));

  const body = create('div', 'event-card-body');
  body.append(create('p', 'event-category', event.category_name), create('h3', '', event.name));
  const meta = create('div', 'event-card-meta');
  meta.append(create('span', '', dateLabel(event.event_date)), create('span', '', event.location));
  body.append(meta);

  const footer = create('div', 'event-card-footer');
  footer.append(create('span', 'ticket-summary', ticketLabel(event.ticket_price)));
  const link = create('a', 'button button-small button-primary', 'View Details');
  link.href = 'event-detail.html?event_id=' + encodeURIComponent(event.id);
  footer.append(link);
  body.append(footer);
  article.append(media, body);
  return article;
}

function searchResultCard(event) {
  const article = create('article', 'search-card');
  const media = create('div', 'search-card-media');
  media.append(eventImage(event, 'search-card-image'), statusBadge(event));

  const content = create('div', 'search-card-content');
  content.append(create('p', 'event-category', event.category_name), create('h3', '', event.name));
  const facts = create('div', 'search-card-facts');
  facts.append(create('span', '', 'Date: ' + dateLabel(event.event_date) + ' at ' + event.event_time), create('span', '', 'Location: ' + event.location));
  content.append(facts, create('p', 'search-card-purpose', event.purpose));
  const link = create('a', 'text-link orange-link', 'View event details');
  link.href = 'event-detail.html?event_id=' + encodeURIComponent(event.id);
  content.append(link);

  const summary = create('div', 'search-card-summary');
  summary.append(create('strong', '', ticketLabel(event.ticket_price)), create('span', '', progressPercent(event) + '% funded'), progressBar(event, 'compact'));
  article.append(media, content, summary);
  return article;
}

function organisationCard(organisation, index) {
  const article = create('article', 'organisation-card');
  article.append(create('span', 'organisation-number', String(index + 1).padStart(2, '0')), create('h3', '', organisation.name), create('p', '', organisation.mission));
  const contact = create('div', 'organisation-contact');
  contact.append(create('span', '', organisation.email), create('span', '', organisation.phone));
  article.append(contact);
  return article;
}

function setMessage(node, text, type = '') {
  if (!node) return;
  node.className = ('message ' + type).trim();
  node.textContent = text;
}

async function loadHome() {
  const eventGrid = byId('eventGrid');
  if (!eventGrid) return;
  const message = byId('homeMessage');
  try {
    const [events, organisations] = await Promise.all([getJson(API), getJson(API + '/organisations')]);
    setMessage(message, events.length + ' public events across Australian communities.');
    eventGrid.replaceChildren(...events.map(eventCard));
    byId('organisationGrid').replaceChildren(...organisations.map(organisationCard));
  } catch (_error) {
    setMessage(message, 'Events are temporarily unavailable. Please try again soon.', 'error');
  }
}

async function loadCategories() {
  const category = byId('category');
  if (!category) return;
  try {
    const categories = await getJson(API + '/categories');
    categories.forEach((item) => {
      const option = create('option', '', item.name);
      option.value = item.id;
      category.append(option);
    });
    setMessage(byId('searchMessage'), 'Choose any combination of filters to begin.');
  } catch (_error) {
    setMessage(byId('searchMessage'), 'Categories are temporarily unavailable. Please try again soon.', 'error');
  }
}

async function searchEvents(event) {
  event.preventDefault();
  const params = new URLSearchParams();
  if (byId('date').value) params.set('date', byId('date').value);
  if (byId('location').value.trim()) params.set('location', byId('location').value.trim());
  if (byId('category').value) params.set('category', byId('category').value);

  const results = byId('results');
  const message = byId('searchMessage');
  results.replaceChildren(create('p', 'loading-state', 'Loading matching events...'));
  setMessage(message, 'Searching public events...');

  try {
    const events = await getJson(API + '/search?' + params.toString());
    results.replaceChildren();
    if (!events.length) {
      setMessage(message, 'No active events match these filters.', 'empty');
      results.append(create('p', 'empty-state', 'Try another date, a broader location, or a different category.'));
      return;
    }
    setMessage(message, 'Found ' + events.length + ' matching event' + (events.length === 1 ? '.' : 's.'), 'success');
    results.replaceChildren(...events.map(searchResultCard));
  } catch (error) {
    results.replaceChildren();
    setMessage(message, error.message || 'Unable to search events. Please try again soon.', 'error');
  }
}

function buildDetail(event) {
  const article = byId('detailContent');
  const hero = create('div', 'detail-hero');
  hero.append(eventImage(event, 'detail-hero-image', true));
  const heroBadges = create('div', 'detail-hero-badges');
  heroBadges.append(statusBadge(event), create('span', 'category-badge', event.category_name));
  hero.append(heroBadges);

  const columns = create('div', 'detail-columns');
  const main = create('div', 'detail-main');
  const heading = create('header', 'detail-heading');
  heading.append(create('p', 'eyebrow', 'CHARITY EVENT'), create('h1', '', event.name));
  const meta = create('div', 'detail-meta');
  meta.append(create('span', '', dateLabel(event.event_date) + ' at ' + event.event_time), create('span', '', event.location), create('span', '', 'Hosted by ' + event.organisation_name));
  heading.append(meta);

  const purpose = create('section', 'detail-section');
  purpose.append(create('h2', '', 'Why it matters'), create('p', '', event.purpose));
  const about = create('section', 'detail-section');
  about.append(create('h2', '', 'About this event'), create('p', '', event.description));
  main.append(heading, purpose, about);

  const aside = create('aside', 'detail-aside');
  const ticket = create('section', 'detail-card ticket-card');
  ticket.append(create('p', 'detail-card-label', 'TICKET AS DONATION'), create('h2', '', ticketLabel(event.ticket_price)), create('p', '', 'Your event ticket represents a donation to the stated community cause.'));

  const fundraising = create('section', 'detail-card');
  fundraising.append(create('p', 'detail-card-label', 'FUNDRAISING PROGRESS'), create('h2', '', progressPercent(event) + '% funded'));
  const amountLine = create('div', 'amount-line');
  amountLine.append(create('strong', '', amount(event.current_progress)), create('span', '', 'Goal ' + amount(event.charity_goal)));
  fundraising.append(amountLine, progressBar(event), create('p', 'progress-caption', 'Raised for the event purpose shown on this page.'));

  const organisation = create('section', 'detail-card');
  organisation.append(create('p', 'detail-card-label', 'HOST ORGANISATION'), create('h2', '', event.organisation_name), create('p', '', event.organisation_mission));
  const contact = create('div', 'detail-contact');
  contact.append(create('span', '', event.organisation_email), create('span', '', event.organisation_phone));
  organisation.append(contact);

  const register = create('button', 'button button-primary register-button', 'Register Now');
  register.type = 'button';
  register.addEventListener('click', openRegisterDialog);
  aside.append(ticket, fundraising, organisation, register);
  columns.append(main, aside);
  article.replaceChildren(hero, columns);
}

async function loadDetail() {
  const content = byId('detailContent');
  if (!content) return;
  const id = new URLSearchParams(window.location.search).get('event_id');
  const message = byId('detailMessage');
  if (!id) {
    setMessage(message, 'No event was selected. Please return to the event list.', 'error');
    return;
  }
  try {
    const event = await getJson(API + '/' + encodeURIComponent(id));
    buildDetail(event);
    message.remove();
    content.hidden = false;
    document.title = event.name + ' | HopeBridge';
  } catch (_error) {
    setMessage(message, 'This event could not be found or is no longer available.', 'error');
  }
}

function openRegisterDialog() {
  const dialog = byId('registerDialog');
  if (!dialog) return;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

function setupModal() {
  const dialog = byId('registerDialog');
  if (!dialog) return;
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });
}

function setupNavigation() {
  const toggle = document.querySelector('.nav-toggle');
  const links = byId('primaryNav');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
    links.classList.toggle('open', !open);
  });
  links.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    links.classList.remove('open');
  }));
}

const form = byId('searchForm');
if (form) {
  loadCategories();
  form.addEventListener('submit', searchEvents);
  byId('clear').addEventListener('click', () => {
    form.reset();
    byId('results').replaceChildren();
    setMessage(byId('searchMessage'), 'Filters cleared. Choose any combination of filters.');
  });
}

setupNavigation();
setupModal();
loadHome();
loadDetail();
