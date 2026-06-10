import { useEffect, useState } from 'react';
import { Button, NumberInput, Select, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy, IconHelmet, IconListDetails, IconShieldPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { createPPE, getActivePPE } from '../../services/PPEService';
import PageHeader from '../UtilityComp/PageHeader';
import { CHIP_BASE, PPE_CATEGORY_OPTIONS, ppeCategoryLabel, STOCK_STATUS_CONFIG, stockBucket } from './ppeLabels';

/**
 * Création d'une référence EPI au catalogue : nom, catégorie, seuil de stock
 * et norme de certification (EN 397, EN 388…).
 */
const PPECreateForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [ppe, setPpe] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm({
        initialValues: {
            name: '',
            category: '',
            description: '',
            minStock: 5,
            certificationStandard: undefined,
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return 'Le nom de l\'EPI est obligatoire';
                return trimmed.length > 50 ? '50 caractères maximum' : null;
            },
            description: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return 'La description est obligatoire';
                return trimmed.length > 250 ? '250 caractères maximum' : null;
            },
            category: (value) => (value?.trim().length > 0 ? null : 'La catégorie est obligatoire'),
            minStock: (value) => (value ? null : 'Le stock minimum est obligatoire'),
        },
    });

    useEffect(() => {
        getActivePPE()
            .then(setPpe)
            .catch(() => { });
    }, []);

    const handleSubmit = () => {
        setSubmitting(true);
        dispatch(showOverlay());
        createPPE(form.values)
            .then(() => {
                successNotification('EPI ajouté au catalogue');
                navigate('/ppe-management');
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "La création de l'EPI a échoué");
            })
            .finally(() => {
                setSubmitting(false);
                dispatch(hideOverlay());
            });
    };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des EPI', to: '/ppe-management' },
                    { label: 'Nouvel EPI' },
                ]}
                icon={<IconShieldPlus size={22} stroke={2} />}
                iconColor="amber"
                title="Nouvel EPI au catalogue"
                subtitle="Référencer un équipement de protection avec son seuil de réapprovisionnement"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Formulaire */}
                <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <header className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-200/70 flex items-center gap-2">
                        <div className="p-1 rounded bg-amber-100">
                            <IconHelmet size={14} className="text-amber-700" />
                        </div>
                        <div>
                            <h2
                                className="text-slate-800"
                                style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}
                            >
                                Caractéristiques de l'EPI
                            </h2>
                            <p className="text-[11.5px] text-slate-500">Nom, catégorie, description et seuil de stock</p>
                        </div>
                    </header>
                    <form onSubmit={form.onSubmit(handleSubmit)} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput
                            label="Nom de l'EPI"
                            placeholder="ex. Casque MSA V-Gard"
                            withAsterisk
                            size="sm"
                            className="md:col-span-2"
                            {...form.getInputProps('name')}
                        />
                        <Select
                            label="Catégorie"
                            placeholder="Sélectionner une catégorie"
                            data={PPE_CATEGORY_OPTIONS}
                            withAsterisk
                            size="sm"
                            className="md:col-span-2"
                            {...form.getInputProps('category')}
                        />
                        <Textarea
                            label="Description"
                            placeholder="ex. Casque de chantier avec jugulaire 4 points, coiffe réglable, usage mine à ciel ouvert"
                            rows={4}
                            withAsterisk
                            size="sm"
                            className="md:col-span-2"
                            {...form.getInputProps('description')}
                        />
                        <NumberInput
                            label="Stock minimum"
                            description="Seuil d'alerte de réapprovisionnement"
                            placeholder="5"
                            min={1}
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('minStock')}
                        />
                        <TextInput
                            label="Norme de certification (facultatif)"
                            placeholder="ex. EN 397"
                            size="sm"
                            {...form.getInputProps('certificationStandard')}
                        />
                        <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-200">
                            <Button variant="default" size="sm" onClick={() => navigate('/ppe-management')}>
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                color="teal"
                                size="sm"
                                loading={submitting}
                                leftSection={<IconDeviceFloppy size={14} />}
                            >
                                Créer l'EPI
                            </Button>
                        </div>
                    </form>
                </section>

                {/* Catalogue existant */}
                <aside className="bg-white rounded-xl border border-slate-200 overflow-hidden h-fit">
                    <header className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                        <div className="p-1 rounded bg-slate-200">
                            <IconListDetails size={14} className="text-slate-600" />
                        </div>
                        <h2
                            className="text-slate-800"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}
                        >
                            Déjà au catalogue
                        </h2>
                    </header>
                    <div className="p-3 space-y-2">
                        {ppe.length === 0 && (
                            <p className="text-[12.5px] text-slate-500 py-4 text-center">
                                Aucun EPI actif au catalogue pour le moment.
                            </p>
                        )}
                        {ppe.slice(0, 6).map((item: any) => {
                            const bucket = stockBucket(item.stock, item.minStock);
                            const cfg = STOCK_STATUS_CONFIG[bucket];
                            return (
                                <div key={item.id} className="border border-slate-200 rounded-lg p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-[13px] text-slate-800 leading-snug">{item.name}</p>
                                        <span className={`${CHIP_BASE} ${cfg.chip} flex-shrink-0`}>{cfg.label}</span>
                                    </div>
                                    <p className="text-[11.5px] text-slate-500 mt-0.5">{ppeCategoryLabel(item.category)}</p>
                                    <p className="text-[11.5px] text-slate-500 mt-1">
                                        Stock : {item.stock ?? 0} · Minimum : {item.minStock ?? 0}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default PPECreateForm;
