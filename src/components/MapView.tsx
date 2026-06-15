import L from 'leaflet';
import { createEffect, onMount } from 'solid-js';
import { getAccountVisit, getMapPinType } from '../selectors';
import { actions, state } from '../store';
import type { LocationPoint } from '../types';

const CONTACT_RANGE_METERS = 2600;
const GRID_CELL_METERS = 900;

const metersToLatitude = (meters: number) => meters / 111320;

const metersToLongitude = (meters: number, latitude: number) =>
  meters / (111320 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.2));

function MapView() {
  let container!: HTMLDivElement;
  let map: L.Map | undefined;
  let markerLayer: L.LayerGroup | undefined;
  let coverageLayer: L.LayerGroup | undefined;

  const getGridCellAccounts = (center: LocationPoint, row: number, column: number) => {
    const minLatitude = center.latitude + metersToLatitude(row * GRID_CELL_METERS);
    const maxLatitude = center.latitude + metersToLatitude((row + 1) * GRID_CELL_METERS);
    const minLongitude = center.longitude + metersToLongitude(column * GRID_CELL_METERS, center.latitude);
    const maxLongitude = center.longitude + metersToLongitude((column + 1) * GRID_CELL_METERS, center.latitude);
    return state.crm.accounts.filter((account) =>
      account.latitude >= Math.min(minLatitude, maxLatitude) &&
      account.latitude <= Math.max(minLatitude, maxLatitude) &&
      account.longitude >= Math.min(minLongitude, maxLongitude) &&
      account.longitude <= Math.max(minLongitude, maxLongitude));
  };

  const updateCoverage = () => {
    if (!coverageLayer) return;
    coverageLayer.clearLayers();
    if (!state.ui.isCoverageLayerVisible) return;
    const current = state.location.current;

    L.circle([current.latitude, current.longitude], {
      radius: CONTACT_RANGE_METERS,
      className: 'contact-range-circle',
      color: '#008a9a',
      weight: 2,
      opacity: 0.55,
      fillColor: '#2fb67c',
      fillOpacity: 0.07,
    }).addTo(coverageLayer).bindTooltip('Contact range: nearby customers inside this area');

    for (let row = -1; row <= 1; row += 1) {
      for (let column = -1; column <= 1; column += 1) {
        const cellAccounts = getGridCellAccounts(current, row, column);
        const south = current.latitude + metersToLatitude(row * GRID_CELL_METERS);
        const north = current.latitude + metersToLatitude((row + 1) * GRID_CELL_METERS);
        const west = current.longitude + metersToLongitude(column * GRID_CELL_METERS, current.latitude);
        const east = current.longitude + metersToLongitude((column + 1) * GRID_CELL_METERS, current.latitude);
        const intensity = Math.min(cellAccounts.length, 3);
        const rectangle = L.rectangle([[south, west], [north, east]], {
          className: `contact-grid-cell density-${intensity}`,
          color: '#3678f6',
          weight: 1,
          opacity: 0.34,
          fillColor: intensity ? '#3678f6' : '#ffffff',
          fillOpacity: intensity ? 0.08 + intensity * 0.08 : 0.025,
        }).addTo(coverageLayer);
        rectangle.bindTooltip(
          cellAccounts.length
            ? `${cellAccounts.length} customer contact${cellAccounts.length > 1 ? 's' : ''}: ${cellAccounts.map((account) => account.name).join(', ')}`
            : 'Coverage cell: no nearby customer contacts',
        );
      }
    }
  };

  const updateMarkers = () => {
    if (!map || !markerLayer) return;
    const layer = markerLayer;
    markerLayer.clearLayers();
    updateCoverage();
    const current = state.location.current;
    const agentIcon = L.divIcon({ className: 'agent-marker', html: '<span></span>', iconSize: [24, 24] });
    L.marker([current.latitude, current.longitude], { icon: agentIcon }).addTo(layer).bindPopup('Sofia Rivera');

    state.crm.accounts.forEach((account) => {
      const visit = getAccountVisit(account.id);
      const pinType = getMapPinType(account, visit);
      const isSelected = state.ui.selectedMapAccountId === account.id;
      const icon = L.divIcon({
        className: `account-marker ${pinType} ${isSelected ? 'selected' : ''}`,
        html: `<span>${visit ? '' : '<i></i>'}</span>`,
        iconSize: [26, 26],
      });
      L.marker([account.latitude, account.longitude], { icon })
        .addTo(layer)
        .on('click', () => actions.selectMapAccount(account.id, visit?.id))
        .bindPopup(`${account.name} - ${visit?.status ?? account.status}`);
    });
    map.setView([current.latitude, current.longitude], map.getZoom() || 13);
  };

  onMount(() => {
    map = L.map(container, { zoomControl: false }).setView([state.location.current.latitude, state.location.current.longitude], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    coverageLayer = L.layerGroup().addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    updateMarkers();
    setTimeout(() => map?.invalidateSize(), 80);
  });

  createEffect(() => {
    state.location.current.latitude;
    state.location.current.longitude;
    state.visits.map((visit) => `${visit.id}-${visit.status}-${visit.pendingSync}`).join('|');
    state.crm.accounts.map((account) => `${account.id}-${account.status}-${account.engagementRisk}`).join('|');
    state.crm.tasks.map((task) => `${task.id}-${task.status}-${task.dueDate}`).join('|');
    state.ui.selectedMapAccountId;
    state.ui.isCoverageLayerVisible;
    updateMarkers();
  });

  return <div ref={container} class="map-view" />;
}

export default MapView;
