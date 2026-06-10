import { ActionIcon, Timeline, Tooltip } from '@mantine/core';
import { IconDownload, IconEye, IconVersions } from '@tabler/icons-react';
import EmptyState from '../UtilityComp/EmptyState';
import { formatDateFr } from './documentLabels';

/**
 * Onglet « Historique des versions » : chronologie des dépôts, de la version
 * la plus récente à la plus ancienne, avec consultation et téléchargement.
 */

const DocumentHistory = ({ versions, downloadDocument, openDocument }: any) => {
    const orderedVersions = (versions ?? []).slice().reverse();

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                <h3
                    className="text-slate-800"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: '14px',
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                    }}
                >
                    Historique des versions
                </h3>
                <span className="text-[11.5px] text-slate-500">
                    {orderedVersions.length} version{orderedVersions.length > 1 ? 's' : ''}
                </span>
            </div>

            {!orderedVersions.length ? (
                <EmptyState
                    icon={<IconVersions size={24} />}
                    title="Aucune version déposée"
                    description="La première version apparaîtra ici dès son dépôt."
                    compact
                />
            ) : (
                <Timeline active={orderedVersions.length} bulletSize={18} lineWidth={2} color="teal">
                    {orderedVersions.map((version: any, index: number) => (
                        <Timeline.Item
                            key={version.id}
                            title={
                                <span className="text-[13px] text-slate-800">
                                    Version {version?.version}
                                    {index === 0 && (
                                        <span className="ml-2 inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-emerald-700">
                                            Courante
                                        </span>
                                    )}
                                </span>
                            }
                        >
                            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 mb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[12.5px] text-slate-800 truncate">{version.mediaName}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Déposée le {formatDateFr(version.createdAt)}
                                        </p>
                                    </div>
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        <Tooltip label="Consulter cette version" withArrow>
                                            <ActionIcon
                                                variant="light"
                                                size="sm"
                                                color="teal"
                                                onClick={() => openDocument(version.mediaId)}
                                                aria-label="Consulter cette version"
                                            >
                                                <IconEye size={14} stroke={1.5} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="Télécharger cette version" withArrow>
                                            <ActionIcon
                                                variant="light"
                                                size="sm"
                                                color="blue"
                                                onClick={() => downloadDocument(version.mediaId)}
                                                aria-label="Télécharger cette version"
                                            >
                                                <IconDownload size={14} stroke={1.5} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </div>
                                </div>
                                {version.description && (
                                    <p className="text-[12px] text-slate-600 mt-2 leading-relaxed">
                                        {version.description}
                                    </p>
                                )}
                            </div>
                        </Timeline.Item>
                    ))}
                </Timeline>
            )}
        </div>
    );
};

export default DocumentHistory;
