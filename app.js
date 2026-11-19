(()=>{
 'use strict';
 const $=id=>document.getElementById(id),yes=$('yes'),no=$('no'),question=$('question'),final=$('final');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),canvas=$('hearts'),ctx=canvas.getContext('2d');
 const screens=[
  {title:'Zostaniesz moją<br><em>walentynką?</em>',copy:'Bo z Tobą nawet zwykły dzień jest wyjątkowy.',eyebrow:'Dla mojej ulubionej osoby',yes:'Tak'},
  {title:'Czy <em>na pewno?</em>',copy:'W pakiecie: przytulanie, wspólny śmiech i ja.',eyebrow:'To brzmi jak początek czegoś pięknego.',yes:'Tak, na pewno!'},
  {title:'Jesteś <em>pewna?</em>',copy:'Bo ja wybieram Ciebie. Dziś i każdego kolejnego dnia.',eyebrow:'Ostatnie pytanie. Obiecuję.',yes:'Tak, jestem pewna!'}
 ];
 let step=0,escapes=0,lastEscape=0,particles=[],raf=0,lastTime=0,burstAt=0,width=0,height=0,clearTimer=0,advancing=false;
 function resetNo(){no.classList.remove('escaped');no.style.left='';no.style.top='';document.querySelector('.no-slot').append(no);$('tease').textContent='';escapes=0;lastEscape=0;}
 function showQuestion(){
  question.hidden=false;final.hidden=true;$('restart').hidden=true;resetNo();
  const s=screens[step];$('title').innerHTML=s.title;$('copy').textContent=s.copy;$('eyebrow').textContent=s.eyebrow;$('yes-label').textContent=s.yes;
  $('progress').setAttribute('aria-label','Pytanie '+(step+1)+' z 3');[...$('progress').children].forEach((node,i)=>node.classList.toggle('active',i===step));
 }
 function next(){
  if(advancing||question.hidden)return;advancing=true;
  if(step<2){step++;showQuestion();$('title').focus({preventScroll:true});}
  else{resetNo();question.hidden=true;final.hidden=false;$('restart').hidden=false;$('final-title').focus({preventScroll:true});burst();}
  // Ignore double taps so each confirmation remains a separate question.
  setTimeout(()=>advancing=false,300);
 }
 function overlaps(a,b,pad=10){return a.x<b.right+pad&&a.x+a.w>b.left-pad&&a.y<b.bottom+pad&&a.y+a.h>b.top-pad;}
 function flee(event){
  if(question.hidden)return;
  if(event){event.preventDefault();event.stopPropagation();}
  if(performance.now()-lastEscape<160)return;lastEscape=performance.now();
  const old=no.getBoundingClientRect(),w=old.width,h=old.height,margin=14,vw=document.documentElement.clientWidth,vh=window.innerHeight;
  const obstacles=[...document.querySelectorAll('[data-avoid]')].filter(n=>n.getClientRects().length).map(n=>n.getBoundingClientRect());
  const pointer={x:Number.isFinite(event?.clientX)?event.clientX:old.x+w/2,y:Number.isFinite(event?.clientY)?event.clientY:old.y+h/2};
  const candidates=[];
  for(let y=margin;y<=vh-h-margin;y+=20)for(let x=margin;x<=vw-w-margin;x+=20){const a={x,y,w,h};const distance=Math.hypot(x+w/2-pointer.x,y+h/2-pointer.y);if(distance>110&&!obstacles.some(b=>overlaps(a,b)))candidates.push({...a,distance});}
  if(!candidates.length)return;
  // Choose a safe landing point, never covering the question or the Yes button.
  candidates.sort((a,b)=>b.distance-a.distance);const pool=candidates.slice(0,Math.max(1,Math.ceil(candidates.length*.45))),place=pool[Math.floor(Math.random()*pool.length)];
  document.body.append(no);no.classList.add('escaped');no.style.left=place.x+'px';no.style.top=place.y+'px';escapes++;
  $('tease').textContent=['To „nie” chyba ma inne plany.','Nawet przycisk wie, że do siebie pasujemy.','Dobrze, że „Tak” nigdzie się nie wybiera.'][Math.min(escapes-1,2)];
 }
 no.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')flee(e);});
 no.addEventListener('pointerdown',flee);no.addEventListener('click',flee);
 yes.addEventListener('click',next);
 function resize(){width=window.innerWidth;height=window.innerHeight;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx?.setTransform(ratio,0,0,ratio,0,0);if(no.classList.contains('escaped'))resetNo();if(reduced.matches&&particles.length)paint();}
 function heart(x,y,size,angle,color){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(size/24,size/24);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,10);ctx.bezierCurveTo(-22,-4,-10,-19,0,-8);ctx.bezierCurveTo(10,-19,22,-4,0,10);ctx.fill();ctx.restore();}
 function paint(){if(!ctx)return;ctx.clearRect(0,0,width,height);for(const p of particles){ctx.globalAlpha=p.alpha;heart(p.x,p.y,p.size,p.angle,p.color);}ctx.globalAlpha=1;}
 function burst(){
  if(!ctx)return;cancelAnimationFrame(raf);clearTimeout(clearTimer);const colors=['#bb3152','#e55d7b','#d44160','#f293a7','#558d7d'];
  particles=Array.from({length:reduced.matches?35:110},()=>({x:Math.random()*width,y:reduced.matches?Math.random()*height:-40-Math.random()*height*.9,size:10+Math.random()*22,angle:Math.random()*6.28,spin:(Math.random()-.5)*1.5,vx:(Math.random()-.5)*45,vy:65+Math.random()*110,color:colors[Math.floor(Math.random()*colors.length)],alpha:.4+Math.random()*.5}));
  if(reduced.matches){paint();clearTimer=setTimeout(()=>{particles=[];paint();},3500);return;}
  burstAt=lastTime=performance.now();
  function tick(now){const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;const age=(now-burstAt)/1000;for(const p of particles){p.x+=p.vx*dt+Math.sin(age+p.size)*.3;p.y+=p.vy*dt;p.angle+=p.spin*dt;if(p.y>height+40&&age<5){p.y=-40;p.x=Math.random()*width;}}
   paint();if(age<11)raf=requestAnimationFrame(tick);else{particles=[];paint();}
  }raf=requestAnimationFrame(tick);
 }
 $('more').addEventListener('click',burst);
 $('restart').addEventListener('click',()=>{cancelAnimationFrame(raf);clearTimeout(clearTimer);particles=[];paint();step=0;showQuestion();$('title').focus({preventScroll:true});});
 addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);particles=[];paint();}});
 reduced.addEventListener('change',()=>{cancelAnimationFrame(raf);particles=[];paint();});
 resize();showQuestion();
})();
