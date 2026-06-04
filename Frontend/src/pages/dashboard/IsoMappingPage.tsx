import { useMemo, useState } from 'react';
import {
    IconShieldCheck,
    IconCertificate,
    IconLayoutGrid,
    IconList,
    IconSearch,
    IconArrowRight,
} from '@tabler/icons-react';
import { Badge, SegmentedControl, TextInput, Select } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import {
    ISO_STANDARDS,
    ISO_CLAUSES,
    SAFEX_MODULES,
    coverageStats,
    clausesForModule,
    type IsoStandardCode,
    type SafeXModuleId,
} from '../../Data/IsoMappingData';

/**
 * LOT 39 audit P0 fix — mapping statique des couleurs par norme.
 *
 * Tailwind 4 JIT n'extrait que les chaînes littérales présentes dans les
 * sources : `bg-${std.color}` était transparent. On déclare ici une table
 * de correspondance, ce qui force Tailwind à voir les classes complètes.
 */
const STANDARD_DOT_BG: Record<IsoStandardCode, string> = {
    'ISO 45001': 'bg-red-700',
    'ISO 14001': 'bg-emerald-700',
    'ISO 9001':  'bg-blue-700',
    'ISO 19011': 'bg-indigo-700',
    'ISO 31000': 'bg-amber-700',
};

/**
 * IsoMappingPage — Cartographie clauses ISO ↔ modules SafeX 360.
 *
 * Deux vues complémentaires :
 *
 *   1. Vue "ISO → modules" (tableau)
 *      Pour chaque clause ISO, liste les modules SafeX qui la couvrent.
 *      C'est la vue privilégiée par un auditeur externe ISO 19011 :
 *      "Montrez-moi comment vous couvrez la clause 6.1.2 d'ISO 45001."
 *
 *   2. Vue "Modules → ISO" (cartes)
 *      Pour chaque module, liste les clauses qu'il instrumente.
 *      Vue utile en interne : "Sur quelle base ISO repose ce module ?"
 *
 * Cette page est la source unique de vérité pour les badges ISO
 * affichés ailleurs dans la plateforme.
 */

// ─────────────────────────────────────────────────────────────────────────────
//  COMPOSANT PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function IsoMappingPage() {
    const [viewMode, setViewMode] = useState<'matrix' | 'modules'>('matrix');
    const [searchTerm, setSearchTerm] = useState('');
    const [standardFilter, setStandardFilter] = useState<IsoStandardCode | 'all'>('all');
    const stats = useMemo(() => coverageStats(), []);

    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-6 lg:px-10 py-6">
            <div className="max-w-[1500px] mx-auto">

                {/* ═══ En-tête ═══ */}
                <div className="mb-6 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                            SafeX 360 · Conformité
                        </p>
                        <h1
                            className="text-slate-900 mt-1.5"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 500,
                                fontSize: '30px',
                                letterSpacing: '-0.018em',
                            }}
                        >
                            Cartographie ISO &harr; modules
                        </h1>
                        <p className="text-[13.5px] text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                            Traçabilité fonctionnelle des clauses ISO 45001, 14001, 9001, 19011 et 31000
                            avec les modules SafeX 360 qui les instrumentent.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <StatPill icon={IconCertificate} label="Normes" value={ISO_STANDARDS.length} />
                        <StatPill icon={IconShieldCheck} label="Clauses couvertes" value={stats.total} />
                        <StatPill icon={IconLayoutGrid} label="Modules" value={SAFEX_MODULES.length} />
                    </div>
                </div>

                {/* ═══ Couverture par norme ═══ */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                    {ISO_STANDARDS.map((std) => (
                        <button
                            key={std.code}
                            type="button"
                            onClick={() =>
                                setStandardFilter(standardFilter === std.code ? 'all' : std.code)
                            }
                            className={`text-left rounded-lg border p-3 transition-all ${
                                standardFilter === std.code
                                    ? 'border-teal-300 bg-teal-50/40 shadow-sm'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${STANDARD_DOT_BG[std.code]}`} />
                                <p className="text-[12px] tracking-tight text-slate-900">{std.code}</p>
                            </div>
                            <p className="text-[10.5px] text-slate-500 leading-snug mb-2 min-h-[2.5em] line-clamp-2">
                                {std.fullName}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-400">{std.year}</span>
                                <span className="text-[11px] text-slate-700">
                                    {stats.byStandard[std.code]} clauses
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* ═══ Contrôles ═══ */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 mb-5">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                        <SegmentedControl
                            value={viewMode}
                            onChange={(v) => setViewMode(v as any)}
                            data={[
                                { value: 'matrix', label: (
                                    <span className="inline-flex items-center gap-1.5">
                                        <IconList size={13} /> Matrice
                                    </span>
                                ) as any },
                                { value: 'modules', label: (
                                    <span className="inline-flex items-center gap-1.5">
                                        <IconLayoutGrid size={13} /> Par module
                                    </span>
                                ) as any },
                            ]}
                            color="teal"
                            size="sm"
                        />

                        <TextInput
                            placeholder="Rechercher une clause, un titre…"
                            leftSection={<IconSearch size={14} className="text-slate-400" />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.currentTarget.value)}
                            radius="md"
                            size="sm"
                            className="flex-1"
                            styles={{ input: { fontSize: '13px' } }}
                        />

                        <Select
                            value={standardFilter}
                            onChange={(v) => setStandardFilter(((v as IsoStandardCode) || 'all') as any)}
                            data={[
                                { value: 'all', label: 'Toutes les normes' },
                                ...ISO_STANDARDS.map((s) => ({ value: s.code, label: s.code })),
                            ]}
                            radius="md"
                            size="sm"
                            allowDeselect={false}
                            styles={{ input: { fontSize: '13px' } }}
                            className="lg:w-[200px]"
                        />
                    </div>
                </div>

                {/* ═══ Contenu ═══ */}
                {viewMode === 'matrix' ? (
                    <MatrixView searchTerm={searchTerm} standardFilter={standardFilter} />
                ) : (
                    <ModulesView searchTerm={searchTerm} standardFilter={standardFilter} />
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Vue 1 — Matrice (tableau clauses)
// ─────────────────────────────────────────────────────────────────────────────
function MatrixView({
    searchTerm,
    standardFilter,
}: {
    searchTerm: string;
    standardFilter: IsoStandardCode | 'all';
}) {
    const navigate = useNavigate();

    const filtered = useMemo(() => {
        const needle = searchTerm.toLowerCase();
        return ISO_CLAUSES.filter((c) => {
            if (standardFilter !== 'all' && c.standard !== standardFilter) return false;
            if (!needle) return true;
            return (
                c.title.toLowerCase().includes(needle) ||
                c.code.toLowerCase().includes(needle) ||
                c.standard.toLowerCase().includes(needle)
            );
        });
    }, [searchTerm, standardFilter]);

    if (filtered.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-10 text-center">
                <p className="text-[13.5px] text-slate-500">
                    Aucune clause ne correspond à ces filtres.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/70 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-[10.5px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">
                                Norme
                            </th>
                            <th className="px-4 py-3 text-[10.5px] uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">
                                Clause
                            </th>
                            <th className="px-4 py-3 text-[10.5px] uppercase tracking-[0.14em] text-slate-500">
                                Intitulé
                            </th>
                            <th className="px-4 py-3 text-[10.5px] uppercase tracking-[0.14em] text-slate-500">
                                Modules couvrants
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((clause) => {
                            const modules = SAFEX_MODULES.filter((m) => clause.coveredBy.includes(m.id));
                            const stdMeta = ISO_STANDARDS.find((s) => s.code === clause.standard);
                            return (
                                <tr key={clause.code} className="hover:bg-slate-50/40 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-700">
                                            <span className={`w-2 h-2 rounded-full ${stdMeta ? STANDARD_DOT_BG[stdMeta.code] : 'bg-slate-400'}`} />
                                            {clause.standard}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-[12.5px] font-mono text-slate-800 whitespace-nowrap">
                                        {clause.code}
                                    </td>
                                    <td className="px-4 py-3 text-[13px] text-slate-800">
                                        {clause.title}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {modules.map((m) => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => m.routes[0] && navigate(m.routes[0])}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-teal-50 border border-teal-100 text-teal-800 hover:bg-teal-100 transition-colors"
                                                    title={m.description}
                                                >
                                                    {m.label}
                                                    <IconArrowRight size={10} />
                                                </button>
                                            ))}
                                            {modules.length === 0 && (
                                                <Badge size="xs" color="gray" variant="light">
                                                    Aucun module
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-[11.5px] text-slate-500">
                    {filtered.length} clause{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
                </span>
                <span className="text-[11px] text-slate-400">
                    Source de vérité : <span className="font-mono">data/IsoMappingData.ts</span>
                </span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Vue 2 — Par module (cartes)
// ─────────────────────────────────────────────────────────────────────────────
function ModulesView({
    searchTerm,
    standardFilter,
}: {
    searchTerm: string;
    standardFilter: IsoStandardCode | 'all';
}) {
    const navigate = useNavigate();

    const modules = useMemo(() => {
        return SAFEX_MODULES.map((m) => {
            let clauses = clausesForModule(m.id);
            if (standardFilter !== 'all') {
                clauses = clauses.filter((c) => c.standard === standardFilter);
            }
            if (searchTerm.trim()) {
                const needle = searchTerm.toLowerCase();
                if (
                    !m.label.toLowerCase().includes(needle) &&
                    !m.description.toLowerCase().includes(needle)
                ) {
                    clauses = clauses.filter(
                        (c) =>
                            c.title.toLowerCase().includes(needle) ||
                            c.code.toLowerCase().includes(needle),
                    );
                }
            }
            return { module: m, clauses };
        }).filter((entry) => entry.clauses.length > 0);
    }, [searchTerm, standardFilter]);

    if (modules.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-10 text-center">
                <p className="text-[13.5px] text-slate-500">
                    Aucun module ne correspond à ces filtres.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {modules.map(({ module, clauses }) => (
                <div
                    key={module.id}
                    className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col"
                >
                    <button
                        type="button"
                        onClick={() => module.routes[0] && navigate(module.routes[0])}
                        className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 flex items-start justify-between gap-3 text-left hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex-1 min-w-0">
                            <h3
                                className="text-slate-900"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 500,
                                    fontSize: '16px',
                                    letterSpacing: '-0.008em',
                                }}
                            >
                                {module.label}
                            </h3>
                            <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">
                                {module.description}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge size="xs" color="teal" variant="light" radius="sm">
                                {clauses.length} clause{clauses.length > 1 ? 's' : ''}
                            </Badge>
                            <IconArrowRight size={14} className="text-slate-400" />
                        </div>
                    </button>

                    <div className="divide-y divide-slate-100 flex-1">
                        {clauses.map((clause) => {
                            const stdMeta = ISO_STANDARDS.find((s) => s.code === clause.standard);
                            return (
                                <div key={clause.code} className="px-5 py-2.5 flex items-start gap-3">
                                    <span className={`mt-1 w-2 h-2 rounded-full ${stdMeta ? STANDARD_DOT_BG[stdMeta.code] : 'bg-slate-400'} flex-shrink-0`} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[12.5px] text-slate-800">
                                            <span className="font-mono text-slate-600 mr-2">{clause.code}</span>
                                            {clause.title}
                                        </p>
                                        <p className="text-[10.5px] uppercase tracking-[0.12em] text-slate-400 mt-0.5">
                                            {clause.standard}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Petit composant UI réutilisable
// ─────────────────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
    return (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-slate-200">
            <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Icon size={13} className="text-slate-600" />
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 leading-none">{label}</p>
                <p className="text-[14px] text-slate-900 mt-0.5 leading-none">{value}</p>
            </div>
        </div>
    );
}

// Re-export pour cohérence d'API (optional usage)
export type { SafeXModuleId };
