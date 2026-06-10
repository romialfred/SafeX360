import { Badge } from '@mantine/core';
import {
    IconFile,
    IconFileTypeDoc,
    IconFileTypePdf,
    IconFileTypeXls,
    IconPhoto,
    IconPresentation,
} from '@tabler/icons-react';
import { getFriendlyFileType } from '../../utility/DocumentUtility';
import {
    DOC_CATEGORY_COLORS,
    accessLevelConfig,
    docCategoryLabel,
    docStatusConfig,
    formatDateFr,
} from './documentLabels';

/**
 * Onglet « Détails » de la fiche document : informations générales à gauche,
 * dates clés à droite. Données issues du backend uniquement.
 */

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
    PDF: <IconFileTypePdf size={16} className="text-rose-500" />,
    Word: <IconFileTypeDoc size={16} className="text-sky-500" />,
    Excel: <IconFileTypeXls size={16} className="text-emerald-500" />,
    PowerPoint: <IconPresentation size={16} className="text-orange-500" />,
    Image: <IconPhoto size={16} className="text-violet-500" />,
};

const getFileTypeIcon = (fileType?: string) =>
    FILE_TYPE_ICONS[fileType ?? ''] ?? <IconFile size={16} className="text-slate-400" />;

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-3 py-1.5 border-t border-slate-100">
        <dt className="text-slate-500 flex-shrink-0">{label}</dt>
        <dd className="text-slate-800 text-right">{children}</dd>
    </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3
        className="text-slate-800"
        style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
        }}
    >
        {children}
    </h3>
);

const DocumentDetails = ({ document, version, empMap, departmentMap }: any) => {
    const statusCfg = docStatusConfig(document?.status);
    const accessCfg = accessLevelConfig(document?.accessLevel);
    const fileType = getFriendlyFileType(version?.mediaType);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
            <div className="xl:col-span-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                        <SectionTitle>Informations générales</SectionTitle>
                        <div className="flex items-center gap-2">
                            {getFileTypeIcon(fileType)}
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                                {statusCfg.label}
                            </span>
                        </div>
                    </div>

                    <p className="text-[12.5px] text-slate-600 leading-relaxed mb-3">
                        {document?.description || 'Aucune description renseignée.'}
                    </p>

                    <dl className="grid grid-cols-1 gap-0 text-[12.5px]">
                        <InfoRow label="Catégorie">
                            <Badge
                                color={DOC_CATEGORY_COLORS[document?.category ?? ''] ?? 'gray'}
                                variant="light"
                                size="sm"
                                radius="sm"
                            >
                                {docCategoryLabel(document?.category)}
                            </Badge>
                        </InfoRow>
                        <InfoRow label="Type de fichier">{fileType || '—'}</InfoRow>
                        <InfoRow label="Propriétaire">{empMap[document?.ownerId]?.name ?? '—'}</InfoRow>
                        <InfoRow label="Département">{departmentMap[document?.departmentId]?.name ?? '—'}</InfoRow>
                        <InfoRow label="Niveau d'accès">
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${accessCfg.chip}`}>
                                {accessCfg.label}
                            </span>
                        </InfoRow>
                        <InfoRow label="Version courante">
                            {version?.version ? `v${version.version}` : '—'}
                        </InfoRow>
                    </dl>

                    {document?.tags?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-[11.5px] text-slate-500 mb-1.5">Étiquettes</p>
                            <div className="flex flex-wrap gap-1.5">
                                {document.tags.map((tag: string, index: number) => (
                                    <Badge key={index} variant="outline" color="gray" size="sm" radius="sm">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="xl:col-span-2">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 pb-3 border-b border-slate-100">
                        <SectionTitle>Dates clés</SectionTitle>
                    </div>
                    <dl className="grid grid-cols-1 gap-0 text-[12.5px]">
                        <InfoRow label="Créé le">{formatDateFr(document?.createdAt)}</InfoRow>
                        <InfoRow label="Modifié le">{formatDateFr(document?.updatedAt)}</InfoRow>
                        {document?.approvalDate && (
                            <InfoRow label="Approuvé le">{formatDateFr(document?.approvalDate)}</InfoRow>
                        )}
                        {document?.reviewDate && (
                            <InfoRow label="Prochaine révision">{formatDateFr(document?.reviewDate)}</InfoRow>
                        )}
                        {document?.expiryDate && (
                            <InfoRow label="Expire le">
                                <span className="text-amber-700">{formatDateFr(document?.expiryDate)}</span>
                            </InfoRow>
                        )}
                    </dl>
                </div>
            </div>
        </div>
    );
};

export default DocumentDetails;
