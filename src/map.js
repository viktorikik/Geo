import {
  MAP_WIDTH, MAP_HEIGHT, GLOBE_INITIAL_ROTATION,
} from './config.js';
import { COUNTRIES_DB } from './data.js';
import {
  state, setState, getFeatureKey, emit,
  initAudio, playClickSound, vibrate,
} from './core.js';
import { showToast } from './ui.js';

// Внутреннее состояние карты
let svg, viewport, zoom, projection, pathGenerator;
let spherePath, graticulePath, haloPath, globeDrag;
let countryPaths = null;
let globeScaleDefault = 220;
const featureByKey = {};
let highlightedFeature = null;

// Внешний доступ (для quiz / screens)
export function getFeatureByKey() { return featureByKey; }
export function getCountryPaths() { return countryPaths; }
export function getProjection() { return projection; }

/* ============================================================
   INIT
   ============================================================ */
export async function initMap() {
  let worldData;
  try {
    worldData = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
  } catch (e) {
    document.getElementById('panel-content').innerHTML =
      '<h2>😢 Ошибка загрузки</h2><p>Проверь интернет и обнови страницу.</p>';
    throw e;
  }

  const countries = topojson.feature(worldData, worldData.objects.countries);
  countries.features.forEach(f => {
    const key = getFeatureKey(f);
    if (key && COUNTRIES_DB[key]) featureByKey[key] = f;
  });

  svg = d3.select('#map');
  viewport = d3.select('#viewport');
  projection = d3.geoNaturalEarth1()
    .fitExtent([[10, 10], [MAP_WIDTH - 10, MAP_HEIGHT - 10]], { type: 'Sphere' });
  pathGenerator = d3.geoPath(projection);

  haloPath = viewport.append('path')
    .attr('fill', 'none')
    .attr('stroke', 'rgba(96,165,250,.4)')
    .attr('stroke-width', 8)
    .attr('filter', 'url(#glow)')
    .style('display', 'none');

  spherePath = viewport.append('path')
    .attr('fill', 'url(#oceanGrad)')
    .attr('stroke', 'rgba(255,255,255,.1)')
    .attr('stroke-width', 1);

  graticulePath = viewport.append('path')
    .attr('fill', 'none')
    .attr('stroke', 'rgba(255,255,255,.04)')
    .attr('stroke-width', 0.5);

  countryPaths = viewport.append('g').attr('id', 'countries')
    .selectAll('path')
    .data(countries.features)
    .join('path')
    .attr('d', pathGenerator)
    .on('click', onClickCountry)
    .on('mousemove', moveTooltip)
    .on('mouseleave', () => { document.getElementById('tooltip').style.display = 'none'; });

  updateLandColors();
  redrawAll();
  setupZoomDrag();

  setState({ ready: true });
}

/* ============================================================
   RENDER
   ============================================================ */
export function redrawAll() {
  spherePath.attr('d', pathGenerator({ type: 'Sphere' }));
  graticulePath.attr('d', pathGenerator(d3.geoGraticule10()));
  haloPath.attr('d', pathGenerator({ type: 'Sphere' }));
  countryPaths.attr('d', pathGenerator);
}

export function updateLandColors() {
  if (!countryPaths) return;
  const style = getComputedStyle(document.documentElement);
  const known = style.getPropertyValue('--land-known').trim();
  const unknown = style.getPropertyValue('--land-unknown').trim();
  const border = style.getPropertyValue('--land-border').trim();
  const hi = style.getPropertyValue('--land-highlight').trim();
  const hiStroke = style.getPropertyValue('--land-highlight-stroke').trim();

  countryPaths.each(function(d) {
    const el = d3.select(this);
    if (d.__highlighted) {
      el.attr('fill', hi).attr('stroke', hiStroke).attr('stroke-width', 2).attr('filter', 'url(#glow)');
    } else {
      el.attr('fill', COUNTRIES_DB[getFeatureKey(d)] ? known : unknown)
        .attr('stroke', border).attr('stroke-width', 0.6).attr('filter', null);
    }
  });
}

/* ============================================================
   INTERACTIONS
   ============================================================ */
function onClickCountry(event, feature) {
  initAudio();
  if (state.mode === 'explore') {
    highlightFeature(feature);
    emit('country:clicked', getFeatureKey(feature));
  } else if (state.mode === 'quiz' && state.quiz && !state.quiz.inputMode) {
    emit('quiz:answer', { feature, key: getFeatureKey(feature) });
  }
}

function moveTooltip(event, feature) {
  const tooltip = document.getElementById('tooltip');
  if (state.mode !== 'explore') { tooltip.style.display = 'none'; return; }
  const country = COUNTRIES_DB[getFeatureKey(feature)];
  tooltip.textContent = country ? country.name : (feature.properties?.name || '');
  tooltip.style.display = 'block';
  tooltip.style.left = (event.clientX + 12) + 'px';
  tooltip.style.top = (event.clientY + 14) + 'px';
}

export function highlightFeature(feature) {
  if (highlightedFeature) highlightedFeature.__highlighted = false;
  feature.__highlighted = true;
  highlightedFeature = feature;
  updateLandColors();
  playClickSound();
  vibrate(20);
}

export function clearHighlight() {
  if (highlightedFeature) {
    highlightedFeature.__highlighted = false;
    highlightedFeature = null;
    updateLandColors();
  }
}

/* ============================================================
   ZOOM / DRAG
   ============================================================ */
function setupZoomDrag() {
  zoom = d3.zoom()
    .scaleExtent([1, 25])
    .translateExtent([[0, 0], [MAP_WIDTH, MAP_HEIGHT]])
    .on('zoom', ev => viewport.attr('transform', ev.transform));
  svg.call(zoom);

  globeDrag = d3.drag()
    .clickDistance(5)
    .on('start', () => svg.interrupt())
    .on('drag', (event) => {
      const k = 57.2958 / projection.scale();
      const rot = projection.rotate();
      const phi = Math.max(-85, Math.min(85, rot[1] - event.dy * k));
      projection.rotate([rot[0] + event.dx * k, phi, 0]);
      redrawAll();
    });

  setupPinch();
}

function setupPinch() {
  let startDist = 0, startScale = 0;
  const dist = (t1, t2) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

  svg.on('touchstart.pinch', e => {
    if (e.touches.length === 2) {
      e.preventDefault();
      startDist = dist(e.touches[0], e.touches[1]);
      startScale = state.mapMode === 'globe'
        ? projection.scale()
        : d3.zoomTransform(svg.node()).k;
    }
  });

  svg.on('touchmove.pinch', e => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const s = startScale * (dist(e.touches[0], e.touches[1]) / startDist);
      if (state.mapMode === 'globe') {
        projection.scale(Math.max(globeScaleDefault * 0.7, Math.min(globeScaleDefault * 5, s)));
        redrawAll();
      } else {
        const t = d3.zoomTransform(svg.node());
        const factor = Math.max(1, Math.min(25, s)) / t.k;
        svg.call(zoom.transform, t.scale(factor));
      }
    }
  });
}

export function setMapMode(mode) {
  if (state.mapMode === mode) return;
  setState({ mapMode: mode });
  document.getElementById('view-flat').classList.toggle('active', mode === 'flat');
  document.getElementById('view-globe').classList.toggle('active', mode === 'globe');
  document.getElementById('tooltip').style.display = 'none';
  svg.interrupt();
  playClickSound();

  if (mode === 'globe') {
    state.stats.globeSwitches = (state.stats.globeSwitches || 0) + 1;
    emit('stats:changed', state.stats);
  }

  if (mode === 'flat') {
    svg.on('.drag', null);
    projection = d3.geoNaturalEarth1()
      .fitExtent([[10, 10], [MAP_WIDTH - 10, MAP_HEIGHT - 10]], { type: 'Sphere' });
    haloPath.style('display', 'none');
    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity);
  } else {
    svg.on('.zoom', null);
    viewport.attr('transform', null);
    projection = d3.geoOrthographic().clipAngle(90)
      .fitExtent([[30, 30], [MAP_WIDTH - 30, MAP_HEIGHT - 30]], { type: 'Sphere' });
    globeScaleDefault = projection.scale();
    projection.rotate(GLOBE_INITIAL_ROTATION);
    haloPath.style('display', null);
    svg.call(globeDrag);
  }
  pathGenerator = d3.geoPath(projection);
  redrawAll();
  updateLandColors();
}

export function zoomTo(feature) {
  if (state.mapMode === 'globe') return rotateTo(feature);
  const [[x0, y0], [x1, y1]] = pathGenerator.bounds(feature);
  const s = Math.max(1, Math.min(12, 0.65 / Math.max((x1 - x0) / MAP_WIDTH, (y1 - y0) / MAP_HEIGHT)));
  const tx = MAP_WIDTH / 2 - s * (x0 + x1) / 2;
  const ty = MAP_HEIGHT / 2 - s * (y0 + y1) / 2;
  svg.transition().duration(700)
    .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(s));
}

function rotateTo(feature) {
  const [lon, lat] = d3.geoCentroid(feature);
  const cur = projection.rotate();
  let targetLon = -lon;
  while (targetLon - cur[0] > 180) targetLon -= 360;
  while (targetLon - cur[0] < -180) targetLon += 360;
  const target = [targetLon, Math.max(-85, Math.min(85, -lat)), 0];
  const interp = d3.interpolate(cur, target);
  svg.transition('rotate').duration(700).ease(d3.easeCubicInOut)
    .tween('rotate', () => t => {
      projection.rotate(interp(t));
      redrawAll();
    });
}

export function resetZoom() {
  clearHighlight();
  if (state.mapMode === 'flat') {
    svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
  } else {
    const cur = projection.rotate();
    let targetLon = GLOBE_INITIAL_ROTATION[0];
    while (targetLon - cur[0] > 180) targetLon -= 360;
    while (targetLon - cur[0] < -180) targetLon += 360;
    const rI = d3.interpolate(cur, [targetLon, GLOBE_INITIAL_ROTATION[1], 0]);
    const sI = d3.interpolate(projection.scale(), globeScaleDefault);
    svg.transition('reset').duration(500)
      .tween('reset', () => t => {
        projection.rotate(rI(t));
        projection.scale(sI(t));
        redrawAll();
      });
  }
}

export function zoomBy(factor) {
  if (state.mapMode === 'flat') {
    svg.transition().duration(250).call(zoom.scaleBy, factor);
  } else {
    const cur = projection.scale();
    const target = Math.max(globeScaleDefault * 0.7, Math.min(globeScaleDefault * 5, cur * factor));
    svg.transition('zoomGlobe').duration(200).tween('scale', () => {
      const i = d3.interpolate(cur, target);
      return t => { projection.scale(i(t)); redrawAll(); };
    });
  }
}

export function flashCountry(feature, type) {
  if (!countryPaths) return;
  countryPaths.filter(p => p === feature).classed(type, true);
}

export function clearFlash() {
  if (countryPaths) countryPaths.classed('flash-correct', false).classed('flash-wrong', false);
}

export function highlightQuizTarget(key) {
  const f = featureByKey[key];
  if (f) { countryPaths.filter(p => p === f).classed('flash-correct', true); zoomTo(f); }
}
