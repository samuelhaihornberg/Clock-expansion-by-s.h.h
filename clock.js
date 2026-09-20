const regions = {
  utc: ['UTC', 'Monde', 'UTC'], paris: ['Paris', 'France', 'Europe/Paris'], london: ['Londres', 'Royaume-Uni', 'Europe/London'],
  newyork: ['New York', 'États-Unis', 'America/New_York'], losangeles: ['Los Angeles', 'États-Unis', 'America/Los_Angeles'],
  mexico: ['Mexico', 'Mexique', 'America/Mexico_City'], saopaulo: ['São Paulo', 'Brésil', 'America/Sao_Paulo'],
  cairo: ['Le Caire', 'Égypte', 'Africa/Cairo'], johannesburg: ['Johannesburg', 'Afrique du Sud', 'Africa/Johannesburg'],
  dubai: ['Dubai', 'Émirats', 'Asia/Dubai'], mumbai: ['Mumbai', 'Inde', 'Asia/Kolkata'], singapore: ['Singapore', 'Singapour', 'Asia/Singapore'],
  tokyo: ['Tokyo', 'Japon', 'Asia/Tokyo'], seoul: ['Séoul', 'Corée du Sud', 'Asia/Seoul'], shanghai: ['Shanghai', 'Chine', 'Asia/Shanghai'],
  sydney: ['Sydney', 'Australie', 'Australia/Sydney'], auckland: ['Auckland', 'Nouvelle-Zélande', 'Pacific/Auckland']
};

const page = location.pathname.split('/').pop();
if (page === 'index.html' || page === '') renderMenu();
else startClock();

function renderMenu() {
  const menu = document.querySelector('#clock-menu');
  if (!menu) return;
  menu.innerHTML = Object.entries(regions).map(([key, [name, country]]) => `
    <a class="clock-button" href="clock.html?zone=${key}"><h2>${name}</h2><p>${country}</p></a>
  `).join('');
}

function getTimeParts(date, timeZone) {
  const values = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3
  }).formatToParts(date).forEach((part) => { values[part.type] = part.value; });
  return {
    year: +values.year, month: +values.month, day: +values.day,
    hour: +values.hour, minute: +values.minute, second: +values.second,
    ms: +(values.fractionalSecond || 0)
  };
}

function startClock() {
  const key = new URLSearchParams(location.search).get('zone') || 'utc';
  const [name, country, timeZone] = regions[key] || regions.utc;
  const canvas = document.querySelector('#clock');
  const ctx = canvas.getContext('2d');
  const colors = {
    milliseconds: '#ff79c6', seconds: '#ff5267', minutes: '#ffd34e',
    hours: '#55e7cf', days: '#70baff', months: '#a98cff', years: '#ffffff'
  };

  document.querySelector('#name').textContent = name;
  document.querySelector('#country').textContent = country;
  document.title = `Clock Expansion — ${name}`;

  function circle(x, y, radius, color, width, alpha = 1) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function label(value, x, y, color, size = 9) {
    ctx.fillStyle = color;
    ctx.font = `600 ${size}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x, y);
  }

  function futureWave(x, y, innerRadius, outerRadius, progress, color, width) {
    const radius = innerRadius + (outerRadius - innerRadius) * progress;
    const fade = 0.22 + 0.78 * (1 - progress);
    circle(x, y, radius, color, width + 2 * (1 - progress), fade);
    circle(x, y, radius + 6, color, 1.2, fade * 0.28);
  }

  function draw(time) {
    const box = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, box.width);
    const height = Math.max(1, box.height);
    const x = width / 2;
    const y = height / 2;

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    const second = (time.second + time.ms / 1000) / 60;
    const minute = (time.minute + second) / 60;
    const hour = (time.hour % 24 + minute) / 24;
    const day = (time.day - 1 + hour) / 31;
    const month = (time.month - 1 + day) / 12;
    const year = (time.year % 100 + month) / 100;

    // Keep the complete outer ring inside the canvas, including its stroke.
    const usableRadius = Math.max(40, Math.min(width, height) / 2 - 28);
    const base = usableRadius / 12.4;

    const layers = [
      [base, base * 2.0, time.ms / 1000, colors.milliseconds, 2],
      [base * 2.0, base * 3.5, second, colors.seconds, 2.5],
      [base * 3.5, base * 5.2, minute, colors.minutes, 3],
      [base * 5.2, base * 7.0, hour, colors.hours, 3],
      [base * 7.0, base * 8.8, day % 1, colors.days, 3.5],
      [base * 8.8, base * 10.6, month % 1, colors.months, 4],
      [base * 10.6, base * 12.4, year % 1, colors.years, 4.5]
    ];

    layers.forEach(([inner, outer, progress, color, width]) => {
      circle(x, y, inner, color, width, 0.18);
      circle(x, y, outer, color, 1, 0.08);
      futureWave(x, y, inner, outer, progress, color, width);
    });

    for (let value = 1; value <= 60; value += 1) {
      const angle = -Math.PI / 2 + value * Math.PI * 2 / 60;
      const secondRadius = base * 2.15 + value * base * 0.012;
      const minuteRadius = base * 5.25 + value * base * 0.012;
      const secondActive = value === time.second + 1;
      const minuteActive = value === time.minute + 1;

      circle(x, y, secondRadius, colors.seconds, secondActive ? 3 : 0.8, secondActive ? 0.9 : 0.13);
      circle(x, y, minuteRadius, colors.minutes, minuteActive ? 3.5 : 1, minuteActive ? 0.9 : 0.16);
      label(value, x + Math.cos(angle) * secondRadius, y + Math.sin(angle) * secondRadius, colors.seconds, 7);
      label(value, x + Math.cos(angle) * minuteRadius, y + Math.sin(angle) * minuteRadius, colors.minutes, 7);
    }

    const hourRadius = base * 8.9;
    for (let value = 1; value <= 24; value += 1) {
      const angle = -Math.PI / 2 + value * Math.PI * 2 / 24;
      const active = value === time.hour || value === time.hour + 1;
      circle(x, y, hourRadius, colors.hours, active ? 3 : 1, active ? 0.85 : 0.16);
      label(value, x + Math.cos(angle) * hourRadius, y + Math.sin(angle) * hourRadius, colors.hours, 9);
    }

    const glow = ctx.createRadialGradient(x, y, 0, x, y, base * 1.5);
    glow.addColorStop(0, 'rgba(255,255,255,0.9)');
    glow.addColorStop(0.35, 'rgba(255,121,198,0.42)');
    glow.addColorStop(1, 'rgba(255,121,198,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, base * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  function update() {
    const now = new Date();
    const time = getTimeParts(now, timeZone);
    document.querySelector('#time').textContent = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}:${String(time.second).padStart(2, '0')}.${String(time.ms).padStart(3, '0')}`;
    document.querySelector('#date').textContent = new Intl.DateTimeFormat('fr', { timeZone, dateStyle: 'full' }).format(now);
    draw(time);
  }

  update();
  setInterval(update, 50);
  window.addEventListener('resize', update);
}
