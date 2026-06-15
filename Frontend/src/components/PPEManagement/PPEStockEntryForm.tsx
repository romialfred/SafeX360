import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation('ppe');

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
            ppeId: (value) => (value ? null : t('stock.validatePpe')),
            quantity: (value) => (value ? null : t('stock.validateQuantity')),
            unitPrice: (value) => (value && value > 0 ? null : t('stock.validateUnitPrice')),
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
                successNotification(t('stock.createSuccess'));
                navigate('/ppe-management');
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || t('stock.createError'));
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
                    { label: t('common.breadcrumbHome'), to: '/' },
                    { label: t('common.breadcrumbModule'), to: '/ppe-management' },
                    { label: t('stock.breadcrumb') },
                ]}
                icon={<IconPackage size={22} stroke={2} />}
                iconColor="amber"
                title={t('stock.title')}
                subtitle={t('stock.subtitle')}
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
                                {t('stock.cardTitle')}
                            </h2>
                            <p className="text-[11.5px] text-slate-500">{t('stock.cardSubtitle')}</p>
                        </div>
                    </header>
                    <form onSubmit={form.onSubmit(handleSubmit)} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            {...form.getInputProps('ppeId')}
                            label={t('stock.fieldPpe')}
                            placeholder={t('stock.fieldPpePlaceholder')}
                            data={ppe.map((item: any) => ({
                                value: item.id.toString(),
                                label: t('stock.ppeOptionLabel', { name: item.name, category: ppeCategoryLabel(item.category) }),
                            }))}
                            searchable
                            withAsterisk
                            size="sm"
                            className="md:col-span-2"
                        />
                        <NumberInput
                            label={t('stock.fieldQuantity')}
                            placeholder={t('stock.fieldQuantityPlaceholder')}
                            min={1}
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('quantity')}
                        />
                        <NumberInput
                            label={t('stock.fieldUnitPrice')}
                            placeholder={t('stock.fieldUnitPricePlaceholder')}
                            min={0}
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('unitPrice')}
                        />
                        <TextInput
                            label={t('stock.fieldSupplier')}
                            placeholder={t('stock.fieldSupplierPlaceholder')}
                            size="sm"
                            className="md:col-span-2"
                            {...form.getInputProps('supplier')}
                        />
                        <TextInput label={t('stock.fieldBrand')} placeholder={t('stock.fieldBrandPlaceholder')} size="sm" {...form.getInputProps('brand')} />
                        <TextInput label={t('stock.fieldModel')} placeholder={t('stock.fieldModelPlaceholder')} size="sm" {...form.getInputProps('model')} />
                        <TextInput label={t('stock.fieldSize')} placeholder={t('stock.fieldSizePlaceholder')} size="sm" {...form.getInputProps('size')} />
                        <DateInput
                            label={t('stock.fieldExpiry')}
                            placeholder={t('stock.datePlaceholder')}
                            valueFormat="DD/MM/YYYY"
                            size="sm"
                            {...form.getInputProps('expiryDate')}
                        />
                        <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-200">
                            <Button variant="default" size="sm" onClick={() => navigate('/ppe-management')}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" color="teal" size="sm" loading={submitting} leftSection={<IconPlus size={14} />}>
                                {t('stock.submit')}
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
                                {t('stock.asideSelectedTitle')}
                            </h2>
                        </header>
                        <div className="p-4">
                            {selectedPpe ? (
                                <dl className="space-y-2.5 text-[12.5px]">
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-500">{t('stock.detailCategory')}</dt>
                                        <dd className="text-slate-800 text-right">{ppeCategoryLabel(selectedPpe.category)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-slate-500 mb-0.5">{t('stock.detailDescription')}</dt>
                                        <dd className="text-slate-800 leading-snug">{selectedPpe.description || '—'}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-500">{t('stock.detailMinStock')}</dt>
                                        <dd className="text-slate-800">{selectedPpe.minStock ?? 0}</dd>
                                    </div>
                                    {selectedPpe.certificationStandard && (
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-slate-500">{t('stock.detailCertification')}</dt>
                                            <dd className="text-slate-800">{selectedPpe.certificationStandard}</dd>
                                        </div>
                                    )}
                                    <div className="flex justify-between gap-2 items-center pt-2 border-t border-slate-100">
                                        <dt className="text-slate-500">{t('stock.detailCurrentStock')}</dt>
                                        <dd>
                                            <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11.5px] text-slate-700 tabular-nums">
                                                {t('stock.unit', { count: selectedPpe.stock ?? 0 })}
                                            </span>
                                        </dd>
                                    </div>
                                    {!!form.values.quantity && (
                                        <div className="flex justify-between gap-2 items-center">
                                            <dt className="text-slate-500">{t('stock.detailNewTotal')}</dt>
                                            <dd>
                                                <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11.5px] text-emerald-700 tabular-nums">
                                                    {t('stock.newTotalUnits', { count: (selectedPpe.stock ?? 0) + parseInt(String(form.values.quantity || '0'), 10) })}
                                                </span>
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            ) : (
                                <p className="text-[12.5px] text-slate-500 py-4 text-center">
                                    {t('stock.asideEmpty')}
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
                                    {t('stock.asideLowStockTitle')}
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
                                            <Progress value={percentage} color="amber" size="xs" aria-label={t('stock.stockLevelAria', { percentage })} />
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
