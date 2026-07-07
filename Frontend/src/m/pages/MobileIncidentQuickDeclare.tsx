/**
 * MobileIncidentQuickDeclare — Mode declaration rapide d'un incident
 * (cible : moins de 90 secondes terrain).
 *
 * Formulaire minimaliste : type + severite + description courte + photo
 * optionnelle. Submit offline-aware via mutateOffline.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconExclamationCircle,
    IconCamera,
    IconCheck,
    IconArrowLeft,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { mutateOffline } from '../services/mobileApi';
import { capturePhoto } from '../services/cameraService';
import { useAppSelector } from '../../slices/hooks';

type IncidentType = 'NEAR_MISS' | 'INJURY' | 'PROPERTY' | 'ENVIRONMENTAL';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const TYPES: { code: IncidentType; label: string; sublabel: string }[] = [
    { code: 'NEAR_MISS', label: 'Presqu\'accident', sublabel: 'Sans dommage' },
    { code: 'INJURY', label: 'Blessure', sublabel: 'Personne blessée' },
    { code: 'PROPERTY', label: 'Matériel', sublabel: 'Équipement endommagé' },
    { code: 'ENVIRONMENTAL', label: 'Environnement', sublabel: 'Pollution, fuite' },
];

const SEVERITIES: { code: Severity; label: string; classes: string }[] = [
    { code: 'LOW', label: 'Faible', classes: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    { code: 'MEDIUM', label: 'Moyenne', classes: 'bg-amber-50 border-amber-200 text-amber-800' },
    { code: 'HIGH', label: 'Élevée', classes: 'bg-orange-50 border-orange-200 text-orange-800' },
    { code: 'CRITICAL', label: 'Critique', classes: 'bg-rose-50 border-rose-300 text-rose-800' },
];

export default function MobileIncidentQuickDeclare() {
    useStatusBarColor('#B45309', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const user = useAppSelector((state: any) => state.user);

    const [type, setType] = useState<IncidentType | null>(null);
    const [severity, setSeverity] = useState<Severity | null>(null);
    const [description, setDescription] = useState<string>('');
    const [photoName, setPhotoName] = useState<string | null>(null);
    const [photoSizeKb, setPhotoSizeKb] = useState<number | null>(null);
    const [sending, setSending] = useState<boolean>(false);
    const [done, setDone] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const userId = Number(user?.id ?? user?.empId ?? user?.userId ?? user?.sub ?? 14);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);
    const canSubmit = !!type && !!severity && description.trim().length >= 10 && !sending;

    const handleTakePhoto = async () => {
        haptic('light');
        try {
            // Capacitor Camera + compression (1024px max, JPEG q70, EXIF strip).
            // Stockage immediat dans photoQueue IndexedDB pour upload differe.
            const photo = await capturePhoto({ label: 'incident' });
            setPhotoName(photo.filename);
            setPhotoSizeKb(Math.round(photo.sizeBytes / 1024));
            haptic('light');
        } catch (e) {
            // Annulation utilisateur : pas d'erreur visible (UX silencieuse)
            // Erreur reelle : log uniquement pour ne pas effrayer le terrain.
            console.warn('[incident] photo capture skipped', e);
        }
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSending(true);
        setError(null);
        haptic('medium');
        try {
            const payload = {
                companyId,
                reporterId: userId,
                type,
                severity,
                description: description.trim(),
                photoFilename: photoName,
                quickDeclare: true,
            };
            // Endpoint réel : POST /hns/incidents/report (comme la déclaration IA)
            // — « /hns/incidents/create » n'existe pas côté backend (404).
            const result = await mutateOffline({
                endpoint: '/hns/incidents/report',
                method: 'POST',
                payload,
                headers: { 'X-User-Id': String(userId) },
                kind: 'incident',
            });
            haptic('success');
            setDone(
                result.online
                    ? "Incident déclaré. Le coordinateur HSE est notifié."
                    : "Incident sauvegardé hors ligne. Sera transmis au retour du réseau.",
            );
            setTimeout(() => navigate('/m/home'), 2500);
        } catch (e: any) {
            haptic('error');
            setError("Échec de la déclaration. Réessayez.");
        } finally {
            setSending(false);
        }
    };

    if (done) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-6">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg ring-2 ring-emerald-200 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-3">
                        <IconCheck size={28} stroke={2.4} className="text-emerald-700" />
                    </div>
                    <h2 className="text-[18px] font-semibold text-slate-900 mb-2">Déclaration enregistrée</h2>
                    <p className="text-[13px] text-slate-600 leading-relaxed">{done}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <MobileTopBar
                title="Déclarer un incident"
                subtitle="Saisie rapide — 90 secondes"
                accent="#B45309"
                onBack={() => navigate('/m/home')}
            />
            <section className="px-4 pt-4 space-y-4">
                <div>
                    <h3 className="text-[12px] uppercase tracking-[0.1em] text-slate-500 mb-2">Type d'incident</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {TYPES.map((t) => (
                            <button
                                key={t.code}
                                type="button"
                                onClick={() => { haptic('light'); setType(t.code); }}
                                className={`text-left p-3 rounded-xl border-2 transition active:scale-[0.98] ${
                                    type === t.code
                                        ? 'border-amber-600 bg-amber-50'
                                        : 'border-slate-200 bg-white'
                                }`}
                                style={{ minHeight: 70 }}
                            >
                                <div className="text-[13.5px] font-semibold text-slate-900">{t.label}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">{t.sublabel}</div>
                            </button>
                        ))}
                    </div>
                </div>

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

                <div>
                    <h3 className="text-[12px] uppercase tracking-[0.1em] text-slate-500 mb-2">
                        Description (min. 10 caractères)
                    </h3>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Décrivez ce qui s'est passé, où, et qui est concerné."
                        rows={4}
                        className="w-full px-3 py-2 text-[14px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    />
                </div>

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
                            ✓ Compressée et mise en file d'attente — sera envoyée au retour réseau
                        </p>
                    )}
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[13px] rounded-xl p-3">
                        {error}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-amber-700 text-white font-semibold text-[14.5px] disabled:opacity-50 active:bg-amber-800"
                    style={{ minHeight: 56 }}
                >
                    <IconExclamationCircle size={18} stroke={2} />
                    {sending ? 'Envoi…' : 'Déclarer l\'incident'}
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/m/home')}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 text-[13px]"
                    style={{ minHeight: 44 }}
                >
                    <IconArrowLeft size={14} stroke={1.8} />
                    Annuler
                </button>
            </section>
        </>
    );
}
