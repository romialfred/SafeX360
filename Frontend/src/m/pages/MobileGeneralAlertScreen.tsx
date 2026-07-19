/**
 * MobileGeneralAlertScreen — Diffusion d'une alerte generale a tout le
 * personnel connecte sur le site minier.
 *
 * Contrairement au SOS (urgence personnelle, un tap = envoi immediat),
 * l'alerte generale couvre les evenements site-wide : meteo, panne
 * equipement, route bloquee, pollution, intrusion, etc.
 * L'utilisateur choisit un type, redige une description (min 20 car.)
 * et selectionne un niveau d'urgence avant de diffuser.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconAlertTriangle,
    IconCloudStorm,
    IconTool,
    IconRoadSign,
    IconBiohazard,
    IconShieldLock,
    IconDots,
    IconArrowLeft,
    IconCheck,
    IconSend,
    IconRefresh,
    IconWifiOff,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { useRedirectTimer } from '../hooks/useRedirectTimer';
import { mutateOffline } from '../services/mobileApi';
import { useAppSelector } from '../../slices/hooks';
import { positiveMineId } from '../../utils/activeMine';

/* ─── Types ─────────────────────────────────────────────────────────── */

type AlertTypeCode = 'WEATHER' | 'EQUIPMENT' | 'ROAD' | 'ENVIRONMENTAL' | 'SECURITY' | 'OTHER';
type UrgencyLevel = 'INFORMATION' | 'URGENT' | 'CRITICAL';

interface AlertTile {
    code: AlertTypeCode;
    label: string;
    sublabel: string;
    Icon: typeof IconAlertTriangle;
    bgClass: string;
}

const ALERT_TILES: AlertTile[] = [
    { code: 'WEATHER',       label: 'Alerte météo',      sublabel: 'Tempête, orage, vent',    Icon: IconCloudStorm,  bgClass: 'bg-amber-600'   },
    { code: 'EQUIPMENT',     label: 'Panne critique',     sublabel: 'Équipement défaillant', Icon: IconTool,        bgClass: 'bg-orange-700'  },
    { code: 'ROAD',          label: 'Route bloquée',      sublabel: 'Accès restreint',       Icon: IconRoadSign,    bgClass: 'bg-yellow-700'  },
    { code: 'ENVIRONMENTAL', label: 'Pollution',          sublabel: 'Fuite, contamination',   Icon: IconBiohazard,   bgClass: 'bg-emerald-700' },
    { code: 'SECURITY',      label: 'Intrusion',          sublabel: 'Zone non sécurisée',    Icon: IconShieldLock, bgClass: 'bg-red-700'     },
    { code: 'OTHER',         label: 'Autre',              sublabel: 'Alerte personnalisée',  Icon: IconDots,        bgClass: 'bg-slate-600'   },
];

const URGENCY_OPTIONS: { value: UrgencyLevel; label: string }[] = [
    { value: 'INFORMATION', label: 'Information — pas de danger immédiat' },
    { value: 'URGENT',      label: 'Urgent — action requise rapidement' },
    { value: 'CRITICAL',    label: 'Critique — danger immédiat, évacuation possible' },
];

const MIN_DESCRIPTION_LENGTH = 20;

/* ─── Component ─────────────────────────────────────────────────────── */

export default function MobileGeneralAlertScreen() {
    useStatusBarColor('#D97706', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);

    const redirectAfter = useRedirectTimer();

    const [selectedType, setSelectedType] = useState<AlertTypeCode | null>(null);
    const [description, setDescription] = useState('');
    const [urgency, setUrgency] = useState<UrgencyLevel>('URGENT');
    const [sending, setSending] = useState(false);
    // Etats succes / echec SEPARES : un echec ne doit jamais s'afficher
    // dans l'ecran « Alerte transmise » avec la coche de succes.
    const [sentMessage, setSentMessage] = useState<string | null>(null);
    // Distingue « diffusée » (vert, serveur atteint) de « enregistrée hors
    // ligne, en attente de réseau » (ambre) — l'utilisateur ne doit pas
    // croire le personnel notifié quand l'alerte est seulement en queue.
    const [pendingOffline, setPendingOffline] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // empId en priorité : le backend attend l'ID EMPLOYÉ, pas l'ID de compte.
    const userId = Number(user?.empId ?? user?.id ?? user?.userId ?? user?.sub ?? 14);
    // Mine mono-tenant du terrain : jamais de repli fabriqué (1/0/NaN) — sinon
    // l'alerte serait diffusée sur la mauvaise mine. null → bloqué au submit.
    const companyId = positiveMineId(user?.mineId) ?? positiveMineId(user?.companyId);

    const descriptionValid = description.trim().length >= MIN_DESCRIPTION_LENGTH;
    const canSubmit = selectedType !== null && descriptionValid && !sending;

    /* ── Handlers ──────────────────────────────────────────────────── */

    const handleSelectType = (code: AlertTypeCode) => {
        haptic('light');
        setSelectedType(code);
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        if (companyId === null) {
            haptic('error');
            setErrorMessage('Aucune mine valide associée à votre compte. Reconnectez-vous puis réessayez.');
            return;
        }
        setSending(true);
        setErrorMessage(null);
        setPendingOffline(false);
        haptic('warning');

        try {
            const fingerprint = `alert-general-${userId}-${selectedType}-${Math.floor(Date.now() / 10000)}`;
            // Contrat backend (GeneralAlertController.trigger) : GeneralAlertRequest
            // = { companyId, reasonCode, message, drillMode } — l'ancien payload
            // (alertType/description) et l'ancien endpoint « /hns/alerts/general »
            // renvoyaient 404.
            const payload = {
                companyId,
                reasonCode: selectedType,
                message: `[${urgency}] ${description.trim()}`,
                drillMode: false,
            };

            const result = await mutateOffline({
                endpoint: `/hns/emergency/alerts/general/trigger?actorId=${userId}`,
                method: 'POST',
                payload,
                headers: { 'X-User-Id': String(userId) },
                kind: 'alert.general',
                fingerprint,
            });

            if (result.online) {
                setPendingOffline(false);
                setSentMessage('Alerte diffusée — Tous les employés sur site sont notifiés.');
            } else {
                setPendingOffline(true);
                setSentMessage('Alerte sauvegardée hors ligne. Sera diffusée au retour du réseau.');
            }
            haptic('success');
            redirectAfter(() => {
                setSentMessage(null);
                setPendingOffline(false);
                navigate('/m/home');
            }, 3000);
        } catch {
            setErrorMessage('Échec de la diffusion. Réessayez ou contactez la salle de contrôle.');
            haptic('error');
        } finally {
            setSending(false);
        }
    };

    /* ── Failure screen — jamais confondu avec le succes ──────────── */

    if (errorMessage) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-6">
                <div className="w-full max-w-md bg-rose-50 rounded-2xl shadow-lg ring-2 ring-rose-300 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-rose-100 mx-auto flex items-center justify-center mb-3">
                        <IconAlertTriangle size={28} stroke={2.4} className="text-rose-700" />
                    </div>
                    <h2
                        className="text-rose-900 mb-2"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: '18px',
                        }}
                    >
                        Alerte non diffusée
                    </h2>
                    <p className="text-[13px] text-rose-900 leading-relaxed">{errorMessage}</p>
                    <button
                        type="button"
                        disabled={sending}
                        onClick={() => {
                            setErrorMessage(null);
                            void handleSubmit();
                        }}
                        className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-700 text-white text-[14px] font-semibold shadow-md active:scale-[0.97] transition disabled:opacity-50"
                        style={{ minHeight: 44 }}
                    >
                        <IconRefresh size={16} stroke={2.2} />
                        Réessayer
                    </button>
                    <button
                        type="button"
                        onClick={() => setErrorMessage(null)}
                        className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-800 bg-white text-[13px] font-medium"
                        style={{ minHeight: 44 }}
                    >
                        <IconArrowLeft size={14} stroke={1.8} />
                        Revenir au formulaire
                    </button>
                </div>
            </div>
        );
    }

    /* ── Confirmation screen ───────────────────────────────────────── */
    /* AMBRE si l'alerte n'est qu'enregistree hors ligne (en attente de
       reseau), VERT « transmise » uniquement si le serveur a bien recu. */

    if (sentMessage) {
        if (pendingOffline) {
            return (
                <div className="min-h-[80vh] flex items-center justify-center px-6">
                    <div className="w-full max-w-md bg-amber-50 rounded-2xl shadow-lg ring-2 ring-amber-300 p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto flex items-center justify-center mb-3">
                            <IconWifiOff size={28} stroke={2.4} className="text-amber-700" />
                        </div>
                        <h2
                            className="text-amber-900 mb-2"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: '18px',
                            }}
                        >
                            Alerte enregistrée — en attente de réseau
                        </h2>
                        <p className="text-[13px] text-amber-900 leading-relaxed">{sentMessage}</p>
                    </div>
                </div>
            );
        }
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-6">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg ring-2 ring-emerald-200 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-3">
                        <IconCheck size={28} stroke={2.4} className="text-emerald-700" />
                    </div>
                    <h2
                        className="text-slate-900 mb-2"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: '18px',
                        }}
                    >
                        Alerte transmise
                    </h2>
                    <p className="text-[13px] text-slate-600 leading-relaxed">{sentMessage}</p>
                </div>
            </div>
        );
    }

    /* ── Main form ─────────────────────────────────────────────────── */

    return (
        <>
            <MobileTopBar
                title="Alerte générale"
                subtitle="Diffusion à tout le personnel"
                accent="#D97706"
                onBack={() => navigate('/m/home')}
            />

            <section className="px-3 pt-3 pb-4 space-y-4">
                {/* Warning banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[12.5px] text-amber-900 flex items-start gap-2">
                    <IconAlertTriangle size={16} stroke={2} className="text-amber-700 mt-0.5 flex-shrink-0" />
                    <span>
                        Cette alerte sera diffusée à <strong>TOUS</strong> les employés connectés du site.
                    </span>
                </div>

                {/* Alert type grid */}
                <div>
                    <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-2">
                        Type d&apos;alerte
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {ALERT_TILES.map((tile) => {
                            const Icon = tile.Icon;
                            const isSelected = selectedType === tile.code;
                            return (
                                <button
                                    key={tile.code}
                                    type="button"
                                    onClick={() => handleSelectType(tile.code)}
                                    className={`relative rounded-2xl p-4 text-left transition shadow-md active:scale-[0.97] ${
                                        isSelected
                                            ? `${tile.bgClass} text-white ring-2 ring-offset-2 ring-amber-400`
                                            : 'bg-white border border-slate-200 text-slate-700'
                                    }`}
                                    style={{ minHeight: 110 }}
                                >
                                    <div
                                        className={`w-11 h-11 rounded-full flex items-center justify-center mb-2 ${
                                            isSelected ? 'bg-white/15' : 'bg-slate-100'
                                        }`}
                                    >
                                        <Icon
                                            size={22}
                                            stroke={2}
                                            className={isSelected ? 'text-white' : 'text-slate-500'}
                                        />
                                    </div>
                                    <div
                                        className={`text-[14px] font-semibold leading-tight ${
                                            isSelected ? '' : 'text-slate-800'
                                        }`}
                                    >
                                        {tile.label}
                                    </div>
                                    <div
                                        className={`text-[11.5px] mt-0.5 ${
                                            isSelected ? 'opacity-85' : 'text-slate-500'
                                        }`}
                                    >
                                        {tile.sublabel}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Description textarea */}
                <div>
                    <label
                        htmlFor="alert-description"
                        className="block text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-1.5"
                    >
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="alert-description"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Précisez la zone et les consignes à suivre."
                        className={`w-full rounded-2xl border bg-white p-3 text-[14px] text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 transition ${
                            description.length > 0 && !descriptionValid
                                ? 'border-red-300 focus:ring-red-300'
                                : 'border-slate-200 focus:ring-amber-400'
                        }`}
                        style={{ minHeight: 100 }}
                    />
                    <p
                        className={`text-[11px] mt-1 ${
                            description.length > 0 && !descriptionValid
                                ? 'text-red-500'
                                : 'text-slate-400'
                        }`}
                    >
                        {description.trim().length}/{MIN_DESCRIPTION_LENGTH} caractères minimum
                    </p>
                </div>

                {/* Urgency level select */}
                <div>
                    <label
                        htmlFor="alert-urgency"
                        className="block text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-1.5"
                    >
                        Niveau d&apos;urgence
                    </label>
                    <select
                        id="alert-urgency"
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 transition appearance-none"
                        style={{ minHeight: 48 }}
                    >
                        {URGENCY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Submit button */}
                <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-white font-semibold text-[15px] shadow-md transition active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#D97706', minHeight: 52 }}
                >
                    {sending ? (
                        <span>Diffusion en cours…</span>
                    ) : (
                        <>
                            <IconSend size={18} stroke={2} />
                            Diffuser l&apos;alerte
                        </>
                    )}
                </button>

                {/* Cancel button */}
                <button
                    type="button"
                    onClick={() => navigate('/m/home')}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white text-[13px] font-medium"
                    style={{ minHeight: 48 }}
                >
                    <IconArrowLeft size={14} stroke={1.8} />
                    Annuler
                </button>
            </section>
        </>
    );
}
