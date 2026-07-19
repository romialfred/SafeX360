import { useMemo, useState } from 'react';
import {
    IconBook2,
    IconCalendarEvent,
    IconExternalLink,
    IconFileDescription,
    IconLock,
    IconSearch,
    IconUserCheck,
} from '@tabler/icons-react';
import { Breadcrumbs, TextInput } from '@mantine/core';
import { Link } from 'react-router-dom';
import { ISO_REGISTRY_VERSION, ISO_STANDARDS, type IsoStandardCode } from '../../../Data/IsoMappingData';

const STANDARD_ACCENT: Record<IsoStandardCode, { dot: string; selected: string }> = {
    'ISO 45001': { dot: 'bg-red-700', selected: 'border-red-300 bg-red-50' },
    'ISO 14001': { dot: 'bg-emerald-700', selected: 'border-emerald-300 bg-emerald-50' },
    'ISO 9001': { dot: 'bg-blue-700', selected: 'border-blue-300 bg-blue-50' },
    'ISO 19011': { dot: 'bg-indigo-700', selected: 'border-indigo-300 bg-indigo-50' },
    'ISO 31000': { dot: 'bg-amber-700', selected: 'border-amber-300 bg-amber-50' },
};

/**
 * Centre de références contrôlées.
 *
 * SafeX conserve uniquement des métadonnées et des notes d'impact internes.
 * Le texte normatif protégé n'est ni copié, ni téléchargé, ni redistribué.
 */
const ISODocuments = () => {
    const [selectedCode, setSelectedCode] = useState<IsoStandardCode>('ISO 45001');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStandards = useMemo(() => {
        const needle = searchTerm.trim().toLocaleLowerCase('fr');
        if (!needle) return ISO_STANDARDS;
        return ISO_STANDARDS.filter((standard) => [
            standard.code,
            standard.fullName,
            `${standard.year}`,
            standard.ownerRole,
            standard.impactStatement,
        ].some((value) => value.toLocaleLowerCase('fr').includes(needle)));
    }, [searchTerm]);

    const selected = ISO_STANDARDS.find((standard) => standard.code === selectedCode) ?? ISO_STANDARDS[0];

    return (
        <main className="flex w-full flex-col gap-4 bg-stone-50 px-4 py-5 sm:px-5 lg:px-6">
            <header className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Documentation › Référentiels</p>
                    <h1 className="mt-1 text-[clamp(19px,2vw,24px)] font-medium text-slate-900 [font-family:'Source_Serif_4',Georgia,serif]">
                        Registre des références ISO
                    </h1>
                    <Breadcrumbs mt="xs" separator="›">
                        <Link className="text-[12px] text-slate-500 hover:underline" to="/">Accueil</Link>
                        <span className="text-[12px] font-medium text-teal-800">Références ISO</span>
                    </Breadcrumbs>
                </div>
                <Link
                    to="/iso-mapping"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-3 py-2 text-[12px] font-medium text-white hover:bg-teal-800"
                >
                    <IconFileDescription aria-hidden size={15} />
                    Ouvrir la cartographie des preuves
                </Link>
            </header>

            <section aria-labelledby="rights-notice-title" className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                <div className="flex items-start gap-2.5">
                    <IconLock aria-hidden size={17} className="mt-0.5 shrink-0 text-indigo-700" />
                    <div>
                        <h2 id="rights-notice-title" className="text-[12.5px] font-semibold text-indigo-950">Droits de reproduction maîtrisés</h2>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-indigo-900">
                            Cette page contient seulement des métadonnées, des liens officiels et des notes d’impact SafeX.
                            Elle ne reproduit pas le texte des normes. L’accès au contenu intégral dépend d’une licence acquise
                            auprès d’ISO ou de l’organisme national autorisé.
                        </p>
                    </div>
                </div>
            </section>

            <TextInput
                aria-label="Rechercher un référentiel ISO"
                placeholder="Rechercher par norme, édition, propriétaire ou impact"
                leftSection={<IconSearch aria-hidden size={15} className="text-slate-400" />}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.currentTarget.value)}
                size="sm"
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                <nav aria-label="Référentiels ISO" className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <h2 className="mb-2 text-[10.5px] uppercase tracking-[0.12em] text-slate-500">Éditions contrôlées</h2>
                    <div className="space-y-2">
                        {filteredStandards.map((standard) => {
                            const selectedItem = selected.code === standard.code;
                            return (
                                <button
                                    key={standard.code}
                                    type="button"
                                    onClick={() => setSelectedCode(standard.code)}
                                    aria-pressed={selectedItem}
                                    className={`w-full rounded-lg border p-3 text-left hover:border-slate-300 ${selectedItem ? STANDARD_ACCENT[standard.code].selected : 'border-slate-200 bg-white'}`}
                                >
                                    <span className="flex items-center gap-2 text-[12.5px] font-medium text-slate-900">
                                        <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${STANDARD_ACCENT[standard.code].dot}`} />
                                        {standard.code}:{standard.year}
                                    </span>
                                    <span className="mt-1 block text-[10.5px] leading-snug text-slate-600">{standard.fullName}</span>
                                    <span className="mt-1 block text-[10px] text-slate-500">Édition {standard.edition} · {standard.lifecycleStatus === 'PUBLISHED' ? 'publiée' : 'en publication'}</span>
                                </button>
                            );
                        })}
                        {filteredStandards.length === 0 && (
                            <p className="rounded-lg bg-slate-50 p-4 text-center text-[11.5px] text-slate-500">Aucun référentiel trouvé.</p>
                        )}
                    </div>
                </nav>

                <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <header className="border-b border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                                    <IconBook2 aria-hidden size={18} className="text-slate-700" />
                                </div>
                                <div>
                                    <h2 className="text-[17px] font-medium text-slate-900">{selected.code}:{selected.year}</h2>
                                    <p className="mt-0.5 text-[12px] text-slate-600">{selected.fullName}</p>
                                </div>
                            </div>
                            <a
                                href={selected.officialSource}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-[11.5px] font-medium text-slate-800 hover:bg-slate-100"
                            >
                                Consulter la fiche ISO officielle
                                <IconExternalLink aria-hidden size={14} />
                            </a>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                        <MetadataCard icon={IconFileDescription} label="Référence contrôlée" value={`${selected.code}:${selected.year} · édition ${selected.edition}`} />
                        <MetadataCard icon={IconCalendarEvent} label="Publication" value={selected.publicationDate} />
                        <MetadataCard icon={IconUserCheck} label="Propriétaire" value={selected.ownerRole} />
                        <MetadataCard icon={IconCalendarEvent} label="Dernière revue" value={selected.reviewedAt} />
                        <MetadataCard icon={IconCalendarEvent} label="Prochaine revue" value={selected.nextReviewDate} />
                        <MetadataCard icon={IconUserCheck} label="Approbation" value={selected.approvalStatus === 'APPROVED' ? 'Approuvée' : 'Approbation humaine en attente'} />
                        <MetadataCard icon={IconFileDescription} label="Version du registre" value={ISO_REGISTRY_VERSION} />
                        <MetadataCard icon={IconLock} label="Contenu intégral" value="Licence externe requise" />
                    </div>

                    <section aria-labelledby="impact-title" className="mx-4 mb-4 rounded-lg border border-slate-200 p-3">
                        <h3 id="impact-title" className="text-[10.5px] uppercase tracking-[0.12em] text-slate-500">Analyse d’impact enregistrée</h3>
                        <p className="mt-1.5 text-[12px] leading-relaxed text-slate-800">{selected.impactStatement}</p>
                        {selected.amendment && <p className="mt-1 text-[11px] text-slate-600">Complément suivi : {selected.amendment}</p>}
                    </section>

                    <section aria-labelledby="approval-title" className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                        <h3 id="approval-title" className="text-[10.5px] uppercase tracking-[0.12em] text-slate-500">Validation nécessaire avant usage d’audit</h3>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-slate-700">
                            Le propriétaire du référentiel doit confirmer l’applicabilité, l’achat ou la licence, l’analyse
                            de transition, la formation des personnes concernées et l’approbation des méthodes internes.
                            SafeX conserve cette limite et ne présente pas la fiche comme une certification.
                        </p>
                    </section>
                </article>
            </div>
        </main>
    );
};

function MetadataCard({ icon: Icon, label, value }: { icon: typeof IconBook2; label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-2 text-slate-500">
                <Icon aria-hidden size={14} />
                <span className="text-[9.5px] uppercase tracking-[0.1em]">{label}</span>
            </div>
            <p className="mt-1.5 text-[12px] font-medium text-slate-800">{value}</p>
        </div>
    );
}

export default ISODocuments;
