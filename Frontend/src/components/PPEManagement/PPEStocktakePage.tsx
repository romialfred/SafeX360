import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Modal, NumberInput, TextInput, Textarea, Tooltip } from '@mantine/core';
import { IconClipboardCheck, IconDeviceFloppy, IconHistory, IconSearch } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { getActivePPE } from '../../services/PPEService';
import { createStocktake, getAllStocktakes, validateStocktake } from '../../services/PPEStocktakeService';
import { notifyError } from '../../utility/notifyError';
import PageHeader from '../UtilityComp/PageHeader';
import EmptyState from '../UtilityComp/EmptyState';
import { CHIP_BASE, formatDateFr, ppeCategoryLabel, stocktakeStatusConfig } from './ppeLabels';

/**
 * Inventaire physique EPI (incrément 5). L'opérateur saisit la quantité COMPTÉE de
 * chaque EPI ; l'écart avec le stock système s'affiche en direct. La validation
 * réconcilie le stock via le journal de mouvements (ajustements tracés) — jamais de
 * mutation directe. « Brouillon » enregistre sans toucher au stock.
 */
type CountRow = { ppeId: number; name: string; category: string; system: number; counted: number | '' };

const PPEStocktakePage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [rows, setRows] = useState<CountRow[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [search, setSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const loadHistory = () => {
        getAllStocktakes()
            .then((data) => setHistory(Array.isArray(data) ? data : []))
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        getActivePPE()
            .then((data: any[]) => {
                setRows(
                    (data || []).map((p) => ({
                        ppeId: p.id,
                        name: p.name,
                        category: p.category,
                        system: p.stock ?? 0,
                        counted: p.stock ?? 0, // défaut = système → écart 0 tant que non modifié
                    }))
                );
            })
            .catch((err) => console.error(err));
        loadHistory();
    }, []);

    const setCounted = (ppeId: number, value: number | '') =>
        setRows((prev) => prev.map((r) => (r.ppeId === ppeId ? { ...r, counted: value } : r)));

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) => `${r.name} ${ppeCategoryLabel(r.category)}`.toLowerCase().includes(q));
    }, [rows, search]);

    // Lignes en écart (compté ≠ système) — ce sont elles qui généreront un ajustement.
    const discrepancies = useMemo(
        () => rows.filter((r) => r.counted !== '' && Number(r.counted) !== r.system),
        [rows]
    );

    const buildPayload = () => ({
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        lines: rows
            .filter((r) => r.counted !== '')
            .map((r) => ({ ppeId: r.ppeId, countedQuantity: Number(r.counted) })),
    });

    // Brouillon : enregistre le comptage sans toucher au stock.
    const handleSaveDraft = async () => {
        if (!rows.length) return;
        try {
            setSubmitting(true);
            dispatch(showOverlay());
            await createStocktake(buildPayload());
            successNotification('Inventaire enregistré en brouillon');
            loadHistory();
        } catch (err: any) {
            notifyError(err, "Échec de l'enregistrement de l'inventaire");
        } finally {
            setSubmitting(false);
            dispatch(hideOverlay());
        }
    };

    // Validation : crée puis clôture l'inventaire → les écarts sont passés en
    // ajustements de stock (mouvements tracés). Le stock système est aligné sur le réel.
    const handleValidate = async () => {
        try {
            setSubmitting(true);
            dispatch(showOverlay());
            const created = await createStocktake(buildPayload());
            await validateStocktake(created.id);
            successNotification(
                discrepancies.length
                    ? `Inventaire validé — ${discrepancies.length} écart(s) ajusté(s)`
                    : 'Inventaire validé — aucun écart'
            );
            setConfirmOpen(false);
            navigate('/ppe-management');
        } catch (err: any) {
            notifyError(err, "Échec de la validation de l'inventaire");
        } finally {
            setSubmitting(false);
            dispatch(hideOverlay());
        }
    };

    const diffBadge = (r: CountRow) => {
        if (r.counted === '') return <span className="text-slate-300">—</span>;
        const d = Number(r.counted) - r.system;
        if (d === 0) return <span className="text-slate-400 tabular-nums">0</span>;
        const color = d > 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200';
        return (
            <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11.5px] tabular-nums ${color}`}>
                {d > 0 ? `+${d}` : d}
            </span>
        );
    };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des EPI', to: '/ppe-management' },
                    { label: 'Inventaire physique' },
                ]}
                icon={<IconClipboardCheck size={22} stroke={2} />}
                iconColor="amber"
                title="Inventaire physique"
                subtitle="Comptage contradictoire : saisissez les quantités réelles, la validation ajuste le stock."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Comptage */}
                <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <header className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-w-[240px]">
                            <TextInput
                                label="Référence"
                                placeholder="ex. INV-2026-08"
                                size="xs"
                                value={reference}
                                onChange={(e) => setReference(e.currentTarget.value)}
                            />
                            <TextInput
                                label="Rechercher un EPI"
                                placeholder="Nom, catégorie…"
                                leftSection={<IconSearch size={14} />}
                                size="xs"
                                value={search}
                                onChange={(e) => setSearch(e.currentTarget.value)}
                            />
                        </div>
                    </header>

                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-slate-50 text-slate-500 text-[12px]">
                                <tr>
                                    <th className="text-left p-2.5 font-medium">EPI</th>
                                    <th className="text-left p-2.5 font-medium">Catégorie</th>
                                    <th className="text-right p-2.5 font-medium">Stock système</th>
                                    <th className="text-right p-2.5 font-medium w-[130px]">Compté</th>
                                    <th className="text-right p-2.5 font-medium">Écart</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((r) => (
                                    <tr key={r.ppeId} className="border-t border-slate-100">
                                        <td className="p-2.5 text-slate-800">{r.name}</td>
                                        <td className="p-2.5 text-slate-500">{ppeCategoryLabel(r.category)}</td>
                                        <td className="p-2.5 text-right tabular-nums text-slate-600">{r.system}</td>
                                        <td className="p-2.5 text-right">
                                            <NumberInput
                                                value={r.counted}
                                                onChange={(v) => setCounted(r.ppeId, v === '' ? '' : Number(v))}
                                                min={0}
                                                size="xs"
                                                hideControls
                                                styles={{ input: { textAlign: 'right' } }}
                                                aria-label={`Quantité comptée pour ${r.name}`}
                                            />
                                        </td>
                                        <td className="p-2.5 text-right">{diffBadge(r)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!filteredRows.length && (
                            <EmptyState icon={<IconClipboardCheck size={24} />} title="Aucun EPI à inventorier" compact />
                        )}
                    </div>

                    <Textarea
                        className="p-4 pt-3"
                        label="Observations"
                        placeholder="Contexte, zone comptée, anomalies constatées…"
                        size="xs"
                        autosize
                        minRows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.currentTarget.value)}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50/60">
                        <span className="text-[12.5px] text-slate-600">
                            {discrepancies.length
                                ? `${discrepancies.length} écart(s) détecté(s) — seront ajustés à la validation`
                                : 'Aucun écart : le stock est conforme au comptage'}
                        </span>
                        <div className="flex gap-2">
                            <Button variant="default" size="sm" loading={submitting} leftSection={<IconDeviceFloppy size={14} />} onClick={handleSaveDraft}>
                                Enregistrer le brouillon
                            </Button>
                            <Button color="teal" size="sm" loading={submitting} leftSection={<IconClipboardCheck size={14} />} onClick={() => setConfirmOpen(true)}>
                                Valider l'inventaire
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Historique */}
                <aside className="bg-white rounded-xl border border-slate-200 overflow-hidden h-fit">
                    <header className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                        <div className="p-1 rounded bg-slate-200">
                            <IconHistory size={14} className="text-slate-600" />
                        </div>
                        <h2 className="text-slate-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}>
                            Inventaires récents
                        </h2>
                    </header>
                    <div className="p-3 space-y-2">
                        {!history.length && (
                            <p className="text-[12.5px] text-slate-500 py-4 text-center">Aucun inventaire enregistré.</p>
                        )}
                        {history.slice(0, 12).map((s) => {
                            const cfg = stocktakeStatusConfig(s.status);
                            const ecarts = (s.lines || []).filter(
                                (l: any) => Number(l.countedQuantity) !== Number(l.systemQuantity)
                            ).length;
                            return (
                                <div key={s.id} className="border border-slate-200 rounded-lg p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-[13px] text-slate-800">{s.reference || `Inventaire #${s.id}`}</p>
                                        <span className={`${CHIP_BASE} ${cfg.chip} flex-shrink-0`}>{cfg.label}</span>
                                    </div>
                                    <p className="text-[11.5px] text-slate-500 mt-1">
                                        {formatDateFr(s.validatedAt || s.createdAt)}
                                        <Tooltip label="Nombre de lignes en écart" withArrow>
                                            <Badge ml={6} size="xs" variant="light" color={ecarts ? 'orange' : 'gray'}>
                                                {ecarts} écart(s)
                                            </Badge>
                                        </Tooltip>
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </aside>
            </div>

            {/* Confirmation de validation (0 champ de saisie → modale légitime) */}
            <Modal opened={confirmOpen} onClose={() => setConfirmOpen(false)} title="Valider l'inventaire" centered>
                <p className="text-[13px] text-slate-700">
                    {discrepancies.length ? (
                        <>
                            <strong>{discrepancies.length}</strong> écart(s) seront passés en ajustements de stock
                            (mouvements tracés). Le stock système sera aligné sur les quantités comptées.
                        </>
                    ) : (
                        <>Aucun écart détecté. L'inventaire sera enregistré et clôturé sans mouvement de stock.</>
                    )}
                </p>
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="default" size="sm" onClick={() => setConfirmOpen(false)}>Annuler</Button>
                    <Button color="teal" size="sm" loading={submitting} onClick={handleValidate}>Confirmer la validation</Button>
                </div>
            </Modal>
        </div>
    );
};

export default PPEStocktakePage;
