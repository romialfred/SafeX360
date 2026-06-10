import {
    GRAVITY_LABELS_FR,
    PROBABILITY_VALUE_LABELS_FR,
    formatDateFr,
    riskLevelFromKey,
    riskStatusConfig,
    scoreChip,
} from '../../riskLabels';
import { classificationConfig, hazardSourceLabel } from '../../../NewComponents/ChemicalRegister/chemicalLabels';

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
    const isChemical = Boolean(risk?.chemicalName || risk?.casNumber || risk?.classification);
    const classCfg = classificationConfig(risk?.classification);
    const statusCfg = riskStatusConfig(risk?.status);
    const levelCfg = riskLevelFromKey(assessment?.riskLevel ?? risk?.riskLevel);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
            <div className="xl:col-span-2 flex flex-col gap-4">
                {/* Informations générales */}
                <section className="bg-white rounded-xl border border-slate-200 p-4">
                    <CardTitle>Informations générales</CardTitle>
                    <dl className="space-y-3">
                        <Field label="Intitulé" value={risk?.title} />
                        <Field label="Description" value={risk?.description} />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Field label="Département" value={departmentMap[risk?.departmentId]?.name} />
                            <Field label="Processus" value={processMap[risk?.workProcessId]?.name} />
                            <Field label="Responsable" value={empMap[risk?.ownerId]?.name} />
                        </div>
                        {risk?.hazardSource && (
                            <Field
                                label="Source de danger"
                                value={isChemical ? hazardSourceLabel(risk.hazardSource) : risk.hazardSource}
                            />
                        )}
                        {risk?.potentialConsequences && (
                            <Field label="Conséquences potentielles" value={risk.potentialConsequences} />
                        )}
                    </dl>
                </section>

                {/* Produit chimique (uniquement pour un risque chimique) */}
                {isChemical && (
                    <section className="bg-white rounded-xl border border-slate-200 p-4">
                        <CardTitle>Produit chimique</CardTitle>
                        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Field label="Produit" value={risk?.chemicalName} />
                            <Field label="N° CAS" value={risk?.casNumber} />
                            <div>
                                <dt className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Classification SGH</dt>
                                <dd>
                                    {classCfg ? (
                                        <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${classCfg.chip}`}>
                                            <span className="font-medium">{classCfg.sgh}</span>
                                            {classCfg.label}
                                        </span>
                                    ) : (
                                        <span className="text-[12.5px] text-slate-400">—</span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                        {risk?.methodOfUse && (
                            <dl className="mt-3">
                                <Field label="Mode d'utilisation" value={risk.methodOfUse} />
                            </dl>
                        )}
                    </section>
                )}

                {/* Maîtrise du risque */}
                {assessment && (
                    <section className="bg-white rounded-xl border border-slate-200 p-4">
                        <CardTitle>Maîtrise du risque</CardTitle>
                        <dl className="space-y-3">
                            <Field label="Mesures de maîtrise actuelles" value={assessment.currentControls} />
                            {assessment.additionalControl && (
                                <Field label="Mesures complémentaires" value={assessment.additionalControl} />
                            )}
                            {assessment.preventiveMeasures && (
                                <Field label="Mesures préventives" value={assessment.preventiveMeasures} />
                            )}
                            {assessment.improvementsMeasures && (
                                <Field label="Mesures d'amélioration" value={assessment.improvementsMeasures} />
                            )}
                            {assessment.comments && <Field label="Commentaires" value={assessment.comments} />}
                        </dl>
                    </section>
                )}
            </div>

            <div className="flex flex-col gap-4">
                {/* Évaluation actuelle */}
                <section className="bg-white rounded-xl border border-slate-200 p-4">
                    <CardTitle>Évaluation actuelle</CardTitle>
                    {assessment ? (
                        <dl className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <ScoreChip
                                    label="Gravité"
                                    score={assessment.gravity}
                                    scoreLabel={GRAVITY_LABELS_FR[String(assessment.gravity)]}
                                />
                                <ScoreChip
                                    label="Probabilité"
                                    score={assessment.probability}
                                    scoreLabel={PROBABILITY_VALUE_LABELS_FR[String(assessment.probability)]}
                                />
                            </div>
                            <div>
                                <dt className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Niveau de risque</dt>
                                <dd>
                                    {levelCfg ? (
                                        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${levelCfg.chip}`}>
                                            {levelCfg.label}
                                        </span>
                                    ) : (
                                        <span className="text-[12.5px] text-slate-400">—</span>
                                    )}
                                </dd>
                            </div>
                            <Field label="Évaluée le" value={formatDateFr(assessment.createdAt)} />
                        </dl>
                    ) : (
                        <p className="text-[12.5px] text-slate-500">
                            Aucune évaluation enregistrée. Utilisez « Nouvelle évaluation » pour coter ce risque.
                        </p>
                    )}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                        <dt className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Statut du risque</dt>
                        <dd>
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                                {statusCfg.label}
                            </span>
                        </dd>
                    </div>
                </section>

                {/* Référence normative */}
                <section className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Référence normative</p>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                        {risk?.isoReference || 'ISO 45001 · 6.1.2 — Identification des dangers et évaluation des risques'}
                    </p>
                </section>
            </div>
        </div>
    );
};

export default RiskDetailOverview;
