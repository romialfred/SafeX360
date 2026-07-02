import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation('ppe');
    // Libellé de statut de stock bilingue : clé i18n `ppe:stockStatus.*`, repli sur le libellé FR centralisé.
    const tStockStatus = (bucket: keyof typeof STOCK_STATUS_CONFIG): string =>
        t(`stockStatus.${bucket}`, { defaultValue: STOCK_STATUS_CONFIG[bucket].label });
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
                if (trimmed.length === 0) return t('create.validateNameRequired');
                return trimmed.length > 50 ? t('create.validateNameMax') : null;
            },
            description: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return t('create.validateDescriptionRequired');
                return trimmed.length > 250 ? t('create.validateDescriptionMax') : null;
            },
            category: (value) => (value?.trim().length > 0 ? null : t('create.validateCategory')),
            minStock: (value) => (value ? null : t('create.validateMinStock')),
        },
    });

    useEffect(() => {
        getActivePPE()
            .then(setPpe)
            .catch((err) => console.error(err));
    }, []);

    const handleSubmit = () => {
        setSubmitting(true);
        dispatch(showOverlay());
        createPPE(form.values)
            .then(() => {
                successNotification(t('create.createSuccess'));
                navigate('/ppe-management');
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || t('create.createError'));
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
                    { label: t('common.breadcrumbHome'), to: '/' },
                    { label: t('common.breadcrumbModule'), to: '/ppe-management' },
                    { label: t('create.breadcrumb') },
                ]}
                icon={<IconShieldPlus size={22} stroke={2} />}
                iconColor="amber"
                title={t('create.title')}
                subtitle={t('create.subtitle')}
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
                                {t('create.cardTitle')}
                            </h2>
                            <p className="text-[11.5px] text-slate-500">{t('create.cardSubtitle')}</p>
                        </div>
                    </header>
                    <form onSubmit={form.onSubmit(handleSubmit)} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput
                            label={t('create.fieldName')}
                            placeholder={t('create.fieldNamePlaceholder')}
                            withAsterisk
                            size="sm"
                            className="md:col-span-2"
                            {...form.getInputProps('name')}
                        />
                        <Select
                            label={t('create.fieldCategory')}
                            placeholder={t('create.fieldCategoryPlaceholder')}
                            data={PPE_CATEGORY_OPTIONS}
                            withAsterisk
                            size="sm"
                            className="md:col-span-2"
                            {...form.getInputProps('category')}
                        />
                        <Textarea
                            label={t('create.fieldDescription')}
                            placeholder={t('create.fieldDescriptionPlaceholder')}
                            rows={4}
                            withAsterisk
                            size="sm"
                            className="md:col-span-2"
                            {...form.getInputProps('description')}
                        />
                        <NumberInput
                            label={t('create.fieldMinStock')}
                            description={t('create.fieldMinStockDescription')}
                            placeholder={t('create.fieldMinStockPlaceholder')}
                            min={1}
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('minStock')}
                        />
                        <TextInput
                            label={t('create.fieldCertification')}
                            placeholder={t('create.fieldCertificationPlaceholder')}
                            size="sm"
                            {...form.getInputProps('certificationStandard')}
                        />
                        <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-200">
                            <Button variant="default" size="sm" onClick={() => navigate('/ppe-management')}>
                                {t('common.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                color="teal"
                                size="sm"
                                loading={submitting}
                                leftSection={<IconDeviceFloppy size={14} />}
                            >
                                {t('create.submit')}
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
                            {t('create.asideTitle')}
                        </h2>
                    </header>
                    <div className="p-3 space-y-2">
                        {ppe.length === 0 && (
                            <p className="text-[12.5px] text-slate-500 py-4 text-center">
                                {t('create.asideEmpty')}
                            </p>
                        )}
                        {ppe.slice(0, 6).map((item: any) => {
                            const bucket = stockBucket(item.stock, item.minStock);
                            const cfg = STOCK_STATUS_CONFIG[bucket];
                            return (
                                <div key={item.id} className="border border-slate-200 rounded-lg p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-[13px] text-slate-800 leading-snug">{item.name}</p>
                                        <span className={`${CHIP_BASE} ${cfg.chip} flex-shrink-0`}>{tStockStatus(bucket)}</span>
                                    </div>
                                    <p className="text-[11.5px] text-slate-500 mt-0.5">{ppeCategoryLabel(item.category)}</p>
                                    <p className="text-[11.5px] text-slate-500 mt-1">
                                        {t('create.stockLine', { stock: item.stock ?? 0, minStock: item.minStock ?? 0 })}
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
