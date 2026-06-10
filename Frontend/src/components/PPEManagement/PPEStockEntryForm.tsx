import { useEffect, useState } from 'react';
import { Button, NumberInput, Progress, Select, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconAlertTriangle, IconInfoCircle, IconPackage, IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { createPPEStock } from '../../services/PPEStockService';
import { getActivePPE } from '../../services/PPEService';
import { mapIdToName } from '../../utility/OtherUtilities';
import { toLocalDate } from '../../utility/dateConversion';
import PageHeader from '../UtilityComp/PageHeader';
import { ppeCategoryLabel } from './ppeLabels';

/**
 * Entrée de stock EPI : réception d'une livraison (quantité, prix unitaire,
 * fournisseur, lot et péremption éventuelle).
 */
const PPEStockEntryForm = () => {
    const [ppe, setPpe] = useState<any[]>([]);
    const [ppeMap, setPpeMap] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const form = useForm({
        initialValues: {
            ppeId: undefined as string | undefined,
            quantity: 1,
            unitPrice: 0,
            supplier: undefined,
            brand: undefined,
            model: undefined,
            size: undefined,
            expiryDate: null as Date | null,
        },
        validate: {
            ppeId: (value) => (value ? null : 'Sélectionnez l\'EPI concerné'),
            quantity: (value) => (value ? null : 'La quantité est obligatoire'),
            unitPrice: (value) => (value && value > 0 ? null : 'Le prix unitaire est obligatoire'),
        },
    });

    useEffect(() => {
        getActivePPE()
            .then((res) => {
                setPpe(res);
                setPpeMap(mapIdToName(res));
            })
            .catch(() => { });
    }, []);

    const handleSubmit = (values: any) => {
        setSubmitting(true);
        dispatch(showOverlay());
        const payload = {
            ...values,
            expiryDate: toLocalDate(values.expiryDate),
        };
        createPPEStock(payload)
            .then(() => {
                successNotification('Entrée de stock enregistrée');
                navigate('/ppe-management');
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "L'entrée de stock a échoué");
            })
            .finally(() => {
                setSubmitting(false);
                dispatch(hideOverlay());
            });
    };

    const selectedPpe = ppeMap[form.values.ppeId ?? ''];
    const lowStockItems = ppe.filter((item: any) => item.stock <= item.minStock).slice(0, 3);

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des EPI', to: '/ppe-management' },
                    { label: 'Entrée de stock' },
                ]}
                icon={<IconPackage size={22} stroke={2} />}
                iconColor="amber"
                title="Entrée de stock EPI"
                subtitle="Enregistrer une réception : quantité, fournisseur et péremption éventuelle"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Formulaire */}
                <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden h-fit">
                    <header className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-200/70 flex items-center gap-2">
                        <div className="p-1 rounded bg-amber-100">
                            <IconPackage size={14} className="text-amber-700" />
                        </div>
                        <div>
                            <h2
                                className="text-slate-800"
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}
                            >
                                Réception de stock
                            </h2>
                            <p className="text-[11.5px] text-slate-500">EPI concerné, quantité reçue et informations fournisseur</p>
                        </div>
                    </header>
                    <form onSubmit={form.onSubmit(handleSubmit)} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            {...form.getInputProps('ppeId')}
                            label="EPI concerné"
                            placeholder="Sélectionner l'EPI à réapprovisionner"
                            data={ppe.map((item: any) => ({
                                value: item.id.toString(),
                                label: `${item.name} — ${ppeCategoryLabel(item.category)}`,
                            }))}
                            searchable
                            withAsterisk
                            size="sm"
                            className="md:col-span-2"
                        />
                        <NumberInput
                            label="Quantité reçue"
                            placeholder="1"
                            min={1}
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('quantity')}
                        />
                        <NumberInput
                            label="Prix unitaire (€)"
                            placeholder="0"
                            min={0}
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('unitPrice')}
                        />
                        <TextInput
                            label="Fournisseur"
                            placeholder="ex. Sahel Équipements Sécurité"
                            size="sm"
                            className="md:col-span-2"
                            {...form.getInputProps('supplier')}
                        />
                        <TextInput label="Marque" placeholder="ex. MSA" size="sm" {...form.getInputProps('brand')} />
                        <TextInput label="Modèle" placeholder="ex. V-Gard 500" size="sm" {...form.getInputProps('model')} />
                        <TextInput label="Taille" placeholder="ex. Réglable" size="sm" {...form.getInputProps('size')} />
                        <DateInput
                            label="Date de péremption (facultatif)"
                            placeholder="JJ/MM/AAAA"
                            valueFormat="DD/MM/YYYY"
                            size="sm"
                            {...form.getInputProps('expiryDate')}
                        />
                        <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-200">
                            <Button variant="default" size="sm" onClick={() => navigate('/ppe-management')}>
                                Annuler
                            </Button>
                            <Button type="submit" color="teal" size="sm" loading={submitting} leftSection={<IconPlus size={14} />}>
                                Ajouter au stock
                            </Button>
                        </div>
                    </form>
                </section>

                {/* Panneau latéral */}
                <div className="space-y-4">
                    <aside className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <header className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                            <div className="p-1 rounded bg-slate-200">
                                <IconInfoCircle size={14} className="text-slate-600" />
                            </div>
                            <h2
                                className="text-slate-800"
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}
                            >
                                EPI sélectionné
                            </h2>
                        </header>
                        <div className="p-4">
                            {selectedPpe ? (
                                <dl className="space-y-2.5 text-[12.5px]">
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-500">Catégorie</dt>
                                        <dd className="text-slate-800 text-right">{ppeCategoryLabel(selectedPpe.category)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-slate-500 mb-0.5">Description</dt>
                                        <dd className="text-slate-800 leading-snug">{selectedPpe.description || '—'}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-500">Stock minimum</dt>
                                        <dd className="text-slate-800">{selectedPpe.minStock ?? 0}</dd>
                                    </div>
                                    {selectedPpe.certificationStandard && (
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-slate-500">Certification</dt>
                                            <dd className="text-slate-800">{selectedPpe.certificationStandard}</dd>
                                        </div>
                                    )}
                                    <div className="flex justify-between gap-2 items-center pt-2 border-t border-slate-100">
                                        <dt className="text-slate-500">Stock actuel</dt>
                                        <dd>
                                            <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11.5px] text-slate-700 tabular-nums">
                                                {selectedPpe.stock ?? 0} unité{(selectedPpe.stock ?? 0) > 1 ? 's' : ''}
                                            </span>
                                        </dd>
                                    </div>
                                    {!!form.values.quantity && (
                                        <div className="flex justify-between gap-2 items-center">
                                            <dt className="text-slate-500">Nouveau total</dt>
                                            <dd>
                                                <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11.5px] text-emerald-700 tabular-nums">
                                                    {(selectedPpe.stock ?? 0) + parseInt(String(form.values.quantity || '0'), 10)} unités
                                                </span>
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            ) : (
                                <p className="text-[12.5px] text-slate-500 py-4 text-center">
                                    Sélectionnez un EPI pour afficher sa fiche.
                                </p>
                            )}
                        </div>
                    </aside>

                    {/* Alertes seuil bas */}
                    {lowStockItems.length > 0 && (
                        <aside className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <header className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-200/70 flex items-center gap-2">
                                <div className="p-1 rounded bg-amber-100">
                                    <IconAlertTriangle size={14} className="text-amber-700" />
                                </div>
                                <h2
                                    className="text-slate-800"
                                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}
                                >
                                    Références sous le seuil
                                </h2>
                            </header>
                            <div className="p-4 space-y-3">
                                {lowStockItems.map((item: any) => {
                                    const percentage = item.minStock
                                        ? Math.min(100, Math.round((item.stock / item.minStock) * 100))
                                        : 0;
                                    return (
                                        <div key={item.id}>
                                            <div className="flex justify-between items-center gap-2 mb-0.5">
                                                <p className="text-[12.5px] text-slate-800">{item.name}</p>
                                                <span className="text-[11px] text-amber-700 tabular-nums">
                                                    {item.stock} / {item.minStock}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mb-1">{ppeCategoryLabel(item.category)}</p>
                                            <Progress value={percentage} color="amber" size="xs" aria-label={`Niveau de stock : ${percentage} %`} />
                                        </div>
                                    );
                                })}
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PPEStockEntryForm;
