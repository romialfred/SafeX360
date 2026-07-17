/**
 * PlanningTab — Planification des cibles/previsions d'un indicateur HSE
 * (onglet « Planification des performances »).
 *
 * L'utilisateur choisit une annee + un indicateur planifiable
 * (getForecastableIndicators), le serveur renvoie le plan existant OU un
 * squelette pret a remplir (getPlan). Le tableau est editable ligne par ligne
 * (une ligne = une periode). L'ecart et le statut sont recalcules EN DIRECT
 * cote client (feedback immediat) avec la meme logique que le serveur, puis
 * savePlan renvoie le plan recalcule qui remplace l'etat local.
 *
 * La mine n'est JAMAIS demandee : l'intercepteur Axios injecte `?companyId=`.
 */

import { useEffect, useMemo, useState } from 'react';
import { Button, LoadingOverlay, NumberInput, Select } from '@mantine/core';
import { IconAlertOctagon, IconDeviceFloppy, IconTarget } from '@tabler/icons-react';

import {
    getForecastableIndicators,
    getPlan,
    savePlan,
    type IndicatorDTO,
    type IndicatorPlanDTO,
    type PlanEntryDTO,
} from '../../../services/IndicatorService';
import {
    directionLabel,
    frequencyLabel,
    numOrDash,
    periodLabelFr,
    periodLabelFrLong,
    periodStatusConfig,
    variancePctFr,
} from './indicatorLabels';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';
import { Z } from '../../../constants/zIndex';

/* Ecart + statut calcules cote client — logique IDENTIQUE au serveur. */
const computeVariance = (target?: number | null, actual?: number | null): number | null =>
    target && actual != null && target !== 0 ? ((actual - target) / Math.abs(target)) * 100 : null;

const computeStatus = (
    direction: IndicatorPlanDTO['direction'],
    target?: number | null,
    actual?: number | null,
): 'PENDING' | 'ON_TARGET' | 'OFF_TARGET' => {
    if (actual == null || target == null) return 'PENDING';
    if (direction === 'HIGHER_IS_BETTER') return actual >= target ? 'ON_TARGET' : 'OFF_TARGET';
    return actual <= target ? 'ON_TARGET' : 'OFF_TARGET';
};

/* Champ numerique -> number | null (Mantine 7 renvoie number | ''). */
const toNum = (v: number | string): number | null => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR + 1 - 2022 + 1 }, (_, i) => {
    const y = String(2022 + i);
    return { value: y, label: y };
});

function Chip({ children, className }: { children: React.ReactNode; className: string }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${className}`}>
            {children}
        </span>
    );
}

const PlanningTab = () => {
    const [forecastables, setForecastables] = useState<IndicatorDTO[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [year, setYear] = useState<string>(String(CURRENT_YEAR));
    const [indicatorId, setIndicatorId] = useState<string | null>(null);
    const [plan, setPlan] = useState<IndicatorPlanDTO | null>(null);
    const [loadingPlan, setLoadingPlan] = useState(false);
    const [planError, setPlanError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLoadingList(true);
        getForecastableIndicators()
            .then((list) => setForecastables(Array.isArray(list) ? list : []))
            .finally(() => setLoadingList(false));
    }, []);

    /* Chargement du plan des que annee + indicateur sont choisis. */
    useEffect(() => {
        if (!indicatorId) {
            setPlan(null);
            setPlanError(null);
            return;
        }
        let cancelled = false;
        setLoadingPlan(true);
        setPlanError(null);
        getPlan(Number(indicatorId), Number(year))
            .then((p) => {
                if (!cancelled) setPlan(p);
            })
            .catch(() => {
                if (!cancelled) {
                    setPlan(null);
                    setPlanError('Impossible de charger le plan pour cet indicateur.');
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingPlan(false);
            });
        return () => {
            cancelled = true;
        };
    }, [indicatorId, year]);

    const indicatorOptions = useMemo(
        () => forecastables.filter((i) => i.id != null).map((i) => ({ value: String(i.id), label: i.name })),
        [forecastables],
    );

    const setEntryField = (periodIndex: number, field: 'target' | 'forecast' | 'actual', value: number | string) => {
        setPlan((prev) =>
            prev
                ? {
                      ...prev,
                      entries: prev.entries.map((e) =>
                          e.periodIndex === periodIndex ? { ...e, [field]: toNum(value) } : e,
                      ),
                  }
                : prev,
        );
    };

    const handleSave = async () => {
        if (!plan) return;
        setSaving(true);
        try {
            const saved = await savePlan(plan);
            setPlan(saved);
            successNotification('Plan enregistre.');
        } catch (e: any) {
            errorNotification(e?.response?.data?.errorMessage || "Echec de l'enregistrement du plan.");
        } finally {
            setSaving(false);
        }
    };

    const hasForecastCol = plan?.hasForecast === true;
    const noForecastable = !loadingList && forecastables.length === 0;

    return (
        <div className="space-y-4">
            {/* Controles */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[640px]">
                    <Select
                        label="Annee de planification"
                        data={YEAR_OPTIONS}
                        value={year}
                        onChange={(v) => v && setYear(v)}
                        allowDeselect={false}
                    />
                    <Select
                        label="Indicateur a planifier"
                        placeholder={noForecastable ? 'Aucun indicateur planifiable' : 'Selectionner un indicateur'}
                        data={indicatorOptions}
                        value={indicatorId}
                        onChange={setIndicatorId}
                        disabled={noForecastable}
                        searchable
                        nothingFoundMessage="Aucun resultat"
                    />
                </div>
            </div>

            {/* Aucun indicateur planifiable */}
            {noForecastable && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center mb-4">
                        <IconTarget size={26} className="text-violet-600" stroke={1.6} />
                    </div>
                    <p className="text-[14px] text-slate-800 font-semibold mb-1">Aucun indicateur planifiable</p>
                    <p className="text-[12.5px] text-slate-500 max-w-md leading-relaxed">
                        Activez la Prevision sur un indicateur dans l'onglet « Indicateurs Sante-Securite » pour pouvoir en planifier les cibles.
                    </p>
                </div>
            )}

            {/* Invite : aucun indicateur choisi */}
            {!noForecastable && !indicatorId && !loadingPlan && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 border border-violet-200 flex items-center justify-center mb-4">
                        <IconTarget size={26} className="text-violet-700" stroke={1.6} />
                    </div>
                    <p className="text-[14px] text-slate-800 font-semibold mb-1">Selectionnez un indicateur</p>
                    <p className="text-[12.5px] text-slate-500 max-w-md leading-relaxed">
                        Choisissez une annee et un indicateur ci-dessus pour afficher et editer son plan de cibles et de previsions.
                    </p>
                </div>
            )}

            {/* Banner erreur plan */}
            {planError && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px]" role="alert">
                    <IconAlertOctagon size={14} stroke={1.8} className="mt-0.5 flex-shrink-0" />
                    <span>{planError}</span>
                </div>
            )}

            {/* Plan charge */}
            {plan && (
                <div className="relative bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <LoadingOverlay visible={loadingPlan || saving} zIndex={Z.overlay} overlayProps={{ radius: 'sm', blur: 2 }} />

                    {/* En-tete du plan */}
                    <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                            <h3
                                className="text-[15px] font-semibold text-slate-900"
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif", letterSpacing: '-0.01em' }}
                            >
                                Planification {frequencyLabel(plan.frequency).toLowerCase()} — {plan.indicatorName ?? '—'} {plan.year}
                            </h3>
                        </div>
                        <div className="flex items-center flex-wrap gap-2 text-[11.5px] text-slate-500">
                            {plan.unit && <span>Unite : <span className="text-slate-700">{plan.unit}</span></span>}
                            <Chip className="bg-slate-50 text-slate-600 border-slate-200">{frequencyLabel(plan.frequency)}</Chip>
                            <Chip className="bg-indigo-50 text-indigo-700 border-indigo-200">{directionLabel(plan.direction)}</Chip>
                        </div>
                    </div>

                    {/* Tableau editable */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12.5px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-slate-600">
                                    <th className="text-left px-3 py-2 font-medium">Periode</th>
                                    <th className="text-left px-3 py-2 font-medium">Cible</th>
                                    {hasForecastCol && <th className="text-left px-3 py-2 font-medium">Prevision</th>}
                                    <th className="text-left px-3 py-2 font-medium">Reel</th>
                                    <th className="text-left px-3 py-2 font-medium">Ecart</th>
                                    <th className="text-left px-3 py-2 font-medium">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plan.entries.map((entry: PlanEntryDTO) => {
                                    const variance = computeVariance(entry.target, entry.actual);
                                    const status = computeStatus(plan.direction, entry.target, entry.actual);
                                    const st = periodStatusConfig(status);
                                    return (
                                        <tr key={entry.periodIndex} className="border-b border-slate-100 hover:bg-slate-50/60 transition">
                                            <td className="px-3 py-2 text-slate-800 font-medium whitespace-nowrap" title={periodLabelFrLong(entry.periodLabel)}>
                                                {periodLabelFr(entry.periodLabel)}
                                            </td>
                                            <td className="px-3 py-1.5">
                                                <NumberInput
                                                    size="xs"
                                                    hideControls
                                                    allowDecimal
                                                    decimalScale={2}
                                                    value={entry.target ?? ''}
                                                    onChange={(v) => setEntryField(entry.periodIndex, 'target', v)}
                                                    placeholder="—"
                                                    className="w-24"
                                                    aria-label={`Cible ${periodLabelFrLong(entry.periodLabel)}`}
                                                />
                                            </td>
                                            {hasForecastCol && (
                                                <td className="px-3 py-1.5">
                                                    <NumberInput
                                                        size="xs"
                                                        hideControls
                                                        allowDecimal
                                                        decimalScale={2}
                                                        value={entry.forecast ?? ''}
                                                        onChange={(v) => setEntryField(entry.periodIndex, 'forecast', v)}
                                                        placeholder="—"
                                                        className="w-24"
                                                        aria-label={`Prevision ${periodLabelFrLong(entry.periodLabel)}`}
                                                    />
                                                </td>
                                            )}
                                            <td className="px-3 py-1.5">
                                                <NumberInput
                                                    size="xs"
                                                    hideControls
                                                    allowDecimal
                                                    decimalScale={2}
                                                    value={entry.actual ?? ''}
                                                    onChange={(v) => setEntryField(entry.periodIndex, 'actual', v)}
                                                    placeholder="—"
                                                    className="w-24"
                                                    aria-label={`Reel ${periodLabelFrLong(entry.periodLabel)}`}
                                                />
                                            </td>
                                            <td className="px-3 py-2 tabular-nums">
                                                {/* Couleur de l'ecart derivee du STATUT (qui tient compte de la
                                                    direction), jamais du signe brut : pour un indicateur « plus haut =
                                                    mieux », un ecart positif est bon (vert), pas mauvais. */}
                                                <span className={
                                                    variance == null
                                                        ? 'text-slate-400'
                                                        : status === 'ON_TARGET'
                                                          ? 'text-emerald-600'
                                                          : status === 'OFF_TARGET'
                                                            ? 'text-rose-600'
                                                            : 'text-slate-600'
                                                }>
                                                    {variance == null ? numOrDash(null) : variancePctFr(variance)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${st.chip}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} aria-hidden="true" />
                                                    {st.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pied : enregistrement */}
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
                        <Button
                            color="violet"
                            leftSection={<IconDeviceFloppy size={15} stroke={1.8} />}
                            onClick={handleSave}
                            disabled={saving}
                            loading={saving}
                        >
                            Enregistrer le plan
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanningTab;
