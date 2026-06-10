import { Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { formatDateShort } from '../../../utility/DateFormats';
import { riskLevelFromKey, riskStatusConfig } from '../riskLabels';

/**
 * Carte de risque du registre (LOT 50) — vue alternative au tableau,
 * chips de niveau et de statut charte R7.
 */
const RiskCards = ({ risk, department, process, owner }: any) => {
    const navigate = useNavigate();
    const statusCfg = riskStatusConfig(risk?.status);
    const levelCfg = riskLevelFromKey(risk?.riskLevel);

    return (
        <div className="rounded-xl border border-slate-200 p-3 bg-white flex flex-col gap-2">
            {/* Processus + statut */}
            <div className="flex gap-2 items-center justify-between flex-wrap">
                <span className="text-[11px] bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
                    {process || 'Processus non renseigné'}
                </span>
                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                    {statusCfg.label}
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
                    <dt>Responsable</dt>
                    <dd className="text-slate-700">{owner || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                    <dt>Département</dt>
                    <dd className="text-slate-700">{department || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2 items-center">
                    <dt>Niveau de risque</dt>
                    <dd>
                        {levelCfg ? (
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${levelCfg.chip}`}>
                                {levelCfg.label}
                            </span>
                        ) : (
                            <span className="text-slate-400">Non évalué</span>
                        )}
                    </dd>
                </div>
            </dl>

            {/* Pied de carte */}
            <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                    {risk.createdAt ? `Créé le ${formatDateShort(risk.createdAt)}` : ''}
                </span>
                <div className="flex gap-2">
                    <Button size="compact-xs" variant="default" onClick={() => navigate(`register-details/${risk.id}`)}>
                        Détail
                    </Button>
                    <Button size="compact-xs" variant="light" color="teal" onClick={() => navigate(`edit/${risk.id}`)}>
                        Modifier
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RiskCards;
