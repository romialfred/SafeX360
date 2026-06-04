import { ReactNode } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

/**
 * ResponsiveTable — Bascule automatique entre tableau (desktop)
 * et liste de cartes (mobile / < 768px).
 *
 * Pattern conçu pour les listings HSE (incidents, audits, risques, EPI…).
 * Préserve la sémantique : <table> sur desktop, <ul role="list"> sur mobile.
 *
 * Utilisation :
 *
 *   <ResponsiveTable
 *     columns={[
 *       { key: 'ref', label: 'Référence' },
 *       { key: 'title', label: 'Titre' },
 *       { key: 'status', label: 'Statut' },
 *     ]}
 *     rows={incidents}
 *     renderRow={(it) => ({
 *       ref: it.refNumber,
 *       title: it.title,
 *       status: <StatusBadge value={it.status} />,
 *     })}
 *     renderMobileCard={(it) => (
 *       <IncidentCard incident={it} />
 *     )}
 *     onRowClick={(it) => navigate(`/incidents/${it.id}`)}
 *     emptyState={<EmptyState title="Aucun incident" />}
 *   />
 *
 * Pour les cas simples sans renderMobileCard, le composant génère
 * une carte par défaut basée sur les colonnes + renderRow.
 */

type CellValue = ReactNode;

export interface ResponsiveTableColumn {
    key: string;
    label: string;
    /** Classes Tailwind sur <th>/<td> (utiles pour width, align…) */
    className?: string;
    /** Caché sur tablet (md) ? Réservé aux colonnes secondaires */
    hideOnTablet?: boolean;
    /** Aligné à droite (chiffres, dates) */
    numeric?: boolean;
}

interface ResponsiveTableProps<T> {
    columns: ResponsiveTableColumn[];
    rows: T[];
    /** Transforme un item en map cellule -> contenu */
    renderRow: (row: T, index: number) => Record<string, CellValue>;
    /** Optionnel : rendu carte mobile custom */
    renderMobileCard?: (row: T, index: number) => ReactNode;
    /** Clé unique par row */
    getRowKey: (row: T, index: number) => string | number;
    /** Callback au clic sur une ligne */
    onRowClick?: (row: T, index: number) => void;
    /** Affiché quand rows.length === 0 */
    emptyState?: ReactNode;
    /** Affiché pendant chargement */
    loading?: boolean;
    loadingState?: ReactNode;
    /** Hauteur max + scroll vertical (optionnel) */
    maxHeight?: string | number;
    /** Forcer un mode (override breakpoint) */
    forceMode?: 'table' | 'cards';
    /** Class additionnelle sur le container */
    className?: string;
}

export default function ResponsiveTable<T>({
    columns,
    rows,
    renderRow,
    renderMobileCard,
    getRowKey,
    onRowClick,
    emptyState,
    loading = false,
    loadingState,
    maxHeight,
    forceMode,
    className = '',
}: ResponsiveTableProps<T>) {
    const bp = useBreakpoint();
    const mode = forceMode ?? (bp.isMobile ? 'cards' : 'table');

    if (loading) {
        return <div className={className}>{loadingState ?? null}</div>;
    }

    if (rows.length === 0) {
        return <div className={className}>{emptyState ?? null}</div>;
    }

    if (mode === 'cards') {
        return (
            <ul
                role="list"
                className={`space-y-2.5 ${className}`}
                style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
            >
                {rows.map((row, idx) => {
                    const cells = renderRow(row, idx);
                    return (
                        <li key={getRowKey(row, idx)}>
                            {renderMobileCard ? (
                                <div
                                    role={onRowClick ? 'button' : undefined}
                                    tabIndex={onRowClick ? 0 : undefined}
                                    onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
                                    onKeyDown={
                                        onRowClick
                                            ? (e) => {
                                                  if (e.key === 'Enter' || e.key === ' ') {
                                                      e.preventDefault();
                                                      onRowClick(row, idx);
                                                  }
                                              }
                                            : undefined
                                    }
                                    className={onRowClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-lg' : undefined}
                                >
                                    {renderMobileCard(row, idx)}
                                </div>
                            ) : (
                                <DefaultMobileCard
                                    columns={columns}
                                    cells={cells}
                                    onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
                                />
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    }

    // ═══ Mode table (desktop / tablet large) ═══
    return (
        <div
            className={`border border-slate-200 rounded-lg overflow-hidden bg-white ${className}`}
            style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/70 border-b border-slate-200">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    scope="col"
                                    className={`px-4 py-3 text-[10.5px] uppercase tracking-[0.12em] text-slate-600 ${
                                        col.numeric ? 'text-right' : ''
                                    } ${col.hideOnTablet ? 'hidden lg:table-cell' : ''} ${col.className ?? ''}`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((row, idx) => {
                            const cells = renderRow(row, idx);
                            return (
                                <tr
                                    key={getRowKey(row, idx)}
                                    onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
                                    className={`${
                                        onRowClick
                                            ? 'cursor-pointer hover:bg-slate-50/60 focus-within:bg-slate-50/60'
                                            : ''
                                    } transition-colors`}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={`px-4 py-3 text-[13px] text-slate-800 ${
                                                col.numeric ? 'text-right tabular-nums' : ''
                                            } ${col.hideOnTablet ? 'hidden lg:table-cell' : ''} ${col.className ?? ''}`}
                                        >
                                            {cells[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Carte mobile par défaut — affiche label : valeur en liste
// ─────────────────────────────────────────────────────────────────────────────
function DefaultMobileCard({
    columns,
    cells,
    onClick,
}: {
    columns: ResponsiveTableColumn[];
    cells: Record<string, CellValue>;
    onClick?: () => void;
}) {
    return (
        <div
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={
                onClick
                    ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onClick();
                          }
                      }
                    : undefined
            }
            className={`bg-white border border-slate-200 rounded-lg p-3.5 ${
                onClick
                    ? 'cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2'
                    : ''
            } transition-all`}
        >
            <dl className="space-y-2">
                {columns.map((col) => (
                    <div key={col.key} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
                        <dt className="text-[10.5px] uppercase tracking-[0.12em] text-slate-500 sm:flex-shrink-0">
                            {col.label}
                        </dt>
                        <dd className="text-[13.5px] text-slate-800 min-w-0 sm:text-right">
                            {cells[col.key]}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
