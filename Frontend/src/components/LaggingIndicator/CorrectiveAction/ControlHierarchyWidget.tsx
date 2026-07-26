import { useEffect, useState } from 'react';
import { Loader } from '@mantine/core';
import { IconStairs } from '@tabler/icons-react';
import { getHierarchyCounts, type HierarchyCount } from '../../../services/CorrectiveActionService';
import { CONTROL_HIERARCHY_ORDER, CONTROL_HIERARCHY_CONFIG } from './correctiveLabels';

/**
 * Widget « mesures par niveau » (ISO 45001 §8.1.2) — indicateur de maturité HSE :
 * une mine qui traite ses risques par l'ingénierie/élimination est plus mûre
 * qu'une mine qui se repose sur l'EPI et les consignes. La part de mesures
 * « faibles » (EPI + administratif) est mise en évidence.
 */
const ControlHierarchyWidget = () => {
  const [counts, setCounts] = useState<HierarchyCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHierarchyCounts()
      .then((res) => setCounts(res))
      .catch(() => setCounts([]))
      .finally(() => setLoading(false));
  }, []);

  const byHierarchy: Record<string, number> = {};
  counts.forEach((c) => { if (c.hierarchy) byHierarchy[c.hierarchy] = c.total; });
  const total = Object.values(byHierarchy).reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...Object.values(byHierarchy));
  const weak = (byHierarchy.PPE || 0) + (byHierarchy.ADMINISTRATIVE || 0);
  const weakPct = total > 0 ? Math.round((weak / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 px-3.5 py-3">
      <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-slate-600 font-semibold">
          <IconStairs size={14} className="text-teal-600" /> Mesures par niveau de maîtrise
        </div>
        <div className="flex items-center gap-2">
          {!loading && total > 0 && (
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${weakPct > 50 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
              title="Part des mesures reposant sur l'EPI ou l'administratif (niveaux faibles)">
              {weakPct}% niveaux faibles
            </span>
          )}
          <span className="text-[10px] text-slate-400 italic hidden md:inline">ISO 45001 §8.1.2</span>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-1"><Loader size="sm" /> Chargement…</div>
      ) : total === 0 ? (
        <p className="text-[12.5px] text-slate-400 italic">Aucune action classée par hiérarchie de maîtrise pour l'instant.</p>
      ) : (
        // Rangée compacte de 5 mini-tuiles (haut → bas de la hiérarchie).
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {CONTROL_HIERARCHY_ORDER.map((h) => {
            const cfg = CONTROL_HIERARCHY_CONFIG[h];
            const n = byHierarchy[h] || 0;
            const pct = Math.round((n / max) * 100);
            return (
              <div key={h} className="rounded-lg border border-slate-200 bg-slate-50/40 px-2.5 py-2">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[11px] text-slate-500 truncate">{cfg.label}</span>
                  <span className="text-[17px] font-bold tabular-nums leading-none" style={{ color: '#12294A' }}>{n}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                  <div className={`h-full rounded-full ${cfg.chip}`} style={{ width: `${Math.max(n > 0 ? 6 : 0, pct)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ControlHierarchyWidget;
