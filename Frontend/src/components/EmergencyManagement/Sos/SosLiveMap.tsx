import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { SosAlertDTO, SosStatus } from '../../../services/SosService';

/**
 * Carte live des SOS actifs (LOT 48 Phase 3.c).
 *
 * <p>Affiche tous les SOS sur fond OpenStreetMap avec pins SVG colorés par
 * statut. Auto-fit sur les pins existants. Popup détail avec navigation.</p>
 */

interface Props {
    alerts: SosAlertDTO[];
    onClick?: (alert: SosAlertDTO) => void;
    height?: number;
}

const STATUS_COLOR: Record<SosStatus, { fill: string; ring: string; label: string; pulse: boolean }> = {
    RECEIVED:     { fill: '#dc2626', ring: '#7f1d1d', label: 'NOUVEAU',         pulse: true },
    ACKNOWLEDGED: { fill: '#f97316', ring: '#9a3412', label: 'PRIS EN CHARGE',  pulse: false },
    DISPATCHED:   { fill: '#eab308', ring: '#854d0e', label: 'DISPATCHÉ',       pulse: false },
    ON_SITE:      { fill: '#0ea5e9', ring: '#0c4a6e', label: 'SUR PLACE',       pulse: false },
    CLOSED:       { fill: '#10b981', ring: '#064e3b', label: 'CLÔTURÉ',        pulse: false },
    FALSE_ALARM:  { fill: '#64748b', ring: '#1e293b', label: 'FAUSSE ALERTE',  pulse: false },
};

const buildSvgIcon = (status: SosStatus) => {
    const colors = STATUS_COLOR[status];
    const pulseAttr = colors.pulse
        ? `<animate attributeName="r" values="6.5;10;6.5" dur="1.2s" repeatCount="indefinite"/>
           <animate attributeName="opacity" values="1;0.6;1" dur="1.2s" repeatCount="indefinite"/>`
        : '';
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            <defs>
                <filter id="sosshadow${status}" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.4"/>
                </filter>
            </defs>
            <!-- Halo pulsant pour RECEIVED -->
            ${colors.pulse ? `<circle cx="20" cy="20" r="18" fill="${colors.fill}" opacity="0.3">
                <animate attributeName="r" values="15;20;15" dur="1.2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.4;0;0.4" dur="1.2s" repeatCount="indefinite"/>
            </circle>` : ''}
            <!-- Cercle principal -->
            <circle cx="20" cy="20" r="11" fill="${colors.fill}" stroke="${colors.ring}" stroke-width="2" filter="url(#sosshadow${status})">
                ${pulseAttr}
            </circle>
            <!-- Icône SOS -->
            <text x="20" y="24" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"
                  font-size="9" font-weight="900" fill="#fff" letter-spacing="0.5">SOS</text>
        </svg>`;
    return L.divIcon({
        className: 'sos-marker',
        html: svg,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -18],
    });
};

const REASON_LABELS: Record<string, string> = {
    MEDICAL: 'Urgence médicale',
    ACCIDENT_TRAVAIL: 'Accident du travail',
    INCENDIE: 'Incendie',
    AGRESSION: 'Agression',
    FUITE_CHIMIQUE: 'Fuite chimique',
    EFFONDREMENT: 'Effondrement',
    AUTRE: 'Autre urgence',
};

function FitToAlerts({ alerts }: { alerts: SosAlertDTO[] }) {
    const map = useMap();
    useEffect(() => {
        const valid = alerts.filter((a) => Number.isFinite(a.latitude) && Number.isFinite(a.longitude));
        if (valid.length === 0) return;
        if (valid.length === 1) {
            map.setView([valid[0].latitude, valid[0].longitude], 15);
        } else {
            const bounds = L.latLngBounds(valid.map((a) => [a.latitude, a.longitude]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    }, [alerts, map]);
    return null;
}

const formatTime = (iso?: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const formatElapsed = (sec?: number) => {
    if (sec == null) return '—';
    const m = Math.floor(sec / 60);
    if (m > 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
    if (m > 0) return `${m}m ${sec % 60}s`;
    return `${sec}s`;
};

const SosLiveMap = ({ alerts, onClick, height = 520 }: Props) => {
    const defaultCenter: [number, number] = [12.37, -1.52];

    const icons = useMemo(() => {
        const m: Record<SosStatus, L.DivIcon> = {} as any;
        (Object.keys(STATUS_COLOR) as SosStatus[]).forEach((s) => {
            m[s] = buildSvgIcon(s);
        });
        return m;
    }, []);

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white" style={{ height }}>
            <MapContainer center={defaultCenter} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitToAlerts alerts={alerts} />

                {alerts.map((alert) => {
                    if (!Number.isFinite(alert.latitude) || !Number.isFinite(alert.longitude)) return null;
                    const colors = STATUS_COLOR[alert.status];
                    const reasonLabel = alert.reasonCode ? (REASON_LABELS[alert.reasonCode] ?? alert.reasonCode) : 'Non précisé';
                    return (
                        <Marker
                            key={alert.id}
                            position={[alert.latitude, alert.longitude]}
                            icon={icons[alert.status]}
                        >
                            <Popup>
                                <div style={{ minWidth: 240 }}>
                                    <div
                                        style={{
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            borderRadius: 4,
                                            background: colors.fill,
                                            color: '#fff',
                                            fontSize: 10,
                                            fontWeight: 700,
                                            letterSpacing: 0.6,
                                            textTransform: 'uppercase',
                                            marginBottom: 6,
                                        }}
                                    >
                                        {colors.label}
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: '#0f172a' }}>
                                        {reasonLabel}
                                    </div>
                                    {alert.description && (
                                        <div style={{ fontSize: 11, color: '#475569', fontStyle: 'italic', marginBottom: 6 }}>
                                            « {alert.description} »
                                        </div>
                                    )}
                                    <div style={{ fontSize: 11, color: '#475569', marginBottom: 3 }}>
                                        👤 {alert.employeeName ?? `Employé #${alert.employeeId}`}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#475569', marginBottom: 3 }}>
                                        🕐 Déclenché à {formatTime(alert.triggeredAt)} · {formatElapsed(alert.elapsedSeconds)} écoulés
                                    </div>
                                    {alert.rescueTeamName && (
                                        <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>
                                            🚑 {alert.rescueTeamName}
                                        </div>
                                    )}
                                    {onClick && (
                                        <button
                                            type="button"
                                            onClick={() => onClick(alert)}
                                            style={{
                                                padding: '5px 12px',
                                                borderRadius: 6,
                                                background: '#0f172a',
                                                color: '#fff',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                border: 'none',
                                                cursor: 'pointer',
                                                marginTop: 4,
                                            }}
                                        >
                                            Voir détail complet
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

export default SosLiveMap;
