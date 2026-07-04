import { DonutChart } from "@mantine/charts";
import { IconChevronLeft, IconChevronRight, IconChartPie, IconAlertTriangle, IconBulb, IconCircleCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { getAllAudit, getPendingRecommendations } from "../../../../services/AuditService";
import { formatDateShort } from "../../../../utility/DateFormats";
import { Link } from "react-router-dom";
import EmptyState from "../../../UtilityComp/EmptyState";

type DonutItem = { name: string; value: number; color: string };

const normalizeStatus = (raw: any): string => {
    if (raw === null || raw === undefined) return '';
    if (typeof raw === 'number') {
        const map = ['PLANNING', 'PREPARATION', 'EXECUTION', 'CLOSED', 'CANCELLED'];
        return map[raw] || '';
    }
    return String(raw).toUpperCase();
};

const priorityLabels: Record<string, string> = {
    HIGH: 'Élevée',
    MEDIUM: 'Moyenne',
    LOW: 'Faible',
    AVERAGE: 'Moyenne',
    high: 'Élevée',
    medium: 'Moyenne',
    low: 'Faible',
};

const priorityBadgeClass = (priority: string) => {
    const p = String(priority || '').toUpperCase();
    if (p === 'HIGH') return 'bg-red-50 text-red-700 border-red-200';
    if (p === 'MEDIUM' || p === 'AVERAGE') return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-yellow-50 text-yellow-800 border-yellow-200';
};

const AuditDashPlanned = () => {
    const [startIndex, setStartIndex] = useState(0);
    const itemsPerPage = 2;
    const [totalAudits, setTotalAudits] = useState<number>(0);
    const [pendingRecs, setPendingRecs] = useState<any[]>([]);
    // Palette charte R7 : cyan=planifié, violet=préparation, amber=exécution,
    // emerald=clôturé, slate=annulé.
    const [complianceData, setComplianceData] = useState<DonutItem[]>([
        { name: 'Planification', value: 0, color: '#0891B2' },
        { name: 'Préparation', value: 0, color: '#7C3AED' },
        { name: 'Exécution', value: 0, color: '#D97706' },
        { name: 'Clôturés', value: 0, color: '#059669' },
        { name: 'Annulés', value: 0, color: '#64748B' },
    ]);

    useEffect(() => {
        getAllAudit()
            .then((audits: any[]) => {
                const total = audits?.length || 0;
                const counts = { PLANNING: 0, PREPARATION: 0, EXECUTION: 0, CLOSED: 0, CANCELLED: 0 } as Record<string, number>;
                (audits || []).forEach((a: any) => {
                    const key = normalizeStatus(a?.status);
                    if (counts[key] !== undefined) counts[key] += 1;
                });
                setTotalAudits(total);
                setComplianceData([
                    { name: 'Planification', value: counts.PLANNING, color: '#0891B2' },
                    { name: 'Préparation', value: counts.PREPARATION, color: '#7C3AED' },
                    { name: 'Exécution', value: counts.EXECUTION, color: '#D97706' },
                    { name: 'Clôturés', value: counts.CLOSED, color: '#059669' },
                    { name: 'Annulés', value: counts.CANCELLED, color: '#64748B' },
                ]);
            })
            .catch((e) => console.error("Failed to load audit stats", e));

        getPendingRecommendations()
            .then((res) => setPendingRecs(res || []))
            .catch(() => setPendingRecs([]));
    }, []);

    const handlePrev = () => {
        if (startIndex > 0) setStartIndex(startIndex - itemsPerPage);
    };
    const handleNext = () => {
        if (startIndex + itemsPerPage < pendingRecs.length) setStartIndex(startIndex + itemsPerPage);
    };

    const visiblePending = pendingRecs.slice(startIndex, startIndex + itemsPerPage);
    const hasData = totalAudits > 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* === Carte 1 : Répartition par statut === */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-indigo-50/60 border-b border-indigo-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-indigo-100">
                        <IconChartPie size={14} className="text-indigo-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                        Répartition des audits par statut
                    </h2>
                    <span className="ml-auto text-[11px] text-slate-500">{totalAudits} audits</span>
                </header>

                <div className="p-4">
                    {hasData ? (
                        <>
                            <div className="flex justify-center mb-4">
                                <DonutChart
                                    h={220}
                                    data={complianceData.filter(d => d.value > 0)}
                                    size={220}
                                    thickness={32}
                                    chartLabel={`${totalAudits}`}
                                    withLabelsLine={false}
                                    paddingAngle={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                                {complianceData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: item.color }}
                                            ></span>
                                            <span className="text-slate-600">{item.name}</span>
                                        </div>
                                        <span className="text-slate-800 tabular-nums">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        /* LOT 41 E: EmptyState unifié pour le donut audit */
                        <EmptyState
                            icon={<IconAlertTriangle size={28} />}
                            title="Aucun audit enregistré"
                            description="Les audits planifiés s'afficheront ici une fois créés."
                            iconColor="slate"
                            compact
                        />
                    )}
                </div>
            </div>

            {/* === Carte 2 : Recommandations en attente === */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
                <header className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-amber-100">
                        <IconBulb size={14} className="text-amber-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                        Recommandations en attente
                    </h2>
                    <span className="ml-auto text-[11px] text-slate-500">{pendingRecs.length} ouvertes</span>
                    {pendingRecs.length > itemsPerPage && (
                        <div className="flex items-center gap-1 ml-2">
                            <button
                                onClick={handlePrev}
                                disabled={startIndex === 0}
                                className="p-1 hover:bg-amber-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Précédent"
                            >
                                <IconChevronLeft size={14} className="text-slate-600" />
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={startIndex + itemsPerPage >= pendingRecs.length}
                                className="p-1 hover:bg-amber-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Suivant"
                            >
                                <IconChevronRight size={14} className="text-slate-600" />
                            </button>
                        </div>
                    )}
                </header>

                <div className="p-3 flex-1 flex flex-col gap-2">
                    {visiblePending.map((rec, index) => {
                        const auditId = rec.auditId || rec.audit?.id;
                        const recommendationLink = auditId ? `/audit-management/details/${auditId}?tab=recommendation` : undefined;

                        return (
                            <div
                                key={index}
                                className="border border-slate-200 rounded-md p-3 bg-slate-50/40 hover:bg-white hover:shadow-sm transition-[background-color,box-shadow]"
                            >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <h3 className="text-sm text-slate-900 leading-tight flex-1 line-clamp-2">
                                        {rec.title || '—'}
                                    </h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priorityBadgeClass(rec.priority)} whitespace-nowrap`}>
                                        {priorityLabels[String(rec.priority || '').toUpperCase()] || priorityLabels[rec.priority] || rec.priority || '—'}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-600 line-clamp-1 mb-2">
                                    <span className="text-slate-400">Audit :</span> {rec.auditTitle || '—'}
                                </p>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                                    <span className="text-[10px] text-slate-500">
                                        <span className="font-medium">Échéance :</span>{' '}
                                        {rec?.deadline ? formatDateShort(rec.deadline) : '—'}
                                    </span>
                                    {recommendationLink && (
                                        <Link
                                            to={recommendationLink}
                                            className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded hover:bg-indigo-100 transition-colors"
                                        >
                                            Détails →
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {/* LOT 41 E: EmptyState unifié pour la liste des recommandations */}
                    {pendingRecs.length === 0 && (
                        <EmptyState
                            icon={<IconCircleCheck size={28} />}
                            title="Aucune recommandation en attente"
                            description="Toutes les recommandations d'audit sont traitées."
                            iconColor="emerald"
                            compact
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditDashPlanned;
