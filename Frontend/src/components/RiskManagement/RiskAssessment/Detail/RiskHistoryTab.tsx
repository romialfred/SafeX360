import { Timeline } from '@mantine/core';
import { IconClipboardCheck } from '@tabler/icons-react';
import EmptyState from '../../../UtilityComp/EmptyState';
import { formatDateShort } from '../../../../utility/DateFormats';
import {
    GRAVITY_LABELS_FR,
    PROBABILITY_VALUE_LABELS_FR,
    riskLevelFromKey,
    scoreChip,
} from '../../riskLabels';

/**
 * Historique des évaluations d'un risque (LOT 50) — chronologie des
 * cotations successives avec les mesures documentées à chaque revue.
 */

const ScoreChip = ({ label, score, scoreLabel }: { label: string; score?: string | number | null; scoreLabel?: string }) => (
    <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">{label}</p>
        {score ? (
            <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${scoreChip(score)}`}>
                <span className="font-medium">{score}</span>
                {scoreLabel}
            </span>
        ) : (
            <span className="text-[12.5px] text-slate-400">—</span>
        )}
    </div>
);

const RiskHistoryTab = ({ revisionHistory }: any) => {
    if (!revisionHistory || revisionHistory.length === 0) {
        return (
            <EmptyState
                icon={<IconClipboardCheck size={24} />}
                title="Aucune évaluation enregistrée"
                description="Les cotations successives du risque apparaîtront ici, de la plus récente à la plus ancienne."
                compact
            />
        );
    }

    return (
        <Timeline active={revisionHistory.length} bulletSize={18} lineWidth={2} color="teal">
            {revisionHistory.slice().reverse().map((revision: any, index: number) => {
                const levelCfg = riskLevelFromKey(revision.riskLevel);
                return (
                    <Timeline.Item key={revision.id ?? index}>
                        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-2">
                            <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                                <p className="text-[12.5px] text-slate-700">
                                    Évaluation du {formatDateShort(revision.createdAt) || '—'}
                                </p>
                                {levelCfg && (
                                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${levelCfg.chip}`}>
                                        {levelCfg.label}
                                    </span>
                                )}
                            </div>

                            {revision.reason && (
                                <p className="text-[12px] text-slate-600 mb-3">
                                    <span className="text-slate-500">Motif : </span>
                                    {revision.reason}
                                </p>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                                <ScoreChip
                                    label="Gravité"
                                    score={revision.gravity}
                                    scoreLabel={GRAVITY_LABELS_FR[String(revision.gravity)]}
                                />
                                <ScoreChip
                                    label="Probabilité"
                                    score={revision.probability}
                                    scoreLabel={PROBABILITY_VALUE_LABELS_FR[String(revision.probability)]}
                                />
                            </div>

                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {revision.currentControls && (
                                    <div>
                                        <dt className="text-[11px] uppercase tracking-wider text-slate-500">Mesures actuelles</dt>
                                        <dd className="text-[12.5px] text-slate-700 mt-0.5 leading-relaxed">{revision.currentControls}</dd>
                                    </div>
                                )}
                                {revision.additionalControl && (
                                    <div>
                                        <dt className="text-[11px] uppercase tracking-wider text-slate-500">Mesures complémentaires</dt>
                                        <dd className="text-[12.5px] text-slate-700 mt-0.5 leading-relaxed">{revision.additionalControl}</dd>
                                    </div>
                                )}
                                {revision.preventiveMeasures && (
                                    <div>
                                        <dt className="text-[11px] uppercase tracking-wider text-slate-500">Mesures préventives</dt>
                                        <dd className="text-[12.5px] text-slate-700 mt-0.5 leading-relaxed">{revision.preventiveMeasures}</dd>
                                    </div>
                                )}
                                {revision.improvementsMeasures && (
                                    <div>
                                        <dt className="text-[11px] uppercase tracking-wider text-slate-500">Mesures d'amélioration</dt>
                                        <dd className="text-[12.5px] text-slate-700 mt-0.5 leading-relaxed">{revision.improvementsMeasures}</dd>
                                    </div>
                                )}
                                {revision.comments && (
                                    <div className="sm:col-span-2">
                                        <dt className="text-[11px] uppercase tracking-wider text-slate-500">Commentaires</dt>
                                        <dd className="text-[12.5px] text-slate-700 mt-0.5 leading-relaxed">{revision.comments}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </Timeline.Item>
                );
            })}
        </Timeline>
    );
};

export default RiskHistoryTab;
