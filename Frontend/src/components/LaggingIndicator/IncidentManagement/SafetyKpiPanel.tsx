import { useEffect, useState } from 'react';
import { Select, Loader, Tooltip } from '@mantine/core';
import {
  IconChartHistogram, IconBandage, IconActivity, IconAlertTriangle, IconClockHour4,
  IconArrowUpRight, IconArrowDownRight, IconMinus, IconSettings,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { getKpi, type SafetyKpi } from '../../../services/SafetyMetricsService';
import { OUTCOME_CONFIG } from './IncidentInjuriesPanel';

/**
 * Indicateurs de fréquence des lésions (ISO 45001 §9.1.1 — ILO/OSHA) : LTIFR,
 * TRIFR, taux de gravité (par million d'heures). La SAISIE des heures travaillées
 * (dénominateur) se fait dans Paramètres › Outils & Templates › Heures de travail.
 */

const CURRENT_YEAR = new Date().getFullYear();

type Tone = { icon: any; accent: string; text: string; iconChip: string };
// STRUCTURE PLUTOT QUE TEINTE : fond blanc, bordure franche et lisere de couleur
// a gauche. Les fonds pastel tres transparents (/35) avec une bordure a 70 % ne
// delimitaient rien — quatre valeurs flottaient dans un meme bloc.
const TONES: Record<string, Tone> = {
  ltifr: { icon: IconBandage, accent: 'border-l-rose-400', text: 'text-rose-700', iconChip: 'bg-rose-50 border-rose-200 text-rose-600' },
  trifr: { icon: IconActivity, accent: 'border-l-amber-400', text: 'text-amber-700', iconChip: 'bg-amber-50 border-amber-200 text-amber-600' },
  severity: { icon: IconAlertTriangle, accent: 'border-l-violet-400', text: 'text-violet-700', iconChip: 'bg-violet-50 border-violet-200 text-violet-600' },
  hours: { icon: IconClockHour4, accent: 'border-l-teal-400', text: 'text-teal-700', iconChip: 'bg-teal-50 border-teal-200 text-teal-600' },
};

/** Valeur absente : on l'ecrit « N/A ». Un tiret se confond avec un signe moins. */
const NO_VALUE = 'N/A';

/**
 * Puce de variation vs mois precedent. lowerIsBetter : baisse = vert (bon).
 *
 * Trois etats, tous trois nommes — l'affichage precedent montrait un tiret aussi
 * bien pour « pas de point de comparaison » que pour « aucune variation », deux
 * situations pourtant tres differentes a lire.
 */
const Delta = ({ delta, lowerIsBetter = true }: { delta: number | null; lowerIsBetter?: boolean }) => {
  if (delta == null) {
    return (
      <Tooltip label="Pas de mois précédent renseigné : variation incalculable">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-[10.5px] font-medium text-slate-400">
          {NO_VALUE}
        </span>
      </Tooltip>
    );
  }
  const flat = Math.abs(delta) < 0.005;
  const good = lowerIsBetter ? delta < 0 : delta > 0;
  const color = flat
    ? 'text-slate-500 bg-slate-100 border-slate-200'
    : good ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200';
  const Icon = flat ? IconMinus : delta > 0 ? IconArrowUpRight : IconArrowDownRight;
  return (
    <Tooltip label={flat ? 'Stable par rapport au mois précédent' : 'Variation vs mois précédent (mois renseignés)'}>
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[10.5px] font-medium tabular-nums ${color}`}>
        <Icon size={11} /> {flat ? 'stable' : `${delta > 0 ? '+' : ''}${delta.toFixed(2)}`}
      </span>
    </Tooltip>
  );
};

const KpiTile = ({ toneKey, label, value, hint, delta, lowerIsBetter }: {
  toneKey: keyof typeof TONES; label: string; value: string; hint: string; delta?: number | null; lowerIsBetter?: boolean;
}) => {
  const tone = TONES[toneKey];
  const Icon = tone.icon;
  const missing = value === NO_VALUE;
  return (
    <div className={`rounded-xl bg-white border border-slate-200 border-l-[3px] ${tone.accent} px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-colors hover:border-slate-300`}>
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 ${tone.iconChip}`}>
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 leading-tight truncate">{label}</p>
          {/* Une valeur absente reste en gris : elle ne doit pas se lire comme un
              indicateur au vert. */}
          <p className={`text-xl font-semibold tabular-nums leading-tight ${missing ? 'text-slate-400' : tone.text}`}>{value}</p>
        </div>
        {delta !== undefined && <Delta delta={delta ?? null} lowerIsBetter={lowerIsBetter} />}
      </div>
      <p className="text-[10.5px] text-slate-400 mt-1.5 truncate">{hint}</p>
    </div>
  );
};

const SafetyKpiPanel = () => {
  const navigate = useNavigate();
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [kpi, setKpi] = useState<SafetyKpi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getKpi(year).then(setKpi).catch(() => setKpi(null)).finally(() => setLoading(false));
  }, [year]);

  const fmt = (v: number | null | undefined) => (v == null ? NO_VALUE : String(v));

  // Variation : deux derniers mois RENSEIGNÉS (heures > 0).
  const withData = (kpi?.monthly ?? []).filter((m) => m.hoursWorked > 0);
  const last = withData[withData.length - 1];
  const prev = withData[withData.length - 2];
  const delta = (sel: (m: NonNullable<typeof last>) => number | null): number | null => {
    if (!last || !prev) return null;
    const a = sel(last); const b = sel(prev);
    if (a == null || b == null) return null;
    return Math.round((a - b) * 100) / 100;
  };

  const yearOptions = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((y) => ({ value: String(y), label: String(y) }));

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <header className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2">
        <IconChartHistogram size={15} className="text-slate-600" />
        <h3 className="text-xs uppercase tracking-wider text-slate-700 flex-1">Indicateurs de fréquence (LTIFR / TRIFR)</h3>
        <Tooltip label="Saisir les heures travaillées (Paramètres)">
          <button type="button" onClick={() => navigate('/parameters/tools-templates?tab=worked-hours')}
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-teal-600 transition-colors">
            <IconSettings size={13} /> Heures travaillées
          </button>
        </Tooltip>
        <Select size="xs" w={90} data={yearOptions} value={String(year)} onChange={(v) => setYear(Number(v) || CURRENT_YEAR)} comboboxProps={{ withinPortal: true }} />
      </header>
      <div className="p-3 space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader size="sm" /> Chargement…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <KpiTile toneKey="ltifr" label="LTIFR" value={fmt(kpi?.ltifr)} hint="Accidents avec arrêt / M h" delta={delta((m) => m.ltifr)} lowerIsBetter />
              <KpiTile toneKey="trifr" label="TRIFR" value={fmt(kpi?.trifr)} hint="Enregistrables / M h" delta={delta((m) => m.trifr)} lowerIsBetter />
              <KpiTile toneKey="severity" label="Taux de gravité" value={fmt(kpi?.severityRate)} hint="Jours perdus / M h" delta={delta((m) => m.severityRate)} lowerIsBetter />
              <KpiTile toneKey="hours" label="Heures travaillées" value={kpi ? kpi.hoursWorked.toLocaleString('fr-FR') : NO_VALUE} hint={`${year}`} delta={delta((m) => m.hoursWorked)} lowerIsBetter={false} />
            </div>

            {kpi && kpi.hoursWorked === 0 && (
              <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2.5">
                Aucune heure travaillée saisie pour {year} : les taux sont indéfinis.{' '}
                <button type="button" className="underline hover:text-amber-900" onClick={() => navigate('/parameters/tools-templates?tab=worked-hours')}>
                  Renseignez les heures dans Paramètres › Outils & Templates › Heures de travail
                </button>.
              </p>
            )}

            {/* Repartition par issue — bloc distinct : ces compteurs ne sont pas des
                taux, les meler aux tuiles laissait croire a une seule et meme serie. */}
            {kpi && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                  Répartition par issue
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(OUTCOME_CONFIG) as (keyof typeof OUTCOME_CONFIG)[]).map((o) => (
                    <span key={o} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md border ${OUTCOME_CONFIG[o].chip}`}>
                      {OUTCOME_CONFIG[o].label} : <strong className="tabular-nums">{kpi.outcomeBreakdown?.[o] ?? 0}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SafetyKpiPanel;
