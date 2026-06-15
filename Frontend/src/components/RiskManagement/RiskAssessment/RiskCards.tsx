import { Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDateShort } from '../../../utility/DateFormats';
import { normalizeRiskStatus, riskLevelFromKey, riskStatusConfig } from '../riskLabels';
import { riskMap } from '../../../Data/DropdownData';

/**
 * Carte d'un risque évalué (LOT 50) — vue alternative au tableau,
 * avec la date de la dernière évaluation.
 */
const RiskCards = ({ risk, department, process, owner }: any) => {
    const navigate = useNavigate();
    const { t } = useTranslation('risk');
    const statusCfg = riskStatusConfig(risk?.status);
    const levelCfg = riskLevelFromKey(risk?.riskLevel);
    const statusLabel = t(`status.${normalizeRiskStatus(risk?.status)}`, { defaultValue: statusCfg.label });
    const levelLabel = levelCfg ? t(`level.${riskMap[String(risk?.riskLevel)]?.level}`, { defaultValue: levelCfg.label }) : '';
    const updatedLabel = risk?.updatedAt ? formatDateShort(risk.updatedAt) : '';
    const createdLabel = risk?.createdAt ? formatDateShort(risk.createdAt) : '';
    const dateLabel = updatedLabel
        ? t('assessmentCard.assessedOn', { date: updatedLabel })
        : createdLabel
            ? t('assessmentCard.createdOn', { date: createdLabel })
            : '';

    return (
        <div className="rounded-xl border border-slate-200 p-3 bg-white flex flex-col gap-2">
            {/* Processus + statut */}
            <div className="flex gap-2 items-center justify-between flex-wrap">
                <span className="text-[11px] bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
                    {process || t('common.processNotSet')}
                </span>
                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                    {statusLabel}
                </span>
            </div>

            {/* Intitulé */}
            <p className="text-[13px] text-slate-800 leading-snug">{risk.title}</p>

            {/* Description */}
            {risk.description && (
                <p className="text-[11.5px] text-slate-500 line-clamp-2">{risk.description}</p>
            )}

            {/* Informations */}
            <dl className="text-[11.5px] text-slate-500 space-y-1 mt-1">
                <div className="flex justify-between gap-2">
                    <dt>{t('common.owner')}</dt>
                    <dd className="text-slate-700">{owner || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                    <dt>{t('common.department')}</dt>
                    <dd className="text-slate-700">{department || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2 items-center">
                    <dt>{t('common.riskLevel')}</dt>
                    <dd>
                        {levelCfg ? (
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${levelCfg.chip}`}>
                                {levelLabel}
                            </span>
                        ) : (
                            <span className="text-slate-400">{t('common.notAssessed')}</span>
                        )}
                    </dd>
                </div>
            </dl>

            {/* Pied de carte */}
            <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">{dateLabel}</span>
                <Button size="compact-xs" variant="default" onClick={() => navigate(`register-details/${risk.id}`)}>
                    {t('common.detail')}
                </Button>
            </div>
        </div>
    );
};

export default RiskCards;
