export function SkeletonLine({ className = '' }: { className?: string }) {
    return <div className={`h-3 bg-slate-200 rounded-lg animate-pulse ${className}`} />;
}

export function CardSkeleton({ badge = false }: { badge?: boolean }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm" style={{ minHeight: 88 }}>
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2 pt-0.5">
                    {badge && (
                        <div className="w-20 h-5 bg-slate-200 rounded-full animate-pulse" />
                    )}
                    <SkeletonLine className="w-3/4 h-3.5" />
                    <SkeletonLine className="w-1/2" />
                    <SkeletonLine className="w-1/3" />
                </div>
            </div>
        </div>
    );
}

export function HomeSkeleton() {
    return (
        <div className="space-y-0">
            <section className="px-4 pt-4 pb-2">
                <div className="h-3 w-16 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-6 w-44 bg-slate-200 rounded-lg animate-pulse mt-1.5" />
            </section>

            <section className="px-4 pt-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-9 h-9 bg-slate-200 rounded-xl animate-pulse" />
                        <div className="space-y-1.5 flex-1">
                            <div className="h-2.5 w-20 bg-slate-200 rounded-lg animate-pulse" />
                            <div className="h-3.5 w-36 bg-slate-200 rounded-lg animate-pulse" />
                        </div>
                    </div>
                    <div className="h-3 w-40 bg-slate-200 rounded-lg animate-pulse mt-1" />
                </div>
            </section>

            <section className="px-4 pt-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="h-3 w-40 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-3 w-14 bg-slate-200 rounded-lg animate-pulse" />
                </div>
                <div className="space-y-2.5">
                    <CardSkeleton badge />
                    <CardSkeleton badge />
                </div>
            </section>

            <section className="px-4 pt-5">
                <div className="h-3 w-24 bg-slate-200 rounded-lg animate-pulse mb-2" />
                <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm"
                            style={{ minHeight: 96 }}
                        >
                            <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse mb-2" />
                            <SkeletonLine className="w-2/3 h-3.5" />
                            <SkeletonLine className="w-3/4 mt-1.5" />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

/**
 * Squelette de liste. `withFilters` n'affiche le faux segment de filtres que
 * sur demande — la plupart des écrans qui l'utilisent sont DÉJÀ sous leur
 * vraie barre de filtres et à l'intérieur d'un conteneur px-4 (le px-4 interne
 * doublait le retrait horizontal).
 */
export function ListSkeleton({ count = 4, withFilters = false }: { count?: number; withFilters?: boolean }) {
    return (
        <div>
            {withFilters && (
                <div className="pb-2">
                    <div className="bg-white border border-slate-200 rounded-full p-1">
                        <div className="grid grid-cols-3 gap-1.5">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-9 bg-slate-200 rounded-full animate-pulse"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2.5">
                {Array.from({ length: count }).map((_, i) => (
                    <CardSkeleton key={i} badge />
                ))}
            </div>
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div>
            <section className="px-4 pt-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="h-4 w-36 bg-slate-200 rounded-lg animate-pulse" />
                        <div className="h-3 w-24 bg-slate-200 rounded-lg animate-pulse" />
                    </div>
                </div>
            </section>

            <section className="px-4 pt-4 space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-sm"
                        style={{ minHeight: 72 }}
                    >
                        <div className="w-11 h-11 bg-slate-200 rounded-xl animate-pulse flex-shrink-0" />
                        <div className="flex-1 min-w-0 space-y-1.5">
                            <SkeletonLine className="w-1/2 h-3.5" />
                            <SkeletonLine className="w-3/4" />
                        </div>
                        <div className="w-4 h-4 bg-slate-200 rounded animate-pulse flex-shrink-0" />
                    </div>
                ))}
            </section>
        </div>
    );
}

export default ListSkeleton;
