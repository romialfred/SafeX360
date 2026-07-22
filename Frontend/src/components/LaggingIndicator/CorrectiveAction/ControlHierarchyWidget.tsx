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
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <header className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2">
        <IconStairs size={15} className="text-slate-600" />
        <h3 className="text-xs uppercase tracking-wider text-slate-700 flex-1">Mesures par niveau de maîtrise</h3>
        <span className="text-[10px] text-slate-400 italic hidden md:inline">ISO 45001 §8.1.2</span>
      </header>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader size="sm" /> Chargement…</div>
        ) : total === 0 ? (
          <p className="text-[12.5px] text-slate-400 italic">Aucune action classée par hiérarchie de maîtrise pour l'instant.</p>
        ) : (
          <div className="space-y-2.5">
            {CONTROL_HIERARCHY_ORDER.map((h) => {
              const cfg = CONTROL_HIERARCHY_CONFIG[h];
              const n = byHierarchy[h] || 0;
              const pct = Math.round((n / max) * 100);
              return (
                <div key={h} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[12px] text-slate-600">{cfg.label}</span>
                  <div className="flex-1 h-4 rounded bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded ${cfg.chip} border`} style={{ width: `${Math.max(n > 0 ? 8 : 0, pct)}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[12px] tabular-nums text-slate-700">{n}</span>
                </div>
              );
            })}
            <div className={`mt-2 rounded-md border px-3 py-2 text-[12px] ${weakPct > 50 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <strong>{weakPct}%</strong> des mesures reposent sur l'EPI ou l'administratif (niveaux faibles).
              {weakPct > 50 && ' Cherchez à remonter la hiérarchie (ingénierie, substitution, élimination).'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlHierarchyWidget;
