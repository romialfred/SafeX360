import { useState } from 'react';
import { Badge, Button } from '@mantine/core';
import {
    IconAlertTriangle,
    IconArrowRight,
    IconCircleCheck,
    IconClockHour4,
    IconFileCheck,
    IconFileX,
    IconHourglassHigh,
    IconInbox,
    IconMail,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { ActionItem, notifyActionItem } from '../../../services/ComplianceDashboardService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import EmptyState from '../../UtilityComp/EmptyState';
import { formatDateFr, translateStatusDetail } from '../complianceLabels';

/**
 * ActionItemList — liste unifiée des actions de conformité (LOT 49).
 *
 * Remplace les 4 anciens panneaux quasi identiques (ExpiredContent,
 * UpcomingExpiry, MissingFile, Pending) par un seul composant tonal :
 * lignes compactes, accent latéral charte R7, rappel e-mail par ligne.
 */

export type ActionTone = 'expired' | 'upcoming' | 'missing' | 'pending';

interface ToneConfig {
    icon: typeof IconAlertTriangle;
    iconChip: string;
    accent: string;
    badgeColor: string;
    dateLabel: string;
    canNotify: boolean;
    emptyIcon: typeof IconCircleCheck;
    emptyIconColor: 'emerald' | 'amber' | 'slate' | 'indigo';
    emptyTitle: string;
    emptyDescription: string;
}

const TONES: Record<ActionTone, ToneConfig> = {
    expired: {
        icon: IconAlertTriangle,
        iconChip: 'bg-rose-50 text-rose-600',
        accent: 'border-l-rose-400',
        badgeColor: 'red',
        dateLabel: 'Expiré le',
        canNotify: true,
        emptyIcon: IconCircleCheck,
        emptyIconColor: 'emerald',
        emptyTitle: 'Aucune exigence expirée',
        emptyDescription: 'Tous les justificatifs déposés sont encore valides.',
    },
    upcoming: {
        icon: IconClockHour4,
        iconChip: 'bg-amber-50 text-amber-600',
        accent: 'border-l-amber-400',
        badgeColor: 'orange',
        dateLabel: 'Échéance le',
        canNotify: true,
        emptyIcon: IconCircleCheck,
        emptyIconColor: 'amber',
        emptyTitle: 'Aucune échéance sous 30 jours',
        emptyDescription: 'Aucun renouvellement à anticiper pour le moment.',
    },
    missing: {
        icon: IconFileX,
        iconChip: 'bg-slate-100 text-slate-600',
        accent: 'border-l-slate-400',
        badgeColor: 'gray',
        dateLabel: 'Attendu depuis le',
        canNotify: true,
        emptyIcon: IconFileCheck,
        emptyIconColor: 'slate',
        emptyTitle: 'Aucun document manquant',
        emptyDescription: 'Toutes les pièces justificatives requises sont déposées.',
    },
    pending: {
        icon: IconHourglassHigh,
        iconChip: 'bg-violet-50 text-violet-600',
        accent: 'border-l-violet-400',
        badgeColor: 'violet',
        dateLabel: 'Échéance le',
        canNotify: false,
        emptyIcon: IconInbox,
        emptyIconColor: 'indigo',
        emptyTitle: 'Aucune validation en attente',
        emptyDescription: 'Les documents soumis par les employés apparaîtront ici.',
    },
};

interface ActionItemListProps {
    items: ActionItem[];
    tone: ActionTone;
    /** Lien "Tout traiter" affiché en pied de liste (ex : /document-validation). */
    seeAllHref?: string;
    seeAllLabel?: string;
}

const ActionItemList = ({ items, tone, seeAllHref, seeAllLabel = 'Tout traiter' }: ActionItemListProps) => {
    const cfg = TONES[tone];
    const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());

    const extractRequirementId = (item: ActionItem) => {
        const rawId = (item as any)?.requirementId ?? item.id;
        if (!rawId) return null;
        const parts = String(rawId).split('-');
        return parts[0] || null;
    };

    const handleNotify = async (item: ActionItem) => {
        const requirementId = extractRequirementId(item);
        if (!item.employee?.id || !requirementId) return;
        const key = `${item.employee.id}-${requirementId}`;
        setSendingIds((prev) => new Set(prev).add(key));
        try {
            await notifyActionItem({ employeeId: item.employee.id, requirementId });
            successNotification(`Rappel envoyé à ${item.employee.name}`);
        } catch (error: any) {
            console.error('Échec de l’envoi du rappel', error);
            errorNotification(error?.response?.data?.errorMessage || "Le rappel n'a pas pu être envoyé");
        } finally {
            setSendingIds((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    };

    if (!items.length) {
        const EmptyIcon = cfg.emptyIcon;
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40">
                <EmptyState
                    icon={<EmptyIcon size={24} />}
                    title={cfg.emptyTitle}
                    description={cfg.emptyDescription}
                    iconColor={cfg.emptyIconColor}
                    compact
                />
            </div>
        );
    }

    const ToneIcon = cfg.icon;

    return (
        <div className="flex flex-col gap-2">
            {items.map((item) => {
                const date = item.expiredOn ?? item.dueOn;
                const sendKey = `${item.employee?.id}-${extractRequirementId(item)}`;
                return (
                    <div
                        key={item.id}
                        className={`bg-white rounded-lg border border-slate-200 border-l-[3px] ${cfg.accent} px-3 py-2.5`}
                    >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                                <span className={`mt-0.5 inline-flex p-1.5 rounded-md ${cfg.iconChip} flex-shrink-0`}>
                                    <ToneIcon size={14} stroke={1.8} aria-hidden="true" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[13px] text-slate-800 leading-snug">{item.requirementTitle}</p>
                                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                                        {item.employee?.name}
                                        {item.employee?.role ? ` · ${item.employee.role}` : ''}
                                        {item.employee?.department ? ` · ${item.employee.department}` : ''}
                                    </p>
                                    {item.description && (
                                        <p className="text-[11.5px] text-slate-400 mt-0.5 safex-truncate-2">{item.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="text-right">
                                    <Badge color={cfg.badgeColor} variant="light" size="sm" radius="sm">
                                        {translateStatusDetail(item.statusDetail) || ACTION_FALLBACK[tone]}
                                    </Badge>
                                    {date && (
                                        <p className="text-[10.5px] text-slate-400 mt-1">
                                            {cfg.dateLabel} {formatDateFr(date)}
                                        </p>
                                    )}
                                </div>
                                {cfg.canNotify && (
                                    <Button
                                        variant="default"
                                        size="compact-xs"
                                        leftSection={<IconMail size={12} />}
                                        loading={sendingIds.has(sendKey)}
                                        onClick={() => handleNotify(item)}
                                    >
                                        Rappel
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {seeAllHref && (
                <div className="flex justify-end pt-1">
                    <Button
                        component={Link}
                        to={seeAllHref}
                        variant="subtle"
                        color="teal"
                        size="compact-sm"
                        rightSection={<IconArrowRight size={14} />}
                    >
                        {seeAllLabel}
                    </Button>
                </div>
            )}
        </div>
    );
};

const ACTION_FALLBACK: Record<ActionTone, string> = {
    expired: 'Expiré',
    upcoming: 'Expire bientôt',
    missing: 'Manquant',
    pending: 'En attente',
};

export default ActionItemList;
