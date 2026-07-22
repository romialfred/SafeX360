import { useEffect, useState } from 'react';
import { Select, NumberInput, Button, Loader } from '@mantine/core';
import { IconChartHistogram, IconDeviceFloppy } from '@tabler/icons-react';
import {
  getKpi, listWorkedHours, upsertWorkedHours, type SafetyKpi, type WorkedHours,
} from '../../../services/SafetyMetricsService';
import { successNotification } from '../../../utility/NotificationUtility';
import { notifyError } from '../../../utility/notifyError';
import { OUTCOME_CONFIG } from './IncidentInjuriesPanel';

/**
 * Indicateurs de fréquence des lésions (ISO 45001 §9.1.1 — ILO/OSHA) : LTIFR,
 * TRIFR, taux de gravité (par million d'heures) + saisie des heures travaillées
 * (dénominateur). Cloisonné mine (companyId auto-injecté).
 */

const MONTHS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
const CURRENT_YEAR = new Date().getFullYear();

const Kpi = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
    <p className="text-[10.5px] uppercase tracking-wider text-slate-500">{label}</p>
    <p className="text-2xl text-slate-800 tabular-nums leading-none mt-1">{value}</p>
    <p className="text-[11px] text-slate-500 mt-1">{hint}</p>
  </div>
);

const SafetyKpiPanel = () => {
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [kpi, setKpi] = useState<SafetyKpi | null>(null);
  const [hours, setHours] = useState<WorkedHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<string | null>(null);
  const [monthHours, setMonthHours] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const load = (y: number) => {
    setLoading(true);
    Promise.allSettled([getKpi(y), listWorkedHours(y)])
      .then(([k, h]) => {
        setKpi(k.status === 'fulfilled' ? k.value : null);
        setHours(h.status === 'fulfilled' ? h.value : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(year); /* eslint-disable-next-line */ }, [year]);

  const fmt = (v: number | null | undefined) => (v == null ? '—' : String(v));

  const saveHours = () => {
    if (!month || monthHours == null) return;
    setSaving(true);
    upsertWorkedHours({ year, month: Number(month), hours: monthHours })
      .then(() => {
        successNotification('Heures travaillées enregistrées');
        setMonth(null); setMonthHours(undefined);
        load(year);
      })
      .catch((e) => notifyError(e, "Enregistrement des heures impossible"))
      .finally(() => setSaving(false));
  };

  const yearOptions = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((y) => ({ value: String(y), label: String(y) }));

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <header className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2">
        <IconChartHistogram size={15} className="text-slate-600" />
        <h3 className="text-xs uppercase tracking-wider text-slate-700 flex-1">Indicateurs de fréquence (LTIFR / TRIFR)</h3>
        <Select size="xs" w={90} data={yearOptions} value={String(year)} onChange={(v) => setYear(Number(v) || CURRENT_YEAR)} comboboxProps={{ withinPortal: true }} />
      </header>
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader size="sm" /> Chargement…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="LTIFR" value={fmt(kpi?.ltifr)} hint="Accidents avec arrêt / M h" />
              <Kpi label="TRIFR" value={fmt(kpi?.trifr)} hint="Enregistrables / M h" />
              <Kpi label="Taux de gravité" value={fmt(kpi?.severityRate)} hint="Jours perdus / M h" />
              <Kpi label="Heures travaillées" value={kpi ? kpi.hoursWorked.toLocaleString('fr-FR') : '—'} hint={`${year}`} />
            </div>

            {kpi && kpi.hoursWorked === 0 && (
              <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2.5">
                Aucune heure travaillée saisie pour {year} : les taux sont indéfinis. Renseignez les heures ci-dessous.
              </p>
            )}

            {/* Répartition par issue */}
            {kpi && (
              <div className="flex flex-wrap gap-2">
                {(Object.keys(OUTCOME_CONFIG) as (keyof typeof OUTCOME_CONFIG)[]).map((o) => (
                  <span key={o} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded border ${OUTCOME_CONFIG[o].chip}`}>
                    {OUTCOME_CONFIG[o].label} : <strong>{kpi.outcomeBreakdown?.[o] ?? 0}</strong>
                  </span>
                ))}
              </div>
            )}

            {/* Saisie des heures travaillées */}
            <div className="border-t border-slate-200 pt-3">
              <p className="text-[12px] font-medium text-slate-700 mb-2">Heures travaillées (dénominateur) — {year}</p>
              <div className="flex flex-wrap items-end gap-2">
                <Select size="xs" w={130} label="Mois" placeholder="Choisir" data={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
                  value={month} onChange={setMonth} comboboxProps={{ withinPortal: true }} />
                <NumberInput size="xs" w={160} label="Heures" min={0} thousandSeparator=" " value={monthHours} onChange={(v) => setMonthHours(typeof v === 'number' ? v : undefined)} />
                <Button size="xs" variant="light" disabled={!month || monthHours == null || saving} leftSection={<IconDeviceFloppy size={14} />} onClick={saveHours}>Enregistrer</Button>
                {hours.length > 0 && (
                  <span className="text-[11px] text-slate-500">{hours.length} mois saisi(s) · {hours.reduce((a, b) => a + (b.hours || 0), 0).toLocaleString('fr-FR')} h</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SafetyKpiPanel;
