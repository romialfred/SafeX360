import { ReactNode } from 'react';
import { Badge, Button } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
    CATEGORY_COLORS,
    categoryLabel,
    commStatusConfig,
    formatDateFr,
    scheduleTypeLabel,
    typeLabel,
    urgencyConfig,
    isUrgentValue,
} from '../communicationLabels';

/**
 * Carte d'une communication HSE (vue « cartes » du registre).
 * Reprend la même palette de statuts que la vue tableau (charte R7).
 */

interface CommunicationCardProps {
    communication: any;
    departmentName: string;
    onViewDetails: () => void;
    actions?: ReactNode;
}

const CommunicationCard = ({ communication, departmentName, onViewDetails, actions }: CommunicationCardProps) => {
    const { t } = useTranslation('communications');
    // Libellés bilingues : clés i18n `communications:*`, repli sur les libellés FR centralisés.
    const tType = (code?: string | null) => t(`type.${code ?? ''}`, { defaultValue: typeLabel(code) });
    const tCategory = (code?: string | null) => t(`category.${code ?? ''}`, { defaultValue: categoryLabel(code) });
    const tScheduleType = (code?: string | null) =>
        t(`scheduleType.${(code ?? '').toUpperCase()}`, { defaultValue: scheduleTypeLabel(code) });
    const tCommStatus = (status?: string | null) =>
        t(`commStatus.${(status ?? '').toUpperCase()}`, { defaultValue: commStatusConfig(status).label });
    const tUrgency = (urgency?: string | null) =>
        t(`urgency.${(urgency ?? '').toUpperCase()}`, { defaultValue: urgencyConfig(urgency).label });

    const statusCfg = commStatusConfig(communication?.status);
    const urgencyCfg = urgencyConfig(communication?.urgency);
    const departmentLabel = departmentName && departmentName !== '—' ? departmentName : null;
    const recipientsCount = communication?.recipientCount;
    const actionsContent = Array.isArray(actions) ? actions : actions ? [actions] : [];

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
                {communication?.category && (
                    <Badge
                        color={CATEGORY_COLORS[communication.category] ?? 'gray'}
                        variant="light"
                        size="sm"
                        radius="sm"
                    >
                        {tCategory(communication.category)}
                    </Badge>
                )}
                {isUrgentValue(communication?.urgency) && (
                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${urgencyCfg.chip}`}>
                        {tUrgency(communication?.urgency)}
                    </span>
                )}
                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                    {tCommStatus(communication?.status)}
                </span>
            </div>

            <div className="min-w-0">
                <p className="text-[13.5px] text-slate-800 leading-snug">{communication?.title}</p>
                <p className="text-[11.5px] text-slate-500 mt-0.5">{tType(communication?.type)}</p>
            </div>

            <dl className="grid grid-cols-1 gap-1 text-[12px]">
                {departmentLabel && (
                    <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">{t('card.department')}</dt>
                        <dd className="text-slate-700 text-right">{departmentLabel}</dd>
                    </div>
                )}
                {typeof recipientsCount === 'number' && (
                    <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">{t('card.recipients')}</dt>
                        <dd className="text-slate-700 tabular-nums">{recipientsCount}</dd>
                    </div>
                )}
                {communication?.scheduleType && (
                    <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">{t('card.schedule')}</dt>
                        <dd className="text-slate-700 text-right">{tScheduleType(communication.scheduleType)}</dd>
                    </div>
                )}
                {communication?.nextRunAt && (
                    <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">{t('card.nextRun')}</dt>
                        <dd className="text-slate-700 text-right">{formatDateFr(communication.nextRunAt)}</dd>
                    </div>
                )}
                {communication?.expiresAt && (
                    <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">{t('card.deadline')}</dt>
                        <dd className="text-slate-700 text-right">{formatDateFr(communication.expiresAt)}</dd>
                    </div>
                )}
            </dl>

            <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-slate-100">
                <div className="flex gap-1.5">{actionsContent}</div>
                <Button
                    size="xs"
                    variant="light"
                    color="teal"
                    leftSection={<IconEye size={14} />}
                    onClick={onViewDetails}
                >
                    {t('card.viewDetails')}
                </Button>
            </div>
        </div>
    );
};

export default CommunicationCard;
