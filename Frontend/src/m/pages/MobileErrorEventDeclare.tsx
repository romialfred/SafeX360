/**
 * MobileErrorEventDeclare — Declaration d'un evenement/erreur (module Juste
 * Culture / Gestion des Erreurs).
 *
 * L'utilisateur choisit une categorie d'evenement, une gravite, redige une
 * description (min. 20 caracteres) et peut joindre une photo facultative.
 * Submit offline-aware via mutateOffline (queue IndexedDB si hors reseau).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconUserExclamation,
    IconListCheck,
    IconBuildingFactory2,
    IconSettingsCog,
    IconLeaf,
    IconCamera,
    IconCheck,
    IconArrowLeft,
    IconSend,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { mutateOffline } from '../services/mobileApi';
import { capturePhoto } from '../services/cameraService';
import { useAppSelector } from '../../slices/hooks';
import { extractErrorMessage } from '../../utility/NotificationUtility';

/* ─── Types ─────────────────────────────────────────────────────────── */

type EventTypeCode =
    | 'HUMAN_ERROR'
    | 'PROCEDURAL'
    | 'ORGANIZATIONAL'
    | 'TECHNICAL'
    | 'ENVIRONMENTAL';

type SeverityCode = 'MINOR' | 'MODERATE' | 'SIGNIFICANT' | 'MAJOR';

interface EventTile {
    code: EventTypeCode;
    label: string;
    sublabel: string;
    Icon: typeof IconUserExclamation;
    bgClass: string;
}

const EVENT_TILES: EventTile[] = [
    { code: 'HUMAN_ERROR', label: 'Erreur humaine', sublabel: 'Geste, oubli, inattention', Icon: IconUserExclamation, bgClass: 'bg-pink-700' },
    { code: 'PROCEDURAL', label: 'Procédure', sublabel: 'Non respectée ou inadaptée', Icon: IconListCheck, bgClass: 'bg-rose-700' },
    { code: 'ORGANIZATIONAL', label: 'Organisationnel', sublabel: 'Charge, planning, moyens', Icon: IconBuildingFactory2, bgClass: 'bg-fuchsia-700' },
    { code: 'TECHNICAL', label: 'Technique', sublabel: 'Panne, défaut matériel', Icon: IconSettingsCog, bgClass: 'bg-purple-700' },
    { code: 'ENVIRONMENTAL', label: 'Environnemental', sublabel: 'Conditions, ambiance', Icon: IconLeaf, bgClass: 'bg-emerald-700' },
];

const SEVERITIES: { code: SeverityCode; label: string; classes: string }[] = [
    { code: 'MINOR', label: 'Mineure', classes: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    { code: 'MODERATE', label: 'Modérée', classes: 'bg-amber-50 border-amber-200 text-amber-800' },
    { code: 'SIGNIFICANT', label: 'Significative', classes: 'bg-orange-50 border-orange-200 text-orange-800' },
    { code: 'MAJOR', label: 'Majeure', classes: 'bg-rose-50 border-rose-300 text-rose-800' },
];

const MIN_DESCRIPTION_LENGTH = 20;
const ACCENT = '#BE185D';

/* ─── Component ─────────────────────────────────────────────────────── */

export default function MobileErrorEventDeclare() {
    useStatusBarColor('#BE185D', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);

    const userId = Number(user?.id ?? user?.empId ?? user?.userId ?? user?.sub ?? 14);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    const [type, setType] = useState<EventTypeCode | null>(null);
    const [severity, setSeverity] = useState<SeverityCode | null>(null);
    const [description, setDescription] = useState('');
    const [photoName, setPhotoName] = useState<string | null>(null);
    const [photoSizeKb, setPhotoSizeKb] = useState<number | null>(null);

    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<string | null>(null);

    const descriptionValid = description.trim().length >= MIN_DESCRIPTION_LENGTH;
    const canSubmit = !!type && !!severity && descriptionValid && !sending;

    /* ── Handlers ──────────────────────────────────────────────────── */

    const handleSelectType = (code: EventTypeCode) => {
        haptic('light');
        setType(code);
    };

    const handleTakePhoto = async () => {
        haptic('light');
        try {
            const photo = await capturePhoto({ label: 'error-event' });
            setPhotoName(photo.filename);
            setPhotoSizeKb(Math.round(photo.sizeBytes / 1024));
            haptic('light');
        } catch (e) {
            // Annulation utilisateur : pas d'erreur visible (UX silencieuse)
            console.warn('[error-event] photo capture skipped', e);
        }
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSending(true);
        setError(null);
        haptic('medium');
        try {
            const cacheKey = 'error-event-' + Date.now();
            const payload = {
                companyId,
                reporterId: userId,
                eventType: type,
                severity,
                description: description.trim(),
                photoFilename: photoName,
            };
            const result = await mutateOffline({
                endpoint: '/hns/error/events',
                method: 'POST',
                payload,
                headers: { 'X-User-Id': String(userId) },
                kind: 'other',
                fingerprint: cacheKey,
            });
            haptic('success');
            setDone(
                result.online
                    ? "Événement déclaré. L'équipe Juste Culture est notifiée."
                    : "Événement sauvegardé hors ligne. Sera transmis au retour du réseau.",
            );
            setTimeout(() => navigate('/m/home'), 2500);
        } catch (e: any) {
            haptic('error');
            setError(extractErrorMessage(e, 'Échec de la déclaration. Réessayez.'));
        } finally {
            setSending(false);
        }
    };

    /* ── Ecran de confirmation ──────────────────────────────────────── */

    if (done) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-6">
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
                        Déclaration enregistrée
                    </h2>
                    <p className="text-[13px] text-slate-600 leading-relaxed">{done}</p>
                </div>
            </div>
        );
    }

    /* ── Formulaire ───────────────────────────────────────────────── */

    return (
        <>
            <MobileTopBar
                title="Déclarer un événement"
                subtitle="Approche Juste Culture"
                accent={ACCENT}
                onBack={() => navigate('/m/home')}
            />

            <section className="px-3 pt-3 pb-4 space-y-4">
                <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 text-[12.5px] text-pink-900 flex items-start gap-2">
                    <IconUserExclamation size={16} stroke={2} className="text-pink-700 mt-0.5 flex-shrink-0" />
                    <span>
                        La Juste Culture distingue l&apos;erreur du manquement volontaire : décrivez les faits,
                        pas les responsabilités.
                    </span>
                </div>

                {/* Type d'evenement */}
                <div>
                    <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-2">
                        Type d&apos;événement
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {EVENT_TILES.map((tile) => {
                            const Icon = tile.Icon;
                            const isSelected = type === tile.code;
                            return (
                                <button
                                    key={tile.code}
                                    type="button"
                                    onClick={() => handleSelectType(tile.code)}
                                    className={`relative rounded-2xl p-4 text-left transition shadow-md active:scale-[0.97] ${
                                        isSelected
                                            ? `${tile.bgClass} text-white ring-2 ring-offset-2 ring-pink-400`
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

                {/* Gravite */}
                <div>
                    <h3 className="text-[12px] uppercase tracking-[0.1em] text-slate-500 mb-2">Gravité</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {SEVERITIES.map((s) => (
                            <button
                                key={s.code}
                                type="button"
                                onClick={() => { haptic('light'); setSeverity(s.code); }}
                                className={`p-2 rounded-xl border-2 text-[12px] font-medium ${
                                    severity === s.code
                                        ? s.classes + ' ring-2 ring-offset-1'
                                        : 'border-slate-200 bg-white text-slate-700'
                                }`}
                                style={{ minHeight: 56 }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label
                        htmlFor="error-event-description"
                        className="block text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-1.5"
                    >
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="error-event-description"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Décrivez les faits : contexte, déroulement, conséquences observées."
                        className={`w-full rounded-2xl border bg-white p-3 text-[14px] text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 transition ${
                            description.length > 0 && !descriptionValid
                                ? 'border-red-300 focus:ring-red-300'
                                : 'border-slate-200 focus:ring-pink-400'
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

                {/* Photo facultative */}
                <div>
                    <h3 className="text-[12px] uppercase tracking-[0.1em] text-slate-500 mb-2">Photo (facultative)</h3>
                    <button
                        type="button"
                        onClick={handleTakePhoto}
                        className="w-full inline-flex items-center justify-center gap-2 px-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 bg-slate-50"
                        style={{ minHeight: 56 }}
                    >
                        <IconCamera size={18} stroke={1.8} />
                        {photoName
                            ? `${photoName}${photoSizeKb ? ` · ${photoSizeKb} Ko` : ''}`
                            : 'Joindre une photo'}
                    </button>
                    {photoName && (
                        <p className="text-[11px] text-emerald-700 mt-1 px-1">
                            ✓ Compressée et mise en file d&apos;attente — sera envoyée au retour réseau
                        </p>
                    )}
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[13px] rounded-xl p-3">
                        {error}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-white font-semibold text-[15px] shadow-md transition active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: ACCENT, minHeight: 52 }}
                >
                    {sending ? (
                        <span>Envoi en cours…</span>
                    ) : (
                        <>
                            <IconSend size={18} stroke={2} />
                            Déclarer l&apos;événement
                        </>
                    )}
                </button>

                {/* Cancel */}
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
