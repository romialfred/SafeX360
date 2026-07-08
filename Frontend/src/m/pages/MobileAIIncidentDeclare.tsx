/**
 * MobileAIIncidentDeclare — Declaration d'incident assistee par IA.
 *
 * Flux en 4 etapes :
 *   1. Capture photo (grande cible tactile)
 *   2. Analyse IA de la photo (POST /hns/ai-incidents/analyze, multipart) avec
 *      squelette de chargement — bascule en saisie manuelle si echec/refus.
 *   3. Formulaire editable pre-rempli par les suggestions IA (type, gravite,
 *      description, localisation) — l'utilisateur valide ou corrige.
 *   4. Ecran de confirmation (offline-aware via mutateOffline).
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconCamera,
    IconCheck,
    IconArrowLeft,
    IconSparkles,
    IconMapPin,
    IconPencil,
    IconRefresh,
    IconRotate,
} from '@tabler/icons-react';
import MobileTopBar from '../components/MobileTopBar';
import { toIsoDateTimeLocal } from '../components/MobileUI';
import { useStatusBarColor } from '../hooks/useStatusBarColor';
import { useHaptics } from '../hooks/useHaptics';
import { useRedirectTimer } from '../hooks/useRedirectTimer';
import { getCached, mutateOffline } from '../services/mobileApi';
import { capturePhoto } from '../services/cameraService';
import axiosInstance from '../../interceptors/AxiosInterceptor';
import { useAppSelector } from '../../slices/hooks';
import { extractErrorMessage } from '../../utility/NotificationUtility';

/* ─── Types ─────────────────────────────────────────────────────────── */

type IncidentType = 'NEAR_MISS' | 'INJURY' | 'PROPERTY' | 'ENVIRONMENTAL';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type Step = 'CAPTURE' | 'ANALYZING' | 'REVIEW' | 'DONE';

interface AiSuggestion {
    type: IncidentType | null;
    severity: Severity | null;
    description: string;
    location: string;
    confidence: number | null;
}

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

const ACCENT = '#7C3AED';

/**
 * Correspondance types IA → codes UI : le backend (HsePromptBuilder) classe en
 * ACCIDENT / QUASI_ACCIDENT / DANGER / NON_CONFORMITY / NEAR_MISS, l'écran ne
 * connaît que les 4 tuiles NEAR_MISS / INJURY / PROPERTY / ENVIRONMENTAL.
 */
const AI_TYPE_TO_UI: Record<string, IncidentType> = {
    ACCIDENT: 'INJURY',
    QUASI_ACCIDENT: 'NEAR_MISS',
    DANGER: 'NEAR_MISS',
    NON_CONFORMITY: 'PROPERTY',
    NEAR_MISS: 'NEAR_MISS',
};


/* ─── Component ─────────────────────────────────────────────────────── */

export default function MobileAIIncidentDeclare() {
    useStatusBarColor('#7C3AED', 'LIGHT');
    const navigate = useNavigate();
    const haptic = useHaptics();
    const redirectAfter = useRedirectTimer();
    const user = useAppSelector((state: any) => state.user);

    // Attribution employé : empId prioritaire sur l'id de compte. Repli 0
    // (bloqué au submit) — plus jamais d'attribution fantôme à l'employé 14.
    const userId = Number(user?.empId ?? user?.id ?? user?.userId ?? user?.sub ?? 0);
    const companyId = Number(user?.mineId ?? user?.companyId ?? 1);

    // FK nullable=false backend — mêmes défauts référentiels que le wizard IA web
    const [defaultIds, setDefaultIds] = useState<{ locationId?: number; workAreaId?: number; workProcessId?: number }>({});
    useEffect(() => {
        let cancelled = false;
        const first = (r: any): number | undefined =>
            Array.isArray(r?.data) && r.data.length > 0 ? Number(r.data[0].id) : undefined;
        (async () => {
            const g = (endpoint: string, cacheKey: string) => getCached<any[]>({
                endpoint, cacheStore: 'inspectionCache', cacheKey, ttlMs: 30 * 60 * 1000,
            }).catch(() => null);
            const [loc, wa, wp] = await Promise.all([
                g('/hns/locations/getAllActive', `nc-locations-${companyId}`),
                g('/hns/work-area/getAllActive', `incident-workareas-${companyId}`),
                g('/hns/work-process/getAllActive', `nc-processes-${companyId}`),
            ]);
            if (!cancelled) setDefaultIds({ locationId: first(loc), workAreaId: first(wa), workProcessId: first(wp) });
        })();
        return () => { cancelled = true; };
    }, [companyId]);

    const [step, setStep] = useState<Step>('CAPTURE');
    const [photoName, setPhotoName] = useState<string | null>(null);
    const [photoSizeKb, setPhotoSizeKb] = useState<number | null>(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
    const [aiUsed, setAiUsed] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const [type, setType] = useState<IncidentType | null>(null);
    const [severity, setSeverity] = useState<Severity | null>(null);
    const [description, setDescription] = useState<string>('');
    const [location, setLocation] = useState<string>('');

    const [sending, setSending] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [done, setDone] = useState<string | null>(null);

    const canSubmit = !!type && !!severity && description.trim().length >= 10 && !sending;

    /* ── Etape 1 : capture photo ───────────────────────────────────── */

    const handleTakePhoto = async () => {
        haptic('light');
        try {
            const photo = await capturePhoto({ label: 'ai-incident' });
            setPhotoName(photo.filename);
            setPhotoSizeKb(Math.round(photo.sizeBytes / 1024));
            // Révoque l'ancienne URL avant d'en créer une nouvelle (fuite mémoire sinon)
            setPhotoPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(photo.blob);
            });
            haptic('light');
            await analyzePhoto(photo.blob);
        } catch (e) {
            // Annulation utilisateur : pas d'erreur visible (UX silencieuse)
            console.warn('[ai-incident] photo capture skipped', e);
        }
    };

    /* ── Etape 2 : analyse IA ──────────────────────────────────────── */

    const analyzePhoto = async (blob: Blob) => {
        setStep('ANALYZING');
        setAiError(null);
        haptic('light');
        try {
            // Endpoint réel : POST /hns/ai-incidents/analyze en multipart/form-data
            // (@RequestParam image) — « analyze-photo » n'existe pas (404).
            const form = new FormData();
            form.append('image', blob, 'incident.jpg');
            form.append('language', 'fr');
            const res = await axiosInstance.post('/hns/ai-incidents/analyze', form, {
                timeout: 45000,
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const data = res.data ?? {};
            // Photo hors sujet HSE : ne rien pré-remplir, expliquer pourquoi
            // et inviter à reprendre une photo (le finally bascule en REVIEW).
            if (data.isHseRelevant === false) {
                setAiUsed(false);
                setAiError(
                    `${String(data.irrelevanceReason || "La photo ne semble pas montrer une situation HSE.").trim()} `
                    + 'Reprenez une photo de la situation ou renseignez les informations manuellement.',
                );
                haptic('warning');
                return;
            }
            // AIAnalysisResponse : title/description/severity(LOW..CRITICAL)/confidence.
            // incidentType arrive dans le vocabulaire backend → table AI_TYPE_TO_UI.
            const sevUpper = String(data.severity ?? '').toUpperCase();
            const suggestion: AiSuggestion = {
                type: AI_TYPE_TO_UI[String(data.incidentType ?? '').toUpperCase()] ?? null,
                severity: SEVERITIES.some((s) => s.code === sevUpper) ? sevUpper as Severity : null,
                description: [data.title, data.description].filter(Boolean).join(' — '),
                location: '',
                confidence: typeof data.confidence === 'number' ? data.confidence : null,
            };
            setType(suggestion.type);
            setSeverity(suggestion.severity);
            setDescription(suggestion.description);
            setLocation(suggestion.location);
            setAiUsed(true);
            haptic('success');
        } catch (e) {
            // Echec IA : on ne bloque jamais le terrain — bascule en saisie manuelle.
            console.warn('[ai-incident] analyse photo indisponible, saisie manuelle', e);
            setAiUsed(false);
            setAiError(
                "L'analyse IA n'est pas disponible pour le moment. Renseignez les informations manuellement.",
            );
            haptic('warning');
        } finally {
            setStep('REVIEW');
        }
    };

    const handleRetakePhoto = async () => {
        setPhotoName(null);
        setPhotoSizeKb(null);
        setPhotoPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        setAiUsed(false);
        setAiError(null);
        setStep('CAPTURE');
        await handleTakePhoto();
    };

    // Révocation au démontage — setState y serait un no-op, on passe par un ref
    const previewUrlRef = useRef<string | null>(null);
    useEffect(() => { previewUrlRef.current = photoPreviewUrl; }, [photoPreviewUrl]);
    useEffect(() => () => {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    }, []);

    const handleSkipPhoto = () => {
        haptic('light');
        setStep('REVIEW');
    };

    /* ── Etape 4 : soumission ───────────────────────────────────────── */

    const handleSubmit = async () => {
        if (!canSubmit) return;
        // Identité obligatoire : sans employé résolu, l'incident serait
        // attribué à un fantôme (reporterId 0 → 500 ou mauvaise personne).
        if (userId === 0) {
            haptic('error');
            setSubmitError('Utilisateur non identifié. Reconnectez-vous puis réessayez.');
            return;
        }
        // FK nullable=false backend : un payload à locationId/workAreaId/
        // workProcessId null partirait en file hors ligne et rejouerait en 500
        // pour toujours, avec une confirmation trompeuse à l'écran.
        if (defaultIds.locationId == null || defaultIds.workAreaId == null || defaultIds.workProcessId == null) {
            haptic('error');
            setSubmitError('Référentiels indisponibles — connectez-vous une première fois au réseau puis réessayez.');
            return;
        }
        setSending(true);
        setSubmitError(null);
        haptic('medium');
        try {
            const typeLabel = TYPES.find((t) => t.code === type)?.label ?? 'Incident';
            const desc = description.trim();
            // Contrat IncidentDTO backend (cf. wizard IA web) : severity Integer 1..4,
            // title/factualDescription/occurredAt, FK location/workArea/workProcess,
            // departmentId @NotNull, status enum IncidentStatus (NULL → 'UNKNOWN' en liste).
            const payload = {
                companyId,
                reporterId: userId,
                departmentId: Number(user?.departmentId ?? user?.deptId ?? 0) || null,
                title: `${typeLabel} — ${desc.slice(0, 80)}`,
                factualDescription: location.trim() ? `${desc}\nLocalisation indiquée : ${location.trim()}` : desc,
                occurredAt: toIsoDateTimeLocal(),
                discoveryTime: toIsoDateTimeLocal(),
                locationId: defaultIds.locationId,
                workAreaId: defaultIds.workAreaId,
                workProcessId: defaultIds.workProcessId,
                severity: severity === 'CRITICAL' ? 4 : severity === 'HIGH' ? 3 : severity === 'MEDIUM' ? 2 : 1,
                probability: 3,
                status: 'PENDING',
                source: aiUsed ? 'AI' : 'EMPLOYEE',
                involvedPersons: [],
                witnesses: [],
                evidence: [],
                ppe: [],
                weatherConditions: [],
            };
            // Fingerprint déterministe : Date.now() rendait la dédup inopérante
            const result = await mutateOffline({
                endpoint: `/hns/incidents/report?companyId=${companyId}`,
                method: 'POST',
                payload,
                headers: { 'X-User-Id': String(userId) },
                kind: 'incident',
                fingerprint: `ai-incident:${userId}:${desc.slice(0, 40)}`,
            });
            haptic('success');
            setDone(
                result.online
                    ? "Incident déclaré. Le coordinateur HSE est notifié."
                    : "Incident sauvegardé hors ligne. Sera transmis au retour du réseau.",
            );
            setStep('DONE');
            redirectAfter(() => navigate('/m/home'), 2500);
        } catch (e: any) {
            haptic('error');
            setSubmitError(extractErrorMessage(e, 'Échec de la déclaration. Réessayez.'));
        } finally {
            setSending(false);
        }
    };

    /* ── Ecran de confirmation ──────────────────────────────────────── */

    if (step === 'DONE' && done) {
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

    return (
        <>
            <MobileTopBar
                title="Déclaration assistée par IA"
                subtitle="Photo → analyse → validation"
                accent={ACCENT}
                onBack={() => navigate('/m/home')}
            />

            {/* ── Etape 1 : capture ──────────────────────────────────── */}
            {step === 'CAPTURE' && (
                <section className="px-4 pt-4 space-y-4">
                    <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-[12.5px] text-violet-900 flex items-start gap-2">
                        <IconSparkles size={16} stroke={2} className="text-violet-700 mt-0.5 flex-shrink-0" />
                        <span>
                            Prenez une photo de la situation. L&apos;IA propose automatiquement le type, la
                            gravité et une description — vous gardez la main pour tout corriger.
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleTakePhoto}
                        className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-violet-300 bg-white active:scale-[0.98] transition"
                        style={{ minHeight: 220 }}
                    >
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: '#EDE9FE' }}
                        >
                            <IconCamera size={36} stroke={1.8} className="text-violet-700" />
                        </div>
                        <div className="text-center px-6">
                            <div className="text-[15px] font-semibold text-slate-900">
                                Prendre une photo
                            </div>
                            <div className="text-[12px] text-slate-500 mt-1">
                                Touchez pour ouvrir la caméra
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={handleSkipPhoto}
                        className="w-full inline-flex items-center justify-center gap-2 px-3 rounded-xl text-slate-600 border border-slate-200 bg-white text-[13.5px] font-medium"
                        style={{ minHeight: 48 }}
                    >
                        <IconPencil size={16} stroke={1.8} />
                        Saisir manuellement sans photo
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
            )}

            {/* ── Etape 2 : analyse IA en cours (squelette) ──────────── */}
            {step === 'ANALYZING' && (
                <section className="px-4 pt-4 space-y-4">
                    {photoPreviewUrl && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100" style={{ maxHeight: 200 }}>
                            <img
                                src={photoPreviewUrl}
                                alt="Photo capturée"
                                className="w-full object-cover"
                                style={{ maxHeight: 200 }}
                            />
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-violet-100 p-5 text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-600" />
                            </span>
                            <span className="text-[14.5px] font-semibold text-violet-800">
                                Analyse IA en cours…
                            </span>
                        </div>

                        {/* Squelette de chargement */}
                        <div className="space-y-3 text-left">
                            <div className="h-3 w-1/3 rounded bg-slate-200 animate-pulse" />
                            <div className="h-9 w-full rounded-xl bg-slate-100 animate-pulse" />
                            <div className="h-3 w-1/4 rounded bg-slate-200 animate-pulse" />
                            <div className="h-9 w-full rounded-xl bg-slate-100 animate-pulse" />
                            <div className="h-3 w-1/2 rounded bg-slate-200 animate-pulse" />
                            <div className="h-16 w-full rounded-xl bg-slate-100 animate-pulse" />
                        </div>

                        <p className="text-[11.5px] text-slate-400 mt-4">
                            Classification du type, de la gravité et rédaction d&apos;une description…
                        </p>
                    </div>
                </section>
            )}

            {/* ── Etape 3 : formulaire editable ───────────────────────── */}
            {step === 'REVIEW' && (
                <section className="px-4 pt-4 space-y-4">
                    {photoPreviewUrl && (
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100" style={{ maxHeight: 160 }}>
                            <img
                                src={photoPreviewUrl}
                                alt="Photo capturée"
                                className="w-full object-cover"
                                style={{ maxHeight: 160 }}
                            />
                            <button
                                type="button"
                                onClick={handleRetakePhoto}
                                className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/60 text-white text-[11.5px] font-medium backdrop-blur-sm"
                                style={{ minHeight: 44 }}
                            >
                                <IconRotate size={13} stroke={2} />
                                Reprendre
                            </button>
                        </div>
                    )}

                    {aiUsed && (
                        <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-[12.5px] text-violet-900 flex items-start gap-2">
                            <IconSparkles size={16} stroke={2} className="text-violet-700 mt-0.5 flex-shrink-0" />
                            <span>
                                Suggestions générées par l&apos;IA à partir de la photo. Vérifiez et corrigez
                                si nécessaire avant l&apos;envoi.
                            </span>
                        </div>
                    )}

                    {aiError && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[12.5px] text-amber-900 flex items-start gap-2">
                            <IconPencil size={16} stroke={2} className="text-amber-700 mt-0.5 flex-shrink-0" />
                            <span>{aiError}</span>
                        </div>
                    )}

                    <div>
                        <h3 className="text-[12px] uppercase tracking-[0.1em] text-slate-500 mb-2">
                            Type d&apos;incident
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {TYPES.map((t) => (
                                <button
                                    key={t.code}
                                    type="button"
                                    onClick={() => { haptic('light'); setType(t.code); }}
                                    className={`text-left p-3 rounded-xl border-2 transition active:scale-[0.98] ${
                                        type === t.code
                                            ? 'border-violet-600 bg-violet-50'
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
                            className="w-full px-3 py-2 text-[14px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        />
                    </div>

                    <div>
                        <h3 className="text-[12px] uppercase tracking-[0.1em] text-slate-500 mb-2">
                            Localisation (facultative)
                        </h3>
                        <div className="relative">
                            <IconMapPin
                                size={16}
                                stroke={1.8}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Ex. Zone d'extraction Nord, niveau -120m"
                                className="w-full pl-9 pr-3 text-[14px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                                style={{ minHeight: 48 }}
                            />
                        </div>
                    </div>

                    {submitError && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[13px] rounded-xl p-3">
                            {submitError}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 rounded-xl text-white font-semibold text-[14.5px] disabled:opacity-50 transition active:scale-[0.98]"
                        style={{ backgroundColor: ACCENT, minHeight: 56 }}
                    >
                        <IconCheck size={18} stroke={2} />
                        {sending ? 'Envoi…' : "Confirmer et déclarer"}
                    </button>

                    {!photoName && (
                        <button
                            type="button"
                            onClick={() => { setStep('CAPTURE'); }}
                            className="w-full inline-flex items-center justify-center gap-2 px-3 rounded-xl text-violet-700 border border-violet-200 bg-violet-50 text-[13px] font-medium"
                            style={{ minHeight: 48 }}
                        >
                            <IconRefresh size={15} stroke={1.8} />
                            Ajouter une photo pour l&apos;analyse IA
                        </button>
                    )}

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
            )}
        </>
    );
}
