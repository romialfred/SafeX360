import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Tooltip } from '@mantine/core';
import {
    IconPlus,
    IconSearch,
    IconEdit,
    IconCheck,
    IconX,
    IconTrash,
    IconChevronLeft,
    IconChevronRight,
    IconInbox,
} from '@tabler/icons-react';
import ResponsiveTable, { ResponsiveTableColumn } from '../../UtilityComp/ResponsiveTable';

/**
 * ReferencePanel — Socle unifié de gestion d'un référentiel (paramètre).
 *
 * Remplace les tableaux PrimeReact hétérogènes (et anglais) des 14 écrans de
 * paramètres par une présentation unique, en français, cohérente avec le
 * design de la plateforme (cartes blanches, bordures slate, accents teal).
 *
 * Fournit d'office : barre d'outils (création + recherche), tableau responsive
 * (cartes sur mobile via ResponsiveTable), colonne Statut, colonne Actions
 * (éditer / activer-désactiver / supprimer), pagination et état vide.
 *
 * Le composant est EMBARQUABLE : il ne rend aucun chrome de page (pas de titre
 * ni de fil d'Ariane) afin d'être posé tel quel dans un onglet.
 *
 * Utilisation :
 *
 *   <ReferencePanel
 *     newLabel="Nouveau site"
 *     onNew={openCreate}
 *     columns={[{ key: 'name', label: 'Nom' }, { key: 'lat', label: 'Latitude', numeric: true }]}
 *     rows={sites}
 *     renderRow={(s) => ({ name: s.name, lat: s.latitude })}
 *     getRowKey={(s) => s.id}
 *     searchText={(s) => s.name}
 *     statusOf={(s) => s.status}
 *     onEdit={handleEdit}
 *     onToggleStatus={handleToggle}
 *   />
 */

export type RowStatus = 'ACTIVE' | 'INACTIVE' | string;

export interface ReferencePanelProps<T> {
    /** Libellé du bouton de création, ex. « Nouveau site ». Omis => pas de bouton. */
    newLabel?: string;
    onNew?: () => void;
    /** Colonnes métier. Les colonnes Statut et Actions sont ajoutées automatiquement. */
    columns: ResponsiveTableColumn[];
    rows: T[];
    renderRow: (row: T, index: number) => Record<string, ReactNode>;
    getRowKey: (row: T, index: number) => string | number;
    /** Texte sur lequel porte la recherche locale. */
    searchText: (row: T) => string;
    searchPlaceholder?: string;
    loading?: boolean;
    emptyTitle?: string;
    emptyHint?: string;
    /** Si fourni, ajoute une colonne Statut + la bascule dans les actions. */
    statusOf?: (row: T) => RowStatus;
    onToggleStatus?: (row: T) => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    /** Rendu d'actions supplémentaires sur la ligne (avant les actions standard). */
    rowActions?: (row: T) => ReactNode;
    /** Contenu libre ajouté à droite de la barre d'outils (filtres…). */
    toolbarExtra?: ReactNode;
    /** Bandeau libre au-dessus du tableau (aide, avertissement…). */
    banner?: ReactNode;
    /** Mini-tableau de bord (cartes de statistiques) en tête du panneau. */
    stats?: StatItem[];
    pageSize?: number;
    onRowClick?: (row: T) => void;
}

export type StatTone = 'teal' | 'violet' | 'amber' | 'slate' | 'rose' | 'sky' | 'emerald' | 'cyan' | 'indigo';
export interface StatItem {
    label: string;
    value: ReactNode;
    icon?: React.ComponentType<any>;
    tone?: StatTone;
}

const STAT_TONES: Record<StatTone, string> = {
    teal: 'border-teal-100 bg-teal-50/60 text-teal-700',
    violet: 'border-violet-100 bg-violet-50/60 text-violet-700',
    amber: 'border-amber-100 bg-amber-50/60 text-amber-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    rose: 'border-rose-100 bg-rose-50/60 text-rose-700',
    sky: 'border-sky-100 bg-sky-50/60 text-sky-700',
    emerald: 'border-emerald-100 bg-emerald-50/60 text-emerald-700',
    cyan: 'border-cyan-100 bg-cyan-50/60 text-cyan-700',
    indigo: 'border-indigo-100 bg-indigo-50/60 text-indigo-700',
};

function StatStrip({ stats }: { stats: StatItem[] }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 p-3 border-b border-slate-100">
            {stats.map((s, i) => {
                const tone = STAT_TONES[s.tone || 'slate'];
                const Icon = s.icon;
                return (
                    <div key={i} className={`rounded-lg border ${tone} px-3 py-2 flex items-center gap-2.5`}>
                        {Icon && (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/70 border border-white/60 shrink-0">
                                <Icon size={17} stroke={1.7} />
                            </span>
                        )}
                        <div className="min-w-0">
                            <p className="text-[19px] leading-none tabular-nums font-semibold">{s.value}</p>
                            <p className="text-[10.5px] uppercase tracking-wide text-slate-500 mt-1 truncate">{s.label}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const isActive = (s: RowStatus) => String(s).toUpperCase() === 'ACTIVE';

function StatusBadge({ status }: { status: RowStatus }) {
    const active = isActive(status);
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                active
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
            }`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {active ? 'Actif' : 'Inactif'}
        </span>
    );
}

function IconButton({
    label,
    onClick,
    tone,
    children,
}: {
    label: string;
    onClick: () => void;
    tone: 'teal' | 'red' | 'emerald' | 'slate';
    children: ReactNode;
}) {
    const toneClass = {
        teal: 'text-teal-600 hover:bg-teal-50 hover:text-teal-700',
        red: 'text-red-500 hover:bg-red-50 hover:text-red-600',
        emerald: 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700',
        slate: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
    }[tone];

    return (
        <Tooltip label={label} withArrow openDelay={300}>
            <button
                type="button"
                aria-label={label}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${toneClass}`}
            >
                {children}
            </button>
        </Tooltip>
    );
}

export default function ReferencePanel<T>({
    newLabel,
    onNew,
    columns,
    rows,
    renderRow,
    getRowKey,
    searchText,
    searchPlaceholder = 'Rechercher…',
    loading = false,
    emptyTitle = 'Aucun élément',
    emptyHint,
    statusOf,
    onToggleStatus,
    onEdit,
    onDelete,
    rowActions,
    toolbarExtra,
    banner,
    stats,
    pageSize = 10,
    onRowClick,
}: ReferencePanelProps<T>) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [perPage, setPerPage] = useState(pageSize);

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return rows;
        return rows.filter((r) => (searchText(r) || '').toLowerCase().includes(needle));
    }, [rows, search, searchText]);

    // Une recherche ou une suppression peut rendre la page courante hors bornes.
    const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
    useEffect(() => {
        if (page > pageCount - 1) setPage(0);
    }, [page, pageCount]);

    const paged = useMemo(
        () => filtered.slice(page * perPage, page * perPage + perPage),
        [filtered, page, perPage],
    );

    const hasActions = Boolean(onEdit || onDelete || (statusOf && onToggleStatus) || rowActions);

    const fullColumns: ResponsiveTableColumn[] = useMemo(() => {
        const cols = [...columns];
        if (statusOf) cols.push({ key: '__status', label: 'Statut', className: 'w-[110px]' });
        if (hasActions) cols.push({ key: '__actions', label: '', className: 'w-[120px] text-right' });
        return cols;
    }, [columns, statusOf, hasActions]);

    const renderFullRow = (row: T, index: number): Record<string, ReactNode> => {
        const cells = { ...renderRow(row, index) };
        if (statusOf) cells.__status = <StatusBadge status={statusOf(row)} />;
        if (hasActions) {
            const active = statusOf ? isActive(statusOf(row)) : false;
            cells.__actions = (
                <div className="flex items-center gap-0.5 justify-end">
                    {rowActions?.(row)}
                    {onEdit && (
                        <IconButton label="Modifier" tone="teal" onClick={() => onEdit(row)}>
                            <IconEdit size={15} stroke={1.7} />
                        </IconButton>
                    )}
                    {statusOf && onToggleStatus && (
                        <IconButton
                            label={active ? 'Désactiver' : 'Activer'}
                            tone={active ? 'red' : 'emerald'}
                            onClick={() => onToggleStatus(row)}
                        >
                            {active ? <IconX size={15} stroke={1.7} /> : <IconCheck size={15} stroke={1.7} />}
                        </IconButton>
                    )}
                    {onDelete && (
                        <IconButton label="Supprimer" tone="red" onClick={() => onDelete(row)}>
                            <IconTrash size={15} stroke={1.7} />
                        </IconButton>
                    )}
                </div>
            );
        }
        return cells;
    };

    const from = filtered.length === 0 ? 0 : page * perPage + 1;
    const to = Math.min((page + 1) * perPage, filtered.length);

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            {/* Mini-tableau de bord */}
            {stats && stats.length > 0 && <StatStrip stats={stats} />}

            {/* Barre d'outils */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 border-b border-slate-100">
                {newLabel && onNew && (
                    <button
                        type="button"
                        onClick={onNew}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-br from-teal-600 to-teal-700 text-white text-[12.5px] font-medium shadow-sm hover:from-teal-700 hover:to-teal-800 active:scale-[0.98] transition-all flex-shrink-0"
                    >
                        <IconPlus size={15} stroke={2} />
                        {newLabel}
                    </button>
                )}

                <div className="flex-1" />

                {toolbarExtra}

                <div className="relative sm:w-[240px] flex-shrink-0">
                    <IconSearch
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0);
                        }}
                        placeholder={searchPlaceholder}
                        className="w-full pl-8 pr-3 py-1.5 text-[12.5px] bg-slate-50/60 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {banner && <div className="px-3 pt-3">{banner}</div>}

            {/* Tableau */}
            <div className="p-3">
                <ResponsiveTable<T>
                    columns={fullColumns}
                    rows={paged}
                    renderRow={renderFullRow}
                    getRowKey={getRowKey}
                    onRowClick={onRowClick}
                    loading={loading}
                    loadingState={
                        <div className="py-10 text-center text-[13px] text-slate-500">Chargement…</div>
                    }
                    emptyState={
                        <div className="py-10 flex flex-col items-center justify-center text-center">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2.5">
                                <IconInbox size={19} stroke={1.6} className="text-slate-400" />
                            </div>
                            <p className="text-[13px] font-medium text-slate-700">
                                {search ? `Aucun résultat pour « ${search} »` : emptyTitle}
                            </p>
                            {!search && emptyHint && (
                                <p className="text-[12px] text-slate-500 mt-0.5 max-w-sm">{emptyHint}</p>
                            )}
                        </div>
                    }
                />
            </div>

            {/* Pagination */}
            {filtered.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 border-t border-slate-100">
                    <p className="text-[11.5px] text-slate-500">
                        Affichage de <span className="font-medium text-slate-700">{from}</span> à{' '}
                        <span className="font-medium text-slate-700">{to}</span> sur{' '}
                        <span className="font-medium text-slate-700">{filtered.length}</span>
                    </p>

                    <div className="flex items-center gap-2">
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setPage(0);
                            }}
                            aria-label="Éléments par page"
                            className="text-[11.5px] border border-slate-200 rounded-md px-1.5 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                        >
                            {[10, 25, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n} / page
                                </option>
                            ))}
                        </select>

                        <div className="flex items-center gap-0.5">
                            <button
                                type="button"
                                aria-label="Page précédente"
                                disabled={page === 0}
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                            >
                                <IconChevronLeft size={15} stroke={1.8} />
                            </button>
                            <span className="text-[11.5px] text-slate-600 px-1.5 tabular-nums">
                                {page + 1} / {pageCount}
                            </span>
                            <button
                                type="button"
                                aria-label="Page suivante"
                                disabled={page >= pageCount - 1}
                                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                            >
                                <IconChevronRight size={15} stroke={1.8} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
