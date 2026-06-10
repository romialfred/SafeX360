/**
 * AIInspectAssistPanel — Panneau d'assistance IA pendant l'exécution d'une
 * inspection (LOT 50).
 *
 * Flux : l'inspecteur photographie une partie de la cible (caméra live ou
 * fichier), précise éventuellement la zone, lance l'analyse. L'IA confronte
 * la photo au référentiel de checkpoints et retourne des PROPOSITIONS que
 * l'inspecteur applique point par point (ou en bloc) dans le formulaire
 * d'exécution existant. Rien n'est écrit en base par l'IA : la sauvegarde
 * passe par le circuit habituel, sous la responsabilité de l'inspecteur.
 *
 * Le panneau peut être utilisé plusieurs fois (une photo par zone de la
 * cible) ; les checkpoints déjà appliqués restent marqués.
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    IconSparkles,
    IconCamera,
    IconUpload,
    IconAlertTriangle,
    IconCheck,
    IconChecks,
    IconRefresh,
    IconPhotoScan,
} from '@tabler/icons-react';

import {
    analyzeInspectionPhoto,
    getAIInspectionStatus,
    type AICheckpointProposal,
    type AIInspectionAnalysisResponse,
} from '../../services/AIInspectionService';
import { errorNotification } from '../../utility/NotificationUtility';
import CameraCaptureModal from '../LaggingIndicator/IncidentManagement/AIDeclaration/CameraCaptureModal';

interface AIInspectAssistPanelProps {
    inspectionId: number;
    targetLabel?: string;
    disabled: boolean;
    /** Applique une proposition dans le formulaire (pré-remplissage). */
    onApplyProposal: (proposal: AICheckpointProposal) => void;
    /** Insère la synthèse suggérée dans le champ synthèse. */
    onUseSummary: (summary: string) => void;
}

const CONFORMITY_CHIP: Record<string, string> = {
    CONFORM: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    WATCH: 'bg-amber-50 border-amber-200 text-amber-800',
    NON_CONFORM: 'bg-rose-50 border-rose-200 text-rose-800',
    NOT_APPLICABLE: 'bg-slate-50 border-slate-200 text-slate-500',
};

export default function AIInspectAssistPanel({
    inspectionId,
    targetLabel,
    disabled,
    onApplyProposal,
    onUseSummary,
}: AIInspectAssistPanelProps) {
    const { t, i18n } = useTranslation('inspection');
    const lang: 'fr' | 'en' = i18n.language === 'en' ? 'en' : 'fr';

    const [configured, setConfigured] = useState<boolean | null>(null);
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [zoneLabel, setZoneLabel] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AIInspectionAnalysisResponse | null>(null);
    const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
    const [summaryUsed, setSummaryUsed] = useState(false);
    const [cameraOpened, setCameraOpened] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getAIInspectionStatus()
            .then((s) => setConfigured(s.configured))
            .catch(() => setConfigured(false));
    }, []);

    const handleFile = (file: File) => {
        setPhoto(file);
        setResult(null);
        setSummaryUsed(false);
        const reader = new FileReader();
        reader.onload = () => setPhotoPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleAnalyze = async () => {
        if (!photo || analyzing) return;
        setAnalyzing(true);
        try {
            const res = await analyzeInspectionPhoto(inspectionId, photo, {
                zoneLabel: zoneLabel.trim() || undefined,
                language: lang,
            });
            setResult(res);
            setAppliedIds(new Set());
            setSummaryUsed(false);
        } catch (e: any) {
            const msg =
                e?.response?.data?.error ||
                e?.response?.data?.message ||
                t('ai.analyzeError');
            errorNotification(msg);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleApply = (p: AICheckpointProposal) => {
        onApplyProposal(p);
        setAppliedIds((prev) => new Set(prev).add(p.checkpointId));
    };

    const applicable = result
        ? result.proposals.filter((p) => p.observable && (p.proposedRawValue || p.proposedConformity))
        : [];

    const handleApplyAll = () => {
        applicable.forEach((p) => onApplyProposal(p));
        setAppliedIds(new Set(applicable.map((p) => p.checkpointId)));
    };

    const handleReset = () => {
        setPhoto(null);
        setPhotoPreview(null);
        setResult(null);
        setZoneLabel('');
        setSummaryUsed(false);
    };

    return (
        <div className="bg-white border border-indigo-200 rounded-xl shadow-sm overflow-hidden">
            {/* En-tête */}
            <div className="px-4 py-3 bg-indigo-50/60 border-b border-indigo-100 flex items-center gap-2">
                <IconSparkles size={16} className="text-indigo-700 flex-shrink-0" stroke={1.8} />
                <div className="min-w-0 flex-1">
                    <h3 className="text-[13.5px] font-semibold text-indigo-900 leading-tight">
                        {t('ai.panelTitle')}
                    </h3>
                    <p className="text-[11.5px] text-indigo-700/80 leading-snug">
                        {t('ai.panelSubtitle')}
                    </p>
                </div>
                {result && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-[11.5px] rounded-md border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 transition flex-shrink-0"
                    >
                        <IconRefresh size={12} stroke={1.8} />
                        {t('ai.newAnalysis')}
                    </button>
                )}
            </div>

            <div className="p-4 space-y-3">
                {/* Bandeau mode démo */}
                {configured === false && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
                        <IconAlertTriangle size={14} className="text-amber-700 flex-shrink-0 mt-0.5" stroke={1.8} />
                        <p className="text-[11.5px] text-amber-800 leading-relaxed">
                            {t('ai.demoBanner')}
                        </p>
                    </div>
                )}

                {/* Étape 1 : photo */}
                {!result && (
                    <>
                        {photoPreview ? (
                            <div className="relative rounded-lg overflow-hidden border border-slate-200">
                                <img
                                    src={photoPreview}
                                    alt={t('ai.photoAlt') as string}
                                    className="w-full max-h-64 object-cover"
                                />
                                {analyzing && (
                                    <div className="absolute inset-0 bg-indigo-950/50 flex flex-col items-center justify-center gap-2">
                                        <IconPhotoScan size={28} className="text-white animate-pulse" stroke={1.5} />
                                        <span className="text-white text-[12.5px] font-medium">
                                            {t('ai.analyzing')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => setCameraOpened(true)}
                                    className="inline-flex flex-col items-center justify-center gap-1.5 px-3 py-4 rounded-lg border-2 border-dashed border-indigo-300 text-indigo-700 bg-indigo-50/40 hover:bg-indigo-50 transition text-[12.5px] font-medium disabled:opacity-50"
                                    style={{ minHeight: 72 }}
                                >
                                    <IconCamera size={20} stroke={1.8} />
                                    {t('ai.takePhoto')}
                                </button>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex flex-col items-center justify-center gap-1.5 px-3 py-4 rounded-lg border-2 border-dashed border-slate-300 text-slate-600 bg-slate-50 hover:bg-slate-100 transition text-[12.5px] font-medium disabled:opacity-50"
                                    style={{ minHeight: 72 }}
                                >
                                    <IconUpload size={20} stroke={1.8} />
                                    {t('ai.uploadPhoto')}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleFile(f);
                                        e.target.value = '';
                                    }}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-[11.5px] text-slate-500 mb-1">
                                {t('ai.zoneLabel')}
                            </label>
                            <input
                                type="text"
                                value={zoneLabel}
                                onChange={(e) => setZoneLabel(e.target.value)}
                                disabled={disabled || analyzing}
                                placeholder={
                                    t('ai.zonePlaceholder', {
                                        target: targetLabel ?? t('ai.zoneTargetFallback'),
                                    }) as string
                                }
                                className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:bg-slate-50"
                            />
                        </div>

                        <button
                            type="button"
                            disabled={disabled || !photo || analyzing}
                            onClick={handleAnalyze}
                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] rounded-md bg-indigo-700 text-white hover:bg-indigo-800 transition font-medium shadow-sm disabled:opacity-50"
                            style={{ minHeight: 48 }}
                        >
                            <IconSparkles size={16} stroke={1.8} />
                            {analyzing ? t('ai.analyzing') : t('ai.analyzeButton')}
                        </button>
                    </>
                )}

                {/* Étape 2 : résultats */}
                {result && (
                    <div className="space-y-3">
                        {/* Métadonnées de traçabilité */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center text-[10.5px] px-1.5 py-0.5 rounded font-medium border bg-indigo-50 border-indigo-200 text-indigo-800">
                                {t('ai.confidenceChip', { pct: Math.round(result.confidence * 100) })}
                            </span>
                            {result.fromMock && (
                                <span className="inline-flex items-center text-[10.5px] px-1.5 py-0.5 rounded font-medium border bg-amber-50 border-amber-200 text-amber-800">
                                    {t('ai.demoChip')}
                                </span>
                            )}
                            <span className="inline-flex items-center text-[10.5px] px-1.5 py-0.5 rounded font-medium border bg-slate-50 border-slate-200 text-slate-600">
                                {result.aiModel}
                            </span>
                            <span className="inline-flex items-center text-[10.5px] px-1.5 py-0.5 rounded font-medium border bg-slate-50 border-slate-200 text-slate-600">
                                {(result.durationMs / 1000).toFixed(1)}s
                            </span>
                        </div>

                        {/* Photo hors sujet */}
                        {!result.relevant && (
                            <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 flex items-start gap-2">
                                <IconAlertTriangle size={14} className="text-rose-700 flex-shrink-0 mt-0.5" stroke={1.8} />
                                <p className="text-[12px] text-rose-800 leading-relaxed">
                                    {t('ai.irrelevant')}
                                    {result.irrelevanceReason ? ` ${result.irrelevanceReason}` : ''}
                                </p>
                            </div>
                        )}

                        {/* Observations globales */}
                        {result.overallObservations && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                                <h4 className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                                    {t('ai.observationsHeading')}
                                </h4>
                                <p className="text-[12.5px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {result.overallObservations}
                                </p>
                            </div>
                        )}

                        {/* Anomalies hors checkpoints */}
                        {result.detectedIssues.length > 0 && (
                            <div className="bg-amber-50/60 border border-amber-200 rounded-lg px-3 py-2.5">
                                <h4 className="text-[11px] uppercase tracking-wider text-amber-700 font-semibold mb-1">
                                    {t('ai.issuesHeading')}
                                </h4>
                                <ul className="space-y-1">
                                    {result.detectedIssues.map((issue, i) => (
                                        <li key={i} className="text-[12.5px] text-amber-900 leading-snug flex items-start gap-1.5">
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            <span>{issue}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Propositions par checkpoint */}
                        {applicable.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <h4 className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                                        {t('ai.proposalsHeading', { count: applicable.length })}
                                    </h4>
                                    <button
                                        type="button"
                                        disabled={disabled || appliedIds.size === applicable.length}
                                        onClick={handleApplyAll}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-[11.5px] rounded-md bg-indigo-700 text-white hover:bg-indigo-800 transition font-medium disabled:opacity-50"
                                    >
                                        <IconChecks size={12} stroke={2} />
                                        {t('ai.applyAll')}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {applicable.map((p) => {
                                        const applied = appliedIds.has(p.checkpointId);
                                        return (
                                            <div
                                                key={p.checkpointId}
                                                className={`rounded-lg border px-3 py-2.5 ${
                                                    applied
                                                        ? 'bg-emerald-50/50 border-emerald-200'
                                                        : 'bg-white border-slate-200'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-[12.5px] font-semibold text-slate-800">
                                                                {p.checkpointLabel}
                                                            </span>
                                                            {p.proposedConformity && (
                                                                <span
                                                                    className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                                                                        CONFORMITY_CHIP[p.proposedConformity] ?? CONFORMITY_CHIP.NOT_APPLICABLE
                                                                    }`}
                                                                >
                                                                    {t(`conformity.${p.proposedConformity}`)}
                                                                </span>
                                                            )}
                                                            {p.proposedRawValue && (
                                                                <span className="text-[11px] text-slate-500 font-mono">
                                                                    {p.proposedRawValue}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {p.observation && (
                                                            <p className="text-[11.5px] text-slate-600 mt-0.5 leading-snug">
                                                                {p.observation}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={disabled || applied}
                                                        onClick={() => handleApply(p)}
                                                        className={`inline-flex items-center gap-1 px-2 py-1.5 text-[11.5px] rounded-md border transition flex-shrink-0 font-medium ${
                                                            applied
                                                                ? 'border-emerald-300 text-emerald-700 bg-emerald-50 cursor-default'
                                                                : 'border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50'
                                                        } disabled:opacity-60`}
                                                    >
                                                        <IconCheck size={12} stroke={2} />
                                                        {applied ? t('ai.applied') : t('ai.apply')}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {applicable.length === 0 && result.relevant && (
                            <p className="text-[12.5px] text-slate-500 italic">
                                {t('ai.noProposals')}
                            </p>
                        )}

                        {/* Synthèse suggérée */}
                        {result.suggestedSummary && (
                            <div className="bg-indigo-50/40 border border-indigo-100 rounded-lg px-3 py-2.5">
                                <h4 className="text-[11px] uppercase tracking-wider text-indigo-700 font-semibold mb-1">
                                    {t('ai.summaryHeading')}
                                </h4>
                                <p className="text-[12.5px] text-slate-700 leading-relaxed whitespace-pre-wrap mb-2">
                                    {result.suggestedSummary}
                                </p>
                                <button
                                    type="button"
                                    disabled={disabled || summaryUsed}
                                    onClick={() => {
                                        onUseSummary(result.suggestedSummary as string);
                                        setSummaryUsed(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1.5 text-[11.5px] rounded-md border border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 transition font-medium disabled:opacity-60"
                                >
                                    <IconCheck size={12} stroke={2} />
                                    {summaryUsed ? t('ai.summaryUsed') : t('ai.useSummary')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Disclaimer permanent */}
                <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
                    {t('ai.disclaimer')}
                </p>
            </div>

            <CameraCaptureModal
                opened={cameraOpened}
                onClose={() => setCameraOpened(false)}
                onCapture={handleFile}
            />
        </div>
    );
}
