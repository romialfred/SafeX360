import { Badge } from '@mantine/core';
import { getFriendlyFileType } from '../../utility/DocumentUtility';
import {
    accessLevelConfig,
    docCategoryLabel,
    docStatusConfig,
    formatDateFr,
} from './documentLabels';

/**
 * Onglet « Métadonnées » : fiche signalétique complète du document
 * (identification, gestion, dates, versions) en lecture seule.
 */

const MetaRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-3 py-1.5 border-t border-slate-100">
        <dt className="text-slate-500 flex-shrink-0">{label}</dt>
        <dd className="text-slate-800 text-right">{children}</dd>
    </div>
);

const MetaGroupTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10.5px] uppercase tracking-[0.12em] text-slate-500 font-medium mb-1">
        {children}
    </p>
);

const DocumentMetadata = ({ document, versions, empMap, departmentMap }: any) => {
    const statusCfg = docStatusConfig(document?.status);
    const accessCfg = accessLevelConfig(document?.accessLevel);
    const latestVersion = versions?.length ? versions[versions.length - 1] : null;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="mb-3 pb-3 border-b border-slate-100">
                <h3
                    className="text-slate-800"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: '14px',
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                    }}
                >
                    Fiche signalétique
                </h3>
                <p className="text-[11.5px] text-slate-500">
                    Métadonnées complètes du document, telles qu'enregistrées dans le référentiel
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-[12.5px]">
                <div>
                    <MetaGroupTitle>Identification</MetaGroupTitle>
                    <dl>
                        <MetaRow label="Nom">{document?.documentName ?? '—'}</MetaRow>
                        <MetaRow label="Catégorie">{docCategoryLabel(document?.category)}</MetaRow>
                        <MetaRow label="Type de fichier">
                            {getFriendlyFileType(latestVersion?.mediaType) || '—'}
                        </MetaRow>
                    </dl>
                </div>

                <div>
                    <MetaGroupTitle>Gestion</MetaGroupTitle>
                    <dl>
                        <MetaRow label="Propriétaire">{empMap[document?.ownerId]?.name ?? '—'}</MetaRow>
                        <MetaRow label="Département">{departmentMap[document?.departmentId]?.name ?? '—'}</MetaRow>
                        <MetaRow label="Statut">
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                                {statusCfg.label}
                            </span>
                        </MetaRow>
                        <MetaRow label="Niveau d'accès">
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${accessCfg.chip}`}>
                                {accessCfg.label}
                            </span>
                        </MetaRow>
                    </dl>
                </div>

                <div>
                    <MetaGroupTitle>Dates</MetaGroupTitle>
                    <dl>
                        <MetaRow label="Créé le">{formatDateFr(document?.createdAt)}</MetaRow>
                        <MetaRow label="Modifié le">{formatDateFr(document?.updatedAt)}</MetaRow>
                        {document?.approvalDate && (
                            <MetaRow label="Approuvé le">{formatDateFr(document?.approvalDate)}</MetaRow>
                        )}
                        {document?.reviewDate && (
                            <MetaRow label="Prochaine révision">{formatDateFr(document?.reviewDate)}</MetaRow>
                        )}
                        {document?.expiryDate && (
                            <MetaRow label="Expire le">{formatDateFr(document?.expiryDate)}</MetaRow>
                        )}
                    </dl>
                </div>

                <div>
                    <MetaGroupTitle>Versions</MetaGroupTitle>
                    <dl>
                        <MetaRow label="Version courante">
                            {latestVersion?.version ? `v${latestVersion.version}` : '—'}
                        </MetaRow>
                        <MetaRow label="Nombre de versions">{versions?.length ?? 0}</MetaRow>
                    </dl>
                </div>
            </div>

            {document?.tags?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                    <MetaGroupTitle>Étiquettes</MetaGroupTitle>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        {document.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" color="gray" size="sm" radius="sm">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100">
                <MetaGroupTitle>Description complète</MetaGroupTitle>
                <p className="text-[12.5px] text-slate-600 leading-relaxed mt-1">
                    {document?.description || 'Aucune description renseignée.'}
                </p>
            </div>
        </div>
    );
};

export default DocumentMetadata;
