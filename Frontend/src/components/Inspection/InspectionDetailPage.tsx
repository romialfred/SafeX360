/**
 * InspectionDetailPage — Page detail + validation collegiale.
 *
 * Cible : superviseur HSE, membres de l'equipe d'approbation, manager.
 * Affichage non tactile prioritaire (desktop / tablette), responsive mobile.
 *
 * Fonctions :
 *   - Synthese executive (KPI, conformite globale)
 *   - Vue complete des constats (lecture seule par defaut)
 *   - Section "Decisions de l'equipe" avec votes deja exprimes
 *   - Boutons "J'approuve" / "Je rejette" si statut SUBMITTED
 *   - Bouton "Telecharger le rapport PDF" (FR ou EN)
 *   - Acces a la page d'execution si statut editable
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    IconArrowLeft,
    IconChevronRight,
    IconCheck,
    IconX,
    IconDownload,
    IconAlertOctagon,
    IconClipboardCheck,
    IconClipboardX,
    IconUsers,
    IconClockHour4,
} from '@tabler/icons-react';
import { Textarea } from '@mantine/core';

import {
    getInspection,
    decideInspection,
    type InspectionDetailDTO,
    type FindingConformity,
} from '../../services/InspectionService';
import { successNotification, errorNotification } from '../../utility/NotificationUtility';
import InspectionStatusBadge from './InspectionStatusBadge';
import axiosInstance from '../../interceptors/AxiosInterceptor';

const CONFORMITY_CLASS: Record<FindingConformity, string> = {
    CONFORM:         'text-emerald-700',
    WATCH:           'text-amber-700',
    NON_CONFORM:     'text-rose-700',
    NOT_APPLICABLE:  'text-slate-400',
};

export default function InspectionDetailPage() {
    const { t, i18n } = useTranslation('inspection');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [detail, setDetail] = useState<InspectionDetailDTO | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [rejectMode, setRejectMode] = useState(false);
    const [rejectComment, setRejectComment] = useState('');
    const [deciding, setDeciding] = useState(false);

    const reload = () => {
        if (!id) return;
        getInspection(Number(id))
            .then(setDetail)
            .catch(() => setError('Inspection introuvable'));
    };
    useEffect(reload, [id]);

    const decide = async (decision: 'APPROVE' | 'REJECT', comment?: string) => {
        if (!detail) return;
        setDeciding(true);
        try {
            await decideInspection(detail.id, { decision, comment });
            successNotification(
                decision === 'APPROVE'
                    ? 'Approbation enregistree'
                    : 'Rejet enregistre',
                '',
            );
            setRejectMode(false);
            setRejectComment('');
            reload();
        } catch (e: any) {
            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                'Echec de la decision';
            errorNotification(msg, '');
        } finally {
            setDeciding(false);
        }
    };

    const downloadPdf = async (lang: 'fr' | 'en') => {
        if (!detail) return;
        try {
            const res = await axiosInstance.get(
                `/hns/inspection/${detail.id}/report/pdf`,
                { params: { lang }, responseType: 'blob' },
            );
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inspection-${detail.id}-${lang}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e: any) {
            errorNotification('Telechargement impossible', '');
        }
    };

    if (error && !detail) {
        return (
            <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
                <div className="w-full">
                    <button
                        type="button"
                        onClick={() => navigate('/inspections')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 mb-3 text-[12.5px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                    >
                        <IconArrowLeft size={14} stroke={1.8} />
                        Retour
                    </button>
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[12.5px]">
                        <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                </div>
            </div>
        );
    }
    if (!detail) {
        return (
            <div className="min-h-full bg-[#FAF8F3] flex items-center justify-center">
                <div className="text-slate-500 text-[13px]">…</div>
            </div>
        );
    }

    const canDecide = detail.status === 'SUBMITTED';
    const canExecute =
        detail.status === 'SCHEDULED' ||
        detail.status === 'IN_PROGRESS' ||
        detail.status === 'REJECTED';

    const conformityRatio =
        detail.totalCheckpoints > 0
            ? Math.round(
                  ((detail.totalCheckpoints - detail.nonConformCount) /
                      detail.totalCheckpoints) *
                      100,
              )
            : 0;

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('registry.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        #{detail.id}
                    </span>
                </div>

                {/* Hero */}
                <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                        <h1
                            className="text-slate-900 leading-tight"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 600,
                                fontSize: 'clamp(18px, 1.8vw, 22px)',
                                letterSpacing: '-0.015em',
                            }}
                        >
                            {detail.templateName ?? `Inspection #${detail.id}`}
                        </h1>
                        <p className="text-[12.5px] text-slate-500 mt-1">
                            {detail.targetLabel}
                            {detail.siteName && <> · {detail.siteName}</>}
                            {detail.plannedDate && <> · {detail.plannedDate}</>}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <InspectionStatusBadge status={detail.status} size="md" />
                        {canExecute && (
                            <button
                                type="button"
                                onClick={() => navigate(`/inspections/execute/${detail.id}`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md bg-amber-700 text-white hover:bg-amber-800 transition font-medium"
                            >
                                Reprendre la saisie
                            </button>
                        )}
                    </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <KpiCell label="Points contrôlés" value={`${detail.findingsRecorded} / ${detail.totalCheckpoints}`} />
                    <KpiCell label="Conformité" value={`${conformityRatio}%`} tone={conformityRatio >= 80 ? 'ok' : conformityRatio >= 60 ? 'warn' : 'bad'} />
                    <KpiCell label="Non conformes" value={detail.nonConformCount} tone={detail.nonConformCount > 0 ? 'bad' : 'neutral'} />
                    <KpiCell label="Critiques NC" value={detail.criticalNonConformCount} tone={detail.criticalNonConformCount > 0 ? 'bad' : 'neutral'} />
                </div>

                {/* Validation equipe */}
                <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <IconUsers size={16} stroke={1.8} className="text-slate-600" />
                        <h2 className="text-[13.5px] font-semibold text-slate-800">
                            Décisions de l'équipe
                        </h2>
                    </div>
                    {detail.approvals.length === 0 ? (
                        <p className="text-[12.5px] text-slate-500 italic">
                            Aucune décision enregistrée pour l'instant.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {detail.approvals.map((a) => (
                                <li
                                    key={a.id}
                                    className="flex items-start gap-2 text-[12.5px]"
                                >
                                    {a.decision === 'APPROVE' ? (
                                        <IconClipboardCheck size={14} stroke={1.8} className="text-emerald-600 mt-0.5" />
                                    ) : (
                                        <IconClipboardX size={14} stroke={1.8} className="text-rose-600 mt-0.5" />
                                    )}
                                    <div className="min-w-0">
                                        <div className="text-slate-800">
                                            <b>
                                                {a.decision === 'APPROVE'
                                                    ? 'Approuvée'
                                                    : 'Rejetée'}
                                            </b>
                                            {' par '}
                                            {a.approverName ?? `#${a.approverId}`}
                                        </div>
                                        {a.decidedAt && (
                                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                                <IconClockHour4 size={11} stroke={1.8} />
                                                {new Date(a.decidedAt).toLocaleString(
                                                    i18n.language === 'fr' ? 'fr-FR' : 'en-GB',
                                                )}
                                            </div>
                                        )}
                                        {a.comment && (
                                            <div className="text-[12px] text-slate-600 mt-0.5 italic">
                                                « {a.comment} »
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Actions de decision */}
                    {canDecide && !rejectMode && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => decide('APPROVE')}
                                disabled={deciding}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] rounded-md bg-emerald-700 text-white hover:bg-emerald-800 transition font-medium disabled:opacity-50"
                            >
                                <IconCheck size={14} stroke={2.4} />
                                J'approuve
                            </button>
                            <button
                                type="button"
                                onClick={() => setRejectMode(true)}
                                disabled={deciding}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] rounded-md border border-rose-600 text-rose-700 bg-white hover:bg-rose-50 transition font-medium disabled:opacity-50"
                            >
                                <IconX size={14} stroke={2.4} />
                                Je rejette
                            </button>
                        </div>
                    )}
                    {canDecide && rejectMode && (
                        <div className="mt-3 space-y-2">
                            <Textarea
                                value={rejectComment}
                                onChange={(e) => setRejectComment(e.currentTarget.value)}
                                placeholder="Précisez la raison du rejet (obligatoire)"
                                minRows={2}
                                size="sm"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => decide('REJECT', rejectComment)}
                                    disabled={deciding || !rejectComment.trim()}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] rounded-md bg-rose-700 text-white hover:bg-rose-800 transition font-medium disabled:opacity-50"
                                >
                                    Confirmer le rejet
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setRejectMode(false); setRejectComment(''); }}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Synthese */}
                {detail.summaryReport && (
                    <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                        <h2 className="text-[13.5px] font-semibold text-slate-800 mb-2">
                            Synthèse de l'inspecteur
                        </h2>
                        <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {detail.summaryReport}
                        </p>
                    </div>
                )}

                {/* Liste des findings */}
                <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <h2 className="text-[13.5px] font-semibold text-slate-800">
                            Points de contrôle ({detail.findings.length})
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12.5px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-slate-600">
                                    <th className="text-left px-3 py-2 font-medium w-12">#</th>
                                    <th className="text-left px-3 py-2 font-medium">Point</th>
                                    <th className="text-left px-3 py-2 font-medium">Réponse</th>
                                    <th className="text-left px-3 py-2 font-medium">Conformité</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detail.findings.map((f, i) => (
                                    <tr key={f.id ?? i} className="border-b border-slate-100">
                                        <td className="px-3 py-2 text-slate-500 tabular-nums">{i + 1}</td>
                                        <td className="px-3 py-2 text-slate-800">
                                            <div className="font-medium">
                                                {f.checkpointLabel}
                                                {f.critical && (
                                                    <span className="ml-2 text-[10px] uppercase tracking-wider text-rose-700">
                                                        critique
                                                    </span>
                                                )}
                                            </div>
                                            {f.note && (
                                                <div className="text-[11.5px] text-slate-500 mt-0.5 italic">
                                                    « {f.note} »
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-slate-700">
                                            {f.rawValue ?? '—'}
                                            {f.unit && <span className="text-slate-400 ml-1">{f.unit}</span>}
                                        </td>
                                        <td className={`px-3 py-2 ${f.conformity ? CONFORMITY_CLASS[f.conformity] : 'text-slate-400'}`}>
                                            {f.conformity ? t(`conformity.${f.conformity}`) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => navigate('/inspections')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                    >
                        <IconArrowLeft size={14} stroke={1.8} />
                        Retour au registre
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => downloadPdf('fr')}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] rounded-md bg-slate-900 text-white hover:bg-slate-800 transition font-medium"
                        >
                            <IconDownload size={14} stroke={1.8} />
                            PDF (FR)
                        </button>
                        <button
                            type="button"
                            onClick={() => downloadPdf('en')}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                        >
                            <IconDownload size={14} stroke={1.8} />
                            PDF (EN)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCell({
    label,
    value,
    tone = 'neutral',
}: {
    label: string;
    value: string | number;
    tone?: 'neutral' | 'ok' | 'warn' | 'bad';
}) {
    const toneClasses = {
        neutral: 'bg-white border-slate-200 text-slate-900',
        ok: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        warn: 'bg-amber-50 border-amber-200 text-amber-800',
        bad: 'bg-rose-50 border-rose-200 text-rose-800',
    }[tone];
    return (
        <div className={`rounded-xl border shadow-sm p-3 ${toneClasses}`}>
            <div className="text-[11px] uppercase tracking-[0.1em] opacity-70">{label}</div>
            <div className="text-[22px] leading-none font-semibold tabular-nums mt-1.5">{value}</div>
        </div>
    );
}
