const regions = {
  utc: ['UTC', 'Monde', 'UTC'],
  paris: ['Paris', 'France', 'Europe/Paris'],
  london: ['Londres', 'Royaume-Uni', 'Europe/London'],
  newyork: ['New York', 'États-Unis', 'America/New_York'],
  losangeles: ['Los Angeles', 'États-Unis', 'America/Los_Angeles'],
  mexico: ['Mexico', 'Mexique', 'America/Mexico_City'],
  saopaulo: ['São Paulo', 'Brésil', 'America/Sao_Paulo'],
  cairo: ['Le Caire', 'Égypte', 'Africa/Cairo'],
  johannesburg: ['Johannesburg', 'Afrique du Sud', 'Africa/Johannesburg'],
  dubai: ['Dubai', 'Émirats', 'Asia/Dubai'],
  mumbai: ['Mumbai', 'Inde', 'Asia/Kolkata'],
  singapore: ['Singapore', 'Singapour', 'Asia/Singapore'],
  tokyo: ['Tokyo', 'Japon', 'Asia/Tokyo'],
  seoul: ['Séoul', 'Corée du Sud', 'Asia/Seoul'],
  shanghai: ['Shanghai', 'Chine', 'Asia/Shanghai'],
  sydney: ['Sydney', 'Australie', 'Australia/Sydney'],
  auckland: ['Auckland', 'Nouvelle-Zélande', 'Pacific/Auckland']
};

const page = location.pathname.split('/').pop();
page === 'index.html' || page === '' ? renderMenu() : startClock();

function renderMenu() {
  const menu = document.querySelector('#clock-menu');
  if (!menu) return;

  menu.innerHTML = Object.entries(regions)
    .map(([key, [name, country]]) => `
      <a class="clock-button" href="clock.html?zone=${key}">
        <h2>${name}</h2>
        <p>${country}</p>
      </a>
    `)
    .join('');
}

function getTimeParts(date, timeZone) {
  const values = {};
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });

  formatter.formatToParts(date).forEach((part) => {
    values[part.type] = part.value;
  });

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
    ms: Number(values.fractionalSecond || 0)
  };
}

function startClock() {
  const zoneKey = new URLSearchParams(location.search).get('zone') || 'utc';
  const [name, country, timeZone] = regions[zoneKey] || regions.utc;
  const canvas = document.querySelector('#clock');
  const context = canvas.getContext('2d');
  const colors = {
    milliseconds: '#ff79c6',
    seconds: '#ff5267',
    minutes: '#ffd34e',
    hours: '#55e7cf',
    days: '#70baff',
    months: '#a98cff',
    years: '#ffffff'
  };

  document.querySelector('#name').textContent = name;
  document.querySelector('#country').textContent = country;
  document.title = `Clock Expansion — ${name}`;

  function circle(x, y, radius, color, width, alpha = 1) {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.strokeStyle = color;
    context.lineWidth = width;
    context.globalAlpha = alpha;
    context.stroke();
    context.globalAlpha = 1;
  }

  function number(value, x, y, color, size = 9) {
    context.fillStyle = color;
    context.font = `600 ${size}px system-ui`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(value), x, y);
  }

  function concentricWave(centerX, centerY, baseRadius, progress, color, width) {
    // Chaque unité de temps crée une onde circulaire complète.
    // L'onde grandit autour des cercles existants, sans spirale ni queue.
    const waveRadius = baseRadius + progress * baseRadius * 0.22;
    const pulse = 0.28 + 0.72 * (1 - progress);
    circle(centerX, centerY, waveRadius, color, width + 2 * pulse, pulse);
    circle(centerX, centerY, waveRadius + 7 * pulse, color, 1.5, pulse * 0.35);
  }

  function draw(time) {
    const bounds = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = bounds.width;
    const height = bounds.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.34;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = 'lighter';

    const secondProgress = (time.second + time.ms / 1000) / 60;
    const minuteProgress = (time.minute + secondProgress) / 60;
    const hourProgress = (time.hour % 24 + minuteProgress) / 24;
    const dayProgress = (time.day - 1 + hourProgress) / 31;
    const monthProgress = (time.month - 1 + dayProgress) / 12;
    const yearProgress = (time.year % 100 + monthProgress) / 100;

    // Cercles concentriques fixes : aucun trait radial, aucune spirale.
    const layers = [
      [radius * 0.16, colors.milliseconds, 2],
      [radius * 0.29, colors.seconds, 2],
      [radius * 0.43, colors.minutes, 2],
      [radius * 0.58, colors.hours, 2.5],
      [radius * 0.74, colors.days, 3],
      [radius * 0.9, colors.months, 3.5],
      [radius * 1.06, colors.years, 4]
    ];

    layers.forEach(([layerRadius, color, width]) => {
      circle(centerX, centerY, layerRadius, color, width, 0.2);
    });

    // Une vague complète par fraction de l'unité temporelle correspondante.
    concentricWave(centerX, centerY, radius * 0.16, time.ms / 1000, colors.milliseconds, 3);
    concentricWave(centerX, centerY, radius * 0.29, secondProgress, colors.seconds, 3);
    concentricWave(centerX, centerY, radius * 0.43, minuteProgress, colors.minutes, 3.5);
    concentricWave(centerX, centerY, radius * 0.58, hourProgress, colors.hours, 4);
    concentricWave(centerX, centerY, radius * 0.74, dayProgress % 1, colors.days, 4);
    concentricWave(centerX, centerY, radius * 0.9, monthProgress % 1, colors.months, 4.5);
    concentricWave(centerX, centerY, radius * 1.06, yearProgress % 1, colors.years, 5);

    // Anneaux concentriques numérotés : toutes les valeurs sont lisibles autour des cercles.
    for (let value = 1; value <= 60; value += 1) {
      const angle = -Math.PI / 2 + value * Math.PI * 2 / 60;
      const secondRadius = radius * (0.29 + value * 0.0022);
      const minuteRadius = radius * (0.58 + value * 0.0022);
      const secondActive = value === time.second + 1;
      const minuteActive = value === time.minute + 1;

      circle(centerX, centerY, secondRadius, colors.seconds, secondActive ? 3 : 1, secondActive ? 0.95 : 0.16);
      circle(centerX, centerY, minuteRadius, colors.minutes, minuteActive ? 3.5 : 1.2, minuteActive ? 0.95 : 0.2);
      number(value, centerX + Math.cos(angle) * secondRadius, centerY + Math.sin(angle) * secondRadius, colors.seconds, 7);
      number(value, centerX + Math.cos(angle) * minuteRadius, centerY + Math.sin(angle) * minuteRadius, colors.minutes, 7);
    }

    for (let value = 1; value <= 24; value += 1) {
      const angle = -Math.PI / 2 + value * Math.PI * 2 / 24;
      const hourRadius = radius * 0.9;
      const active = value === time.hour || value === time.hour + 1;
      circle(centerX, centerY, hourRadius, colors.hours, active ? 3 : 1.2, active ? 0.9 : 0.2);
      number(value, centerX + Math.cos(angle) * hourRadius, centerY + Math.sin(angle) * hourRadius, colors.hours, 9);
    }

    // Centre lumineux uniquement : aucun pointeur et aucune queue aiguillée.
    const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.22);
    glow.addColorStop(0, 'rgba(255,255,255,0.95)');
    glow.addColorStop(0.35, 'rgba(255,121,198,0.55)');
    glow.addColorStop(1, 'rgba(255,121,198,0)');
    context.fillStyle = glow;
    context.beginPath();
    context.arc(centerX, centerY, radius * 0.22, 0, Math.PI * 2);
    context.fill();
    context.globalCompositeOperation = 'source-over';
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
