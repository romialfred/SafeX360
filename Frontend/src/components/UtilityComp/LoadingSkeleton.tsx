/**
 * LoadingSkeleton — Patterns réutilisables de chargement.
 *
 * Trois variantes pour la majorité des cas SafeX 360 :
 *   - <SkeletonTable rows={N} cols={N} /> : remplace une DataTable en chargement
 *   - <SkeletonCardList items={N} />      : remplace une grille de cartes
 *   - <SkeletonDashboard />              : remplace un tableau de bord KPI + grille
 *
 * Inspiration : Mantine Skeleton mais maîtrisé sans dépendance externe.
 * Utilise une animation `safex-pulse` (définie dans App.css).
 */

interface SkeletonBlockProps {
    className?: string;
    width?: string | number;
    height?: string | number;
}

export function SkeletonBlock({ className = '', width, height }: SkeletonBlockProps) {
    return (
        <div
            className={`safex-skeleton bg-slate-200/70 rounded-md ${className}`}
            style={{ width, height }}
            aria-hidden="true"
        />
    );
}

export function SkeletonText({
    lines = 3,
    className = '',
}: {
    lines?: number;
    className?: string;
}) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <SkeletonBlock
                    key={i}
                    className="h-3"
                    width={i === lines - 1 ? '70%' : '100%'}
                />
            ))}
        </div>
    );
}

export function SkeletonTable({
    rows = 6,
    cols = 5,
}: {
    rows?: number;
    cols?: number;
}) {
    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden" role="status" aria-label="Chargement des données">
            <div className="bg-slate-50/70 border-b border-slate-200 px-4 py-3 flex gap-4">
                {Array.from({ length: cols }).map((_, c) => (
                    <SkeletonBlock key={c} className="h-3 flex-1" />
                ))}
            </div>
            <div className="divide-y divide-slate-100">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="px-4 py-3.5 flex gap-4">
                        {Array.from({ length: cols }).map((_, c) => (
                            <SkeletonBlock
                                key={c}
                                className="h-3 flex-1"
                                width={c === 0 ? '60%' : '100%'}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function SkeletonCardList({
    items = 6,
    columns = 3,
}: {
    items?: number;
    columns?: number;
}) {
    const cols =
        columns === 1 ? 'grid-cols-1' :
        columns === 2 ? 'grid-cols-1 sm:grid-cols-2' :
        columns === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

    return (
        <div className={`grid ${cols} gap-4`} role="status" aria-label="Chargement des données">
            {Array.from({ length: items }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white rounded-lg border border-slate-200 p-4"
                >
                    <div className="flex items-start gap-3 mb-4">
                        <SkeletonBlock className="h-9 w-9 rounded-md" />
                        <div className="flex-1 space-y-2">
                            <SkeletonBlock className="h-3" width="80%" />
                            <SkeletonBlock className="h-2.5" width="50%" />
                        </div>
                    </div>
                    <SkeletonText lines={3} />
                </div>
            ))}
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <div className="space-y-5" role="status" aria-label="Chargement du tableau de bord">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                        <SkeletonBlock className="h-8 w-8 rounded-md mb-3" />
                        <SkeletonBlock className="h-6 mb-2" width="60%" />
                        <SkeletonBlock className="h-2.5" width="80%" />
                    </div>
                ))}
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
                        <SkeletonBlock className="h-4 mb-4" width="40%" />
                        <SkeletonBlock className="h-48 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SkeletonBlock;
