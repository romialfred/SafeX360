import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, MultiSelect, NumberInput, Select, Textarea } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
    IconArrowLeft, IconClipboardList, IconDeviceFloppy, IconLayoutGrid, IconUsers,
} from '@tabler/icons-react';
import { getActivePPE } from '../../services/PPEService';
import { getEmployeesWithDepartment } from '../../services/EmployeeService';
import { createPpeRequest } from '../../services/PpeRequestService';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { toLocalDate } from '../../utility/dateConversion';
import PageHeader from '../UtilityComp/PageHeader';
import { PRIORITY_OPTIONS, ppeCategoryLabel } from './ppeLabels';

/**
 * PAGE MATRICE de demande d'EPI (incrément 2).
 *
 * Remplace l'ancienne modale « Nouvelle demande » qui appliquait la MÊME liste
 * d'EPI à tous les employés, sans quantité. Ici : une vraie matrice
 * bénéficiaires × EPI, une quantité PROPRE par cellule — « employé A : 2 gants,
 * employé B : 1 casque ». Page plein écran (jamais une modale pour un formulaire
 * métier), avec application groupée, totaux et disponibilité du stock.
 */

type QtyMap = Record<string, Record<string, number | ''>>; // empId -> ppeId -> quantité
type EmpRow = { id: number | string; name?: string; firstName?: string; lastName?: string; department?: string };
type PpeRow = { id: number | string; name?: string; category?: string; stock?: number };

const PPERequestMatrixPage = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<EmpRow[]>([]);
    const [activePpe, setActivePpe] = useState<PpeRow[]>([]);
    const [loading, setLoading] = useState(false);

    // Sélections
    const [selectedEmps, setSelectedEmps] = useState<string[]>([]);
    const [selectedPpe, setSelectedPpe] = useState<string[]>([]);
    const [qty, setQty] = useState<QtyMap>({});

    // En-tête
    const [desiredDate, setDesiredDate] = useState<Date | null>(null);
    const [priority, setPriority] = useState<string>('Medium');
    const [reason, setReason] = useState('');

    useEffect(() => {
        getEmployeesWithDepartment().then(setEmployees).catch(() => setEmployees([]));
        getActivePPE().then(setActivePpe).catch(() => setActivePpe([]));
    }, []);

    const empById = useMemo(() => {
        const m: Record<string, EmpRow> = {};
        employees.forEach((e) => { m[String(e.id)] = e; });
        return m;
    }, [employees]);
    const ppeById = useMemo(() => {
        const m: Record<string, PpeRow> = {};
        activePpe.forEach((p) => { m[String(p.id)] = p; });
        return m;
    }, [activePpe]);

    const empOptions = useMemo(
        () => employees.map((e) => ({
            value: String(e.id),
            label: `${e.name || `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim()}${e.department ? ` · ${e.department}` : ''}`,
        })),
        [employees],
    );
    const ppeOptions = useMemo(
        () => activePpe.map((p) => ({ value: String(p.id), label: `${p.name} · ${ppeCategoryLabel(p.category)}` })),
        [activePpe],
    );

    const cell = (empId: string, ppeId: string): number | '' => qty[empId]?.[ppeId] ?? '';
    const setCell = (empId: string, ppeId: string, v: number | '') =>
        setQty((prev) => ({ ...prev, [empId]: { ...(prev[empId] ?? {}), [ppeId]: v } }));

    /** Applique une quantité à TOUS les employés sélectionnés pour un EPI donné. */
    const applyToAll = (ppeId: string, v: number) => {
        setQty((prev) => {
            const next = { ...prev };
            selectedEmps.forEach((empId) => {
                next[empId] = { ...(next[empId] ?? {}), [ppeId]: v };
            });
            return next;
        });
    };

    // Totaux
    const totalByPpe = (ppeId: string) =>
        selectedEmps.reduce((s, empId) => s + (Number(cell(empId, ppeId)) || 0), 0);
    const totalByEmp = (empId: string) =>
        selectedPpe.reduce((s, ppeId) => s + (Number(cell(empId, ppeId)) || 0), 0);
    const grandTotal = selectedEmps.reduce((s, empId) => s + totalByEmp(empId), 0);

    /** Lignes non nulles à soumettre. */
    const buildLines = () => {
        const lines: { empId: number; ppeId: number; quantityRequested: number }[] = [];
        selectedEmps.forEach((empId) => {
            selectedPpe.forEach((ppeId) => {
                const q = Number(cell(empId, ppeId)) || 0;
                if (q > 0) lines.push({ empId: Number(empId), ppeId: Number(ppeId), quantityRequested: q });
            });
        });
        return lines;
    };

    const submit = () => {
        if (selectedEmps.length === 0) { errorNotification('Sélectionnez au moins un employé.'); return; }
        if (selectedPpe.length === 0) { errorNotification('Sélectionnez au moins un EPI.'); return; }
        if (!desiredDate) { errorNotification('La date souhaitée est requise.'); return; }
        if (!reason.trim()) { errorNotification('Le motif est requis.'); return; }
        const lines = buildLines();
        if (lines.length === 0) { errorNotification('Renseignez au moins une quantité.'); return; }

        setLoading(true);
        createPpeRequest({
            desiredDate: toLocalDate(desiredDate),
            priority,
            reason: reason.trim(),
            lines,
        })
            .then(() => {
                successNotification('Demande créée.');
                navigate('/ppe-request');
            })
            .catch((err) => errorNotification(err?.response?.data?.errorMessage || 'Échec de la création.'))
            .finally(() => setLoading(false));
    };

    // Disponibilité : total demandé d'un EPI vs stock — signale un dépassement.
    const overStock = (ppeId: string) => {
        const stock = Number(ppeById[ppeId]?.stock ?? 0);
        return totalByPpe(ppeId) > stock;
    };

    return (
        <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestion des EPI', to: '/ppe-management' },
                    { label: 'Demandes', to: '/ppe-request' },
                    { label: 'Nouvelle demande' },
                ]}
                icon={<IconClipboardList size={22} />}
                iconColor="yellow"
                title="Nouvelle demande d'EPI"
                subtitle="Matrice bénéficiaires × EPI — une quantité par employé et par équipement"
            />

            {/* En-tête de la demande */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DateInput label="Date souhaitée" withAsterisk value={desiredDate} onChange={setDesiredDate}
                    minDate={new Date()} placeholder="JJ/MM/AAAA" />
                <Select label="Priorité" withAsterisk value={priority} onChange={(v) => setPriority(v || 'Medium')}
                    data={PRIORITY_OPTIONS} />
                <Textarea label="Motif" withAsterisk value={reason} onChange={(e) => setReason(e.currentTarget.value)}
                    autosize minRows={1} placeholder="ex. Renouvellement des gants de l'équipe forage" className="sm:col-span-1" />
            </div>

            {/* Sélecteurs */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <MultiSelect label="Bénéficiaires" withAsterisk searchable clearable
                    leftSection={<IconUsers size={15} />} data={empOptions} value={selectedEmps}
                    onChange={setSelectedEmps} placeholder="Rechercher et sélectionner des employés" />
                <MultiSelect label="EPI demandés" withAsterisk searchable clearable
                    leftSection={<IconLayoutGrid size={15} />} data={ppeOptions} value={selectedPpe}
                    onChange={setSelectedPpe} placeholder="Sélectionner les équipements" />
            </div>

            {/* Matrice */}
            {selectedEmps.length > 0 && selectedPpe.length > 0 ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left p-3 font-semibold text-slate-700 sticky left-0 bg-slate-50 min-w-[200px]">
                                    Employé \ EPI
                                </th>
                                {selectedPpe.map((ppeId) => (
                                    <th key={ppeId} className="p-2 font-semibold text-slate-700 min-w-[130px] align-top">
                                        <div className="text-[12.5px] leading-tight">{ppeById[ppeId]?.name}</div>
                                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                                            stock : {ppeById[ppeId]?.stock ?? 0}
                                        </div>
                                        {/* Appliquer une quantité à tous les employés pour cet EPI */}
                                        <div className="mt-1.5 flex items-center gap-1">
                                            <NumberInput size="xs" min={0} placeholder="tous" hideControls w={64}
                                                onChange={(v) => applyToAll(ppeId, Number(v) || 0)} />
                                            <span className="text-[10px] text-slate-400">→ tous</span>
                                        </div>
                                    </th>
                                ))}
                                <th className="p-2 font-semibold text-slate-700 text-right min-w-[90px]">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedEmps.map((empId) => (
                                <tr key={empId} className="border-b border-slate-100 hover:bg-slate-50/50">
                                    <td className="p-3 text-slate-800 sticky left-0 bg-white min-w-[200px]">
                                        <div className="font-medium text-[13px]">
                                            {empById[empId]?.name || `Employé #${empId}`}
                                        </div>
                                        {empById[empId]?.department && (
                                            <div className="text-[11px] text-slate-400">{empById[empId].department}</div>
                                        )}
                                    </td>
                                    {selectedPpe.map((ppeId) => (
                                        <td key={ppeId} className="p-2 text-center">
                                            <NumberInput size="xs" min={0} hideControls w={72} className="mx-auto"
                                                value={cell(empId, ppeId)}
                                                onChange={(v) => setCell(empId, ppeId, v === '' ? '' : Number(v))} />
                                        </td>
                                    ))}
                                    <td className="p-2 text-right font-semibold text-slate-700 tabular-nums">
                                        {totalByEmp(empId)}
                                    </td>
                                </tr>
                            ))}
                            {/* Ligne des totaux par EPI */}
                            <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                                <td className="p-3 text-slate-700 sticky left-0 bg-slate-50">Total par EPI</td>
                                {selectedPpe.map((ppeId) => (
                                    <td key={ppeId} className={`p-2 text-center tabular-nums ${overStock(ppeId) ? 'text-red-600' : 'text-slate-700'}`}>
                                        {totalByPpe(ppeId)}
                                        {overStock(ppeId) && <div className="text-[10px] font-normal">&gt; stock</div>}
                                    </td>
                                ))}
                                <td className="p-2 text-right text-teal-700 tabular-nums">{grandTotal}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
                    Sélectionnez des bénéficiaires et des EPI pour construire la matrice des quantités.
                </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between gap-3">
                <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/ppe-request')}>
                    Annuler
                </Button>
                <div className="flex items-center gap-3">
                    {grandTotal > 0 && (
                        <span className="text-[13px] text-slate-500">
                            {buildLines().length} ligne(s) · {grandTotal} unité(s)
                        </span>
                    )}
                    <Button color="teal" leftSection={<IconDeviceFloppy size={16} />} loading={loading} onClick={submit}>
                        Soumettre la demande
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PPERequestMatrixPage;
