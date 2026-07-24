(function(){
  "use strict";
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOUCH = window.matchMedia('(hover:none),(pointer:coarse)').matches;
  const isMobile = window.innerWidth < 900;
  gsap.registerPlugin(ScrollTrigger);
  const EASE = "power3.out";

  /* ---------- i18n + THEME: estado e dicionário ---------- */
  const LANG_KEY='lumo-lang', THEME_KEY='lumo-theme', COOKIE_KEY='lumo-cookies';
  const LANGS = ['pt','en','es'];
  const HTML_LANG = {pt:'pt-BR', en:'en', es:'es'};
  function stored(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } }
  function store(key,val){ try{ localStorage.setItem(key,val); }catch(e){} }
  let LANG = LANGS.indexOf(stored(LANG_KEY))>-1 ? stored(LANG_KEY) : 'pt';
  let THEME = (stored(THEME_KEY)==='light') ? 'light' : 'dark';
  const I18N = {
    swaps:{
      pt:["arquitetos","designers de interiores","estudantes","escritórios"],
      en:["architects","interior designers","students","studios"],
      es:["arquitectos","diseñadores de interiores","estudiantes","estudios"]
    }
  };
  let swapWords = I18N.swaps[LANG];
  let swapWI = 0;
  let heroAnimated = false;

  /* ---------- i18n: aplicar idioma ---------- */
  function applyLang(lang){
    if(LANGS.indexOf(lang)===-1) lang='pt';
    LANG = lang;
    document.documentElement.setAttribute('lang', HTML_LANG[lang]);
    document.querySelectorAll('[data-en]').forEach(el=>{
      if(el.dataset.pt===undefined) el.dataset.pt = el.innerHTML;
      el.innerHTML = (lang==='pt')
        ? el.dataset.pt
        : (el.getAttribute('data-'+lang) || el.getAttribute('data-en') || el.dataset.pt);
    });
    swapWords = I18N.swaps[lang]; swapWI = 0;
    const sw = document.querySelector('[data-swap]'); if(sw) sw.textContent = swapWords[0];
    document.querySelectorAll('.lang-code').forEach(s=>s.textContent=lang.toUpperCase());
    // marca o idioma ativo e espelha a bandeira no botão
    document.querySelectorAll('.lang__item').forEach(it=>{
      it.setAttribute('aria-selected', String(it.dataset.lang===lang));
    });
    const src = document.querySelector('#langMenu .lang__item[data-lang="'+lang+'"] .flag');
    const slot = document.getElementById('langFlagCur');
    if(src && slot) slot.innerHTML = src.innerHTML;
    if(heroAnimated){ document.querySelectorAll('#hero-h1 .word-mask>span').forEach(s=>{s.style.transform='none';}); }
    store(LANG_KEY, lang);
  }

  /* ---------- TEMA: aplicar claro/escuro ---------- */
  function applyTheme(t){
    THEME = t;
    document.documentElement.setAttribute('data-theme', t);
    store(THEME_KEY, t);
  }
  function toggleTheme(){ applyTheme(THEME==='light'?'dark':'light'); }

  /* aplicar preferências salvas + ligar botões */
  applyTheme(THEME);
  applyLang(LANG);
  ['themeToggle','themeToggleM'].forEach(id=>{ const b=document.getElementById(id); if(b) b.addEventListener('click',toggleTheme); });

  /* ---------- Dropdown de idioma ---------- */
  const langWrap=document.getElementById('langWrap'), langBtn=document.getElementById('langBtn');
  function closeLangMenu(){
    if(!langWrap) return;
    langWrap.classList.remove('open');
    if(langBtn) langBtn.setAttribute('aria-expanded','false');
  }
  if(langWrap && langBtn){
    langBtn.addEventListener('click',e=>{
      e.stopPropagation();
      const open = langWrap.classList.toggle('open');
      langBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click',e=>{ if(!langWrap.contains(e.target)) closeLangMenu(); });
  }
  document.querySelectorAll('.lang__item').forEach(it=>{
    it.addEventListener('click',()=>{ applyLang(it.dataset.lang); closeLangMenu(); });
  });

  /* ---------- Banner de cookies ---------- */
  const cookieBar=document.getElementById('cookieBar');
  function saveCookieChoice(v){ store(COOKIE_KEY, v); if(cookieBar) cookieBar.classList.remove('show'); }
  function maybeShowCookieBar(){
    if(!cookieBar || stored(COOKIE_KEY)) return;
    setTimeout(()=>cookieBar.classList.add('show'), 900);
  }
  const ckA=document.getElementById('cookieAccept'), ckR=document.getElementById('cookieReject');
  if(ckA) ckA.addEventListener('click',()=>saveCookieChoice('all'));
  if(ckR) ckR.addEventListener('click',()=>saveCookieChoice('essential'));

  /* ---------- LENIS smooth scroll (own rAF loop, decoupled from gsap.ticker) ---------- */
  let lenis=null;
  const LenisCtor = window.Lenis || (window.studioFreight&&window.studioFreight.Lenis);
  if(!RM && typeof LenisCtor==='function'){
    try{
      lenis = new LenisCtor({ duration:1.1, easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)), smoothWheel:true });
      lenis.on('scroll', ScrollTrigger.update);
      (function raf(time){ lenis.raf(time); requestAnimationFrame(raf); })(performance.now());
    }catch(e){ lenis=null; console.warn('Lenis indisponível, usando scroll nativo',e); }
  }
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const id=a.getAttribute('href'); if(id.length<2) return;
      const el=document.querySelector(id); if(!el) return;
      e.preventDefault();
      closeMobile();
      if(lenis) lenis.scrollTo(el,{offset:-70}); else el.scrollIntoView();
    });
  });

  /* ---------- MENU MOBILE ---------- */
  const navToggle=document.getElementById('navToggle');
  const navMobile=document.getElementById('navMobile');
  function setMobile(open){
    if(!navToggle||!navMobile) return;
    navToggle.classList.toggle('open',open);
    navMobile.classList.toggle('open',open);
    document.body.classList.toggle('menu-open',open);
    navToggle.setAttribute('aria-expanded',open);
    navToggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
    navMobile.setAttribute('aria-hidden',!open);
  }
  function closeMobile(){ setMobile(false); }
  if(navToggle&&navMobile){
    navToggle.addEventListener('click',()=>setMobile(!navMobile.classList.contains('open')));
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ closeMobile(); closeLangMenu(); } });
  }

  /* ---------- PROGRESS bar ---------- */
  const bar=document.querySelector('.progress');
  gsap.to(bar,{scaleX:1,ease:"none",scrollTrigger:{trigger:document.body,start:"top top",end:"bottom bottom",scrub:true}});

  /* ---------- NAV shrink ---------- */
  const nav=document.getElementById('nav');
  ScrollTrigger.create({start:"top -60",onUpdate:s=>nav.classList.toggle('shrink',s.scroll()>60),onToggle:s=>nav.classList.toggle('shrink',s.progress>0)});
  if(window.scrollY>60) nav.classList.add('shrink');

  /* ---------- PRELOADER ---------- */
  let SITE_STARTED=false;
  function startSite(){ if(SITE_STARTED) return; SITE_STARTED=true; document.body.classList.remove('loading'); try{ initReveals(); initHero(); initSteps(); initEstilos(); initCompare(); maybeShowCookieBar(); }catch(e){ console.error(e); } ScrollTrigger.refresh(); }
  const plN=document.querySelector('.pl-n');
  function hidePreloader(){ const p=document.querySelector('.preloader'),c=document.querySelector('.curtain'); if(p)p.style.display='none'; if(c)c.style.display='none'; }
  if(RM){
    hidePreloader();
    startSite();
  } else {
    try{
      const mark=document.querySelector('.preloader__mark');
      const tl=gsap.timeline({onComplete:startSite});
      tl.fromTo(mark,{opacity:0,scale:.72,filter:'blur(10px)'},{opacity:1,scale:1,filter:'blur(0px)',duration:1.1,ease:"power3.out"});
      const counter={v:0};
      tl.to(counter,{v:100,duration:1.4,ease:"power1.inOut",onUpdate:()=>{plN.textContent=Math.round(counter.v);}},0);
      tl.to('.preloader',{yPercent:-100,duration:.8,ease:"power4.inOut"},"+=.15")
        .to('.curtain',{yPercent:-100,duration:.9,ease:"power4.inOut"},"-=.65");
    }catch(e){ console.error(e); hidePreloader(); startSite(); }
  }
  // failsafe — never leave the user on a stuck preloader
  setTimeout(()=>{ if(!SITE_STARTED){ hidePreloader(); startSite(); } },4200);

  /* ---------- REVEALS ---------- */
  function initReveals(){
    // generic reveal
    gsap.utils.toArray('.reveal').forEach(el=>{
      if(el.closest('.hero')) return; // hero handled by its own timeline
      gsap.to(el,{opacity:1,y:0,duration:.8,ease:EASE,scrollTrigger:{trigger:el,start:"top 86%"}});
    });
    // stagger groups
    [['.rec__grid','.card'],['.estilos__grid','.preset']].forEach(([p,c])=>{
      const parent=document.querySelector(p); if(!parent) return;
      gsap.to(parent.querySelectorAll(c),{opacity:1,y:0,duration:.8,ease:EASE,stagger:.07,scrollTrigger:{trigger:parent,start:"top 82%"}});
    });
    // line reveals for [data-lines] — only those NOT already covered by .reveal
    gsap.utils.toArray('[data-lines]').forEach(h=>{
      if(h.closest('.hero')||h.classList.contains('reveal')) return;
      gsap.from(h,{opacity:0,y:34,duration:.9,ease:EASE,scrollTrigger:{trigger:h,start:"top 85%"}});
    });
  }

  /* ---------- HERO ---------- */
  function initHero(){
    const wire=document.querySelector('.hero__wire');
    // entrance sequence
    const tl=gsap.timeline({defaults:{ease:EASE}});
    tl.from('#nav',{y:-40,opacity:0,duration:.7})
      .fromTo('.hero .eyebrow',{opacity:0,y:20},{opacity:1,y:0,duration:.6},"-=.2")
      .to('#hero-h1 .word-mask>span',{y:0,duration:.9,stagger:.045,ease:"power4.out",onComplete:()=>{const h=document.getElementById('hero-h1');if(h)h.classList.add('revealed');}},"-=.1")
      .fromTo('.hero__sub',{opacity:0,y:20},{opacity:1,y:0,duration:.6,stagger:.12},"-=.5")
      .fromTo('.hero__ctas',{opacity:0,y:20},{opacity:1,y:0,duration:.6},"-=.35")
      .fromTo('.hero__wire',{opacity:0,scale:1.08},{opacity:1,scale:1,duration:1.1,ease:"power2.out"},"-=1.1")
      .fromTo('.hero__labels,.hero__scroll',{opacity:0},{opacity:1,duration:.5},"-=.3");

    // rAF-independent failsafe: guarantee hero copy is visible even if the ticker is throttled
    setTimeout(()=>{
      document.querySelectorAll('.hero .eyebrow,.hero__sub,.hero__ctas,.hero__labels,.hero__scroll').forEach(e=>{e.style.opacity=1;e.style.transform='none';});
      document.querySelectorAll('#hero-h1 .word-mask>span').forEach(e=>{e.style.transform='none';});
      const h=document.getElementById('hero-h1'); if(h) h.classList.add('revealed');
      document.querySelector('.hero__wire').style.opacity=1;
    },3900);

    // scroll-driven sweep (signature)
    const render=document.querySelector('.hero__render');
    const sweep=document.querySelector('.hero__sweep');
    const st={v:8};
    ScrollTrigger.create({
      trigger:'#hero', start:"top top", end:"+=110%", pin:true, scrub:.6,
      onUpdate:s=>{
        const p=8+s.progress*92;
        render.style.clipPath='inset(0 '+(100-p)+'% 0 0)';
        sweep.style.left=p+'%';
        sweep.style.opacity = s.progress>0.985?0:1;
      }
    });

    // word swap in subtitle (busca o elemento a cada tick — ele é recriado ao trocar idioma)
    setInterval(()=>{
      const swap=document.querySelector('[data-swap]'); if(!swap) return;
      swapWI=(swapWI+1)%swapWords.length;
      gsap.to(swap,{opacity:0,y:-8,duration:.28,ease:"power2.in",onComplete:()=>{
        swap.textContent=swapWords[swapWI];
        gsap.fromTo(swap,{opacity:0,y:10},{opacity:1,y:0,duration:.35,ease:EASE});
      }});
    },2200);

    heroAnimated=true;
  }

  /* ---------- STEPS pin ---------- */
  function initSteps(){
    const steps=gsap.utils.toArray('.step');
    const vis=gsap.utils.toArray('.steps__visual img');
    const cur=document.querySelector('.steps-cur');
    const barI=document.getElementById('stepsBar');
    function setActive(i){
      steps.forEach((s,k)=>s.classList.toggle('on',k===i));
      vis.forEach((v,k)=>v.classList.toggle('on',k===i));
      cur.textContent='0'+(i+1);
      barI.style.transform='scaleX('+((i+1))+')';
    }
    barI.style.width='25%';barI.style.transformOrigin='left';barI.style.transform='scaleX(1)';
    if(isMobile){
      // no pin on mobile — reveal steps, keep matching visual on view
      steps.forEach((s,i)=>ScrollTrigger.create({trigger:s,start:"top 70%",onEnter:()=>setActive(i),onEnterBack:()=>setActive(i)}));
      return;
    }
    ScrollTrigger.create({
      trigger:'#stepsPin', start:"top top", end:"+=280%", pin:true, scrub:.4,
      onUpdate:s=>{ const i=Math.min(3,Math.floor(s.progress*4)); setActive(i); }
    });
  }

  /* ---------- ESTILOS (nothing extra, reveal handled) ---------- */
  function initEstilos(){}

  /* ---------- COMPARADOR (antes/depois arrastável) ---------- */
  function initCompare(){
    document.querySelectorAll('.cmp').forEach(cmp=>{
      const frame=cmp.querySelector('.cmp__frame');
      const reveal=cmp.querySelector('.cmp__reveal');
      const divider=cmp.querySelector('.cmp__divider');
      const handle=cmp.querySelector('.cmp__handle');
      if(!frame||!reveal||!divider||!handle) return;
      let p=50, dragging=false;
      function set(np){
        p=Math.max(2,Math.min(98,np));
        // render visível de p% até a borda direita — arrastar p/ esquerda revela mais render
        reveal.style.clipPath='inset(0 0 0 '+p+'%)';
        divider.style.left=p+'%';
        handle.style.left=p+'%';
        handle.setAttribute('aria-valuenow',Math.round(p));
      }
      function fromX(clientX){
        const r=frame.getBoundingClientRect();
        set(((clientX-r.left)/r.width)*100);
      }
      frame.addEventListener('pointerdown',e=>{
        dragging=true;
        try{ frame.setPointerCapture(e.pointerId); }catch(_){}
        fromX(e.clientX);
      });
      frame.addEventListener('pointermove',e=>{ if(dragging) fromX(e.clientX); });
      frame.addEventListener('pointerup',()=>{ dragging=false; });
      frame.addEventListener('pointercancel',()=>{ dragging=false; });
      handle.addEventListener('keydown',e=>{
        if(e.key==='ArrowLeft'){ set(p-2); e.preventDefault(); }
        else if(e.key==='ArrowRight'){ set(p+2); e.preventDefault(); }
      });
      set(50);
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.acc__item').forEach(item=>{
    const btn=item.querySelector('.acc__q');
    const panel=item.querySelector('.acc__a');
    btn.addEventListener('click',()=>{
      const open=item.classList.contains('open');
      document.querySelectorAll('.acc__item.open').forEach(o=>{
        if(o!==item){o.classList.remove('open');o.querySelector('.acc__q').setAttribute('aria-expanded','false');gsap.to(o.querySelector('.acc__a'),{height:0,duration:.4,ease:EASE});}
      });
      if(open){item.classList.remove('open');btn.setAttribute('aria-expanded','false');gsap.to(panel,{height:0,duration:.4,ease:EASE});}
      else{item.classList.add('open');btn.setAttribute('aria-expanded','true');gsap.set(panel,{height:'auto'});gsap.from(panel,{height:0,duration:.5,ease:EASE});}
    });
  });

  /* ---------- CUSTOM CURSOR + magnetic + tilt + card border ---------- */
  if(!TOUCH && !isMobile){
    const dot=document.querySelector('.cursor'), ring=document.querySelector('.cursor-ring');
    let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
    addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.transform='translate('+mx+'px,'+my+'px) translate(-50%,-50%)';});
    (function loop(){rx+=(mx-rx)*.16;ry+=(my-ry)*.16;ring.style.transform='translate('+rx+'px,'+ry+'px) translate(-50%,-50%)';requestAnimationFrame(loop);})();
    document.querySelectorAll('a,button,.card,.preset').forEach(el=>{
      el.addEventListener('mouseenter',()=>ring.classList.add('is-active'));
      el.addEventListener('mouseleave',()=>ring.classList.remove('is-active'));
    });
    // magnetic
    document.querySelectorAll('.magnetic').forEach(el=>{
      el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect();const x=e.clientX-r.left-r.width/2;const y=e.clientY-r.top-r.height/2;gsap.to(el,{x:x*.3,y:y*.4,duration:.4,ease:EASE});});
      el.addEventListener('mouseleave',()=>gsap.to(el,{x:0,y:0,duration:.6,ease:"elastic.out(1,.5)"}));
    });
    // tilt + reactive border
    document.querySelectorAll('.tilt').forEach(el=>{
      el.addEventListener('mousemove',e=>{
        const r=el.getBoundingClientRect();const px=(e.clientX-r.left)/r.width;const py=(e.clientY-r.top)/r.height;
        el.style.setProperty('--mx',(px*100)+'%');el.style.setProperty('--my',(py*100)+'%');
        gsap.to(el,{rotateY:(px-.5)*6,rotateX:(.5-py)*6,duration:.4,ease:EASE,transformPerspective:900});
      });
      el.addEventListener('mouseleave',()=>gsap.to(el,{rotateX:0,rotateY:0,duration:.6,ease:EASE}));
    });
    // spotlight in pricing
    const precos=document.getElementById('precos'), spot=document.getElementById('precosSpot');
    precos.addEventListener('mousemove',e=>{const r=precos.getBoundingClientRect();spot.style.left=(e.clientX-r.left)+'px';spot.style.top=(e.clientY-r.top)+'px';spot.style.opacity=1;});
    precos.addEventListener('mouseleave',()=>spot.style.opacity=0);
  }

  /* ---------- refresh after load ---------- */
  window.addEventListener('load',()=>ScrollTrigger.refresh());
})();
