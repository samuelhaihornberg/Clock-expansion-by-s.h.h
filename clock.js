const regions={utc:['UTC','Monde','UTC'],paris:['Paris','France','Europe/Paris'],london:['Londres','Royaume-Uni','Europe/London'],newyork:['New York','États-Unis','America/New_York'],losangeles:['Los Angeles','États-Unis','America/Los_Angeles'],mexico:['Mexico','Mexique','America/Mexico_City'],saopaulo:['São Paulo','Brésil','America/Sao_Paulo'],cairo:['Le Caire','Égypte','Africa/Cairo'],johannesburg:['Johannesburg','Afrique du Sud','Africa/Johannesburg'],dubai:['Dubai','Émirats','Asia/Dubai'],mumbai:['Mumbai','Inde','Asia/Kolkata'],singapore:['Singapore','Singapour','Asia/Singapore'],tokyo:['Tokyo','Japon','Asia/Tokyo'],seoul:['Séoul','Corée du Sud','Asia/Seoul'],shanghai:['Shanghai','Chine','Asia/Shanghai'],sydney:['Sydney','Australie','Australia/Sydney'],auckland:['Auckland','Nouvelle-Zélande','Pacific/Auckland']};
const YEAR_START=1900,YEAR_END=2030;const isMenu=!document.querySelector('#clock');if(isMenu)renderMenu();else startClock();
function renderMenu(){const menu=document.querySelector('#clock-menu');if(!menu)return;menu.innerHTML=Object.entries(regions).map(([key,[name]])=>`<a class="clock-button" href="clock.html?zone=${encodeURIComponent(key)}"><h2>${name}</h2></a>`).join('');}
function parts(date,zone){const v={};new Intl.DateTimeFormat('en-US',{timeZone:zone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',fractionalSecondDigits:3}).formatToParts(date).forEach(p=>v[p.type]=p.value);return{year:+v.year,month:+v.month,day:+v.day,hour:+v.hour,minute:+v.minute,second:+v.second,ms:+(v.fractionalSecond||0)};}
function days(y,m){return new Date(Date.UTC(y,m,0)).getUTCDate();}
function startClock(){const key=new URLSearchParams(location.search).get('zone')||'utc';const[name,country,zone]=regions[key]||regions.utc;const canvas=document.querySelector('#clock'),ctx=canvas.getContext('2d');let calendar=false;document.querySelector('#name').textContent=name;document.querySelector('#country').textContent=country;document.title=`Clock Expansion — ${name}`;window.addEventListener('clock-mode',e=>{calendar=!!e.detail.calendar;});
function ring(x,y,r,color,w,a=.15){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.globalAlpha=a;ctx.stroke();ctx.globalAlpha=1;}
function donutArc(x,y,r,start,end,color,width,alpha=1){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.globalAlpha=alpha;ctx.arc(x,y,r,start,end);ctx.stroke();ctx.globalAlpha=1;}
function text(v,x,y,color,size){ctx.fillStyle=color;ctx.font=`600 ${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(v,x,y);}
function spiral(x,y,inner,outer,progress,color,width){const start=-Math.PI/2;const end=start+progress*Math.PI*2*1.35;ctx.save();ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.shadowColor=color;ctx.shadowBlur=12;ctx.globalAlpha=0.9;for(let i=0;i<=64;i++){const t=i/64;const r=inner+(outer-inner)*t;const a=start+t*(end-start);const px=x+Math.cos(a)*r;const py=y+Math.sin(a)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();ctx.restore();}
function draw(t){const b=canvas.getBoundingClientRect(),d=devicePixelRatio||1,w=Math.max(1,b.width),h=Math.max(1,b.height),x=w/2,y=h/2,base=Math.max(12,Math.min(w,h)/2-30)/13.8;canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='lighter';const dc=days(t.year,t.month),sec=(t.second+t.ms/1000)/60,min=(t.minute+sec)/60,hr=(t.hour+min)/24,day=(t.day-1+(t.hour+t.minute/60)/24)/dc,mon=(t.month-1+day)/12,yr=(t.year-YEAR_START+mon)/(YEAR_END-YEAR_START+1);
const list=calendar?[
 [base*1.8, base*3.5, day, '#70baff', 3.0],
 [base*3.8, base*6.1, mon, '#a98cff', 3.3],
 [base*6.5, base*9.0, yr, '#ffffff', 3.8]
]:[
 [base*1.2, base*2.8, t.ms/1000, '#ff79c6', 2.2],
 [base*2.8, base*4.8, sec, '#ff5267', 2.7],
 [base*4.9, base*7.0, min, '#ffd34e', 3.2],
 [base*7.1, base*9.6, hr, '#55e7cf', 3.7]
];
list.forEach(([inner,outer,p,color,width],index)=>{
 ring(x,y,inner,color,width,0.12);
 ring(x,y,outer,color,1,0.06);
 const start=-Math.PI/2; const end=start + p * Math.PI*2;
 donutArc(x,y,inner,start,end,color,width+2,0.9);
 donutArc(x,y,outer,start,end,color,1.2,0.15);
 spiral(x,y,inner,outer,p,color,1.2+index*.15);
});
if(calendar){for(let n=1;n<=dc;n++){const a=-Math.PI/2+n*Math.PI*2/dc;const r=base*2.0;text(String(n),x+Math.cos(a)*r,y+Math.sin(a)*r,'#70baff',7);}for(let n=1;n<=12;n++){const a=-Math.PI/2+n*Math.PI*2/12;const r=base*4.5;text(String(n),x+Math.cos(a)*r,y+Math.sin(a)*r,'#a98cff',7);}for(let n=YEAR_START;n<=YEAR_END;n++){const a=-Math.PI/2+((n-YEAR_START)/(YEAR_END-YEAR_START+1))*Math.PI*2;const r=base*7.8;text(String(n),x+Math.cos(a)*r,y+Math.sin(a)*r,'#ffffff',n===t.year?8:5);}}else{for(let n=1;n<=10;n++){const a=-Math.PI/2+n*Math.PI*2/10;const r=base*1.6;text(String(n),x+Math.cos(a)*r,y+Math.sin(a)*r,'#ff79c6',6);}for(let n=1;n<=60;n++){const a=-Math.PI/2+n*Math.PI*2/60;const r=base*3.5;text(String(n),x+Math.cos(a)*r,y+Math.sin(a)*r,'#ff5267',n===t.second?7:5);}for(let n=1;n<=60;n++){const a=-Math.PI/2+n*Math.PI*2/60;const r=base*5.7;text(String(n),x+Math.cos(a)*r,y+Math.sin(a)*r,'#ffd34e',n===t.minute?7:5);}for(let n=1;n<=24;n++){const a=-Math.PI/2+n*Math.PI*2/24;const r=base*8.0;text(String(n),x+Math.cos(a)*r,y+Math.sin(a)*r,'#55e7cf',n===t.hour?8:5);}}
ctx.fillStyle='rgba(255,255,255,0.08)';ctx.beginPath();ctx.arc(x,y,base*0.7,0,Math.PI*2);ctx.fill();}
function update(){const t=parts(new Date(),zone);document.querySelector('#time').textContent=`${String(t.hour).padStart(2,'0')}:${String(t.minute).padStart(2,'0')}:${String(t.second).padStart(2,'0')}.${String(t.ms).padStart(3,'0')}`;document.querySelector('#date').textContent=new Intl.DateTimeFormat('fr',{timeZone:zone,dateStyle:'full'}).format(new Date());draw(t);}update();setInterval(update,50);addEventListener('resize',update);}
