import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '@mantine/core';
import { IconClock, IconUser, IconPencil, IconCheck, IconArchive, IconCircle } from '@tabler/icons-react';
import {
    getAssemblyPointHistory,
    type AssemblyPointDTO,
    type AssemblyPointHistoryDTO,
} from '../../../services/EmergencyService';

/**
 * Drawer d'historique des modifications d'un Point de rassemblement (LOT 48 Phase 2).
 *
 * <p>Timeline verticale chronologique inversée (plus récent en haut) avec :</p>
 * <ul>
 *   <li>Icône colorée par type d'action</li>
 *   <li>Action + horodatage + auteur</li>
 *   <li>Résumé des champs modifiés</li>
 * </ul>
 */

interface Props {
    opened: boolean;
    onClose: () => void;
    point: AssemblyPointDTO | null;
    employeeNameOf: (id?: number | null) => string;
}

const ACTION_META: Record<string, { icon: React.ComponentType<any>; color: string; bg: string; label: string }> = {
    created: { icon: IconCheck, color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Création' },
    updated: { icon: IconPencil, color: 'text-amber-700', bg: 'bg-amber-100', label: 'Modification' },
    archived: { icon: IconArchive, color: 'text-slate-600', bg: 'bg-slate-200', label: 'Archivage' },
};

const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const AssemblyPointHistoryDrawer = ({ opened, onClose, point, employeeNameOf }: Props) => {
    const { t } = useTranslation('emergency');
    const [items, setItems] = useState<AssemblyPointHistoryDTO[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!opened || !point?.id) return;
        setLoading(true);
        getAssemblyPointHistory(point.id)
            .then(setItems)
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [opened, point]);

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position="right"
            size="md"
            title={
                <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-700 rounded-full p-1.5 flex items-center justify-center">
                        <IconClock size={13} stroke={1.8} />
                    </span>
                    <div>
                        <p
                            className="text-slate-800 text-[14px]"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 500 }}
                        >
                            {t('assemblyPoints.history.title')}
                        </p>
                        {point && (
                            <p className="text-[11.5px] text-slate-500">{point.name}</p>
                        )}
                    </div>
                </div>
            }
        >
            <div className="mt-2">
                {loading ? (
                    <p className="text-[12px] text-slate-400 italic">Chargement…</p>
                ) : items.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50/40 border border-dashed border-slate-200 rounded-lg">
                        <IconClock size={24} className="text-slate-300 mx-auto mb-2" stroke={1.5} />
                        <p className="text-[12px] text-slate-500 italic">
                            {t('assemblyPoints.history.empty')}
                        </p>
                    </div>
                ) : (
                    <ol className="relative border-l-2 border-slate-200 ml-3 space-y-4 pl-5 py-2">
                        {items.map((h) => {
                            const meta = ACTION_META[h.action] ?? {
                                icon: IconCircle,
                                color: 'text-slate-600',
                                bg: 'bg-slate-100',
                                label: h.action,
                            };
                            const Icon = meta.icon;
                            return (
                                <li key={h.id} className="relative">
                                    <span
                                        className={`absolute -left-[33px] inline-flex items-center justify-center w-6 h-6 rounded-full ${meta.bg} ${meta.color} ring-4 ring-white shadow-sm`}
                                    >
                                        <Icon size={11} stroke={1.8} />
                                    </span>
                                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <span
                                                className={`text-[11px] uppercase tracking-wider font-semibold ${meta.color}`}
                                            >
                                                {meta.label}
                                            </span>
                                            <span className="text-[10.5px] text-slate-500">
                                                {formatDate(h.createdAt)}
                                            </span>
                                        </div>
                                        {h.diffSummary && (
                                            <p className="text-[12px] text-slate-700">
                                                {h.diffSummary}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
                                            <IconUser size={9} stroke={1.8} />
                                            {h.actorId ? employeeNameOf(h.actorId) : 'Système'}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </div>
        </Drawer>
    );
};

export default AssemblyPointHistoryDrawer;
