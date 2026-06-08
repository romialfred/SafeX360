/**
 * SyncConflictDrawer — Resolution manuelle des mutations en echec.
 *
 * S'ouvre depuis SyncIndicator quand stats.failed > 0. Pour chaque
 * mutation en echec, l'utilisateur peut :
 *   - Reessayer (remet en pending → relance sync)
 *   - Abandonner (supprime de la queue, perte assumee)
 *
 * Conformement REGLES.MD : pas d'animation gratuite, w-full, libelle FR.
 */

import { useEffect, useState, useCallback } from 'react';
import { IconAlertOctagon, IconRefresh, IconTrash, IconX } from '@tabler/icons-react';
import { queueFailed, queueRetry, queueDelete, type MutationRecord } from '../offline/db';
import { syncEngine } from '../offline/syncEngine';

interface Props {
    open: boolean;
    onClose: () => void;
}

const KIND_LABELS: Record<MutationRecord['kind'], string> = {
    'inspection.finding': 'Constat inspection',
    'inspection.submit': 'Soumission inspection',
    sos: 'Alerte SOS',
    'alert.general': 'Alerte generale',
    incident: 'Declaration incident',
    other: 'Action HSE',
};

export default function SyncConflictDrawer({ open, onClose }: Props) {
    const [items, setItems] = useState<MutationRecord[]>([]);
    const [busy, setBusy] = useState<number | null>(null);

    const refresh = useCallback(async () => {
        const list = await queueFailed();
        setItems(list.sort((a, b) => b.createdAt - a.createdAt));
    }, []);

    useEffect(() => {
        if (!open) return;
        void refresh();
    }, [open, refresh]);

    if (!open) return null;

    const handleRetry = async (id?: number) => {
        if (id === undefined) return;
        setBusy(id);
        try {
            await queueRetry(id);
            void syncEngine.run();
            await refresh();
        } finally {
            setBusy(null);
        }
    };

    const handleDelete = async (id?: number) => {
        if (id === undefined) return;
        const confirmed = window.confirm(
            'Supprimer cette declaration de la file ? Les donnees seront perdues.',
        );
        if (!confirmed) return;
        setBusy(id);
        try {
            await queueDelete(id);
            await refresh();
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-end" role="dialog" aria-modal="true">
            <div
                className="absolute inset-0 bg-slate-900/40"
                onClick={onClose}
                aria-hidden="true"
            />
            <div className="relative w-full bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col">
                <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <IconAlertOctagon size={18} stroke={1.8} className="text-rose-600" />
                        <h2 className="text-[14px] font-semibold text-slate-900">
                            Synchronisations en echec
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-500"
                        style={{ minWidth: 36, minHeight: 36 }}
                        aria-label="Fermer"
                    >
                        <IconX size={18} stroke={1.8} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-4 py-3">
                    {items.length === 0 ? (
                        <p className="text-center text-[13px] text-slate-500 py-8">
                            Aucune synchronisation en echec.
                        </p>
                    ) : (
                        <ul className="space-y-2.5">
                            {items.map((m) => (
                                <li
                                    key={m.id}
                                    className="bg-rose-50 border border-rose-200 rounded-xl p-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[13px] font-medium text-rose-900">
                                                {KIND_LABELS[m.kind] ?? m.kind}
                                            </div>
                                            <div className="text-[11.5px] text-rose-700 mt-0.5 truncate">
                                                {m.endpoint}
                                            </div>
                                            {m.lastError && (
                                                <div className="text-[11px] text-rose-800 mt-1 line-clamp-2">
                                                    {m.lastError}
                                                </div>
                                            )}
                                            <div className="text-[10.5px] text-rose-600 mt-1">
                                                Cree le{' '}
                                                {new Date(m.createdAt).toLocaleString('fr-FR', {
                                                    dateStyle: 'short',
                                                    timeStyle: 'short',
                                                })}{' '}
                                                · {m.retryCount} tentative
                                                {m.retryCount > 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => handleRetry(m.id)}
                                            disabled={busy === m.id}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[12.5px] font-medium disabled:opacity-50"
                                            style={{ minHeight: 36 }}
                                        >
                                            <IconRefresh size={13} stroke={1.8} />
                                            Reessayer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(m.id)}
                                            disabled={busy === m.id}
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 text-[12.5px] disabled:opacity-50"
                                            style={{ minHeight: 36 }}
                                        >
                                            <IconTrash size={13} stroke={1.8} />
                                            Abandonner
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <footer className="px-4 py-3 border-t border-slate-100 text-[11px] text-slate-500 text-center">
                    Les conflits de version (HTTP 409) necessitent generalement de
                    recreer la declaration avec les donnees a jour.
                </footer>
            </div>
        </div>
    );
}
