/**
 * MobileSosScreen — Ecran SOS plein ecran, 6 tuiles tactiles immenses.
 *
 * Une vie peut etre en jeu : pas de modal, pas d'animation gratuite.
 * Tuiles 120 dp min, espacees, contrast eleve. Tap = envoie immediat
 * (avec geoloc si dispo) + haptic SOS long. En mode offline : enqueue
 * dans IndexedDB, feedback "SOS sauvegarde, sera transmis au reconnect".
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconAlertOctagon,
    IconHeartbeat,
    IconFlame,
    IconMountain,
    IconBiohazard,
    IconShieldX,
    IconCheck,
    IconArrowLeft,
    IconRefresh,
    IconWifiOff,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { mutateOffline } from '../services/mobileApi';
import { getCapacitorPlugin } from '../utils/capacitorBridge';
import { useAppSelector } from '../../slices/hooks';
import { positiveMineId } from '../../utils/activeMine';
import type { SosAlertDTO } from '../../services/SosService';
import {
    createSosClientRequestId,
    deriveSosDeliveryState,
    getSosDeliveryNotice,
    SOS_DEGRADED_GUIDANCE,
    type SosDeliveryState,
} from '../../utility/SosDeliveryState';

type ReasonCode = 'GENERAL' | 'MEDICAL' | 'FIRE' | 'COLLAPSE' | 'CHEMICAL' | 'ARMED_ATTACK';

interface Tile {
    code: ReasonCode;
    label: string;
    sublabel: string;
    Icon: typeof IconAlertOctagon;
    bgClass: string;
}

const TILES: Tile[] = [
    { code: 'GENERAL', label: 'Urgence générale', sublabel: 'Danger non classé', Icon: IconAlertOctagon, bgClass: 'bg-slate-700' },
    { code: 'MEDICAL', label: 'Médical', sublabel: 'Blessure, malaise', Icon: IconHeartbeat, bgClass: 'bg-rose-600' },
    { code: 'FIRE', label: 'Incendie', sublabel: 'Flamme, fumée', Icon: IconFlame, bgClass: 'bg-orange-600' },
    { code: 'COLLAPSE', label: 'Effondrement', sublabel: 'Éboulement, chute', Icon: IconMountain, bgClass: 'bg-amber-700' },
    { code: 'CHEMICAL', label: 'Chimique', sublabel: 'Fuite, contamination', Icon: IconBiohazard, bgClass: 'bg-emerald-700' },
    { code: 'ARMED_ATTACK', label: 'Attaque', sublabel: 'Intrusion armée', Icon: IconShieldX, bgClass: 'bg-fuchsia-700' },
];

async function getGeolocation(): Promise<{ lat: number; lng: number; accuracy: number } | null> {
    try {
        const Geolocation = getCapacitorPlugin<any>('Geolocation');
        if (Geolocation) {
            const pos = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 5000,
            });
            return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        }
    } catch {
        // ignore
    }
    // Fallback navigator
    return new Promise((resolve) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 5000 },
        );
    });
}

export default function MobileSosScreen() {
    useStatusBarColor('#B91C1C', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);

    const [sending, setSending] = useState<ReasonCode | null>(null);
    const [delivery, setDelivery] = useState<{
        state: SosDeliveryState;
        reasonLabel: string;
    } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [failedTile, setFailedTile] = useState<Tile | null>(null);

    // empId en priorité : le backend attend l'ID EMPLOYÉ, pas l'ID de compte.
    const userId = Number(user?.empId ?? user?.id ?? user?.userId ?? user?.sub);
    // Mine mono-tenant du terrain : jamais de repli fabriqué (1/0/NaN) — null si
    // la session n'a pas de mine valide ; bloqué avant l'envoi du SOS.
    const companyId = positiveMineId(user?.mineId) ?? positiveMineId(user?.companyId);

    const handleSendSos = async (tile: Tile) => {
        if (sending) return;
        setSending(tile.code);
        setErrorMessage(null);
        setFailedTile(null);
        setDelivery(null);
        haptic('sos');
        try {
            if (!Number.isSafeInteger(userId) || userId <= 0 || companyId === null) {
                throw new Error('Identité ou mine absente de la session.');
            }
            const position = await getGeolocation();
            const clientRequestId = createSosClientRequestId();
            const payload = {
                clientRequestId,
                companyId,
                employeeId: userId,
                reasonCode: tile.code,
                description: null,
                latitude: position?.lat ?? 0,
                longitude: position?.lng ?? 0,
                gpsAccuracy: position?.accuracy ?? null,
                status: 'RECEIVED' as const,
                drillMode: false,
            };
            // Endpoint réel du backend : POST /hns/emergency/sos (SosAlertController)
            // — « /hns/sos/create » n'existe pas et renvoyait 404.
            const result = await mutateOffline<SosAlertDTO>({
                endpoint: `/hns/emergency/sos?actorId=${userId}`,
                method: 'POST',
                payload,
                headers: { 'X-User-Id': String(userId) },
                kind: 'sos',
                fingerprint: clientRequestId,
            });
            setDelivery({
                state: deriveSosDeliveryState(result.online, result.data?.status),
                reasonLabel: tile.label,
            });
        } catch (error) {
            haptic('error');
            setFailedTile(tile);
            const detail = error instanceof Error ? ` ${error.message}` : '';
            setErrorMessage(`Échec de l'envoi du SOS.${detail} ${SOS_DEGRADED_GUIDANCE}`);
        } finally {
            setSending(null);
        }
    };

    /* ── Ecran d'echec — JAMAIS confondu avec le succes ─────────────── */
    if (errorMessage) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-6">
                <div className="w-full max-w-md bg-rose-50 rounded-2xl shadow-lg ring-2 ring-rose-300 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-rose-100 mx-auto flex items-center justify-center mb-3">
                        <IconAlertOctagon size={28} stroke={2.4} className="text-rose-700" />
                    </div>
                    <h2
                        className="text-rose-900 mb-2"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: '18px',
                        }}
                    >
                        SOS non transmis
                    </h2>
                    <p className="text-[13px] text-rose-900 leading-relaxed">{errorMessage}</p>
                    {failedTile && (
                        <button
                            type="button"
                            onClick={() => {
                                const tile = failedTile;
                                setErrorMessage(null);
                                setFailedTile(null);
                                void handleSendSos(tile);
                            }}
                            className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-700 text-white text-[14px] font-semibold shadow-md active:scale-[0.97] transition"
                            style={{ minHeight: 44 }}
                        >
                            <IconRefresh size={16} stroke={2.2} />
                            Réessayer ({failedTile.label})
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setErrorMessage(null);
                            setFailedTile(null);
                        }}
                        className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-800 bg-white text-[13px] font-medium"
                        style={{ minHeight: 44 }}
                    >
                        <IconArrowLeft size={14} stroke={1.8} />
                        Retour aux tuiles SOS
                    </button>
                </div>
            </div>
        );
    }

    /* La réception serveur n'est jamais présentée comme un acquittement humain. */
    if (delivery) {
        const notice = getSosDeliveryNotice(delivery.state, delivery.reasonLabel);
        const queued = delivery.state === 'QUEUED';
        const acknowledged = delivery.state === 'ACKNOWLEDGED';
        const palette = queued
            ? 'bg-amber-50 ring-amber-300 text-amber-900'
            : acknowledged
                ? 'bg-emerald-50 ring-emerald-300 text-emerald-900'
                : 'bg-sky-50 ring-sky-300 text-sky-950';
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-6">
                <div className={`w-full max-w-md rounded-2xl shadow-lg ring-2 p-6 text-center ${palette}`}>
                    <div className="w-16 h-16 rounded-full bg-white/70 mx-auto flex items-center justify-center mb-3">
                        {queued
                            ? <IconWifiOff size={28} stroke={2.4} />
                            : <IconCheck size={28} stroke={2.4} />}
                    </div>
                    <h2
                        className="mb-2"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: '18px',
                        }}
                    >
                        {notice.title}
                    </h2>
                    <p className="text-[13px] leading-relaxed">{notice.body}</p>
                    {!acknowledged && (
                        <p className="mt-3 text-[12.5px] font-semibold leading-relaxed">
                            {SOS_DEGRADED_GUIDANCE}
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={() => navigate('/m/home')}
                        className="w-full mt-5 px-4 py-3 rounded-xl bg-slate-900 text-white text-[13px] font-semibold"
                        style={{ minHeight: 48 }}
                    >
                        Retour à l'accueil
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <MobileTopBar
                title="Signaler un SOS"
                subtitle="Touchez le danger correspondant"
                accent="#B91C1C"
                onBack={() => navigate('/m/home')}
            />
            <section className="px-3 pt-3 pb-4">
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[12.5px] text-rose-900 mb-3 flex items-start gap-2">
                    <IconAlertOctagon size={16} stroke={2} className="text-rose-700 mt-0.5 flex-shrink-0" />
                    <span>
                        Ceci n'est pas un exercice. Un appui déclenche l'envoi immédiat. SafeX indique séparément la mise en file, la réception serveur et la prise en charge.
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {TILES.map((tile) => {
                        const Icon = tile.Icon;
                        const isSending = sending === tile.code;
                        return (
                            <button
                                key={tile.code}
                                type="button"
                                disabled={!!sending}
                                onClick={() => handleSendSos(tile)}
                                className={`relative ${tile.bgClass} text-white rounded-2xl p-4 text-left active:scale-[0.97] transition shadow-md disabled:opacity-60`}
                                style={{ minHeight: 140 }}
                            >
                                <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center mb-2">
                                    <Icon size={26} stroke={2} />
                                </div>
                                <div className="text-[14.5px] font-semibold leading-tight">
                                    {tile.label}
                                </div>
                                <div className="text-[11.5px] opacity-85 mt-0.5">
                                    {tile.sublabel}
                                </div>
                                {isSending && (
                                    <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center">
                                        <div className="text-[12px] font-medium">Transmission…</div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/m/alert')}
                    className="w-full mt-4 inline-flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-amber-800 bg-amber-50 border border-amber-200 text-[13.5px] font-semibold active:bg-amber-100 transition"
                    style={{ minHeight: 48 }}
                >
                    <IconAlertOctagon size={16} stroke={2} />
                    Diffuser une alerte générale
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/m/home')}
                    className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white text-[13px] font-medium"
                    style={{ minHeight: 48 }}
                >
                    <IconArrowLeft size={14} stroke={1.8} />
                    Annuler
                </button>
            </section>
        </>
    );
}
