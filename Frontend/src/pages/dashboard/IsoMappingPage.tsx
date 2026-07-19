import { useMemo, useState } from 'react';
import {
    IconArrowRight,
    IconExternalLink,
    IconFileCheck,
    IconLayoutGrid,
    IconList,
    IconSearch,
    IconUsersGroup,
} from '@tabler/icons-react';
import { Badge, SegmentedControl, Select, TextInput } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import {
    ISO_CLAUSES,
    ISO_REGISTRY_VERSION,
    ISO_STANDARDS,
    ORGANIZATIONAL_PROCESS_CONTROLS,
    SAFEX_MODULES,
    clausesForModule,
    coverageStats,
    type IsoStandardCode,
    type ProductSupport,
} from '../../Data/IsoMappingData';

type ViewMode = 'matrix' | 'modules' | 'processes';

const STANDARD_DOT_BG: Record<IsoStandardCode, string> = {
    'ISO 45001': 'bg-red-700',
    'ISO 14001': 'bg-emerald-700',
    'ISO 9001': 'bg-blue-700',
    'ISO 19011': 'bg-indigo-700',
    'ISO 31000': 'bg-amber-700',
};

const SUPPORT_LABEL: Record<ProductSupport, string> = {
    SUPPORTED: 'Support produit',
    PARTIAL: 'Support partiel',
    OUTSIDE_PRODUCT: 'Hors produit',
};

const SUPPORT_COLOR: Record<ProductSupport, string> = {
    SUPPORTED: 'teal',
    PARTIAL: 'yellow',
    OUTSIDE_PRODUCT: 'gray',
};

const MATURITY_LABEL = {
    NOT_SUPPORTED: 'non supporté',
    SUPPORTED: 'support produit',
    CONFIGURED: 'configuré',
    APPLIED: 'appliqué',
    VERIFIED: 'vérifié',
    EFFECTIVE: 'efficace',
} as const;

/**
 * Cartographie de traçabilité. Cette vue décrit les capacités du produit et
 * les preuves attendues ; elle ne calcule aucun score de conformité ISO.
 */
export default function IsoMappingPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('matrix');
    const [searchTerm, setSearchTerm] = useState('');
    const [standardFilter, setStandardFilter] = useState<IsoStandardCode | 'all'>('all');
    const stats = useMemo(() => coverageStats(), []);

    return (
        <main className="min-h-full w-full bg-stone-50 px-4 py-5 sm:px-5 lg:px-6">
            <header className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Conformité › Référentiels</p>
                    <h1 className="mt-1 text-[clamp(19px,2vw,24px)] font-medium text-slate-900 [font-family:'Source_Serif_4',Georgia,serif]">
                        Cartographie ISO et preuves attendues
                    </h1>
                    <p className="mt-1 max-w-4xl text-[13px] leading-relaxed text-slate-600">
                        Registre versionné des éditions, processus, responsabilités, contrôles et écarts. Une capacité
                        SafeX ne constitue jamais, à elle seule, une preuve de conformité organisationnelle.
                    </p>
                    <p className="mt-1 text-[10.5px] text-slate-500">Version du registre : {ISO_REGISTRY_VERSION} · approbation organisationnelle en attente</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <StatPill label="Référentiels" value={ISO_STANDARDS.length} />
                    <StatPill label="Lignes de traçabilité" value={stats.total} />
                    <StatPill label="Processus structurants" value={ORGANIZATIONAL_PROCESS_CONTROLS.length} />
                </div>
            </header>

            <section aria-label="Avertissement de conformité" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12.5px] text-amber-950">
                <strong className="font-semibold">Lecture obligatoire :</strong> les états « support produit »,
                « configuré », « appliqué », « vérifié » et « efficace » sont distincts. Le registre ne positionne
                aucune exigence au-delà de « support produit » sans preuve réelle revue par une personne compétente.
            </section>

            <section aria-labelledby="standard-register-title" className="mb-4">
                <h2 id="standard-register-title" className="sr-only">Registre des éditions normatives</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                    {ISO_STANDARDS.map((standard) => (
                        <article key={standard.code} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStandardFilter(standardFilter === standard.code ? 'all' : standard.code)}
                                    className="min-w-0 text-left"
                                    aria-pressed={standardFilter === standard.code}
                                >
                                    <span className="flex items-center gap-2 text-[12px] font-medium text-slate-900">
                                        <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${STANDARD_DOT_BG[standard.code]}`} />
                                        {standard.code}:{standard.year}
                                    </span>
                                    <span className="mt-1 block text-[10.5px] leading-snug text-slate-500">Édition {standard.edition} · publiée {standard.publicationDate}</span>
                                </button>
                                <a
                                    href={standard.officialSource}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`Ouvrir la source ISO officielle pour ${standard.code}`}
                                    className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                >
                                    <IconExternalLink aria-hidden size={14} />
                                </a>
                            </div>
                            <p className="mt-2 text-[10.5px] leading-snug text-slate-600">Revue : {standard.reviewedAt}</p>
                            <p className="text-[10.5px] leading-snug text-slate-600">Prochaine revue : {standard.nextReviewDate}</p>
                            <p className="mt-1.5 text-[10.5px] leading-snug text-slate-500">{standard.impactStatement}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section aria-label="Filtres de la cartographie" className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <SegmentedControl
                        value={viewMode}
                        onChange={(value) => setViewMode(value as ViewMode)}
                        data={[
                            { value: 'matrix', label: <span className="inline-flex items-center gap-1.5"><IconList aria-hidden size={13} /> Exigences</span> as never },
                            { value: 'modules', label: <span className="inline-flex items-center gap-1.5"><IconLayoutGrid aria-hidden size={13} /> Modules</span> as never },
                            { value: 'processes', label: <span className="inline-flex items-center gap-1.5"><IconUsersGroup aria-hidden size={13} /> Processus</span> as never },
                        ]}
                        color="teal"
                        size="sm"
                    />
                    <TextInput
                        aria-label="Rechercher dans la cartographie"
                        placeholder="Rechercher une clause, un processus, une preuve ou un écart"
                        leftSection={<IconSearch aria-hidden size={14} className="text-slate-400" />}
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.currentTarget.value)}
                        className="flex-1"
                        size="sm"
                    />
                    <Select
                        aria-label="Filtrer par référentiel"
                        value={standardFilter}
                        onChange={(value) => setStandardFilter((value as IsoStandardCode | 'all') ?? 'all')}
                        data={[{ value: 'all', label: 'Tous les référentiels' }, ...ISO_STANDARDS.map((standard) => ({ value: standard.code, label: `${standard.code}:${standard.year}` }))]}
                        allowDeselect={false}
                        className="lg:w-[230px]"
                        size="sm"
                    />
                </div>
            </section>

            {viewMode === 'matrix' && <MatrixView searchTerm={searchTerm} standardFilter={standardFilter} />}
            {viewMode === 'modules' && <ModulesView searchTerm={searchTerm} standardFilter={standardFilter} />}
            {viewMode === 'processes' && <ProcessesView searchTerm={searchTerm} standardFilter={standardFilter} />}
        </main>
    );
}

function MatrixView({ searchTerm, standardFilter }: { searchTerm: string; standardFilter: IsoStandardCode | 'all' }) {
    const navigate = useNavigate();
    const filtered = useMemo(() => {
        const needle = searchTerm.trim().toLocaleLowerCase('fr');
        return ISO_CLAUSES.filter((item) => {
            if (standardFilter !== 'all' && item.standard !== standardFilter) return false;
            if (!needle) return true;
            return [item.code, item.standard, item.title, item.process, item.ownerRole, item.expectedEvidence, item.gap]
                .some((value) => value.toLocaleLowerCase('fr').includes(needle));
        });
    }, [searchTerm, standardFilter]);

    if (filtered.length === 0) return <EmptyState />;

    return (
        <section aria-label="Matrice exigences et preuves" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[88rem] text-left">
                    <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                            {['Référence', 'Processus', 'Responsable', 'Preuve attendue', 'Contrôle', 'État', 'Résultat', 'Écart', 'Supports'].map((label) => (
                                <th key={label} scope="col" className="px-3 py-2.5 text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((item) => {
                            const modules = SAFEX_MODULES.filter((module) => item.coveredBy.includes(module.id));
                            return (
                                <tr key={item.id} className="align-top hover:bg-slate-50/60">
                                    <td className="px-3 py-3">
                                        <p className="whitespace-nowrap text-[11px] font-medium text-slate-800">{item.standard} §{item.code}</p>
                                        <p className="mt-1 max-w-[190px] text-[11px] leading-snug text-slate-600">{item.title}</p>
                                    </td>
                                    <td className="px-3 py-3 text-[11px] text-slate-700">{item.process}</td>
                                    <td className="px-3 py-3 text-[11px] text-slate-700">{item.ownerRole}</td>
                                    <td className="px-3 py-3 text-[11px] leading-snug text-slate-700">{item.expectedEvidence}</td>
                                    <td className="px-3 py-3 text-[11px] leading-snug text-slate-700">{item.controlMethod}</td>
                                    <td className="px-3 py-3">
                                        <Badge size="xs" variant="light" color={SUPPORT_COLOR[item.productSupport]}>{SUPPORT_LABEL[item.productSupport]}</Badge>
                                        <p className="mt-1 text-[10px] text-slate-500">Maturité : {MATURITY_LABEL[item.maturity]}</p>
                                    </td>
                                    <td className="px-3 py-3 text-[11px] leading-snug text-slate-600">{item.result}</td>
                                    <td className="px-3 py-3 text-[11px] leading-snug text-rose-800">{item.gap}</td>
                                    <td className="px-3 py-3">
                                        <div className="flex max-w-[220px] flex-wrap gap-1">
                                            {modules.map((module) => (
                                                <button
                                                    key={module.id}
                                                    type="button"
                                                    onClick={() => navigate(module.routes[0])}
                                                    className="inline-flex items-center gap-1 rounded border border-teal-100 bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal-900 hover:bg-teal-100"
                                                >
                                                    {module.label}<IconArrowRight aria-hidden size={9} />
                                                </button>
                                            ))}
                                            {modules.length === 0 && <span className="text-[10px] text-slate-500">Aucun workflow</span>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-[10.5px] text-slate-500">
                {filtered.length} lignes · identifiants composites norme + clause · aucune agrégation en taux de conformité
            </p>
        </section>
    );
}

function ModulesView({ searchTerm, standardFilter }: { searchTerm: string; standardFilter: IsoStandardCode | 'all' }) {
    const navigate = useNavigate();
    const modules = useMemo(() => {
        const needle = searchTerm.trim().toLocaleLowerCase('fr');
        return SAFEX_MODULES.map((module) => {
            let items = clausesForModule(module.id);
            if (standardFilter !== 'all') items = items.filter((item) => item.standard === standardFilter);
            if (needle) items = items.filter((item) => [module.label, module.description, item.title, item.process, item.gap].some((value) => value.toLocaleLowerCase('fr').includes(needle)));
            return { module, items };
        }).filter(({ items }) => items.length > 0);
    }, [searchTerm, standardFilter]);

    if (modules.length === 0) return <EmptyState />;

    return (
        <section aria-label="Cartographie par module" className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {modules.map(({ module, items }) => (
                <article key={module.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <button type="button" onClick={() => navigate(module.routes[0])} className="flex w-full items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-3 text-left hover:bg-slate-100">
                        <span>
                            <span className="block text-[14px] font-medium text-slate-900">{module.label}</span>
                            <span className="mt-0.5 block text-[11px] text-slate-500">{module.description}</span>
                        </span>
                        <IconArrowRight aria-hidden size={14} className="mt-1 text-slate-500" />
                    </button>
                    <div className="divide-y divide-slate-100">
                        {items.map((item) => (
                            <div key={item.id} className="grid grid-cols-[130px_1fr_auto] gap-2 px-3 py-2 text-[11px]">
                                <span className="font-mono text-slate-600">{item.standard} §{item.code}</span>
                                <span className="text-slate-800">{item.title}</span>
                                <Badge size="xs" variant="light" color={SUPPORT_COLOR[item.productSupport]}>{SUPPORT_LABEL[item.productSupport]}</Badge>
                            </div>
                        ))}
                    </div>
                </article>
            ))}
        </section>
    );
}

function ProcessesView({ searchTerm, standardFilter }: { searchTerm: string; standardFilter: IsoStandardCode | 'all' }) {
    const navigate = useNavigate();
    const filtered = useMemo(() => {
        const needle = searchTerm.trim().toLocaleLowerCase('fr');
        return ORGANIZATIONAL_PROCESS_CONTROLS.filter((control) => {
            if (standardFilter !== 'all' && !control.clauses.some((reference) => reference.startsWith(standardFilter))) return false;
            if (!needle) return true;
            return [control.process, control.ownerRole, control.inputs, control.decisions, control.participants, control.signedEvidence, control.residual]
                .some((value) => value.toLocaleLowerCase('fr').includes(needle));
        });
    }, [searchTerm, standardFilter]);

    if (filtered.length === 0) return <EmptyState />;

    return (
        <section aria-label="Processus organisationnels structurants" className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {filtered.map((control) => (
                <article key={control.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-[15px] font-medium text-slate-900">{control.process}</h2>
                            <p className="mt-0.5 text-[10.5px] text-slate-500">{control.clauses.join(' · ')}</p>
                        </div>
                        <Badge size="sm" variant="light" color={SUPPORT_COLOR[control.support]}>{SUPPORT_LABEL[control.support]}</Badge>
                    </div>
                    <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-[11px] sm:grid-cols-2">
                        <Field label="Responsable" value={control.ownerRole} />
                        <Field label="Participants" value={control.participants} />
                        <Field label="Entrées" value={control.inputs} />
                        <Field label="Décisions" value={control.decisions} />
                        <Field label="Preuve signée" value={control.signedEvidence} />
                        <Field label="Échéance" value={control.dueRule} />
                        <Field label="Version" value={control.versioning} />
                        <Field label="Conservation" value={control.retention} />
                        <Field label="Efficacité" value={control.effectivenessIndicator} />
                        <Field label="Résiduel" value={control.residual} emphasize />
                    </dl>
                    {control.availableRoutes.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                            {control.availableRoutes.map((route) => (
                                <button key={route} type="button" onClick={() => navigate(route)} className="inline-flex items-center gap-1 rounded border border-teal-100 bg-teal-50 px-2 py-1 text-[10.5px] text-teal-900 hover:bg-teal-100">
                                    Ouvrir le support <IconArrowRight aria-hidden size={10} />
                                </button>
                            ))}
                        </div>
                    )}
                </article>
            ))}
        </section>
    );
}

function Field({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
    return (
        <div>
            <dt className="text-[9.5px] uppercase tracking-[0.1em] text-slate-500">{label}</dt>
            <dd className={`mt-0.5 leading-snug ${emphasize ? 'text-rose-800' : 'text-slate-700'}`}>{value}</dd>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <IconFileCheck aria-hidden size={22} className="mx-auto text-slate-400" />
            <p className="mt-2 text-[13px] text-slate-600">Aucun élément ne correspond aux filtres.</p>
        </div>
    );
}

function StatPill({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <p className="text-[9.5px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className="mt-0.5 text-[14px] font-medium tabular-nums text-slate-900">{value}</p>
        </div>
    );
}
