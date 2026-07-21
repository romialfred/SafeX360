import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { AssemblyPointDTO } from '../../../services/EmergencyService';

/**
 * Carte Leaflet des Points de rassemblement (LOT 48 Phase 2).
 *
 * <p>Affiche des pins SVG colorés selon la priorité d'évacuation
 * (1 = haute, 5 = basse). Centre automatique sur le barycentre des points
 * si au moins un est présent ; sinon zoom sur Burkina Faso.</p>
 *
 * <p>Click sur un pin → popup avec nom, priorité, capacité, responsable.
 * Bouton « Modifier » dans le popup déclenche {@code onEdit(point)} côté parent.</p>
 */

interface Props {
    points: AssemblyPointDTO[];
    onEdit?: (point: AssemblyPointDTO) => void;
    onPickLocation?: (lat: number, lng: number) => void; // mode "pick"
    selectedId?: number | null;
    height?: number;
}

// ── Couleurs par priorité (1 = rouge fort, 5 = gris) ──────────────────────
const PRIORITY_COLORS: Record<number, { fill: string; ring: string; label: string }> = {
    1: { fill: '#dc2626', ring: '#7f1d1d', label: 'P1 : Haute' },
    2: { fill: '#f97316', ring: '#9a3412', label: 'P2 : Standard' },
    3: { fill: '#eab308', ring: '#854d0e', label: 'P3 : Secondaire' },
    4: { fill: '#0ea5e9', ring: '#0c4a6e', label: 'P4 : Repli' },
    5: { fill: '#64748b', ring: '#1e293b', label: 'P5 : Faible' },
};

const buildSvgIcon = (priority: number) => {
    const colors = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS[2];
    // SVG inline : losange de localisation avec halo
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
            <defs>
                <filter id="shadow${priority}" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.35"/>
                </filter>
            </defs>
            <path d="M17 2 C9.27 2 3 8.27 3 16 c0 11 14 24 14 24 s14 -13 14 -24 c0 -7.73 -6.27 -14 -14 -14 z"
                  fill="${colors.fill}" stroke="${colors.ring}" stroke-width="1.5" filter="url(#shadow${priority})"/>
            <circle cx="17" cy="16" r="6.5" fill="#fff" stroke="${colors.ring}" stroke-width="1.5"/>
            <text x="17" y="20" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"
                  font-size="11" font-weight="700" fill="${colors.ring}">${priority}</text>
        </svg>`;
    return L.divIcon({
        className: 'ap-marker',
        html: svg,
        iconSize: [34, 42],
        iconAnchor: [17, 40],
        popupAnchor: [0, -38],
    });
};

// ── Component pour auto-fit ──
function FitToPoints({ points }: { points: AssemblyPointDTO[] }) {
    const map = useMap();
    useEffect(() => {
        if (points.length === 0) return;
        const valid = points.filter(
            (p) =>
                typeof p.latitude === 'number' &&
                typeof p.longitude === 'number' &&
                !Number.isNaN(p.latitude) &&
                !Number.isNaN(p.longitude)
        );
        if (valid.length === 0) return;
        if (valid.length === 1) {
            map.setView([valid[0].latitude, valid[0].longitude], 14);
        } else {
            const bounds = L.latLngBounds(valid.map((p) => [p.latitude, p.longitude]));
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
    }, [points, map]);
    return null;
}

// ── Component pour mode "pick" (click → callback) ──
function PickHandler({ onPickLocation }: { onPickLocation?: (lat: number, lng: number) => void }) {
    const map = useMap();
    useEffect(() => {
        if (!onPickLocation) return;
        const handler = (e: L.LeafletMouseEvent) => {
            onPickLocation(e.latlng.lat, e.latlng.lng);
        };
        map.on('click', handler);
        return () => {
            map.off('click', handler);
        };
    }, [map, onPickLocation]);
    return null;
}

const AssemblyPointsMap = ({
    points,
    onEdit,
    onPickLocation,
    selectedId = null,
    height = 480,
}: Props) => {
    // Centre par défaut : Burkina Faso (Ouagadougou-ish)
    const defaultCenter: [number, number] = [12.37, -1.52];

    // Mémoïse les icônes pour éviter re-create à chaque render
    const icons = useMemo(() => {
        const m: Record<number, L.DivIcon> = {};
        for (let i = 1; i <= 5; i++) m[i] = buildSvgIcon(i);
        return m;
    }, []);

    return (
        <div
            className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white"
            style={{ height }}
        >
            <MapContainer
                center={defaultCenter}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitToPoints points={points} />
                {onPickLocation && <PickHandler onPickLocation={onPickLocation} />}

                {points.map((p) => {
                    const priority = p.evacuationPriority ?? 2;
                    const icon = icons[priority] ?? icons[2];
                    return (
                        <Marker
                            key={p.id}
                            position={[p.latitude, p.longitude]}
                            icon={icon}
                            opacity={selectedId && selectedId !== p.id ? 0.5 : 1}
                        >
                            <Popup>
                                <div style={{ minWidth: 220 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                                        {p.name}
                                    </div>
                                    <div
                                        style={{
                                            display: 'inline-block',
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            background: PRIORITY_COLORS[priority]?.fill ?? '#64748b',
                                            color: '#fff',
                                            fontSize: 10,
                                            fontWeight: 700,
                                            letterSpacing: 0.4,
                                            textTransform: 'uppercase',
                                            marginBottom: 6,
                                        }}
                                    >
                                        {PRIORITY_COLORS[priority]?.label ?? `P${priority}`}
                                    </div>
                                    {p.locationText && (
                                        <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>
                                            📍 {p.locationText}
                                        </div>
                                    )}
                                    {p.maxCapacity && (
                                        <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>
                                            👥 Capacité : {p.maxCapacity} personnes
                                        </div>
                                    )}
                                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 8 }}>
                                        {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                                    </div>
                                    {onEdit && (
                                        <button
                                            type="button"
                                            onClick={() => onEdit(p)}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: 6,
                                                background: '#0f172a',
                                                color: '#fff',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Modifier
                                        </button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default AssemblyPointsMap;
