import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    IconBolt,
    IconCalendarDue,
    IconClock,
    IconHistory,
    IconPaperclip,
    IconUser,
} from "@tabler/icons-react";
import PageHeader from "../../UtilityComp/PageHeader";
import SafeHtml from "../../UtilityComp/SafeHtml";
import { getActionById } from "../../../services/CorrectiveActionService";
import { getAllActionProcessByActionId } from "../../../services/ActionProcessService";
import { handlePreview, getFriendlyFileType } from "../../../utility/DocumentUtility";
import { adhocStatusConfig, formatDateFr, progressBarClass } from "./adhocLabels";

/**
 * Fiche de consultation d'une suggestion d'amélioration : description,
 * pièces jointes et historique complet des mises à jour.
 */

const AdhocActionDetails = () => {
    const { id } = useParams();
    const [action, setAction] = useState<any>({});
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        getActionById(id)
            .then((res) => setAction(res))
            .catch(() => { });

        getAllActionProcessByActionId(id)
            .then((res) => setHistory(res))
            .catch(() => { });
    }, [id]);

    const cfg = adhocStatusConfig(action?.status);
    const progress = Number(action?.progress ?? 0);

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Actions Correctives' },
                    { label: "Suggestions d'amélioration", to: '/adhoc-actions' },
                    { label: 'Détail de la suggestion' },
                ]}
                icon={<IconBolt size={22} stroke={2} />}
                iconColor="orange"
                title="Détail de la suggestion"
                subtitle="Fiche complète, pièces jointes et historique des mises à jour"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                {/* ─── Fiche de la suggestion ─────────────────────────────── */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2
                                className="text-slate-800 leading-snug"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                {action?.actionName || '—'}
                            </h2>
                            <div className="mt-2 flex flex-wrap gap-2 items-center">
                                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                                    {cfg.label}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[12px] text-slate-600">
                                    <IconUser size={13} className="text-slate-400" aria-hidden="true" />
                                    {action?.assignedEmployeeName || '—'}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[12px] text-slate-600">
                                    <IconCalendarDue size={13} className="text-slate-400" aria-hidden="true" />
                                    Échéance : {action?.deadline ? formatDateFr(action.deadline) : '—'}
                                </span>
                            </div>
                        </div>
                        <div className="w-28 flex-shrink-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] text-slate-500">Progression</span>
                                <span className="text-[11px] text-slate-800 tabular-nums">{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                                <div className={`h-full rounded-full ${progressBarClass(progress)}`} style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </div>

                    {action?.description && (
                        <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
                            <p className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1">Description</p>
                            <SafeHtml html={action.description} className="text-slate-700 text-[12.5px]" />
                        </div>
                    )}

                    {Array.isArray(action?.docs) && action.docs.length > 0 && (
                        <div className="rounded-md border border-slate-200 p-3">
                            <p className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-2">Pièces jointes</p>
                            <div className="flex flex-wrap gap-2">
                                {action.docs.map((doc: any, idx: number) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handlePreview(doc)}
                                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11.5px] text-slate-700 hover:border-teal-300 hover:text-teal-700"
                                        aria-label={`Ouvrir la pièce jointe ${doc?.name}`}
                                    >
                                        <IconPaperclip size={12} aria-hidden="true" />
                                        {doc?.name} ({getFriendlyFileType(doc?.type)})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Historique des mises à jour ─────────────────────────── */}
                <aside className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <span className="inline-flex p-1.5 rounded-md bg-orange-50 text-orange-700">
                            <IconHistory size={15} stroke={1.8} />
                        </span>
                        <h3
                            className="text-slate-800"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontSize: '14px',
                                fontWeight: 600,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Historique des mises à jour
                        </h3>
                    </div>

                    {history.length === 0 && (
                        <p className="text-[12.5px] text-slate-500">Aucune mise à jour enregistrée pour le moment.</p>
                    )}

                    {history.slice().reverse().map((x: any, index: number, arr: any[]) => {
                        const previousProgress = index < arr.length - 1 ? arr[index + 1].progress : 0;
                        const progressMade = (x.progress ?? 0) - (previousProgress ?? 0);
                        const stepCfg = adhocStatusConfig(x?.status);

                        return (
                            <div key={index} className="rounded-lg border border-slate-200 p-3">
                                <div className="flex justify-between items-center gap-2">
                                    <p className="text-[11.5px] text-slate-500 flex gap-1 items-center">
                                        <IconClock size={12} aria-hidden="true" /> {x?.createdAt ? formatDateFr(x.createdAt) : '—'}
                                    </p>
                                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${stepCfg.chip}`}>
                                        {stepCfg.label}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={x.progress ?? 0} aria-valuemin={0} aria-valuemax={100}>
                                        <div className={`h-full rounded-full ${progressBarClass(x.progress ?? 0)}`} style={{ width: `${x.progress ?? 0}%` }} />
                                    </div>
                                    <span className="text-[11.5px] text-slate-600 tabular-nums">
                                        {previousProgress}% {progressMade > 0 ? `→ ${x.progress}%` : ''}
                                    </span>
                                </div>

                                <div className="mt-2">
                                    <SafeHtml html={x?.description || '—'} className="text-slate-600 text-[12px]" />
                                </div>

                                {Array.isArray(x?.docs) && x.docs.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {x.docs.map((doc: any, i: number) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handlePreview(doc)}
                                                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-700 hover:border-teal-300 hover:text-teal-700"
                                                aria-label={`Ouvrir la pièce jointe ${doc?.name}`}
                                            >
                                                <IconPaperclip size={11} aria-hidden="true" />
                                                {doc.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </aside>
            </div>
        </div>
    );
};

export default AdhocActionDetails;
