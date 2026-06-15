import L from 'leaflet';
import { createEffect, onMount } from 'solid-js';
import { getAccountVisit, getMapPinType } from '../selectors';
import { actions, state } from '../store';

function MapView() {
  let container!: HTMLDivElement;
  let map: L.Map | undefined;
  let markerLayer: L.LayerGroup | undefined;

  const updateMarkers = () => {
    if (!map || !markerLayer) return;
    const layer = markerLayer;
    markerLayer.clearLayers();
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
    updateMarkers();
  });

  return <div ref={container} class="map-view" />;
}

export default MapView;
