import { Button, Tooltip } from "@mantine/core";
import { IconCalendar, IconEye, IconEdit } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { formatDateShort } from "../../../utility/DateFormats";
import { REC_STATUS_CHIPS, recPriorityLabel, recStatusLabel } from "./auditLabels";

interface RecommendationData {
    id: number;
    title: string;
    auditTitle: string;
    department: string;
    deadline: string;
    status: string;
    progress: number;
    observation: string;
    actionManagerId: string;
    priority?: string;
}

const getUpdateRestriction = (status: string, progress: number, t: (key: string) => string) => {
    const normalizedStatus = String(status ?? '').toUpperCase();
    const normalizedProgress = Number(progress ?? 0);

    if (normalizedProgress >= 100) {
        return t('recommendations.restrictionProgress100');
    }

    if (normalizedStatus === 'PENDING') {
        return t('recommendations.restrictionPending');
    }

    if (normalizedStatus === 'COMPLETED') {
        return t('recommendations.restrictionCompleted');
    }

    if (normalizedStatus === 'CANCELLED') {
        return t('recommendations.restrictionCancelled');
    }

    return null;
};

const RecommendationCard = ({ data, onView, onUpdate }: {
    data: RecommendationData;
    onView: () => void;
    onUpdate: () => void;
}) => {
    const { t } = useTranslation('audits');
    // Libellé de statut bilingue : clé i18n `audits:recStatus.*`, repli sur le libellé FR centralisé.
    const tStatus = (code?: string | null): string =>
        code ? t(`recStatus.${String(code).toUpperCase()}`, { defaultValue: recStatusLabel(code) }) : '—';
    const statusChip = REC_STATUS_CHIPS[data.status?.toUpperCase()] || "bg-slate-50 text-slate-600 border-slate-200";
    const updateRestriction = getUpdateRestriction(data?.status, data?.progress, t);
    const updateTooltip = updateRestriction ?? t('recommendations.update');

    return (
        <div className="rounded-xl border border-slate-200 shadow-sm p-4 bg-white flex flex-col gap-3 transition-[box-shadow,border-color] duration-200 hover:shadow-md hover:border-slate-300">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-1 rounded-lg border ${statusChip}`}>
                    {tStatus(data.status)}
                </span>
                <span className="text-xs px-2 py-1 rounded-lg bg-orange-50 text-orange-800 border border-orange-200">
                    {data.progress}%
                </span>
                {data.priority && (
                    <span className="text-xs px-2 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
                        {t('recommendations.priority', { value: recPriorityLabel(data.priority) })}
                    </span>
                )}
            </div>

            {/* Titre */}
            <p className="text-[13px] text-slate-800">{data.title}</p>

            {data.observation && <p className="text-[12.5px] text-slate-600">{t('recommendations.finding', { value: data.observation })}</p>}
            {data.department && <p className="text-[12.5px] text-slate-600">{t('recommendations.department', { value: data.department })}</p>}

            {/* Échéance */}
            <div className="text-slate-600 text-[12.5px] flex items-center gap-1">
                <IconCalendar size={15} /> {t('recommendations.deadline', { date: formatDateShort(data.deadline) })}
            </div>

            {/* Actions */}
            <div className="flex justify-center grow gap-4">
                <Button size="xs" leftSection={<IconEye size={15} />} color="gray" variant="subtle" onClick={onView}>
                    {t('recommendations.view')}
                </Button>
                <Tooltip label={updateTooltip}>
                    <span className="inline-flex">
                        <Button
                            size="xs"
                            leftSection={<IconEdit size={15} />}
                            color="blue"
                            variant="subtle"
                            disabled={Boolean(updateRestriction)}
                            onClick={onUpdate}
                        >
                            {t('recommendations.update')}
                        </Button>
                    </span>
                </Tooltip>
            </div>
        </div>
    );
};

export default RecommendationCard;
