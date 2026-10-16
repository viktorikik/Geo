// src/map.js — D3-карта
// ВАЖНО: на верхнем уровне модуля НЕЛЬЗЯ обращаться к d3/topojson напрямую,
// иначе модуль упадёт при импорте, если библиотеки ещё не загружены.
import { VIEWBOX, CDN_SOURCES } from './config.js';
import { COUNTRIES_DB } from './data.js';
import { state, on, emit, getFeatureKey } from './core.js';

let svg, viewport, projection, path, graticule;
let countriesLayer, oceanLayer, haloLayer;
let zoomBehavior, dragBehavior;
let featureByKey = {};
let features = [];
let countryEls = new Map();
let rotation = [0, 0, 0];
let globeDragging = false;
let globeMoved = false;

function assertLibs() {
  if (typeof window.d3 === 'undefined') {
    throw new Error('D3 не загрузился (все CDN недоступны). Кнопки викторины работают, но карта недоступна.');
  }
  if (typeof window.topojson === 'undefined') {
    throw new Error('topojson-client не загрузился (все CDN недоступны).');
  }
}

export function initMap() {
  assertLibs();

  svg = window.d3.select('#map');
  viewport = window.d3.select('#viewport');

  oceanLayer = viewport.append('g').attr('class', 'ocean-layer');
  haloLayer = viewport.append('g').attr('class', 'halo-layer');
  graticule = window.d3.geoGraticule10();
  countriesLayer = viewport.append('g').attr('class', 'countries-layer');

  setProjection('flat');
  setupZoom();
  setupHover();

  on('map:set-mode', (mode) => setMapMode(mode));
  on('map:zoom', (action) => zoomAction(action));
}

function setProjection(mode) {
  const w = VIEWBOX.w, h = VIEWBOX.h;
  if (mode === 'globe') {
    projection = window.d3.geoOrthographic()
      .scale(230)
      .translate([w / 2, h / 2])
      .rotate(rotation)
      .clipAngle(90);
  } else {
    projection = window.d3.geoNaturalEarth1()
      .scale(160)
      .translate([w / 2, h / 2]);
  }
  path = window.d3.geoPath().projection(projection);
}

export function setMapMode(mode) {
  assertLibs();
  state.mapMode = mode;
  const w = VIEWBOX.w, h = VIEWBOX.h;

  if (svg && zoomBehavior) {
    svg.call(zoomBehavior.transform, window.d3.zoomIdentity);
  }

  setProjection(mode);

  // Океан
  oceanLayer.selectAll('*').remove();
  if (mode === 'globe') {
    oceanLayer.append('circle')
      .attr('cx', w / 2).attr('cy', h / 2).attr('r', 230)
      .attr('fill', 'url(#oceanGrad)');
  } else {
    oceanLayer.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', w).attr('height', h)
      .attr('fill', 'url(#oceanGrad)');
  }

  // Обводка и сетка
  haloLayer.selectAll('*').remove();
  if (mode === 'globe') {
    haloLayer.append('circle')
      .attr('cx', w / 2).attr('cy', h / 2).attr('r', 230)
      .attr('fill', 'none')
      .attr('stroke', 'var(--accent-1)')
      .attr('stroke-width', 1)
      .attr('opacity', 0.5);
  }
  haloLayer.append('path')
    .datum(graticule)
    .attr('class', 'graticule')
    .attr('d', path);

  renderCountries();
  updateZoomBehavior(mode);
  emit('map:mode-changed', mode);
}

function renderCountries() {
  countriesLayer.selectAll('*').remove();
  countryEls.clear();
  for (const f of features) {
    const key = getFeatureKey(f);
    if (!key) continue;
    if (!COUNTRIES_DB[key]) continue;

    const el = countriesLayer.append('path')
      .datum(f)
      .attr('class', 'country clickable')
      .attr('d', path)
      .attr('data-id', key);
    countryEls.set(key, el);
    if (state.stats.exploredCountries.includes(key)) {
      el.classed('known', true);
    }
  }
}

function redraw() {
  if (!path) return;
  if (state.mapMode === 'globe') {
    const w = VIEWBOX.w, h = VIEWBOX.h;
    oceanLayer.selectAll('circle').attr('cx', w / 2).attr('cy', h / 2);
  }
  haloLayer.selectAll('path.graticule').attr('d', path);
  countriesLayer.selectAll('path.country').attr('d', path);
}

function setupZoom() {
  zoomBehavior = window.d3.zoom()
    .scaleExtent([1, 25])
    .on('zoom', (event) => {
      if (state.mapMode === 'globe') return;
      countriesLayer.attr('transform', event.transform);
      haloLayer.attr('transform', event.transform);
    });
  svg.call(zoomBehavior);

  dragBehavior = window.d3.drag()
    .on('start', (event) => {
      if (state.mapMode !== 'globe') return;
      globeDragging = true;
      globeMoved = false;
    })
    .on('drag', (event) => {
      if (state.mapMode !== 'globe' || !globeDragging) return;
      globeMoved = true;
      const sens = 0.25;
      rotation[0] += event.dx * sens;
      rotation[1] -= event.dy * sens;
      rotation[1] = Math.max(-90, Math.min(90, rotation[1]));
      projection.rotate(rotation);
      redraw();
    })
    .on('end', () => {
      globeDragging = false;
      setTimeout(() => { globeMoved = false; }, 50);
    });
  svg.call(dragBehavior);
}

function updateZoomBehavior(mode) {
  if (mode === 'globe') {
    svg.on('.zoom', null);
    svg.call(dragBehavior);
  } else {
    svg.call(zoomBehavior);
  }
}

function zoomAction(action) {
  if (state.mapMode === 'globe') return;
  if (action === 'in') {
    svg.transition().duration(250).call(zoomBehavior.scaleBy, 1.6);
  } else if (action === 'out') {
    svg.transition().duration(250).call(zoomBehavior.scaleBy, 1 / 1.6);
  } else if (action === 'reset') {
    svg.transition().duration(400).call(zoomBehavior.transform, window.d3.zoomIdentity);
  }
}

export function zoomToFeature(key) {
  if (!featureByKey[key]) return;
  if (state.mapMode === 'globe') {
    const f = featureByKey[key];
    const c = window.d3.geoCentroid(f);
    rotation = [-c[0], -c[1], 0];
    projection.rotate(rotation);
    redraw();
    return;
  }
  const f = featureByKey[key];
  const bounds = path.bounds(f);
  const w = VIEWBOX.w, h = VIEWBOX.h;
  const dx = bounds[1][0] - bounds[0][0];
  const dy = bounds[1][1] - bounds[0][1];
  const x = (bounds[0][0] + bounds[1][0]) / 2;
  const y = (bounds[0][1] + bounds[1][1]) / 2;
  const scale = Math.max(1, Math.min(8, 0.7 / Math.max(dx / w, dy / h)));
  const translate = [w / 2 - scale * x, h / 2 - scale * y];
  svg.transition().duration(600).call(
    zoomBehavior.transform,
    window.d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
  );
}

export function highlightFeature(key, on = true) {
  const el = countryEls.get(key);
  if (el) el.classed('highlighted', on);
}

export function clearHighlights() {
  countryEls.forEach(el => el.classed('highlighted', false));
}

export function flashFeature(key, type) {
  const el = countryEls.get(key);
  if (!el) return;
  el.classed('flash-' + type, true);
  setTimeout(() => el.classed('flash-' + type, false), 900);
}

export function markKnown(key) {
  const el = countryEls.get(key);
  if (el) el.classed('known', true);
}

export function refreshKnown() {
  countryEls.forEach((el, key) => {
    el.classed('known', state.stats.exploredCountries.includes(key));
  });
}

function setupHover() {
  const tooltip = document.getElementById('tooltip');
  if (!tooltip) return;

  countriesLayer.on('mousemove', (event) => {
    const key = event.target.getAttribute && event.target.getAttribute('data-id');
    if (!key) { tooltip.classList.remove('show'); return; }
    const c = COUNTRIES_DB[key];
    if (!c) { tooltip.classList.remove('show'); return; }
    tooltip.textContent = c.name;
    tooltip.style.left = (event.clientX + 14) + 'px';
    tooltip.style.top = (event.clientY + 14) + 'px';
    tooltip.classList.add('show');
  });
  countriesLayer.on('mouseleave', () => tooltip.classList.remove('show'));
}

export async function loadGeoData() {
  assertLibs();
  let lastErr = null;
  for (const url of CDN_SOURCES.countries) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const topo = await res.json();
      const geo = window.topojson.feature(topo, topo.objects.countries);
      features = geo.features;
      featureByKey = {};
      for (const f of features) {
        const key = getFeatureKey(f);
        if (key && COUNTRIES_DB[key]) {
          featureByKey[key] = f;
        }
      }
      return true;
    } catch (e) {
      lastErr = e;
      console.warn('Geo load failed:', url, e);
    }
  }
  throw lastErr || new Error('Не удалось загрузить геоданные');
}

export function bindMapClick() {
  viewport.on('click', (event) => {
    if (state.mapMode === 'globe' && globeMoved) return;
    const target = event.target;
    if (!target || !target.getAttribute) return;
    const key = target.getAttribute('data-id');
    if (!key) return;
    if (!COUNTRIES_DB[key]) return;
    emit('country:clicked', key);
  });
}

export function getFeatureByKey(key) {
  return featureByKey[key];
}
