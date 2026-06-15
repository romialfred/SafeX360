import { useTranslation } from 'react-i18next';
import {
    GRAVITY_LABELS_FR,
    PROBABILITY_VALUE_LABELS_FR,
    formatDateFr,
    normalizeRiskStatus,
    riskLevelFromKey,
    riskStatusConfig,
    scoreChip,
} from '../../riskLabels';
import { classificationConfig, hazardSourceLabel } from '../../../NewComponents/ChemicalRegister/chemicalLabels';
import { riskMap } from '../../../../Data/DropdownData';

/**
 * Synthèse d'un risque (LOT 50) — partagée entre le registre des risques et
 * le registre chimique : informations générales, dernière évaluation et
 * mesures de maîtrise. Les champs produit (CAS, SGH) apparaissent
 * uniquement pour un risque chimique.
 */

const CardTitle = ({ children }: { children: React.ReactNode }) => (
    <h3
        className="text-slate-800 mb-3 pb-2 border-b border-slate-100"
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

const Field = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <div>
        <dt className="text-[11px] uppercase tracking-wider text-slate-500">{label}</dt>
        <dd className="text-[12.5px] text-slate-800 mt-0.5 leading-relaxed">{value ?? '—'}</dd>
    </div>
);

const ScoreChip = ({ label, score, scoreLabel }: { label: string; score?: string | number | null; scoreLabel?: string }) => (
    <div>
        <dt className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">{label}</dt>
        <dd>
            {score ? (
                <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${scoreChip(score)}`}>
                    <span className="font-medium">{score}</span>
                    {scoreLabel}
                </span>
            ) : (
                <span className="text-[12.5px] text-slate-400">—</span>
            )}
        </dd>
    </div>
);

const RiskDetailOverview = ({ risk, departmentMap, processMap, empMap, assessment }: any) => {
    const { t } = useTranslation('risk');
    const isChemical = Boolean(risk?.chemicalName || risk?.casNumber || risk?.classification);
    const classCfg = classificationConfig(risk?.classification);
    const statusCfg = riskStatusConfig(risk?.status);
    const levelKey = assessment?.riskLevel ?? risk?.riskLevel;
    const levelCfg = riskLevelFromKey(levelKey);
    const statusLabel = t(`status.${normalizeRiskStatus(risk?.status)}`, { defaultValue: statusCfg.label });
    const levelLabel = levelCfg ? t(`level.${riskMap[String(levelKey)]?.level}`, { defaultValue: levelCfg.label }) : '';
    const classLabel = classCfg ? t(`chemical.classification.${risk?.classification}`, { defaultValue: classCfg.label }) : '';
    const tGravity = (g?: string | number | null) => g ? t(`severity.${g}`, { defaultValue: GRAVITY_LABELS_FR[String(g)] }) : undefined;
    const tProbability = (p?: string | number | null) => p ? t(`probability.${p}`, { defaultValue: PROBABILITY_VALUE_LABELS_FR[String(p)] }) : undefined;
    const tHazardSource = (code?: string | null) => code ? t(`chemical.hazardSource.${code}`, { defaultValue: hazardSourceLabel(code) }) : undefined;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
            <div className="xl:col-span-2 flex flex-col gap-4">
                {/* Informations générales */}
                <section className="bg-white rounded-xl border border-slate-200 p-4">
                    <CardTitle>{t('overview.generalInfo')}</CardTitle>
                    <dl className="space-y-3">
                        <Field label={t('overview.labelTitle')} value={risk?.title} />
                        <Field label={t('overview.labelDescription')} value={risk?.description} />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Field label={t('overview.labelDepartment')} value={departmentMap[risk?.departmentId]?.name} />
                            <Field label={t('overview.labelProcess')} value={processMap[risk?.workProcessId]?.name} />
                            <Field label={t('overview.labelOwner')} value={empMap[risk?.ownerId]?.name} />
                        </div>
                        {risk?.hazardSource && (
                            <Field
                                label={t('overview.labelHazardSource')}
                                value={isChemical ? tHazardSource(risk.hazardSource) : risk.hazardSource}
                            />
                        )}
                        {risk?.potentialConsequences && (
                            <Field label={t('overview.labelConsequences')} value={risk.potentialConsequences} />
                        )}
                    </dl>
                </section>

                {/* Produit chimique (uniquement pour un risque chimique) */}
                {isChemical && (
                    <section className="bg-white rounded-xl border border-slate-200 p-4">
                        <CardTitle>{t('overview.chemicalProduct')}</CardTitle>
                        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Field label={t('overview.labelProduct')} value={risk?.chemicalName} />
                            <Field label={t('overview.labelCas')} value={risk?.casNumber} />
                            <div>
                                <dt className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">{t('overview.labelClassification')}</dt>
                                <dd>
                                    {classCfg ? (
                                        <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${classCfg.chip}`}>
                                            <span className="font-medium">{classCfg.sgh}</span>
                                            {classLabel}
                                        </span>
                                    ) : (
                                        <span className="text-[12.5px] text-slate-400">—</span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                        {risk?.methodOfUse && (
                            <dl className="mt-3">
                                <Field label={t('overview.labelMethodOfUse')} value={risk.methodOfUse} />
                            </dl>
                        )}
                    </section>
                )}

                {/* Maîtrise du risque */}
                {assessment && (
                    <section className="bg-white rounded-xl border border-slate-200 p-4">
                        <CardTitle>{t('overview.riskControl')}</CardTitle>
                        <dl className="space-y-3">
                            <Field label={t('overview.labelCurrentControls')} value={assessment.currentControls} />
                            {assessment.additionalControl && (
                                <Field label={t('overview.labelAdditionalControls')} value={assessment.additionalControl} />
                            )}
                            {assessment.preventiveMeasures && (
                                <Field label={t('overview.labelPreventive')} value={assessment.preventiveMeasures} />
                            )}
                            {assessment.improvementsMeasures && (
                                <Field label={t('overview.labelImprovements')} value={assessment.improvementsMeasures} />
                            )}
                            {assessment.comments && <Field label={t('overview.labelComments')} value={assessment.comments} />}
                        </dl>
                    </section>
                )}
            </div>

            <div className="flex flex-col gap-4">
                {/* Évaluation actuelle */}
                <section className="bg-white rounded-xl border border-slate-200 p-4">
                    <CardTitle>{t('overview.currentAssessment')}</CardTitle>
                    {assessment ? (
                        <dl className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <ScoreChip
                                    label={t('overview.labelGravity')}
                                    score={assessment.gravity}
                                    scoreLabel={tGravity(assessment.gravity)}
                                />
                                <ScoreChip
                                    label={t('overview.labelProbability')}
                                    score={assessment.probability}
                                    scoreLabel={tProbability(assessment.probability)}
                                />
                            </div>
                            <div>
                                <dt className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">{t('overview.labelRiskLevel')}</dt>
                                <dd>
                                    {levelCfg ? (
                                        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${levelCfg.chip}`}>
                                            {levelLabel}
                                        </span>
                                    ) : (
                                        <span className="text-[12.5px] text-slate-400">—</span>
                                    )}
                                </dd>
                            </div>
                            <Field label={t('overview.labelAssessedOn')} value={formatDateFr(assessment.createdAt)} />
                        </dl>
                    ) : (
                        <p className="text-[12.5px] text-slate-500">
                            {t('overview.noAssessment')}
                        </p>
                    )}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                        <dt className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">{t('overview.labelRiskStatus')}</dt>
                        <dd>
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                                {statusLabel}
                            </span>
                        </dd>
                    </div>
                </section>

                {/* Référence normative */}
                <section className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">{t('overview.normReference')}</p>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                        {risk?.isoReference || t('overview.defaultNorm')}
                    </p>
                </section>
            </div>
        </div>
    );
};

export default RiskDetailOverview;
