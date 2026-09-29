/* ====== SETTINGS — change these to your real details ====== */
const WHATSAPP_NUMBER = '2348068238357';   // country code + number, no "+" or spaces
const BUSINESS_NAME   = 'Diamond Event N Services';
// Enquiries are emailed to this address (first submission needs a one-time activation)
const ENQUIRY_EMAIL   = 'Otugift62@gmail.com';
const FORM_ENDPOINT   = `https://formsubmit.co/ajax/${ENQUIRY_EMAIL}`;
/* ========================================================== */

// Sticky nav: solid background after scrolling
const nav = document.querySelector('.site-nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Mobile menu
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

function setMenu(open) {
  navLinks.classList.toggle('open', open);
  nav.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
}
menuToggle?.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
navLinks?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', e => {
  if (navLinks.classList.contains('open') && !nav.contains(e.target)) setMenu(false);
});
window.matchMedia('(min-width: 901px)').addEventListener('change', () => setMenu(false));

// WhatsApp links use the number above
const waText = encodeURIComponent(`Hello ${BUSINESS_NAME}, I'd like to plan an event.`);
document.querySelectorAll('[data-whatsapp]').forEach(a => {
  a.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;
});

// Gallery filter
const filters = document.querySelectorAll('.filter');
const galleryGrid = document.getElementById('galleryGrid');
const galleryItems = document.querySelectorAll('.gallery-item');

filters.forEach(filter => {
  filter.addEventListener('click', () => {
    filters.forEach(btn => { btn.classList.remove('active'); btn.setAttribute('aria-pressed', 'false'); });
    filter.classList.add('active');
    filter.setAttribute('aria-pressed', 'true');

    const category = filter.dataset.filter;
    galleryGrid.classList.toggle('is-filtered', category !== 'all');
    galleryItems.forEach(item => {
      item.hidden = !(category === 'all' || item.dataset.category === category);
    });
  });
});

// Service selection (highlights the card you clicked)
const serviceCards = document.querySelectorAll('.service-card');
serviceCards.forEach(card => {
  card.addEventListener('click', () => {
    serviceCards.forEach(item => item.classList.remove('selected'));
    card.classList.add('selected');
  });
});

// "Explore service" / "Get a Quote" links pre-fill the enquiry form
const bookingForm = document.getElementById('bookingForm');
const formMessage = document.getElementById('formMessage');
const INTEREST = "I'm interested in: ";

document.querySelectorAll('[data-service]').forEach(link => {
  link.addEventListener('click', () => {
    if (!bookingForm) return;
    const { service, event } = link.dataset;
    if (event) bookingForm.eventType.value = event;
    const msg = bookingForm.message;
    if (!msg.value.trim() || msg.value.startsWith(INTEREST)) msg.value = `${INTEREST}${service}.`;
  });
});

// Testimonials
const testimonials = [
  { quote: "Diamond Event N Services made our celebration feel beautiful, organized and truly personal.", author: "— Happy Client" },
  { quote: "Every detail came together beautifully. We could relax and enjoy our special day.", author: "— Wedding Client" },
  { quote: "Professional, creative and attentive from the first conversation to the final setup.", author: "— Corporate Client" }
];

let quoteIndex = 0;
const quoteEl = document.getElementById('quote');
const authorEl = document.getElementById('quote-author');
const dotsEl = document.getElementById('quoteDots');

testimonials.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('aria-label', `Show testimonial ${i + 1}`);
  dot.addEventListener('click', () => showQuote(i));
  dotsEl.appendChild(dot);
});

function showQuote(index) {
  quoteIndex = (index + testimonials.length) % testimonials.length;
  quoteEl.textContent = testimonials[quoteIndex].quote;
  authorEl.textContent = testimonials[quoteIndex].author;
  [...dotsEl.children].forEach((d, i) => d.classList.toggle('on', i === quoteIndex));
}
showQuote(0);

document.getElementById('prevQuote')?.addEventListener('click', () => showQuote(quoteIndex - 1));
document.getElementById('nextQuote')?.addEventListener('click', () => showQuote(quoteIndex + 1));

// Auto-rotate (paused on hover/focus, and off for reduced-motion users)
const testimonialBox = document.querySelector('.testimonial');
let paused = false;
testimonialBox.addEventListener('mouseenter', () => paused = true);
testimonialBox.addEventListener('mouseleave', () => paused = false);
testimonialBox.addEventListener('focusin', () => paused = true);
testimonialBox.addEventListener('focusout', () => paused = false);
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  setInterval(() => { if (!paused) showQuote(quoteIndex + 1); }, 7000);
}

// Enquiry form -> emailed to the business
function showMessage(text, isError = false, link, linkText = 'Open WhatsApp') {
  formMessage.classList.remove('success');
  formMessage.classList.toggle('error', isError);
  formMessage.textContent = text;
  if (link) {
    const a = document.createElement('a');
    a.href = link; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = linkText;
    formMessage.append(' ', a);
  }
}

bookingForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const f = bookingForm;
  const submitBtn = f.querySelector('.submit-btn');

  // Spam trap: real people never see or fill this field
  if (f._honey && f._honey.value) return;

  const required = [f.name, f.phone, f.eventType];
  required.forEach(el => el.classList.toggle('invalid', !el.value.trim()));
  const missing = required.find(el => !el.value.trim());
  if (missing) {
    showMessage('Please fill in your name, phone number and event type.', true);
    missing.focus();
    return;
  }
  if (f.email.value && !f.email.checkValidity()) {
    f.email.classList.add('invalid');
    showMessage('That email address looks incomplete. Please check it.', true);
    f.email.focus();
    return;
  }
  f.email.classList.remove('invalid');

  const name = f.name.value.trim();
  const dateVal = f.date.value
    ? new Date(f.date.value + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const payload = {
    _subject: `New event enquiry from ${name}`,
    _template: 'table',
    _captcha: 'false',
    Name: name,
    Phone: f.phone.value.trim(),
    Email: f.email.value.trim() || 'Not provided',
    'Event type': f.eventType.value,
    'Event date': dateVal || 'Not provided',
    Guests: f.guests.value || 'Not provided',
    Details: f.message.value.trim() || 'None'
  };
  // Lets you reply straight to the client from your inbox
  if (f.email.value.trim()) payload._replyto = f.email.value.trim();

  const originalLabel = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';
  showMessage('');

  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === 'false' || data.success === false) throw new Error(data.message || 'Request failed');

    showMessage(`✓ Form submitted! Thank you, ${name}. We'll get back to you shortly.`);
    formMessage.classList.add('success');
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    f.reset();
    if (dateInput) dateInput.min = today;

    // Button confirms too, then goes back to normal after a few seconds
    submitBtn.textContent = 'Form submitted ✓';
    submitBtn.classList.add('sent');
    setTimeout(() => {
      submitBtn.innerHTML = originalLabel;
      submitBtn.classList.remove('sent');
      submitBtn.disabled = false;
    }, 4000);
    setTimeout(() => { if (formMessage.classList.contains('success')) { formMessage.textContent = ''; formMessage.classList.remove('success'); } }, 12000);
    return;
  } catch (err) {
    const fallback = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;
    showMessage("Sorry, we couldn't send your enquiry just now. Please try again, or", true, fallback, 'message us on WhatsApp');
  } finally {
    if (!submitBtn.classList.contains('sent')) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
    }
  }
});

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Earliest event date is today (local time, not UTC)
const dateInput = document.querySelector('input[type="date"]');
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
if (dateInput) dateInput.min = today;
