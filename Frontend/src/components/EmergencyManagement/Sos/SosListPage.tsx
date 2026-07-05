import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    IconAlertTriangle,
    IconClock,
    IconMapPin,
    IconUser,
    IconShield,
    IconRefresh,
    IconUrgent,
    IconCheck,
    IconList,
    IconMap2,
} from '@tabler/icons-react';
import SosLiveMap from './SosLiveMap';
import PageHeader from '../../UtilityComp/PageHeader';
import { useAppSelector } from '../../../slices/hooks';
import { listSosAlerts, type SosAlertDTO, type SosStatus } from '../../../services/SosService';
import { useEmergencyWebSocket } from './EmergencyWebSocketProvider';
import { SOS_REASON_LABELS } from './sosLabels';

/**
 * Page Liste / Tableau de bord SOS (LOT 48 Phase 3.b).
 *
 * <p>Affiche les alertes SOS de la mine active : actives en haut, historique en
 * bas. Mise à jour temps réel via le provider WebSocket (le listener met à jour
 * la liste sans rechargement complet).</p>
 */

const STATUS_META: Record<SosStatus, { bg: string; text: string; ring: string; label: string; pulse: boolean }> = {
    RECEIVED:     { bg: 'bg-red-600',     text: 'text-white', ring: 'ring-red-300',     label: 'NOUVEAU',      pulse: true },
    ACKNOWLEDGED: { bg: 'bg-orange-500',  text: 'text-white', ring: 'ring-orange-200',  label: 'PRIS EN CHARGE', pulse: false },
    DISPATCHED:   { bg: 'bg-amber-500',   text: 'text-white', ring: 'ring-amber-200',   label: 'DISPATCHÉ',    pulse: false },
    ON_SITE:      { bg: 'bg-sky-600',     text: 'text-white', ring: 'ring-sky-200',     label: 'SUR PLACE',    pulse: false },
    CLOSED:       { bg: 'bg-emerald-600', text: 'text-white', ring: 'ring-emerald-200', label: 'CLÔTURÉ',      pulse: false },
    FALSE_ALARM:  { bg: 'bg-slate-500',   text: 'text-white', ring: 'ring-slate-200',   label: 'FAUSSE ALERTE', pulse: false },
};

const REASON_LABELS = SOS_REASON_LABELS;

const formatDateTime = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatElapsed = (sec?: number) => {
    if (sec == null) return '—';
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${sec % 60}s`;
    return `${sec}s`;
};

const SosListPage = () => {
    const { t } = useTranslation(['emergency', 'common', 'navigation']);
    const navigate = useNavigate();
    const selectedCompanyId = useAppSelector((state) => state.companySelection.selectedCompanyId);
    const { connected, subscribe } = useEmergencyWebSocket();

    const [alerts, setAlerts] = useState<SosAlertDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [includeClosed, setIncludeClosed] = useState(false);
    const [retryTick, setRetryTick] = useState(0);
    const [view, setView] = useState<'list' | 'map'>('list');

    // ── Chargement initial ──
    useEffect(() => {
        if (!selectedCompanyId) return;
        setLoading(true);
        listSosAlerts(selectedCompanyId, includeClosed)
            .then(setAlerts)
            .catch(() => setAlerts([]))
            .finally(() => setLoading(false));
    }, [selectedCompanyId, includeClosed, retryTick]);

    // ── Mise à jour live via WebSocket ──
    useEffect(() => {
        const unsubscribe = subscribe((alert) => {
            setAlerts((prev) => {
                const idx = prev.findIndex((a) => a.id === alert.id);
                if (idx === -1) {
                    // Nouvelle alerte → ajout en tête
                    return [alert, ...prev];
                }
                // Mise à jour en place
                const next = [...prev];
                next[idx] = alert;
                return next;
            });
        });
        return unsubscribe;
    }, [subscribe]);

    // ── Stats ──
    const stats = useMemo(() => ({
        total: alerts.length,
        active: alerts.filter((a) => a.status !== 'CLOSED' && a.status !== 'FALSE_ALARM').length,
        received: alerts.filter((a) => a.status === 'RECEIVED').length,
        avgElapsed: alerts.filter((a) => a.elapsedSeconds != null).reduce((acc, a) => acc + (a.elapsedSeconds ?? 0), 0) / Math.max(1, alerts.length),
    }), [alerts]);

    // Active alerts trient toujours en haut + plus récente première
    const sortedAlerts = useMemo(() => {
        return [...alerts].sort((a, b) => {
            const aActive = a.status !== 'CLOSED' && a.status !== 'FALSE_ALARM';
            const bActive = b.status !== 'CLOSED' && b.status !== 'FALSE_ALARM';
            if (aActive !== bActive) return aActive ? -1 : 1;
            return new Date(b.triggeredAt ?? 0).getTime() - new Date(a.triggeredAt ?? 0).getTime();
        });
    }, [alerts]);

    if (!selectedCompanyId) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-6 text-center">
                    <IconAlertTriangle size={28} className="text-amber-500 mx-auto mb-2" stroke={1.6} />
                    <p className="text-[13px] text-slate-700">Sélectionnez une mine active.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 lg:px-6 py-5">
            <PageHeader
                breadcrumbs={[
                    { label: t('navigation:breadcrumbs.home'), to: '/' },
                    { label: t('emergency:module.name') },
                    { label: 'Suivi SOS' },
                ]}
                useSafeXLogo
                title="Suivi des SOS"
                subtitle="Tableau de bord temps réel des alertes individuelles"
                actions={
                    <>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                            connected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'} ${connected ? 'animate-pulse' : ''}`} />
                            {connected ? 'Temps réel actif' : 'Hors-ligne'}
                        </span>
                        <button
                            type="button"
                            onClick={() => setRetryTick((n) => n + 1)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[12.5px] font-medium hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <IconRefresh size={12} stroke={1.8} />
                            Rafraîchir
                        </button>
                    </>
                }
            />

            {/* KPI tuiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                <StatCard icon={<IconUrgent size={14} stroke={1.7} />} label="Total alertes" value={stats.total} accent="red" />
                <StatCard icon={<IconAlertTriangle size={14} stroke={1.7} />} label="Actives" value={stats.active} accent="orange" />
                <StatCard icon={<IconShield size={14} stroke={1.7} />} label="Nouvelles" value={stats.received} accent="amber" pulse={stats.received > 0} />
                <StatCard icon={<IconClock size={14} stroke={1.7} />} label="Durée moyenne" value={Math.round(stats.avgElapsed)} suffix="s" accent="sky" />
            </div>

            {/* Toggle vue + filtre */}
            <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setView('list')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                            view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <IconList size={13} stroke={1.8} />
                        Liste
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('map')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                            view === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <IconMap2 size={13} stroke={1.8} />
                        Carte live ({alerts.length})
                    </button>
                </div>
                <label className="inline-flex items-center gap-2 text-[12.5px] text-slate-700 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={includeClosed}
                        onChange={(e) => setIncludeClosed(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    Inclure clôturées & fausses alertes
                </label>
            </div>

            {/* Liste */}
            <div className="mt-4">
                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                        <IconUrgent size={28} className="text-slate-300 mx-auto mb-2 animate-pulse" />
                        <p className="text-[13px] text-slate-500">{t('common:messages.loadingData')}</p>
                    </div>
                ) : sortedAlerts.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                        <IconCheck size={36} className="text-emerald-400 mx-auto mb-3" stroke={1.5} />
                        <h3
                            className="text-[15px] text-slate-800 mb-1.5"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
                        >
                            Aucune alerte SOS active
                        </h3>
                        <p className="text-[12px] text-slate-500">
                            La mine est sécurisée. Le système est en veille.
                        </p>
                    </div>
                ) : view === 'map' ? (
                    <SosLiveMap
                        alerts={sortedAlerts}
                        onClick={(a) => a.id && navigate(`/emergency/sos/${a.id}`)}
                        height={560}
                    />
                ) : (
                    <ul className="space-y-2">
                        {sortedAlerts.map((alert) => {
                            const meta = STATUS_META[alert.status];
                            return (
                                <li
                                    key={alert.id}
                                    onClick={() => navigate(`/emergency/sos/${alert.id}`)}
                                    className={`bg-white border rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-[box-shadow,border-color] ${
                                        alert.status === 'RECEIVED' ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
                                    }`}
                                >
                                    <div className="flex items-stretch gap-0">
                                        {/* Bandeau status à gauche */}
                                        <div className={`flex flex-col items-center justify-center px-4 py-3 rounded-l-xl ${meta.bg} min-w-[110px]`}>
                                            <span className={`text-[10px] uppercase tracking-[0.1em] font-bold ${meta.text} ${meta.pulse ? 'animate-pulse' : ''}`}>
                                                {meta.label}
                                            </span>
                                            <span className="text-[10px] text-white/80 mt-0.5 inline-flex items-center gap-0.5">
                                                <IconClock size={9} stroke={2} />
                                                {formatElapsed(alert.elapsedSeconds)}
                                            </span>
                                        </div>

                                        {/* Contenu */}
                                        <div className="flex-1 px-4 py-3">
                                            <div className="flex items-start justify-between gap-3 mb-1.5">
                                                <div>
                                                    <p
                                                        className="text-[15px] text-slate-900"
                                                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
                                                    >
                                                        {alert.reasonCode ? (REASON_LABELS[alert.reasonCode] ?? alert.reasonCode) : 'Motif non précisé'}
                                                    </p>
                                                    {alert.description && (
                                                        <p className="text-[12px] text-slate-600 italic mt-0.5">
                                                            « {alert.description} »
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-[10.5px] text-slate-400 font-mono whitespace-nowrap">
                                                    #{alert.id}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-slate-600 mt-2">
                                                <span className="inline-flex items-center gap-1">
                                                    <IconUser size={11} stroke={1.8} className="text-slate-400" />
                                                    {alert.employeeName ?? `Employé #${alert.employeeId}`}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <IconMapPin size={11} stroke={1.8} className="text-slate-400" />
                                                    <span className="font-mono">{alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}</span>
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <IconClock size={11} stroke={1.8} className="text-slate-400" />
                                                    {formatDateTime(alert.triggeredAt)}
                                                </span>
                                                {alert.rescueTeamName && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <IconShield size={11} stroke={1.8} className="text-emerald-500" />
                                                        {alert.rescueTeamName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

// ── Sous-composants ────────────────────────────────────────────────────────

const STAT_ACCENT: Record<string, { bg: string; text: string; ring: string }> = {
    red:    { bg: 'bg-red-50',    text: 'text-red-700',    ring: 'border-l-red-400' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'border-l-orange-400' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  ring: 'border-l-amber-400' },
    sky:    { bg: 'bg-sky-50',    text: 'text-sky-700',    ring: 'border-l-sky-400' },
};

function StatCard({ icon, label, value, suffix, accent, pulse }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    suffix?: string;
    accent: keyof typeof STAT_ACCENT;
    pulse?: boolean;
}) {
    const tone = STAT_ACCENT[accent];
    return (
        <div className={`bg-white border border-slate-200 border-l-[3px] ${tone.ring} rounded-xl p-3 shadow-sm ${pulse ? 'ring-2 ring-amber-200 animate-pulse' : ''}`}>
            <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-[10.5px] uppercase tracking-[0.1em] text-slate-500 font-semibold">{label}</p>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${tone.bg} ${tone.text}`}>
                    {icon}
                </span>
            </div>
            <p
                className="text-[24px] text-slate-900 leading-none"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
            >
                {value.toLocaleString('fr-FR')}
                {suffix && <span className="text-[11px] text-slate-500 ml-1 font-normal">{suffix}</span>}
            </p>
        </div>
    );
}

export default SosListPage;
