const regions = {
  utc: ['UTC', 'Monde', 'UTC'], paris: ['Paris', 'France', 'Europe/Paris'], london: ['Londres', 'Royaume-Uni', 'Europe/London'],
  newyork: ['New York', 'États-Unis', 'America/New_York'], losangeles: ['Los Angeles', 'États-Unis', 'America/Los_Angeles'],
  mexico: ['Mexico', 'Mexique', 'America/Mexico_City'], saopaulo: ['São Paulo', 'Brésil', 'America/Sao_Paulo'],
  cairo: ['Le Caire', 'Égypte', 'Africa/Cairo'], johannesburg: ['Johannesburg', 'Afrique du Sud', 'Africa/Johannesburg'],
  dubai: ['Dubai', 'Émirats', 'Asia/Dubai'], mumbai: ['Mumbai', 'Inde', 'Asia/Kolkata'], singapore: ['Singapore', 'Singapour', 'Asia/Singapore'],
  tokyo: ['Tokyo', 'Japon', 'Asia/Tokyo'], seoul: ['Séoul', 'Corée du Sud', 'Asia/Seoul'], shanghai: ['Shanghai', 'Chine', 'Asia/Shanghai'],
  sydney: ['Sydney', 'Australie', 'Australia/Sydney'], auckland: ['Auckland', 'Nouvelle-Zélande', 'Pacific/Auckland']
};
const YEAR_START = 1900;
const YEAR_END = 2030;
const page = location.pathname.split('/').pop();
page === 'index.html' || page === '' ? renderMenu() : startClock();

function renderMenu() {
  const menu = document.querySelector('#clock-menu');
  if (!menu) return;
  menu.innerHTML = Object.entries(regions).map(([key, [name]]) => `<a class="clock-button" href="clock.html?zone=${key}"><h2>${name}</h2></a>`).join('');
}
function getTimeParts(date, timeZone) {
  const values = {};
  new Intl.DateTimeFormat('en-US', { timeZone, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }).formatToParts(date).forEach((part) => { values[part.type] = part.value; });
  return { year: +values.year, month: +values.month, day: +values.day, hour: +values.hour, minute: +values.minute, second: +values.second, ms: +(values.fractionalSecond || 0) };
}
function daysInMonth(year, month) { return new Date(Date.UTC(year, month, 0)).getUTCDate(); }

function startClock() {
  const key = new URLSearchParams(location.search).get('zone') || 'utc';
  const [name, country, timeZone] = regions[key] || regions.utc;
  const canvas = document.querySelector('#clock');
  const context = canvas.getContext('2d');
  const colors = { ms: '#ff79c6', seconds: '#ff5267', minutes: '#ffd34e', hours: '#55e7cf', days: '#70baff', months: '#a98cff', years: '#ffffff' };
  let calendarMode = false;
  document.querySelector('#name').textContent = name;
  document.querySelector('#country').textContent = country;
  document.title = `Clock Expansion — ${name}`;
  window.addEventListener('clock-display-mode', (event) => { calendarMode = event.detail.calendar; });

  function circle(x, y, radius, color, width, alpha = 1) {
    context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.strokeStyle = color; context.lineWidth = width; context.globalAlpha = alpha; context.stroke(); context.globalAlpha = 1;
  }
  function label(value, x, y, color, size = 9) {
    context.fillStyle = color; context.font = `600 ${size}px system-ui`; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(String(value), x, y);
  }
  function wave(x, y, inner, outer, progress, color, width) {
    const p = Math.max(0, Math.min(1, progress));
    circle(x, y, inner + (outer - inner) * p, color, width + 2 * (1 - p), 0.22 + 0.78 * (1 - p));
  }
  function plusLaser(x, y, radius, progress, color) {
    const reach = Math.max(10, radius * Math.max(0.08, Math.min(1, progress)));
    context.save();
    context.globalCompositeOperation = 'lighter';
    context.strokeStyle = color;
    context.shadowColor = color;
    context.shadowBlur = 18;
    context.globalAlpha = 0.9;
    context.lineWidth = Math.max(2, Math.min(8, radius * 0.018));
    context.beginPath(); context.moveTo(x - reach, y); context.lineTo(x + reach, y); context.moveTo(x, y - reach); context.lineTo(x, y + reach); context.stroke();
    context.shadowBlur = 4; context.globalAlpha = 1; context.lineWidth = 1.5;
    context.beginPath(); context.moveTo(x - reach, y); context.lineTo(x + reach, y); context.moveTo(x, y - reach); context.lineTo(x, y + reach); context.stroke();
    context.restore();
  }
  function numberedRing(x, y, radius, count, color, active, size, yearLabels = false) {
    circle(x, y, radius, color, active ? 2.8 : 0.8, active ? 0.9 : 0.12);
    for (let value = 1; value <= count; value += 1) {
      const angle = -Math.PI / 2 + (value / count) * Math.PI * 2;
      const labelSize = yearLabels ? (value % 10 === 0 || value === active ? size : 5) : size;
      label(yearLabels ? value : value, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, color, labelSize);
    }
  }

  function draw(time) {
    const box = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, box.width), height = Math.max(1, box.height);
    const x = width / 2, y = height / 2;
    const usable = Math.max(40, Math.min(width, height) / 2 - 38);
    const base = usable / 13.8;
    const dayCount = daysInMonth(time.year, time.month);
    const second = (time.second + time.ms / 1000) / 60;
    const minute = (time.minute + second) / 60;
    const hour = (time.hour % 24 + minute) / 24;
    const day = (time.day - 1 + (time.hour + time.minute / 60) / 24) / dayCount;
    const month = (time.month - 1 + day) / 12;
    const year = (time.year - YEAR_START + month) / (YEAR_END - YEAR_START + 1);
    const outer = base * 13.5;

    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, width, height); context.globalCompositeOperation = 'lighter';
    const rings = calendarMode ? [
      [base, base * 2, day, colors.days, 2.5], [base * 2, base * 4.3, month, colors.months, 3.5], [base * 4.3, base * 13.5, year, colors.years, 4.5]
    ] : [
      [base, base * 2, time.ms / 1000, colors.ms, 2], [base * 2, base * 4.3, second, colors.seconds, 2.5], [base * 4.3, base * 7, minute, colors.minutes, 3], [base * 7, base * 10, hour, colors.hours, 3.5]
    ];
    rings.forEach(([inner, outerRadius, progress, color, widthValue]) => { circle(x, y, inner, color, widthValue, 0.18); circle(x, y, outerRadius, color, 1, 0.08); wave(x, y, inner, outerRadius, progress, color, widthValue); });

    if (calendarMode) {
      numberedRing(x, y, base * 2.25, dayCount, colors.days, time.day, 8);
      numberedRing(x, y, base * 5.0, 12, colors.months, time.month, 9);
      numberedRing(x, y, base * 12.8, YEAR_END - YEAR_START + 1, colors.years, time.year, 5, true);
      plusLaser(x, y, outer, year);
    } else {
      numberedRing(x, y, base * 2.25, 1000, colors.ms, Math.floor(time.ms), 4);
      numberedRing(x, y, base * 4.9, 60, colors.seconds, time.second, 7);
      numberedRing(x, y, base * 7.6, 60, colors.minutes, time.minute, 7);
      numberedRing(x, y, base * 10.5, 24, colors.hours, time.hour, 8);
      plusLaser(x, y, outer, hour, colors.hours);
    }

    const glow = context.createRadialGradient(x, y, 0, x, y, base * 1.5);
    glow.addColorStop(0, 'rgba(255,255,255,0.9)'); glow.addColorStop(0.35, 'rgba(255,121,198,0.42)'); glow.addColorStop(1, 'rgba(255,121,198,0)');
    context.fillStyle = glow; context.beginPath(); context.arc(x, y, base * 1.5, 0, Math.PI * 2); context.fill(); context.globalCompositeOperation = 'source-over';
  }
  function update() {
    const now = new Date(); const time = getTimeParts(now, timeZone);
    document.querySelector('#time').textContent = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}:${String(time.second).padStart(2, '0')}.${String(time.ms).padStart(3, '0')}`;
    document.querySelector('#date').textContent = new Intl.DateTimeFormat('fr', { timeZone, dateStyle: 'full' }).format(now);
    draw(time);
  }
  update(); setInterval(update, 50); window.addEventListener('resize', update);
}
