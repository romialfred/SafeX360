import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconAlertTriangle,
    IconClock,
    IconUser,
    IconRefresh,
    IconUrgent,
    IconHistory,
    IconShieldCheck,
    IconShieldX,
    IconStethoscope,
    IconUsers,
    IconSearch,
    IconMapPin,
} from '@tabler/icons-react';
import PageHeader from '../../UtilityComp/PageHeader';
import ColoredTabs from '../../UtilityComp/ColoredTabs';
import { useAppSelector } from '../../../slices/hooks';
import { listAlerts, type GeneralAlertDTO } from '../../../services/GeneralAlertService';
import { listSosAlerts, type SosAlertDTO, type SosStatus } from '../../../services/SosService';
import { formatReasonCode } from '../GeneralAlert/alertHelpers';
import { SOS_REASON_LABELS } from '../Sos/sosLabels';
import { useEmergencyWebSocket } from '../Sos/EmergencyWebSocketProvider';

/**
 * Page HISTORIQUE des alertes d'urgence (Alertes Générales + SOS).
 *
 * <p>Il n'existait aucune vue listant les Alertes Générales — seul le détail
 * (revoir / continuer le traitement) était accessible. Cette page unifie les
 * deux flux d'urgence sous forme de tuiles cliquables : chaque tuile rouvre le
 * détail correspondant pour poursuivre le traitement (appel nominatif,
 * clôture, dispatch secours…).</p>
 *
 * <p>Les alertes / SOS <strong>en cours</strong> remontent toujours en tête ;
 * l'historique suit, du plus récent au plus ancien. Mise à jour temps réel via
 * le provider WebSocket Emergency (re-fetch de la liste concernée) + polling de
 * sécurité toutes les 15 s.</p>
 */

// ── Helpers d'affichage ─────────────────────────────────────────────────────

const formatDateTime = (iso?: string | null): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/** Formate une durée en secondes → « Xh Ym » / « Ym » (« < 1 min » sous la minute). */
const formatDuration = (sec?: number): string => {
    if (sec == null) return '—';
    const totalMin = Math.floor(sec / 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (totalMin > 0) return `${m}m`;
    return '< 1 min';
};

// Statuts SOS considérés « ouverts » (traitement en cours).
const isSosOpen = (s: SosAlertDTO): boolean => s.status !== 'CLOSED' && s.status !== 'FALSE_ALARM';

const SOS_STATUS_META: Record<SosStatus, { label: string; cls: string; pulse: boolean }> = {
    RECEIVED: { label: 'NOUVEAU', cls: 'bg-red-600 text-white', pulse: true },
    ACKNOWLEDGED: { label: 'PRIS EN CHARGE', cls: 'bg-orange-500 text-white', pulse: false },
    DISPATCHED: { label: 'DISPATCHÉ', cls: 'bg-amber-500 text-white', pulse: false },
    ON_SITE: { label: 'SUR PLACE', cls: 'bg-sky-600 text-white', pulse: false },
    CLOSED: { label: 'CLÔTURÉ', cls: 'bg-emerald-600 text-white', pulse: false },
    FALSE_ALARM: { label: 'FAUSSE ALERTE', cls: 'bg-slate-500 text-white', pulse: false },
};

type TabId = 'general' | 'sos';
type Scope = 'all' | 'active';

const AlertsHistoryPage = () => {
    const navigate = useNavigate();
    const selectedCompanyId = useAppSelector((state) => state.companySelection.selectedCompanyId);
    const user = useAppSelector((state: any) => state.user);
    // Même résolution que GeneralAlertListener : en vue consolidée (Toutes les
    // Mines) selectedCompanyId est null → on retombe sur la mine d'attache.
    const effectiveCompanyId = Number(selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 0);

    const { connected, subscribe, subscribeGeneralAlert } = useEmergencyWebSocket();

    const [generalAlerts, setGeneralAlerts] = useState<GeneralAlertDTO[]>([]);
    const [sosAlerts, setSosAlerts] = useState<SosAlertDTO[]>([]);
    const [loadingGeneral, setLoadingGeneral] = useState(true);
    const [loadingSos, setLoadingSos] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>('general');
    const [scope, setScope] = useState<Scope>('all');
    const [search, setSearch] = useState('');

    // ── Fetchers ──
    const fetchGeneral = useCallback(() => {
        if (!effectiveCompanyId) return;
        setLoadingGeneral(true);
        listAlerts(effectiveCompanyId)
            .then(setGeneralAlerts)
            .catch(() => setGeneralAlerts([]))
            .finally(() => setLoadingGeneral(false));
    }, [effectiveCompanyId]);

    const fetchSos = useCallback(() => {
        if (!effectiveCompanyId) return;
        setLoadingSos(true);
        // includeClosed=true : c'est une page d'HISTORIQUE, on veut tout.
        listSosAlerts(effectiveCompanyId, true)
            .then(setSosAlerts)
            .catch(() => setSosAlerts([]))
            .finally(() => setLoadingSos(false));
    }, [effectiveCompanyId]);

    // ── Chargement initial + changement de mine ──
    useEffect(() => {
        fetchGeneral();
        fetchSos();
    }, [fetchGeneral, fetchSos]);

    // ── Temps réel : re-fetch de la liste concernée sur événement WebSocket ──
    useEffect(() => subscribeGeneralAlert(() => fetchGeneral()), [subscribeGeneralAlert, fetchGeneral]);
    useEffect(() => subscribe(() => fetchSos()), [subscribe, fetchSos]);

    // ── Polling léger (filet de sécurité si WS déconnecté) ──
    useEffect(() => {
        if (!effectiveCompanyId) return;
        const id = window.setInterval(() => {
            fetchGeneral();
            fetchSos();
        }, 15_000);
        return () => clearInterval(id);
    }, [effectiveCompanyId, fetchGeneral, fetchSos]);

    // ── Tri : en cours d'abord, puis déclenchement décroissant ──
    const sortedGeneral = useMemo(() => {
        return [...generalAlerts].sort((a, b) => {
            const aActive = a.status === 'ACTIVE';
            const bActive = b.status === 'ACTIVE';
            if (aActive !== bActive) return aActive ? -1 : 1;
            return new Date(b.triggeredAt ?? 0).getTime() - new Date(a.triggeredAt ?? 0).getTime();
        });
    }, [generalAlerts]);

    const sortedSos = useMemo(() => {
        return [...sosAlerts].sort((a, b) => {
            const aOpen = isSosOpen(a);
            const bOpen = isSosOpen(b);
            if (aOpen !== bOpen) return aOpen ? -1 : 1;
            return new Date(b.triggeredAt ?? 0).getTime() - new Date(a.triggeredAt ?? 0).getTime();
        });
    }, [sosAlerts]);

    // ── Filtrage (scope + recherche) ──
    const q = search.trim().toLowerCase();

    const filteredGeneral = useMemo(() => {
        return sortedGeneral.filter((a) => {
            if (scope === 'active' && a.status !== 'ACTIVE') return false;
            if (q) {
                const hay = `${formatReasonCode(a.reasonCode)} ${a.message ?? ''} ${a.triggeredByName ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [sortedGeneral, scope, q]);

    const filteredSos = useMemo(() => {
        return sortedSos.filter((s) => {
            if (scope === 'active' && !isSosOpen(s)) return false;
            if (q) {
                const reason = s.reasonCode ? SOS_REASON_LABELS[s.reasonCode] ?? s.reasonCode : '';
                const hay = `${reason} ${s.employeeName ?? ''} ${s.coordinatorName ?? ''} ${s.description ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [sortedSos, scope, q]);

    // ── État « pas de mine sélectionnée » ──
    if (!effectiveCompanyId) {
        return (
            <div className="px-4 lg:px-6 py-5">
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-8 text-center">
                    <IconAlertTriangle size={30} className="text-amber-500 mx-auto mb-2" stroke={1.6} />
                    <p className="text-[13.5px] text-slate-700 font-medium">Sélectionnez une mine active</p>
                    <p className="text-[12px] text-slate-500 mt-1">
                        L'historique des alertes est propre à chaque mine.
                    </p>
                </div>
            </div>
        );
    }

    const isGeneral = activeTab === 'general';
    const loading = isGeneral ? loadingGeneral : loadingSos;
    const shownGeneral = filteredGeneral;
    const shownSos = filteredSos;
    const emptyShown = isGeneral ? shownGeneral.length === 0 : shownSos.length === 0;

    return (
        <div className="px-4 lg:px-6 py-5">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des Urgences' },
                    { label: 'Historique des alertes' },
                ]}
                useSafeXLogo
                title="Alertes & SOS — Historique"
                subtitle="Rouvrez une alerte pour revoir ou poursuivre son traitement"
                actions={
                    <>
                        <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                                connected
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}
                            />
                            {connected ? 'Temps réel actif' : 'Hors-ligne'}
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                fetchGeneral();
                                fetchSos();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[12.5px] font-medium hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <IconRefresh size={13} stroke={1.8} />
                            Rafraîchir
                        </button>
                    </>
                }
            />

            {/* Onglets */}
            <div className="mt-5">
                <ColoredTabs
                    activeId={activeTab}
                    onChange={(id) => setActiveTab(id as TabId)}
                    tabs={[
                        {
                            id: 'general',
                            label: 'Alertes Générales',
                            icon: <IconAlertTriangle size={15} stroke={1.8} />,
                            count: generalAlerts.length,
                            tone: 'red',
                        },
                        {
                            id: 'sos',
                            label: 'SOS',
                            icon: <IconUrgent size={15} stroke={1.8} />,
                            count: sosAlerts.length,
                            tone: 'amber',
                        },
                    ]}
                />
            </div>

            {/* Filtres légers : scope + recherche */}
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {(['all', 'active'] as Scope[]).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setScope(s)}
                            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                                scope === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {s === 'all' ? 'Tout' : 'En cours'}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <IconSearch size={14} stroke={1.8} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={isGeneral ? 'Motif, message, déclencheur…' : 'Motif, employé, coordinateur…'}
                        className="w-64 max-w-full pl-8 pr-3 py-1.5 text-[12.5px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400"
                    />
                </div>
            </div>

            {/* Contenu */}
            <div className="mt-4">
                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                        <IconUrgent size={28} className="text-slate-300 mx-auto mb-2 animate-pulse" />
                        <p className="text-[13px] text-slate-500">Chargement de l'historique…</p>
                    </div>
                ) : emptyShown ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                        <IconHistory size={34} className="text-slate-300 mx-auto mb-3" stroke={1.5} />
                        <h3
                            className="text-[15px] text-slate-800 mb-1.5"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
                        >
                            {scope === 'active' ? 'Aucune alerte en cours' : 'Aucune alerte dans l\'historique'}
                        </h3>
                        <p className="text-[12px] text-slate-500">
                            {isGeneral
                                ? 'Les alertes générales déclenchées apparaîtront ici.'
                                : 'Les SOS émis apparaîtront ici.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isGeneral
                            ? shownGeneral.map((a) => (
                                  <GeneralAlertTile
                                      key={a.id}
                                      alert={a}
                                      onOpen={() => a.id && navigate(`/emergency/alerts/general/${a.id}`)}
                                  />
                              ))
                            : shownSos.map((s) => (
                                  <SosTile
                                      key={s.id}
                                      sos={s}
                                      onOpen={() => s.id && navigate(`/emergency/sos/${s.id}`)}
                                  />
                              ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Tuile Alerte Générale ────────────────────────────────────────────────────

function GeneralAlertTile({ alert, onOpen }: { alert: GeneralAlertDTO; onOpen: () => void }) {
    const isActive = alert.status === 'ACTIVE';
    const isDrill = Boolean(alert.drillMode);

    return (
        <button
            type="button"
            onClick={onOpen}
            className={`text-left bg-white border rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-[box-shadow,border-color] flex flex-col gap-3 ${
                isActive ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
            {/* Badges statut + exercice/réel */}
            <div className="flex items-center justify-between gap-2">
                <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-[0.08em] ${
                        isActive ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                    }`}
                >
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    {isActive ? 'EN COURS' : 'Terminée'}
                </span>
                <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.08em] border ${
                        isDrill
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}
                >
                    {isDrill ? 'Exercice' : 'Réel'}
                </span>
            </div>

            {/* Motif */}
            <div>
                <p
                    className="text-[15px] text-slate-900 leading-tight"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
                >
                    {formatReasonCode(alert.reasonCode)}
                </p>
                {alert.message && (
                    <p className="text-[12px] text-slate-600 italic mt-1 line-clamp-2">« {alert.message} »</p>
                )}
            </div>

            {/* Méta : déclenchement, durée, déclencheur */}
            <div className="flex flex-col gap-1.5 text-[11.5px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                    <IconClock size={12} stroke={1.8} className="text-slate-400" />
                    Déclenchée le {formatDateTime(alert.triggeredAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <IconHistory size={12} stroke={1.8} className="text-slate-400" />
                    Durée : {formatDuration(alert.elapsedSeconds)}
                </span>
                {alert.triggeredByName && (
                    <span className="inline-flex items-center gap-1.5">
                        <IconUser size={12} stroke={1.8} className="text-slate-400" />
                        Par {alert.triggeredByName}
                    </span>
                )}
                {alert.status === 'ENDED' && (alert.endedByName || alert.endedAt) && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                        <IconShieldCheck size={12} stroke={1.8} className="text-emerald-500" />
                        Clôturée{alert.endedByName ? ` par ${alert.endedByName}` : ''}
                        {alert.endedAt ? ` — ${formatDateTime(alert.endedAt)}` : ''}
                    </span>
                )}
            </div>

            {/* Compteurs appel nominatif */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 pt-2.5 border-t border-slate-100 text-[11.5px]">
                <span className="inline-flex items-center gap-1 text-emerald-700" title="En sécurité">
                    <IconShieldCheck size={13} stroke={1.9} />
                    {alert.safeCount ?? 0}
                </span>
                <span className="inline-flex items-center gap-1 text-amber-700" title="Blessés">
                    <IconStethoscope size={13} stroke={1.9} />
                    {alert.injuredCount ?? 0}
                </span>
                <span className="inline-flex items-center gap-1 text-red-700" title="Manquants">
                    <IconShieldX size={13} stroke={1.9} />
                    {alert.missingCount ?? 0}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-600 ml-auto" title="Effectif total">
                    <IconUsers size={13} stroke={1.9} className="text-slate-400" />
                    {alert.totalEmployees ?? '—'}
                </span>
            </div>
        </button>
    );
}

// ── Tuile SOS ────────────────────────────────────────────────────────────────

function SosTile({ sos, onOpen }: { sos: SosAlertDTO; onOpen: () => void }) {
    const meta = SOS_STATUS_META[sos.status];
    const open = isSosOpen(sos);
    const reason = sos.reasonCode ? SOS_REASON_LABELS[sos.reasonCode] ?? sos.reasonCode : 'Motif non précisé';

    return (
        <button
            type="button"
            onClick={onOpen}
            className={`text-left bg-white border rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-[box-shadow,border-color] flex flex-col gap-3 ${
                sos.status === 'RECEIVED' ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
            {/* Badges statut + exercice */}
            <div className="flex items-center justify-between gap-2">
                <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-[0.08em] ${meta.cls}`}
                >
                    {meta.pulse && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    {meta.label}
                </span>
                {sos.drillMode && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.08em] border bg-sky-50 text-sky-700 border-sky-200">
                        Exercice
                    </span>
                )}
            </div>

            {/* Motif */}
            <div>
                <p
                    className="text-[15px] text-slate-900 leading-tight"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
                >
                    {reason}
                </p>
                {sos.description && (
                    <p className="text-[12px] text-slate-600 italic mt-1 line-clamp-2">« {sos.description} »</p>
                )}
            </div>

            {/* Méta : employé, déclenchement, coordinateur */}
            <div className="flex flex-col gap-1.5 text-[11.5px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                    <IconUser size={12} stroke={1.8} className="text-slate-400" />
                    {sos.employeeName ?? `Employé #${sos.employeeId}`}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <IconClock size={12} stroke={1.8} className="text-slate-400" />
                    {formatDateTime(sos.triggeredAt)}
                </span>
                {sos.coordinatorName && (
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <IconShieldCheck size={12} stroke={1.8} className="text-emerald-500" />
                        Coordinateur : {sos.coordinatorName}
                    </span>
                )}
                {sos.rescueTeamName && (
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <IconMapPin size={12} stroke={1.8} className="text-slate-400" />
                        {sos.rescueTeamName}
                    </span>
                )}
            </div>

            {/* Pied : durée + réf */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px]">
                <span className="inline-flex items-center gap-1 text-slate-500">
                    <IconHistory size={12} stroke={1.8} className="text-slate-400" />
                    {open ? 'En cours' : 'Durée'} : {formatDuration(sos.elapsedSeconds)}
                </span>
                <span className="text-slate-400 font-mono">#{sos.id}</span>
            </div>
        </button>
    );
}

export default AlertsHistoryPage;
