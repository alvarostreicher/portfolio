const SECTION_IDS = ['hero', 'skills', 'experience', 'projects', 'about', 'contact'];

const onIdle = (cb) => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(cb, { timeout: 1200 });
    return;
  }
  window.setTimeout(cb, 500);
};

const setDot = (id) => {
  document.querySelectorAll('.scroll-dot').forEach((d) => d.classList.remove('active'));
  const dot = document.querySelector(`.scroll-dot[data-section="${id}"]`);
  if (dot) dot.classList.add('active');
};

const setupThreeBackground = async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  try {
    const THREE = await import('three');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    const particleCount = 900;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const palette = [
      new THREE.Color('#00dcff'),
      new THREE.Color('#7b5cfa'),
      new THREE.Color('#ff2d78'),
      new THREE.Color('#ffffff'),
    ];

    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particles = new THREE.Points(
      particlesGeometry,
      new THREE.PointsMaterial({ size: 0.35, vertexColors: true, transparent: true, opacity: 0.7 }),
    );
    scene.add(particles);

    const makeWire = (geometry, color, x, y, z) => {
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color,
          wireframe: true,
          transparent: true,
          opacity: 0.14,
        }),
      );
      mesh.position.set(x, y, z);
      scene.add(mesh);
      return mesh;
    };

    const shapes = [
      makeWire(new THREE.IcosahedronGeometry(12, 1), 0x00dcff, -30, 8, -20),
      makeWire(new THREE.OctahedronGeometry(8), 0x7b5cfa, 28, -10, -15),
      makeWire(new THREE.TorusGeometry(9, 2.5, 8, 24), 0xff2d78, 0, -25, -10),
    ];

    let mouseX = 0;
    let mouseY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      particles.rotation.y = t * 0.018;
      particles.rotation.x = t * 0.008;
      shapes[0].rotation.x = t * 0.22;
      shapes[0].rotation.y = t * 0.14;
      shapes[1].rotation.y = t * 0.18;
      shapes[1].rotation.z = t * 0.1;
      shapes[2].rotation.x = t * 0.12;
      shapes[2].rotation.z = t * 0.16;
      camera.position.x += (mouseX * 8 - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 5 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    };

    animate();
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  } catch (error) {
    console.warn('Three background disabled:', error);
  }
};

const setupStatCounters = () => {
  const counters = [...document.querySelectorAll('.stat-num[data-target]')];
  const hero = document.getElementById('hero');
  if (!counters.length || !hero) return;

  const animateCounter = (el, target) => {
    const duration = 1300;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = `${Math.round(target * progress)}+`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      counters.forEach((el) => animateCounter(el, Number(el.dataset.target || 0)));
      observer.disconnect();
    },
    { threshold: 0.55 },
  );

  observer.observe(hero);
};

const setupScrollUI = () => {
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    let ticking = false;
    const updateProgress = () => {
      const height = document.body.scrollHeight - window.innerHeight;
      const progress = height > 0 ? window.scrollY / height : 0;
      progressBar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(updateProgress);
      },
      { passive: true },
    );
    updateProgress();
  }

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setDot(entry.target.id);
      });
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
  );
  SECTION_IDS.forEach((id) => {
    const section = document.getElementById(id);
    if (section) sectionObserver.observe(section);
  });
};

const setupCursor = () => {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!cursor || !ring) return;

  let cursorX = 0;
  let cursorY = 0;
  let ringX = 0;
  let ringY = 0;
  let cursorScale = 1;
  let ringScale = 1;
  document.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
  });

  const follow = () => {
    ringX += (cursorX - ringX) * 0.18;
    ringY += (cursorY - ringY) * 0.18;
    cursor.style.transform = `translate3d(${cursorX - 6}px, ${cursorY - 6}px, 0) scale(${cursorScale})`;
    ring.style.transform = `translate3d(${ringX - 18}px, ${ringY - 18}px, 0) scale(${ringScale})`;
    requestAnimationFrame(follow);
  };
  follow();

  document.querySelectorAll('a,button,.skill-card,.proj-card').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursorScale = 2.5;
      ringScale = 1.6;
      ring.style.opacity = '0.8';
    });
    el.addEventListener('mouseleave', () => {
      cursorScale = 1;
      ringScale = 1;
      ring.style.opacity = '0.5';
    });
  });
};

const setupMobileNav = () => {
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  const closeNav = document.getElementById('closeNav');
  if (!menuBtn || !mobileNav || !closeNav) return;

  menuBtn.addEventListener('click', () => mobileNav.classList.add('open'));
  closeNav.addEventListener('click', () => mobileNav.classList.remove('open'));
  document.querySelectorAll('.mob-link').forEach((link) => {
    link.addEventListener('click', () => mobileNav.classList.remove('open'));
  });
};

const init = () => {
  if (window.__portfolioInitialized) return;
  if (!document.getElementById('hero')) return;
  window.__portfolioInitialized = true;

  setupStatCounters();
  setupScrollUI();
  setupCursor();
  setupMobileNav();
  window.addEventListener('load', () => onIdle(() => { void setupThreeBackground(); }), { once: true });

/* ══════════════════════════════════════
   DEMO 1: B2B ORDERS DASHBOARD
══════════════════════════════════════ */
const orders=[
  {id:'B2B-8821',client:'Acme Corp',carrier:'FedEx',amount:'$24,500',status:'paid'},
  {id:'B2B-8822',client:'MegaBulk Ltd',carrier:'DHL',amount:'$67,200',status:'pending'},
  {id:'B2B-8823',client:'TechSupply Co',carrier:'UPS',amount:'$12,750',status:'overdue'},
  {id:'B2B-8824',client:'GlobalTrade Inc',carrier:'FedEx',amount:'$89,100',status:'paid'},
  {id:'B2B-8825',client:'FastCargo SA',carrier:'Estafeta',amount:'$31,400',status:'pending'},
  {id:'B2B-8826',client:'NorthWest Dist',carrier:'DHL',amount:'$18,900',status:'overdue'},
];
let activeFilter='all';
function renderB2B(){
  const filtered=orders.filter(o=>activeFilter==='all'||o.status===activeFilter);
  const body=document.getElementById('b2bBody');
  body.innerHTML=filtered.map(o=>`
    <div class="b2b-row">
      <div class="b2b-cell" style="color:var(--accent)">${o.id}</div>
      <div class="b2b-cell">${o.client}<br><span style="color:var(--muted);font-size:.56rem">${o.carrier}</span></div>
      <div class="b2b-cell" style="color:var(--text)">${o.amount}</div>
      <div class="b2b-cell"><span class="b2b-status status-${o.status}">${o.status}</span></div>
      <div class="b2b-cell"><button class="mini-btn ${o.status==='paid'?'mini-btn-ghost':'mini-btn-success'}" onclick="sendInvoice(this,'${o.id}')" style="font-size:.56rem;padding:.18rem .5rem">${o.status==='paid'?'↓ PDF':'📨 Send'}</button></div>
    </div>`).join('');
  const paid=orders.filter(o=>o.status==='paid').length;
  const pend=orders.filter(o=>o.status!=='paid').length;
  const total=orders.reduce((a,o)=>a+parseFloat(o.amount.replace(/[$,]/g,'')),0);
  document.getElementById('sumTotal').textContent='$'+total.toLocaleString();
  document.getElementById('sumPaid').textContent=paid;
  document.getElementById('sumPending').textContent=pend;
}
window.sendInvoice=function(btn,id){
  const o=orders.find(x=>x.id===id);if(!o)return;
  btn.textContent='⟳ Sending…';btn.disabled=true;
  setTimeout(()=>{o.status='paid';renderB2B();},900);
};
document.querySelectorAll('.b2b-filter').forEach(b=>{
  b.addEventListener('click',function(){
    document.querySelectorAll('.b2b-filter').forEach(x=>x.classList.remove('active'));
    this.classList.add('active');activeFilter=this.dataset.filter;renderB2B();
  });
});
document.getElementById('bulkInvoice').addEventListener('click',function(){
  this.textContent='⟳ Sending all…';this.disabled=true;
  orders.forEach(o=>{if(o.status!=='paid'){setTimeout(()=>{o.status='paid';renderB2B();},600+Math.random()*800);}});
  setTimeout(()=>{this.textContent='📨 Send All Invoices';this.disabled=false;},1800);
});
renderB2B();

/* ══════════════════════════════════════
   DEMO 2: A11Y FORM SCORE
══════════════════════════════════════ */
const a11yFeatureConfig=[
  {
    toggleId:'a11yToggleLabels',
    points:20,
    onText:'Labels are programmatically tied to their controls.',
    offText:'Enable label binding (`for` + `id`) so assistive tech reads each field name.',
    enable(){
      const bindings=[['f-name-label','f-name'],['f-dob-label','f-dob'],['f-dept-label','f-dept']];
      bindings.forEach(([labelId,inputId])=>{
        const label=document.getElementById(labelId);
        if(label)label.setAttribute('for', inputId);
      });
    },
    disable(){
      ['f-name-label','f-dob-label','f-dept-label'].forEach((labelId)=>{
        const label=document.getElementById(labelId);
        if(label)label.removeAttribute('for');
      });
    },
    check(){
      const bindings=[['f-name-label','f-name'],['f-dob-label','f-dob'],['f-dept-label','f-dept']];
      return bindings.every(([labelId,inputId])=>{
        const label=document.getElementById(labelId);
        return !!label && label.getAttribute('for')===inputId;
      });
    },
  },
  {
    toggleId:'a11yToggleRequired',
    points:20,
    onText:'Required fields expose both native and ARIA required state.',
    offText:'Enable required semantics so mandatory fields are announced consistently.',
    enable(){
      ['f-name','f-dob'].forEach((id)=>{
        const input=document.getElementById(id);
        if(!input)return;
        input.setAttribute('required','');
        input.setAttribute('aria-required','true');
      });
    },
    disable(){
      ['f-name','f-dob'].forEach((id)=>{
        const input=document.getElementById(id);
        if(!input)return;
        input.removeAttribute('required');
        input.removeAttribute('aria-required');
      });
    },
    check(){
      return ['f-name','f-dob'].every((id)=>{
        const input=document.getElementById(id);
        return !!input && input.hasAttribute('required') && input.getAttribute('aria-required')==='true';
      });
    },
  },
  {
    toggleId:'a11yToggleHint',
    points:20,
    onText:'Helper text is linked with `aria-describedby` for extra context.',
    offText:'Connect hint text to inputs so screen readers include guidance.',
    enable(){
      const nameInput=document.getElementById('f-name');
      if(nameInput)nameInput.setAttribute('aria-describedby','f-name-hint');
    },
    disable(){
      const nameInput=document.getElementById('f-name');
      if(nameInput)nameInput.removeAttribute('aria-describedby');
    },
    check(){
      const nameInput=document.getElementById('f-name');
      const hint=document.getElementById('f-name-hint');
      return !!nameInput && !!hint && nameInput.getAttribute('aria-describedby')==='f-name-hint';
    },
  },
  {
    toggleId:'a11yToggleGroup',
    points:20,
    onText:'Radio options are exposed as one labeled group.',
    offText:'Add radiogroup semantics so navigation and announcement are clearer.',
    enable(){
      const group=document.getElementById('f-priority-group');
      if(!group)return;
      group.setAttribute('role','radiogroup');
      group.setAttribute('aria-labelledby','f-priority-legend');
    },
    disable(){
      const group=document.getElementById('f-priority-group');
      if(!group)return;
      group.removeAttribute('role');
      group.removeAttribute('aria-labelledby');
    },
    check(){
      const group=document.getElementById('f-priority-group');
      const legend=document.getElementById('f-priority-legend');
      const radios=Array.from(document.querySelectorAll('#f-priority-group input[type="radio"]'));
      return !!group &&
        !!legend &&
        group.getAttribute('role')==='radiogroup' &&
        group.getAttribute('aria-labelledby')==='f-priority-legend' &&
        radios.length>=2 &&
        new Set(radios.map((radio)=>radio.name)).size===1 &&
        radios.every((radio)=>!!radio.closest('label'));
    },
  },
  {
    toggleId:'a11yToggleLive',
    points:20,
    onText:'Score feedback uses live-region and progressbar semantics.',
    offText:'Enable progressbar/live-region semantics so score updates are announced.',
    enable(){
      const track=document.getElementById('a11yTrack');
      const val=document.getElementById('a11yScoreVal');
      if(track){
        track.setAttribute('role','progressbar');
        track.setAttribute('aria-labelledby','a11yScoreLabel');
        track.setAttribute('aria-valuemin','0');
        track.setAttribute('aria-valuemax','100');
      }
      if(val){
        val.setAttribute('role','status');
        val.setAttribute('aria-live','polite');
      }
    },
    disable(){
      const track=document.getElementById('a11yTrack');
      const val=document.getElementById('a11yScoreVal');
      if(track){
        track.removeAttribute('role');
        track.removeAttribute('aria-labelledby');
        track.removeAttribute('aria-valuemin');
        track.removeAttribute('aria-valuemax');
        track.removeAttribute('aria-valuenow');
      }
      if(val){
        val.removeAttribute('role');
        val.removeAttribute('aria-live');
      }
    },
    check(){
      const track=document.getElementById('a11yTrack');
      const val=document.getElementById('a11yScoreVal');
      return !!track &&
        !!val &&
        track.getAttribute('role')==='progressbar' &&
        track.getAttribute('aria-labelledby')==='a11yScoreLabel' &&
        track.getAttribute('aria-valuemin')==='0' &&
        track.getAttribute('aria-valuemax')==='100' &&
        val.getAttribute('role')==='status' &&
        val.getAttribute('aria-live')==='polite';
    },
  },
];

function renderA11yChanges(results){
  const list=document.getElementById('a11yChanges');
  if(!list)return;
  list.innerHTML='';
  results.forEach(({feature,enabled})=>{
    const item=document.createElement('li');
    item.className='a11y-change-item '+(enabled?'is-on':'is-off');
    item.textContent=enabled?`+${feature.points} ${feature.onText}`:feature.offText;
    list.appendChild(item);
  });
}

function updateA11yScore(){
  a11yFeatureConfig.forEach((feature)=>{
    const toggle=document.getElementById(feature.toggleId);
    if(toggle && toggle.checked){
      feature.enable();
    } else {
      feature.disable();
    }
  });

  const results=a11yFeatureConfig.map((feature)=>({feature,enabled:feature.check()}));
  const score=results.reduce((total,result)=>total+(result.enabled?result.feature.points:0),0);

  const track=document.getElementById('a11yTrack');
  const fill=document.getElementById('a11yFill');
  const val=document.getElementById('a11yScoreVal');
  if(!fill || !val)return;
  if(track && track.getAttribute('role')==='progressbar'){
    track.setAttribute('aria-valuenow', String(score));
  }
  fill.style.transform=`scaleX(${score/100})`;
  fill.style.background=score>=90?'#4ade80':score>=70?'var(--accent)':'#f59e0b';
  val.textContent=score+'%';
  val.style.color=score>=90?'#4ade80':score>=70?'var(--accent)':'#f59e0b';
  renderA11yChanges(results);
}
document.querySelectorAll('.a11y-toggle').forEach((toggle)=>{
  toggle.addEventListener('change', updateA11yScore);
});
updateA11yScore();

/* ══════════════════════════════════════
   DEMO 3: SQL AUDIT
══════════════════════════════════════ */
const sqlBefore=`<span class="cmt">-- ❌ N+1 Problem: fetches patients then</span>
<span class="cmt">-- runs a separate query per patient</span>
<span class="kw">SELECT</span> * <span class="kw">FROM</span> <span class="fn">Patients</span>
<span class="kw">WHERE</span> DepartmentId = <span class="str">@deptId</span>

<span class="cmt">-- Then for EACH patient (N queries):</span>
<span class="kw">SELECT</span> * <span class="kw">FROM</span> <span class="fn">Appointments</span>
<span class="kw">WHERE</span> PatientId = <span class="str">@patientId</span>

<span class="cmt">-- No index on PatientId → full table scan</span>`;

const sqlAfter=`<span class="cmt">-- ✓ Single JOIN + indexed columns</span>
<span class="kw">SELECT</span>
  p.Id, p.Name, p.DOB,
  a.Date, a.DoctorId, a.Status
<span class="kw">FROM</span> <span class="fn">Patients</span> p
<span class="kw">INNER JOIN</span> <span class="fn">Appointments</span> a
  <span class="kw">ON</span> a.PatientId = p.Id

<span class="cmt">-- Index created:</span>
<span class="kw">CREATE INDEX</span> <span class="fn">IX_Appt_PatientId</span>
  <span class="kw">ON</span> Appointments(PatientId)
  <span class="kw">INCLUDE</span> (Date, DoctorId, Status)`;

let sqlMode='before';
function renderSQL(){
  document.getElementById('sqlCode').innerHTML=sqlMode==='before'?sqlBefore:sqlAfter;
  const explain=document.getElementById('sqlExplain');
  if(sqlMode==='before'){
    explain.innerHTML='<span class="explain-item explain-bad">Full Table Scan</span><span class="explain-item explain-bad">N+1 Queries</span><span class="explain-item explain-bad">No Index</span>';
    document.getElementById('sqlTime').textContent='1,240ms';document.getElementById('sqlTime').style.color='var(--accent2)';
    document.getElementById('sqlScans').textContent='847';document.getElementById('sqlScans').style.color='var(--accent2)';
    document.getElementById('sqlRows').textContent='N+1';document.getElementById('sqlRows').style.color='var(--accent2)';
  } else {
    explain.innerHTML='<span class="explain-item explain-good">Index Seek</span><span class="explain-item explain-good">Single Query</span><span class="explain-item explain-good">Covering Index</span>';
    document.getElementById('sqlTime').textContent='18ms';document.getElementById('sqlTime').style.color='#4ade80';
    document.getElementById('sqlScans').textContent='1';document.getElementById('sqlScans').style.color='#4ade80';
    document.getElementById('sqlRows').textContent='JOIN';document.getElementById('sqlRows').style.color='#4ade80';
  }
}
document.getElementById('sqlBefore').addEventListener('click',function(){sqlMode='before';this.classList.add('active');document.getElementById('sqlAfter').classList.remove('active');renderSQL();});
document.getElementById('sqlAfter').addEventListener('click',function(){sqlMode='after';this.classList.add('active');document.getElementById('sqlBefore').classList.remove('active');renderSQL();});
renderSQL();

/* ══════════════════════════════════════
   DEMO 4: AIRLINE REALTIME DASHBOARD
══════════════════════════════════════ */
(function(){
  const TOTAL=120;
  const routes=['MEX→CDG','GDL→JFK','MTY→MIA','CUN→MAD','TIJ→LAX','BOG→CDG','LIM→JFK','SCL→MAD'];
  const airlines=['AM','VB','Y4','2Z','LA','AV','VX','IB'];
  const gates=['A1','A4','B2','B7','B12','C3','C8','D1','D5','E2'];
  const statuses=['ontime','ontime','ontime','boarding','delayed','departed'];
  const statusLabel={'ontime':'On Time','boarding':'Boarding','delayed':'Delayed','departed':'Departed'};
  const statusClass={'ontime':'fs-ontime','boarding':'fs-boarding','delayed':'fs-delayed','departed':'fs-departed'};
  const ROW_HEIGHT=32;
  const OVERSCAN=4;

  const body=document.getElementById('airlineBody');
  const virtInfo=document.getElementById('virtInfo');
  const updateCounter=document.getElementById('updateCounter');
  const delayedMetric=document.getElementById('airlineDelayed');
  const ontimeMetric=document.getElementById('airlineOntime');
  const updatesMetric=document.getElementById('airlineUpdates');
  const depMetric=document.getElementById('airlineColDep');
  const gateMetric=document.getElementById('airlineColGate');
  const statusMetric=document.getElementById('airlineColStatus');
  const workerBadge=document.getElementById('workerModeBadge');
  if(!body||!virtInfo||!updateCounter||!delayedMetric||!ontimeMetric||!updatesMetric||!depMetric||!gateMetric||!statusMetric)return;

  // Generate dataset
  const flights=Array.from({length:TOTAL},(_,i)=>({
    id:airlines[i%airlines.length]+' '+(400+Math.floor(Math.random()*500)),
    route:routes[i%routes.length],
    dep:padTime(6+Math.floor(i*.18),Math.floor(Math.random()*60)),
    gate:gates[Math.floor(Math.random()*gates.length)],
    status:statuses[Math.floor(Math.random()*statuses.length)],
  }));
  function padTime(h,m){return (h%24+'').padStart(2,'0')+':'+(m+'').padStart(2,'0');}

  let updateCount=0;
  let updatesThisSec=0;
  let depChangesThisSec=0;
  let gateChangesThisSec=0;
  let statusChangesThisSec=0;
  let pendingFieldChanges=new Map();
  let rafRender=0;
  let workerUrl='';
  let worker=null;

  function queueRender(){
    if(rafRender)return;
    rafRender=requestAnimationFrame(()=>{
      rafRender=0;
      renderRows();
    });
  }

  function renderRows(){
    const viewportRows=Math.ceil(body.clientHeight/ROW_HEIGHT)||8;
    const start=Math.max(0,Math.floor(body.scrollTop/ROW_HEIGHT)-OVERSCAN);
    const end=Math.min(TOTAL,start+viewportRows+OVERSCAN*2);
    const topOffset=start*ROW_HEIGHT;

    const rowsHtml=[];
    for(let i=start;i<end;i++){
      const f=flights[i];
      const changed=pendingFieldChanges.get(i);
      const depClass=changed&&changed.has('dep')?' updated col-dep':'';
      const gateClass=changed&&changed.has('gate')?' updated col-gate':'';
      const statusUpdateClass=changed&&changed.has('status')?' updated col-status':'';
      rowsHtml.push(`
      <div class="airline-row" data-row="${i}">
        <div class="airline-cell" style="color:var(--accent)">${f.id}</div>
        <div class="airline-cell">${f.route}</div>
        <div class="airline-cell${depClass}">${f.dep}</div>
        <div class="airline-cell${gateClass}">${f.gate}</div>
        <div class="airline-cell"><span class="flight-status ${statusClass[f.status]}${statusUpdateClass}">${statusLabel[f.status]}</span></div>
      </div>`);
    }
    body.innerHTML=`<div class="airline-spacer" style="height:${TOTAL*ROW_HEIGHT}px"></div><div class="airline-viewport" style="transform:translateY(${topOffset}px)">${rowsHtml.join('')}</div>`;
    pendingFieldChanges.clear();

    let delayed=0;let ontime=0;
    flights.forEach((f)=>{if(f.status==='delayed')delayed++;if(f.status==='ontime')ontime++;});
    delayedMetric.textContent=delayed;
    ontimeMetric.textContent=ontime;
    updateCounter.textContent='Updates: '+updateCount;
    virtInfo.textContent=`Rendering ${end-start} rows (${start+1}-${end}) of ${TOTAL} (virtualized)`;
  }

  function applyUpdates(payload){
    const updates=payload.updates||[];
    const columnCounts=payload.columnCounts||{dep:0,gate:0,status:0};
    updates.forEach((change)=>{
      const idx=change.idx;
      const flight=flights[idx];
      if(!flight)return;
      let fieldSet=pendingFieldChanges.get(idx);
      if(!fieldSet){fieldSet=new Set();pendingFieldChanges.set(idx,fieldSet);}
      if(Object.prototype.hasOwnProperty.call(change,'dep')){flight.dep=change.dep;fieldSet.add('dep');}
      if(Object.prototype.hasOwnProperty.call(change,'gate')){flight.gate=change.gate;fieldSet.add('gate');}
      if(Object.prototype.hasOwnProperty.call(change,'status')){flight.status=change.status;fieldSet.add('status');}
    });

    updateCount+=updates.length;
    updatesThisSec+=updates.length;
    depChangesThisSec+=(columnCounts.dep||0);
    gateChangesThisSec+=(columnCounts.gate||0);
    statusChangesThisSec+=(columnCounts.status||0);
    queueRender();
  }

  function makeMainThreadUpdates(count){
    const updates=[];
    const columnCounts={dep:0,gate:0,status:0};
    for(let i=0;i<count;i++){
      const idx=Math.floor(Math.random()*TOTAL);
      const update={idx};
      const fieldRoll=Math.random();
      if(fieldRoll<0.45){
        update.status=statuses[Math.floor(Math.random()*statuses.length)];
        columnCounts.status++;
      } else if(fieldRoll<0.8){
        const [h,m]=flights[idx].dep.split(':').map(Number);
        update.dep=padTime(h,Math.max(0,Math.min(59,m+Math.floor(Math.random()*10)-4)));
        columnCounts.dep++;
      } else {
        update.gate=gates[Math.floor(Math.random()*gates.length)];
        columnCounts.gate++;
      }
      updates.push(update);
    }
    return {updates,columnCounts};
  }

  function createFlightWorker(){
    if(!('Worker' in window))return null;
    const workerScript=`
      let flights=[];let statuses=[];let gates=[];
      const padTime=(h,m)=>String((h%24+24)%24).padStart(2,'0')+':'+String(m).padStart(2,'0');
      const shiftDep=(dep)=>{const parts=dep.split(':').map(Number);const h=parts[0];const m=parts[1];const nm=Math.max(0,Math.min(59,m+Math.floor(Math.random()*10)-4));return padTime(h,nm);};
      self.onmessage=(event)=>{
        const data=event.data||{};
        if(data.type==='init'){flights=data.flights||[];statuses=data.statuses||[];gates=data.gates||[];return;}
        if(data.type!=='tick'||!flights.length)return;
        const count=data.count||1;
        const updates=[];
        const columnCounts={dep:0,gate:0,status:0};
        for(let i=0;i<count;i++){
          const idx=Math.floor(Math.random()*flights.length);
          const update={idx};
          const roll=Math.random();
          if(roll<0.45){
            update.status=statuses[Math.floor(Math.random()*statuses.length)];
            flights[idx].status=update.status;
            columnCounts.status++;
          } else if(roll<0.8){
            update.dep=shiftDep(flights[idx].dep);
            flights[idx].dep=update.dep;
            columnCounts.dep++;
          } else {
            update.gate=gates[Math.floor(Math.random()*gates.length)];
            flights[idx].gate=update.gate;
            columnCounts.gate++;
          }
          if(Math.random()<0.18&&!Object.prototype.hasOwnProperty.call(update,'gate')){
            update.gate=gates[Math.floor(Math.random()*gates.length)];
            flights[idx].gate=update.gate;
            columnCounts.gate++;
          }
          updates.push(update);
        }
        self.postMessage({updates,columnCounts});
      };
    `;
    try{
      workerUrl=URL.createObjectURL(new Blob([workerScript],{type:'text/javascript'}));
      return new Worker(workerUrl,{name:'flight-column-worker'});
    }catch(_error){
      return null;
    }
  }

  worker=createFlightWorker();
  if(worker){
    worker.postMessage({type:'init',flights,statuses,gates});
    worker.onmessage=(event)=>applyUpdates(event.data||{});
    if(workerBadge)workerBadge.textContent='⚙ Worker: Parallel';
  }else if(workerBadge){
    workerBadge.textContent='⚙ Worker: Fallback';
  }

  function runTick(){
    const count=2+Math.floor(Math.random()*3);
    if(worker){
      worker.postMessage({type:'tick',count});
      return;
    }
    applyUpdates(makeMainThreadUpdates(count));
  }

  const tickTimer=setInterval(runTick,900);
  const metricsTimer=setInterval(()=>{
    updatesMetric.textContent=updatesThisSec;
    depMetric.textContent=depChangesThisSec;
    gateMetric.textContent=gateChangesThisSec;
    statusMetric.textContent=statusChangesThisSec;
    updatesThisSec=0;
    depChangesThisSec=0;
    gateChangesThisSec=0;
    statusChangesThisSec=0;
  },1000);

  body.addEventListener('scroll',queueRender,{passive:true});
  renderRows();

  // FPS counter
  let frames=0,lastFpsTime=performance.now();
  (function countFPS(){requestAnimationFrame(countFPS);frames++;const now=performance.now();if(now-lastFpsTime>1000){const fps=Math.round(frames*1000/(now-lastFpsTime));const badge=document.getElementById('fpsBadge');if(badge)badge.textContent=fps+' FPS';frames=0;lastFpsTime=now;}})();
  window.addEventListener('pagehide',()=>{
    clearInterval(tickTimer);
    clearInterval(metricsTimer);
    if(worker){worker.terminate();worker=null;}
    if(workerUrl)URL.revokeObjectURL(workerUrl);
  },{once:true});
})();

/* ══════════════════════════════════════
   DEMO 5: CI/CD PIPELINE
══════════════════════════════════════ */
const pipeSteps=[
  {id:'pn0',msgs:['npm ci — resolving 847 packages…','Dependencies installed (12.3s) ✓']},
  {id:'pn1',msgs:['ESLint + Prettier checking 143 files…','0 errors, 0 warnings ✓']},
  {id:'pn2',msgs:['Vitest running 312 unit tests…','All passed · Coverage: 94.2% ✓']},
  {id:'pn3',msgs:['Webpack production build…','Bundle: 214kb gzipped (67kb) ✓']},
  {id:'pn4',msgs:['Uploading to AWS S3 bucket…','CloudFront cache invalidated · Live ✓']},
];
let pipeRunning=false;
document.getElementById('runPipeline').addEventListener('click',function(){
  if(pipeRunning)return;pipeRunning=true;this.textContent='⟳ Running…';
  pipeSteps.forEach(s=>document.getElementById(s.id).className='pipe-node idle');
  document.getElementById('cicdLog').innerHTML='';let step=0;
  function next(){
    if(step>=pipeSteps.length){addLog('ok','✓ Deployed to production');pipeRunning=false;document.getElementById('runPipeline').textContent='▶ Run Pipeline';return;}
    const s=pipeSteps[step];document.getElementById(s.id).className='pipe-node running';addLog('run',s.msgs[0]);
    setTimeout(()=>{document.getElementById(s.id).className='pipe-node done';addLog('ok',s.msgs[1]);step++;setTimeout(next,280);},1000);
  }next();
});
function addLog(t,m){const log=document.getElementById('cicdLog');const ts=new Date().toLocaleTimeString('en',{hour12:false});log.innerHTML+=`<div><span class="log-time">${ts}</span><span class="${t==='ok'?'log-ok':'log-run'}">${m}</span></div>`;log.scrollTop=log.scrollHeight;}

/* ══════════════════════════════════════
   DEMO 6: ATOMIC DESIGN
══════════════════════════════════════ */
const atomicDescs={
  final:'The complete FlightCard component as rendered in production — composed entirely from smaller atomic units.',
  atom:'<span style="color:#4ade80">Atoms highlighted:</span> Text primitives (flight-code), Badge/status chip, and Button elements — the smallest indivisible UI units with their own props.',
  molecule:'<span style="color:var(--accent)">Molecules highlighted:</span> FlightRoute (code + arrow + destination), InfoRow (label + value pair), and ActionGroup (button cluster) — atoms with shared state.',
  organism:'<span style="color:var(--accent3)">Organism highlighted:</span> The complete header section and info grid — multiple molecules working together to form a meaningful UI section.',
};
document.querySelectorAll('.atomic-tab').forEach(tab=>{
  tab.addEventListener('click',function(){
    document.querySelectorAll('.atomic-tab').forEach(t=>t.classList.remove('active'));
    this.classList.add('active');
    const mode=this.dataset.mode;
    const card=document.getElementById('flightCardDemo');
    card.className='flight-card';
    if(mode!=='final')card.classList.add('highlight-'+mode);
    document.getElementById('atomicDesc').innerHTML=atomicDescs[mode]||'';
    document.getElementById('atomicLegend').style.display=mode==='final'?'none':'flex';
  });
});
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
