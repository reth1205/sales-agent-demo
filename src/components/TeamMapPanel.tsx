import L from 'leaflet';
import { createEffect, For, onCleanup, onMount } from 'solid-js';
import { getAgentStatusColor, getAgentStatusLabel } from '../selectors';
import { actions, state } from '../store';
import type { AgentStatus } from '../types';

const statuses: AgentStatus[] = ['OnSchedule', 'AtRisk', 'Missed', 'InMeeting', 'Offline'];

function TeamMapPanel() {
  let container!: HTMLDivElement;
  let map: L.Map | undefined;
  let markerLayer: L.LayerGroup | undefined;

  const updateMarkers = () => {
    if (!map || !markerLayer) return;
    markerLayer.clearLayers();

    const bounds = L.latLngBounds([]);
    state.manager.agents.forEach((agent) => {
      const isSelected = state.ui.selectedManagerAgentId === agent.id;
      const icon = L.divIcon({
        className: `team-agent-marker ${isSelected ? 'selected' : ''}`,
        html: `<span style="background:${getAgentStatusColor(agent.status)}">${agent.avatarInitials}</span>`,
        iconSize: [34, 34],
      });
      L.marker([agent.latitude, agent.longitude], { icon })
        .addTo(markerLayer!)
        .bindPopup(`${agent.name} - ${getAgentStatusLabel(agent.status)}`)
        .on('click', () => actions.selectManagerAgent(agent.id));
      bounds.extend([agent.latitude, agent.longitude]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 12 });
    }
  };

  onMount(() => {
    map = L.map(container, { zoomControl: false, attributionControl: false }).setView([19.4328, -99.1334], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    updateMarkers();
    setTimeout(() => map?.invalidateSize(), 80);
  });

  onCleanup(() => map?.remove());

  createEffect(() => {
    state.ui.selectedManagerAgentId;
    state.manager.agents.map((agent) => `${agent.id}-${agent.status}-${agent.latitude}-${agent.longitude}`).join('|');
    updateMarkers();
  });

  return (
    <section class="panel team-map-panel">
      <div class="section-title">
        <div>
          <span class="eyebrow">Team map</span>
          <h3>Field status now</h3>
        </div>
        <span>{state.manager.agents.length} agents</span>
      </div>
      <div ref={container} class="team-map-canvas" />
      <div class="map-legend">
        <For each={statuses}>
          {(status) => (
            <span>
              <i style={{ background: getAgentStatusColor(status) }} />
              {getAgentStatusLabel(status)}
            </span>
          )}
        </For>
      </div>
    </section>
  );
}

export default TeamMapPanel;
