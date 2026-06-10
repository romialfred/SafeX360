/**
 * AIReportReviewPanel — Relecture critique du rapport d'inspection par l'IA
 * (LOT 50).
 *
 * Purement consultatif : l'IA évalue la qualité du rapport (complétude,
 * cohérence, couverture des risques) et propose des améliorations, des
 * actions correctives et une synthèse retravaillée. Aucune écriture en
 * base — l'équipe de validation reste seule décisionnaire (ISO 45001 §10.3).
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    IconSparkles,
    IconAlertTriangle,
    IconThumbUp,
    IconSearch,
    IconShieldExclamation,
    IconBulb,
    IconListCheck,
    IconRefresh,
} from '@tabler/icons-react';

import {
    getAIInspectionStatus,
    reviewInspectionReport,
    type AIInspectionReviewResponse,
} from '../../services/AIInspectionService';
import { errorNotification } from '../../utility/NotificationUtility';

const PRIORITY_CHIP: Record<string, string> = {
    P0: 'bg-rose-50 border-rose-200 text-rose-800',
    P1: 'bg-orange-50 border-orange-200 text-orange-800',
    P2: 'bg-amber-50 border-amber-200 text-amber-800',
    P3: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function AIReportReviewPanel({ inspectionId }: { inspectionId: number }) {
    const { t, i18n } = useTranslation('inspection');
    const lang: 'fr' | 'en' = i18n.language === 'en' ? 'en' : 'fr';

    const [configured, setConfigured] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [review, setReview] = useState<AIInspectionReviewResponse | null>(null);

    useEffect(() => {
        getAIInspectionStatus()
            .then((s) => setConfigured(s.configured))
            .catch(() => setConfigured(false));
    }, []);

    const handleReview = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await reviewInspectionReport(inspectionId, lang);
            setReview(res);
        } catch (e: any) {
            const msg =
                e?.response?.data?.error ||
                e?.response?.data?.message ||
                t('ai.reviewError');
            errorNotification(msg);
        } finally {
            setLoading(false);
        }
    };

    const scoreTone = (score: number) =>
        score >= 80
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : score >= 50
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-rose-50 border-rose-200 text-rose-800';

    return (
        <div className="mb-4 bg-white border border-indigo-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-indigo-50/60 border-b border-indigo-100 flex items-center gap-2 flex-wrap">
                <IconSparkles size={16} className="text-indigo-700 flex-shrink-0" stroke={1.8} />
                <div className="min-w-0 flex-1">
                    <h2 className="text-[13.5px] font-semibold text-indigo-900 leading-tight">
                        {t('ai.reviewTitle')}
                    </h2>
                    <p className="text-[11.5px] text-indigo-700/80 leading-snug">
                        {t('ai.reviewSubtitle')}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleReview}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md bg-indigo-700 text-white hover:bg-indigo-800 transition font-medium shadow-sm disabled:opacity-50 flex-shrink-0"
                >
                    {review ? <IconRefresh size={13} stroke={1.8} /> : <IconSparkles size={13} stroke={1.8} />}
                    {loading
                        ? t('ai.reviewLoading')
                        : review
                        ? t('ai.reviewAgain')
                        : t('ai.reviewButton')}
                </button>
            </div>

            <div className="p-4 space-y-3">
                {configured === false && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
                        <IconAlertTriangle size={14} className="text-amber-700 flex-shrink-0 mt-0.5" stroke={1.8} />
                        <p className="text-[11.5px] text-amber-800 leading-relaxed">
                            {t('ai.demoBanner')}
                        </p>
                    </div>
                )}

                {!review && !loading && (
                    <p className="text-[12.5px] text-slate-500">
                        {t('ai.reviewIdle')}
                    </p>
                )}

                {loading && (
                    <div className="flex items-center gap-2 text-[12.5px] text-indigo-700 py-2">
                        <IconSearch size={16} className="animate-pulse" stroke={1.8} />
                        {t('ai.reviewLoadingHint')}
                    </div>
                )}

                {review && (
                    <div className="space-y-3">
                        {/* Score + verdict + traçabilité */}
                        <div className="flex items-start gap-3 flex-wrap">
                            <div className={`rounded-xl border px-4 py-3 text-center ${scoreTone(review.qualityScore)}`}>
                                <div className="text-[26px] leading-none font-semibold tabular-nums">
                                    {review.qualityScore}
                                </div>
                                <div className="text-[10px] uppercase tracking-[0.1em] opacity-70 mt-1">
                                    {t('ai.qualityScore')}
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                {review.verdict && (
                                    <p className="text-[13px] text-slate-800 leading-relaxed">
                                        {review.verdict}
                                    </p>
                                )}
                                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                    {review.fromMock && (
                                        <span className="inline-flex items-center text-[10.5px] px-1.5 py-0.5 rounded font-medium border bg-amber-50 border-amber-200 text-amber-800">
                                            {t('ai.demoChip')}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center text-[10.5px] px-1.5 py-0.5 rounded font-medium border bg-slate-50 border-slate-200 text-slate-600">
                                        {review.aiModel}
                                    </span>
                                    <span className="inline-flex items-center text-[10.5px] px-1.5 py-0.5 rounded font-medium border bg-slate-50 border-slate-200 text-slate-600">
                                        {(review.durationMs / 1000).toFixed(1)}s
                                    </span>
                                    {review.isoClauses.map((c) => (
                                        <span
                                            key={c}
                                            className="inline-flex items-center text-[10.5px] px-1.5 py-0.5 rounded font-medium border bg-indigo-50 border-indigo-200 text-indigo-800"
                                        >
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                            <ReviewList
                                icon={<IconThumbUp size={13} stroke={1.8} />}
                                title={t('ai.strengthsHeading')}
                                items={review.strengths}
                                tone="bg-emerald-50/50 border-emerald-100 text-emerald-900"
                                bullet="text-emerald-500"
                            />
                            <ReviewList
                                icon={<IconSearch size={13} stroke={1.8} />}
                                title={t('ai.gapsHeading')}
                                items={review.gaps}
                                tone="bg-amber-50/50 border-amber-100 text-amber-900"
                                bullet="text-amber-500"
                            />
                            <ReviewList
                                icon={<IconShieldExclamation size={13} stroke={1.8} />}
                                title={t('ai.risksHeading')}
                                items={review.underCoveredRisks}
                                tone="bg-rose-50/50 border-rose-100 text-rose-900"
                                bullet="text-rose-500"
                            />
                            <ReviewList
                                icon={<IconBulb size={13} stroke={1.8} />}
                                title={t('ai.improvementsHeading')}
                                items={review.improvements}
                                tone="bg-indigo-50/40 border-indigo-100 text-indigo-900"
                                bullet="text-indigo-500"
                            />
                        </div>

                        {/* Actions recommandées */}
                        {review.recommendedActions.length > 0 && (
                            <div className="rounded-lg border border-slate-200 overflow-hidden">
                                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5">
                                    <IconListCheck size={13} stroke={1.8} className="text-slate-600" />
                                    <h3 className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">
                                        {t('ai.actionsHeading')}
                                    </h3>
                                </div>
                                <ul className="divide-y divide-slate-100">
                                    {review.recommendedActions.map((a, i) => (
                                        <li key={i} className="px-3 py-2 flex items-start gap-2 text-[12.5px]">
                                            <span
                                                className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-semibold border flex-shrink-0 mt-0.5 ${
                                                    PRIORITY_CHIP[a.priority] ?? PRIORITY_CHIP.P2
                                                }`}
                                            >
                                                {a.priority}
                                            </span>
                                            <span className="text-slate-700 leading-snug flex-1">
                                                {a.action}
                                            </span>
                                            <span className="text-[11px] text-slate-500 flex-shrink-0">
                                                {a.deadline}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Synthèse améliorée */}
                        {review.improvedSummary && (
                            <div className="bg-indigo-50/40 border border-indigo-100 rounded-lg px-3 py-2.5">
                                <h3 className="text-[11px] uppercase tracking-wider text-indigo-700 font-semibold mb-1">
                                    {t('ai.improvedSummaryHeading')}
                                </h3>
                                <p className="text-[12.5px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {review.improvedSummary}
                                </p>
                            </div>
                        )}

                        <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
                            {t('ai.reviewDisclaimer')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ReviewList({
    icon,
    title,
    items,
    tone,
    bullet,
}: {
    icon: React.ReactNode;
    title: string;
    items: string[];
    tone: string;
    bullet: string;
}) {
    if (items.length === 0) return null;
    return (
        <div className={`rounded-lg border px-3 py-2.5 ${tone}`}>
            <h3 className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1.5 opacity-80">
                {icon}
                {title}
            </h3>
            <ul className="space-y-1">
                {items.map((item, i) => (
                    <li key={i} className="text-[12.5px] leading-snug flex items-start gap-1.5">
                        <span className={`mt-0.5 ${bullet}`}>•</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
