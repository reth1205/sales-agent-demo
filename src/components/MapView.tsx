import L from 'leaflet';
import { createEffect, onMount } from 'solid-js';
import { getVisitAccount } from '../selectors';
import { state } from '../store';

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

    state.visits.forEach((visit) => {
      const account = getVisitAccount(visit);
      const icon = L.divIcon({
        className: `visit-marker ${visit.status.toLowerCase()}`,
        html: '<span></span>',
        iconSize: [22, 22],
      });
      L.marker([visit.latitude, visit.longitude], { icon })
        .addTo(layer)
        .bindPopup(`${account?.name ?? 'Customer'} - ${visit.status}`);
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
    updateMarkers();
  });

  return <div ref={container} class="map-view" />;
}

export default MapView;
