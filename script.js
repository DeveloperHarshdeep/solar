/* ==========================================================================
   SOLAR SYSTEM EXPLORER — HD WEB STUDIOS
   script.js
   -------------------------------------------------------------------------
   Sections:
   1. Planet data
   2. Starfield + shooting stars (ambient)
   3. Solar system DOM build (orbits + planets)
   4. Hover tooltip (follows planet in real time)
   5. Click-to-focus (selection, dim, detail panel)
   6. Speed control (buttons + slider) & pause/resume/reset
   7. Contact panel toggle
   ========================================================================== */

(() => {
  'use strict';

  /* ---------------------------------------------------------------------
     1. PLANET DATA
     Visual orbit/size values are chosen for a pleasing layout, not to
     astronomical scale. Distance / period / diameter text is real-world.
     dur = base orbital animation duration in seconds at 1x speed.
     --------------------------------------------------------------------- */
  const PLANET_DATA = [
    { key:'mercury', name:'Mercury', color:'#b9b6ad', size:9,  orbit:90,  dur:3,
      desc:'The smallest, swiftest planet — a scorched and cratered world with almost no atmosphere to trap heat.',
      distance:'57.9M km (0.39 AU)', period:'88 Earth days', diameter:'4,879 km', moons:'0' },
    { key:'venus', name:'Venus', color:'#e6c79c', size:15, orbit:130, dur:5,
      desc:'Earth\u2019s scorching twin, wrapped in thick clouds of sulfuric acid — the hottest planet in the system.',
      distance:'108.2M km (0.72 AU)', period:'225 Earth days', diameter:'12,104 km', moons:'0' },
    { key:'earth', name:'Earth', color:'#4f8cd6', size:16, orbit:170, dur:8,
      desc:'Our home world — the only known planet with liquid oceans, a breathable atmosphere, and life.',
      distance:'149.6M km (1 AU)', period:'365.25 days', diameter:'12,742 km', moons:'1' },
    { key:'mars', name:'Mars', color:'#c1552c', size:12, orbit:210, dur:12,
      desc:'The Red Planet — a dusty desert world with the solar system\u2019s tallest volcano and traces of ancient water.',
      distance:'227.9M km (1.52 AU)', period:'687 Earth days', diameter:'6,779 km', moons:'2' },
    { key:'jupiter', name:'Jupiter', color:'#d9a066', size:34, orbit:270, dur:20,
      desc:'The solar system\u2019s giant — a swirling ball of gas famous for its centuries-old Great Red Spot storm.',
      distance:'778.5M km (5.2 AU)', period:'11.9 Earth years', diameter:'139,820 km', moons:'95' },
    { key:'saturn', name:'Saturn', color:'#e3c16f', size:30, orbit:330, dur:28,
      desc:'Famed for its dazzling ring system, built from countless chunks of orbiting ice and rock.',
      distance:'1.43B km (9.58 AU)', period:'29.5 Earth years', diameter:'116,460 km', moons:'146' },
    { key:'uranus', name:'Uranus', color:'#87e0dd', size:22, orbit:380, dur:36,
      desc:'An ice giant tipped almost completely on its side, giving it the most extreme seasons of any planet.',
      distance:'2.87B km (19.2 AU)', period:'84 Earth years', diameter:'50,724 km', moons:'28' },
    { key:'neptune', name:'Neptune', color:'#4a6fd4', size:21, orbit:430, dur:44,
      desc:'The windiest world — a deep blue giant with supersonic storms far out at the edge of the planetary system.',
      distance:'4.5B km (30.1 AU)', period:'164.8 Earth years', diameter:'49,244 km', moons:'16' }
  ];

  const $ = (sel) => document.querySelector(sel);
  const orbitsRoot = $('#orbits-root');

  /* ---------------------------------------------------------------------
     2. AMBIENT — starfield + shooting stars
     --------------------------------------------------------------------- */
  function buildStarfield(){
    const field = $('#starfield');
    const frag = document.createDocumentFragment();
    const count = window.innerWidth < 600 ? 70 : 140;
    for(let i=0;i<count;i++){
      const s = document.createElement('span');
      s.className = 'star';
      const size = Math.random() * 2 + 0.6;
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.top = Math.random()*100 + 'vh';
      s.style.left = Math.random()*100 + 'vw';
      s.style.setProperty('--min-op', (Math.random()*0.35 + 0.1).toFixed(2));
      s.style.animationDuration = (Math.random()*3 + 2.5) + 's';
      s.style.animationDelay = (Math.random()*4) + 's';
      frag.appendChild(s);
    }
    field.appendChild(frag);
  }

  function spawnShootingStar(){
    const container = $('#shooting-stars');
    const el = document.createElement('div');
    el.className = 'shooting-star';
    el.style.top = (Math.random()*40) + 'vh';
    el.style.left = (Math.random()*60) + 'vw';
    container.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
  function scheduleShootingStars(){
    spawnShootingStar();
    setTimeout(scheduleShootingStars, Math.random()*4000 + 2500);
  }

  /* ---------------------------------------------------------------------
     3. BUILD ORBITS + PLANETS
     Each orbit ring rotates via CSS animation; each planet sits on the
     ring's edge inside a counter-rotating wrapper so it stays upright.
     --------------------------------------------------------------------- */
  const orbitEls = [];   // { orbit, wrap, planet, data }

  function buildSolarSystem(){
    PLANET_DATA.forEach((data) => {
      const orbit = document.createElement('div');
      orbit.className = 'orbit';
      orbit.style.width = data.orbit * 2 + 'px';
      orbit.style.height = data.orbit * 2 + 'px';
      orbit.style.marginLeft = -(data.orbit) + 'px';
      orbit.style.marginTop = -(data.orbit) + 'px';
      orbit.style.animationDuration = data.dur + 's';
      orbit.dataset.baseDuration = data.dur;

      const label = document.createElement('span');
      label.className = 'orbit-label';
      label.textContent = data.name.toUpperCase();
      orbit.appendChild(label);

      const wrap = document.createElement('div');
      wrap.className = 'planet-wrap';
      wrap.style.animationDuration = data.dur + 's';
      wrap.dataset.baseDuration = data.dur;

      const planet = document.createElement('div');
      planet.className = 'planet ' + data.key;
      planet.style.width = data.size + 'px';
      planet.style.height = data.size + 'px';
      planet.style.background = data.color;
      planet.style.color = data.color; /* used by ring/box-shadow currentColor */
      planet.style.boxShadow = `0 0 ${Math.max(6,data.size/2)}px ${data.color}99`;
      planet.tabIndex = 0;
      planet.setAttribute('role','button');
      planet.setAttribute('aria-label', data.name + ' — view details');
      planet.dataset.key = data.key;

      wrap.appendChild(planet);
      orbit.appendChild(wrap);
      orbitsRoot.appendChild(orbit);

      orbitEls.push({ orbit, wrap, planet, data });

      attachPlanetEvents(planet, data);
    });
  }

  /* ---------------------------------------------------------------------
     4. HOVER TOOLTIP — follows the planet live while orbiting
     --------------------------------------------------------------------- */
  const tooltip = $('#tooltip');
  let followRAF = null;
  let hoveredPlanet = null;

  function positionTooltip(planetEl){
    const r = planetEl.getBoundingClientRect();
    tooltip.style.left = (r.left + r.width/2) + 'px';
    tooltip.style.top = (r.top) + 'px';
  }

  function followLoop(){
    if(hoveredPlanet){
      positionTooltip(hoveredPlanet);
      followRAF = requestAnimationFrame(followLoop);
    }
  }

  function showTooltip(planetEl, data){
    hoveredPlanet = planetEl;
    $('#ttSwatch').style.background = data.color;
    $('#ttSwatch').style.color = data.color;
    $('#ttName').textContent = data.name;
    $('#ttDesc').textContent = data.desc;
    $('#ttDistance').textContent = data.distance;
    $('#ttPeriod').textContent = data.period;
    positionTooltip(planetEl);
    tooltip.classList.add('is-visible');
    tooltip.setAttribute('aria-hidden','false');
    cancelAnimationFrame(followRAF);
    followLoop();
  }

  function hideTooltip(){
    hoveredPlanet = null;
    cancelAnimationFrame(followRAF);
    tooltip.classList.remove('is-visible');
    tooltip.setAttribute('aria-hidden','true');
  }

  /* ---------------------------------------------------------------------
     5. CLICK-TO-FOCUS — selection, dim siblings, detail panel, gentle zoom
     --------------------------------------------------------------------- */
  const galaxy = $('#galaxy');
  const focusOverlay = $('#focusOverlay');
  const detailPanel = $('#detailPanel');
  let selectedKey = null;

  function openDetail(data){
    $('#dSwatch').style.background = data.color;
    $('#dSwatch').style.color = data.color;
    $('#dName').textContent = data.name;
    $('#dDesc').textContent = data.desc;
    $('#dDistance').textContent = data.distance;
    $('#dPeriod').textContent = data.period;
    $('#dDiameter').textContent = data.diameter;
    $('#dMoons').textContent = data.moons;
    detailPanel.classList.add('is-open');
    detailPanel.setAttribute('aria-hidden','false');
  }
  function closeDetail(){
    detailPanel.classList.remove('is-open');
    detailPanel.setAttribute('aria-hidden','true');
  }

  function selectPlanet(planetEl, data){
    hideTooltip();
    selectedKey = data.key;

    orbitEls.forEach(({ orbit, planet }) => {
      const isSelf = planet === planetEl;
      planet.classList.toggle('is-selected', isSelf);
      planet.classList.toggle('is-dimmed', !isSelf);
      orbit.classList.toggle('is-dimmed', !isSelf);
    });

    galaxy.classList.add('is-focused');
    focusOverlay.classList.add('is-active');
    setPaused(true, { fromFocus:true });
    openDetail(data);
  }

  function clearSelection(){
    selectedKey = null;
    orbitEls.forEach(({ orbit, planet }) => {
      planet.classList.remove('is-selected','is-dimmed');
      orbit.classList.remove('is-dimmed');
    });
    galaxy.classList.remove('is-focused');
    focusOverlay.classList.remove('is-active');
    closeDetail();
    setPaused(userPaused, { fromFocus:true });
  }

  function attachPlanetEvents(planet, data){
    planet.addEventListener('mouseenter', () => { if(!selectedKey) showTooltip(planet, data); });
    planet.addEventListener('mouseleave', hideTooltip);
    planet.addEventListener('focus', () => { if(!selectedKey) showTooltip(planet, data); });
    planet.addEventListener('blur', hideTooltip);
    planet.addEventListener('click', () => {
      if(selectedKey === data.key){ clearSelection(); }
      else { selectPlanet(planet, data); }
    });
    planet.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        planet.click();
      }
    });
  }

  $('#closeDetail').addEventListener('click', clearSelection);
  $('#resetFromPanel').addEventListener('click', resetAll);
  focusOverlay.addEventListener('click', clearSelection);

  /* ---------------------------------------------------------------------
     6. SPEED CONTROL + PAUSE/RESUME + RESET
     --------------------------------------------------------------------- */
  let currentSpeed = 1;
  let userPaused = false;      // pause button state
  let effectivePaused = false; // combined (user OR focus)

  function applySpeed(speed){
    currentSpeed = speed;
    orbitEls.forEach(({ orbit, wrap }) => {
      const base = parseFloat(orbit.dataset.baseDuration);
      const dur = (base / speed) + 's';
      orbit.style.animationDuration = dur;
      wrap.style.animationDuration = dur;
    });
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.toggle('is-active', parseFloat(btn.dataset.speed) === speed);
    });
    $('#speedSlider').value = speed;
  }

  function setPaused(paused, opts = {}){
    if(!opts.fromFocus) userPaused = paused;
    effectivePaused = userPaused || !!selectedKey;
    orbitEls.forEach(({ orbit, wrap }) => {
      orbit.style.animationPlayState = effectivePaused ? 'paused' : 'running';
      wrap.style.animationPlayState = effectivePaused ? 'paused' : 'running';
    });
    $('#pauseLabel').textContent = userPaused ? 'Resume' : 'Pause';
    $('#pauseIcon').textContent = userPaused ? '▶' : '❚❚';
  }

  function resetAll(){
    clearSelection();
    applySpeed(1);
    setPaused(false);
  }

  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => applySpeed(parseFloat(btn.dataset.speed)));
  });
  $('#speedSlider').addEventListener('input', (e) => applySpeed(parseFloat(e.target.value)));
  $('#pauseBtn').addEventListener('click', () => setPaused(!userPaused));
  $('#resetBtn').addEventListener('click', resetAll);

  /* ---------------------------------------------------------------------
     7. CONTACT PANEL TOGGLE
     --------------------------------------------------------------------- */
  const contactPanel = $('#contactPanel');
  $('#contactToggle').addEventListener('click', () => {
    const open = contactPanel.classList.toggle('is-open');
    $('#contactToggle').setAttribute('aria-expanded', String(open));
  });

  /* ---------------------------------------------------------------------
     INIT
     --------------------------------------------------------------------- */
  function init(){
    buildStarfield();
    buildSolarSystem();
    scheduleShootingStars();
    applySpeed(1);

    // brief opening beat: fade the HUD title's emphasis in from the eyebrow
    requestAnimationFrame(() => {
      $('#hudTitle').style.opacity = '0';
      $('#hudTitle').style.transform = 'translate(-50%,-8px)';
      $('#hudTitle').style.transition = 'opacity .8s ease, transform .8s cubic-bezier(.16,1,.3,1)';
      requestAnimationFrame(() => {
        $('#hudTitle').style.opacity = '1';
        $('#hudTitle').style.transform = 'translate(-50%,0)';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
