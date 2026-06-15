import { Timeline } from '@mantine/core';
import { IconClipboardCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../../../UtilityComp/EmptyState';
import { formatDateShort } from '../../../../utility/DateFormats';
import {
    GRAVITY_LABELS_FR,
    PROBABILITY_VALUE_LABELS_FR,
    riskLevelFromKey,
    scoreChip,
} from '../../riskLabels';
import { riskMap } from '../../../../Data/DropdownData';

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
    const { t } = useTranslation('risk');
    const tGravity = (g?: string | number | null) => g ? t(`severity.${g}`, { defaultValue: GRAVITY_LABELS_FR[String(g)] }) : undefined;
    const tProbability = (p?: string | number | null) => p ? t(`probability.${p}`, { defaultValue: PROBABILITY_VALUE_LABELS_FR[String(p)] }) : undefined;
    if (!revisionHistory || revisionHistory.length === 0) {
        return (
            <EmptyState
                icon={<IconClipboardCheck size={24} />}
                title={t('history.emptyTitle')}
                description={t('history.emptyDescription')}
                compact
            />
        );
    }

    return (
        <Timeline active={revisionHistory.length} bulletSize={18} lineWidth={2} color="teal">
            {revisionHistory.slice().reverse().map((revision: any, index: number) => {
                const levelCfg = riskLevelFromKey(revision.riskLevel);
                const levelLabel = levelCfg ? t(`level.${riskMap[String(revision.riskLevel)]?.level}`, { defaultValue: levelCfg.label }) : '';
                return (
                    <Timeline.Item key={revision.id ?? index}>
                        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-2">
                            <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                                <p className="text-[12.5px] text-slate-700">
                                    {t('history.assessmentOf', { date: formatDateShort(revision.createdAt) || '—' })}
                                </p>
                                {levelCfg && (
                                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${levelCfg.chip}`}>
                                        {levelLabel}
                                    </span>
                                )}
                            </div>

                            {revision.reason && (
                                <p className="text-[12px] text-slate-600 mb-3">
                                    <span className="text-slate-500">{t('history.reasonPrefix')}</span>
                                    {revision.reason}
                                </p>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                                <ScoreChip
                                    label={t('history.labelGravity')}
                                    score={revision.gravity}
                                    scoreLabel={tGravity(revision.gravity)}
                                />
                                <ScoreChip
                                    label={t('history.labelProbability')}
                                    score={revision.probability}
                                    scoreLabel={tProbability(revision.probability)}
                                />
                            </div>

                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {revision.currentControls && (
                                    <div>
                                        <dt className="text-[11px] uppercase tracking-wider text-slate-500">{t('history.labelCurrentControls')}</dt>
                                        <dd className="text-[12.5px] text-slate-700 mt-0.5 leading-relaxed">{revision.currentControls}</dd>
                                    </div>
                                )}
                                {revision.additionalControl && (
                                    <div>
                                        <dt className="text-[11px] uppercase tracking-wider text-slate-500">{t('history.labelAdditionalControls')}</dt>
                                        <dd className="text-[12.5px] text-slate-700 mt-0.5 leading-relaxed">{revision.additionalControl}</dd>
                                    </div>
                                )}
                                {revision.preventiveMeasures && (
                                    <div>
                                        <dt className="text-[11px] uppercase tracking-wider text-slate-500">{t('history.labelPreventive')}</dt>
                                        <dd className="text-[12.5px] text-slate-700 mt-0.5 leading-relaxed">{revision.preventiveMeasures}</dd>
                                    </div>
                                )}
                                {revision.improvementsMeasures && (
                                    <div>
                                        <dt className="text-[11px] uppercase tracking-wider text-slate-500">{t('history.labelImprovements')}</dt>
                                        <dd className="text-[12.5px] text-slate-700 mt-0.5 leading-relaxed">{revision.improvementsMeasures}</dd>
                                    </div>
                                )}
                                {revision.comments && (
                                    <div className="sm:col-span-2">
                                        <dt className="text-[11px] uppercase tracking-wider text-slate-500">{t('history.labelComments')}</dt>
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
