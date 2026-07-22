import { useEffect, useMemo, useState } from 'react';
import { Select, NumberInput, Button, Loader, TextInput, Badge } from '@mantine/core';
import { IconClockHour4, IconBuildingFactory2, IconUsersGroup, IconPlus, IconInfoCircle, IconCalendarMonth } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import {
  listWorkedHoursEntries, upsertWorkedHoursEntry,
  type WorkedHoursEntry,
} from '../../../services/SafetyMetricsService';
import { getDepartmentsByCompany } from '../../../services/HrmsService';
import { successNotification } from '../../../utility/NotificationUtility';
import { notifyError } from '../../../utility/notifyError';

/**
 * Heures travaillées par DÉPARTEMENT / SOUS-TRAITANT et par mois (ISO 45001 §9.1.1).
 * Matrice éditable : la somme de toutes les cellules constitue le dénominateur des
 * taux LTIFR / TRIFR / gravité. Cloisonné mine (companyId auto-injecté).
 */

const MONTHS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
const CURRENT_YEAR = new Date().getFullYear();

type Row = { key: string; label: string; kind: 'DEPARTMENT' | 'SUBCONTRACTOR'; departmentId?: number; subcontractorName?: string };
type Grid = Record<string, Record<number, number | undefined>>; // rowKey -> month -> hours

const WorkedHoursManager = () => {
  const companyId = useSelector((s: any) => s.companySelection?.selectedCompanyId ?? null);
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [subRows, setSubRows] = useState<string[]>([]);
  const [grid, setGrid] = useState<Grid>({});
  const [loading, setLoading] = useState(true);
  const [newSub, setNewSub] = useState('');
  const [savingCell, setSavingCell] = useState<string | null>(null);

  const load = () => {
    if (companyId == null) { setLoading(false); return; }
    setLoading(true);
    Promise.all([getDepartmentsByCompany(Number(companyId)), listWorkedHoursEntries(year)])
      .then(([deps, entries]: [any[], WorkedHoursEntry[]]) => {
        setDepartments((deps || []).map((d: any) => ({ id: d.id, name: d.name })));
        const g: Grid = {};
        const subs = new Set<string>();
        (entries || []).forEach((e) => {
          const key = e.departmentId != null ? `d:${e.departmentId}` : `s:${e.subcontractorName}`;
          if (e.subcontractorName) subs.add(e.subcontractorName);
          g[key] = g[key] || {};
          if (e.month != null) g[key][e.month] = e.hours ?? undefined;
        });
        setGrid(g);
        setSubRows(Array.from(subs));
      })
      .catch(() => { setDepartments([]); setGrid({}); })
      .finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [companyId, year]);

  const rows: Row[] = useMemo(() => [
    ...departments.map((d) => ({ key: `d:${d.id}`, label: d.name, kind: 'DEPARTMENT' as const, departmentId: d.id })),
    ...subRows.map((s) => ({ key: `s:${s}`, label: s, kind: 'SUBCONTRACTOR' as const, subcontractorName: s })),
  ], [departments, subRows]);

  const rowTotal = (key: string) => Object.values(grid[key] || {}).reduce<number>((a, b) => a + (b ?? 0), 0);
  const monthTotal = (m: number) => rows.reduce<number>((a, r) => a + (grid[r.key]?.[m] ?? 0), 0);
  const grandTotal = rows.reduce<number>((a, r) => a + rowTotal(r.key), 0);

  const setCell = (key: string, month: number, val: number | undefined) => {
    setGrid((g) => ({ ...g, [key]: { ...(g[key] || {}), [month]: val } }));
  };

  const saveCell = (row: Row, month: number) => {
    const val = grid[row.key]?.[month];
    if (val == null) return; // rien à enregistrer
    const cellId = `${row.key}:${month}`;
    setSavingCell(cellId);
    const dto: WorkedHoursEntry = {
      year, month, hours: val,
      departmentId: row.kind === 'DEPARTMENT' ? row.departmentId : null,
      subcontractorName: row.kind === 'SUBCONTRACTOR' ? row.subcontractorName : null,
    };
    upsertWorkedHoursEntry(dto)
      .then(() => successNotification(`${row.label} · ${MONTHS[month - 1]} enregistré`))
      .catch((e) => notifyError(e, "Enregistrement des heures impossible"))
      .finally(() => setSavingCell(null));
  };

  const addSub = () => {
    const name = newSub.trim();
    if (!name || subRows.includes(name)) return;
    setSubRows((s) => [...s, name]);
    setNewSub('');
  };

  const yearOptions = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((y) => ({ value: String(y), label: String(y) }));

  if (companyId == null) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <IconInfoCircle size={18} className="shrink-0" />
        Sélectionnez une <strong>mine précise</strong> dans le bandeau (vue « Toutes les mines » exclue) pour saisir ses heures travaillées.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-slate-600">
          <IconClockHour4 size={18} />
          <span className="text-sm">
            Total <strong>{grandTotal.toLocaleString('fr-FR')} h</strong> saisies pour {year}
          </span>
        </div>
        <Select size="xs" w={100} data={yearOptions} value={String(year)} onChange={(v) => setYear(Number(v) || CURRENT_YEAR)} comboboxProps={{ withinPortal: true }} />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-6"><Loader size="sm" /> Chargement…</div>
      ) : (
        <>
          {/* Mini-tableau de bord */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'Heures saisies', value: grandTotal.toLocaleString('fr-FR'), tone: 'border-teal-100 bg-teal-50/60 text-teal-700', Icon: IconClockHour4 },
              { label: 'Départements', value: departments.length, tone: 'border-cyan-100 bg-cyan-50/60 text-cyan-700', Icon: IconBuildingFactory2 },
              { label: 'Sous-traitants', value: subRows.length, tone: 'border-violet-100 bg-violet-50/60 text-violet-700', Icon: IconUsersGroup },
              { label: 'Mois renseignés', value: MONTHS.filter((_, i) => monthTotal(i + 1) > 0).length, tone: 'border-amber-100 bg-amber-50/60 text-amber-700', Icon: IconCalendarMonth },
            ].map((s, i) => (
              <div key={i} className={`rounded-lg border px-3 py-2 flex items-center gap-2.5 ${s.tone}`}>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/70 border border-white/60 shrink-0"><s.Icon size={17} stroke={1.7} /></span>
                <div className="min-w-0">
                  <p className="text-[19px] leading-none font-semibold tabular-nums">{s.value}</p>
                  <p className="text-[10.5px] uppercase tracking-wide text-slate-500 mt-1 truncate">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="sticky left-0 z-10 bg-slate-50 text-left px-3 py-2 text-[11px] uppercase tracking-wide text-slate-500 min-w-[200px]">Périmètre</th>
                  {MONTHS.map((m) => (
                    <th key={m} className="px-1 py-2 text-[11px] text-slate-500 font-medium text-center min-w-[84px]">{m}</th>
                  ))}
                  <th className="px-3 py-2 text-[11px] uppercase tracking-wide text-slate-500 text-right min-w-[90px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={14} className="px-3 py-6 text-center text-slate-400 text-[13px]">Aucun département pour cette mine.</td></tr>
                )}
                {rows.map((r) => (
                  <tr key={r.key} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="sticky left-0 z-10 bg-white px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        {r.kind === 'DEPARTMENT'
                          ? <IconBuildingFactory2 size={14} className="text-slate-400 shrink-0" />
                          : <IconUsersGroup size={14} className="text-violet-400 shrink-0" />}
                        <span className="text-[13px] text-slate-700 truncate max-w-[160px]" title={r.label}>{r.label}</span>
                        {r.kind === 'SUBCONTRACTOR' && <Badge size="xs" color="violet" variant="light">Sous-traitant</Badge>}
                      </div>
                    </td>
                    {MONTHS.map((_, i) => {
                      const month = i + 1;
                      const cellId = `${r.key}:${month}`;
                      return (
                        <td key={month} className="px-0.5 py-1 text-center">
                          <NumberInput
                            size="xs"
                            hideControls
                            min={0}
                            thousandSeparator=" "
                            placeholder="—"
                            value={grid[r.key]?.[month] ?? ''}
                            onChange={(v) => setCell(r.key, month, typeof v === 'number' ? v : undefined)}
                            onBlur={() => saveCell(r, month)}
                            classNames={{ input: `text-center !px-1 ${savingCell === cellId ? '!border-teal-400' : ''}` }}
                            styles={{ input: { minWidth: 72 } }}
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-1 text-right tabular-nums text-[13px] text-slate-700">{rowTotal(r.key).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-600">Total mensuel</td>
                    {MONTHS.map((_, i) => (
                      <td key={i} className="px-1 py-2 text-center tabular-nums text-[12px] text-slate-600">{monthTotal(i + 1).toLocaleString('fr-FR')}</td>
                    ))}
                    <td className="px-3 py-2 text-right tabular-nums text-[13px] font-semibold text-slate-800">{grandTotal.toLocaleString('fr-FR')}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Ajout d'un sous-traitant */}
          <div className="flex items-end gap-2">
            <TextInput
              size="xs" className="max-w-[280px]" label="Ajouter un sous-traitant"
              placeholder="Nom du sous-traitant (ex. Forage SA)"
              value={newSub} onChange={(e) => setNewSub(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addSub(); }}
            />
            <Button size="xs" variant="light" color="violet" leftSection={<IconPlus size={14} />} disabled={!newSub.trim()} onClick={addSub}>
              Ajouter
            </Button>
          </div>

          <p className="flex items-start gap-1.5 text-[11px] text-slate-400">
            <IconInfoCircle size={13} className="mt-0.5 shrink-0" />
            Saisissez les heures travaillées mois par mois. La valeur est enregistrée automatiquement en quittant la cellule. La somme de toutes les cellules alimente les taux LTIFR / TRIFR / gravité de la mine.
          </p>
        </>
      )}
    </div>
  );
};

export default WorkedHoursManager;
