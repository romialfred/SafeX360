/**
 * DosimeterForm — Module Dosimetrie & Expositions.
 *
 * Formulaire premium de creation / edition d'un dosimetre du parc.
 *
 * Routes :
 *   - /dosimetry/dosimeters/new      (creation)
 *   - /dosimetry/dosimeters/edit/:id (edition)
 *
 * Champs metier :
 *   - serial             : N° de serie unique, OBLIGATOIRE
 *   - type               : TLD / OSL / FILM / EPD, OBLIGATOIRE
 *   - qrCode             : QR code, auto-genere si vide (DOSI-<SERIAL>)
 *   - status             : AVAILABLE (defaut) / ASSIGNED / IN_READING /
 *                          LOST / DAMAGED / RETIRED
 *   - calibrationDueDate : Echeance d'etalonnage (ISO 17025)
 *
 * Validation :
 *   - serial : non vide, longueur min 3
 *   - type   : choisi parmi DosimeterType
 *
 * Submit :
 *   - createDosimeter / updateDosimeter
 *   - Redirige vers /dosimetry/dosimeters en cas de succes
 *
 * RBAC UI :
 *   - Page accessible uniquement si DOSIMETRY_WRITE
 *
 * Pattern UI aligne sur MeasurementPointForm et ExposedWorkerForm.
 * i18n : namespace `dosimetry` -> bloc `dosimeters.form`.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import {
    Paper,
    Group,
    Button,
    Select,
    TextInput,
    Alert,
    Text,
} from '@mantine/core';
import {
    IconDeviceWatch,
    IconChevronRight,
    IconArrowLeft,
    IconDeviceFloppy,
    IconQrcode,
    IconCalendarTime,
    IconInfoCircle,
    IconAlertOctagon,
    IconHash,
    IconShieldCheck,
} from '@tabler/icons-react';
import { useAppSelector } from '../../slices/hooks';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import {
    createDosimeter,
    updateDosimeter,
    getDosimeterById,
    type DosimeterDTO,
    type DosimeterType,
    type DosimeterStatus,
} from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  RBAC tolerant — aligne sur les autres pages Dosimetry
// ─────────────────────────────────────────────────────────────────────────────

function hasDosimetryPermission(user: any, permission: string): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
    const candidates: string[] = [];
    if (Array.isArray(user.permissions)) candidates.push(...user.permissions);
    if (Array.isArray(user.authorities)) {
        candidates.push(...user.authorities.map((a: any) => a?.authority ?? a));
    }
    if (Array.isArray(user.roles)) candidates.push(...user.roles);
    if (typeof user.role === 'string') candidates.push(user.role);
    return candidates.includes(permission);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers de formatage date
// ─────────────────────────────────────────────────────────────────────────────

const toIsoDate = (d: Date | null | undefined): string | null => {
    if (!d) return null;
    if (typeof d === 'string') return d;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const fromIsoDate = (s: string | null | undefined): Date | null => {
    if (!s) return null;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return d;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Modele de formulaire
// ─────────────────────────────────────────────────────────────────────────────

interface FormShape {
    serial: string;
    type: DosimeterType | '';
    qrCode: string;
    status: DosimeterStatus;
    calibrationDueDate: Date | null;
}

const ALL_TYPES: DosimeterType[] = ['TLD', 'OSL', 'FILM', 'EPD'];
const ALL_STATUSES: DosimeterStatus[] = [
    'AVAILABLE',
    'ASSIGNED',
    'IN_READING',
    'LOST',
    'DAMAGED',
    'RETIRED',
];

// ─────────────────────────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────────────────────────

const DosimeterForm = () => {
    const { t } = useTranslation('dosimetry');
    const navigate = useNavigate();
    const params = useParams();
    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector(
        (state: any) => state.companySelection?.selectedCompanyId,
    );

    const editId = params?.id ? Number(params.id) : null;
    const isEdit = editId !== null && !Number.isNaN(editId);

    const canWrite = hasDosimetryPermission(user, 'DOSIMETRY_WRITE');
    const mineId: number = Number(
        selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1,
    );

    const [loadingInitial, setLoadingInitial] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useForm<FormShape>({
        initialValues: {
            serial: '',
            type: '',
            qrCode: '',
            status: 'AVAILABLE',
            calibrationDueDate: null,
        },
        validate: {
            serial: (value) => {
                if (!value || !value.trim()) {
                    return t('dosimeters.form.errors.serialRequired');
                }
                if (value.trim().length < 3) {
                    return t('dosimeters.form.errors.serialTooShort');
                }
                if (value.trim().length > 64) {
                    return t('dosimeters.form.errors.serialTooLong');
                }
                return null;
            },
            type: (value) =>
                !value ? t('dosimeters.form.errors.typeRequired') : null,
        },
    });

    // ───── Chargement initial pour edition ─────
    useEffect(() => {
        if (!isEdit || editId == null) {
            setLoadingInitial(false);
            return;
        }
        let cancelled = false;
        setLoadingInitial(true);
        getDosimeterById(editId)
            .then((dto: DosimeterDTO) => {
                if (cancelled || !dto) return;
                form.setValues({
                    serial: dto.serial ?? '',
                    type: dto.type ?? '',
                    qrCode: dto.qrCode ?? '',
                    status: dto.status ?? 'AVAILABLE',
                    calibrationDueDate: fromIsoDate(dto.calibrationDueDate ?? null),
                });
                form.resetDirty();
            })
            .catch(() => {
                if (cancelled) return;
                setSubmitError(t('dosimeters.form.loadError'));
            })
            .finally(() => {
                if (!cancelled) setLoadingInitial(false);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId, isEdit]);

    // ───── Auto-generation QR code si vide ─────
    const handleAutoGenerateQr = () => {
        const serial = form.values.serial.trim().toUpperCase();
        if (!serial) {
            errorNotification(t('dosimeters.form.errors.serialRequired'));
            return;
        }
        form.setFieldValue('qrCode', `DOSI-${serial}`);
    };

    // ───── Submit ─────
    const handleSubmit = form.onSubmit(async (values) => {
        if (!canWrite) {
            errorNotification(t('dosimeters.form.errors.permissionDenied'));
            return;
        }
        setSubmitting(true);
        setSubmitError(null);
        const payload: DosimeterDTO = {
            id: isEdit ? editId : null,
            serial: values.serial.trim(),
            type: values.type as DosimeterType,
            qrCode: values.qrCode.trim() || null,
            status: values.status,
            calibrationDueDate: toIsoDate(values.calibrationDueDate),
            mineId,
        };
        try {
            if (isEdit) {
                await updateDosimeter(payload);
                successNotification(t('dosimeters.form.successUpdate'));
            } else {
                await createDosimeter(payload);
                successNotification(t('dosimeters.form.successCreate'));
            }
            navigate('/dosimetry/dosimeters');
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ??
                err?.message ??
                t('dosimeters.form.errorGeneric');
            setSubmitError(msg);
            errorNotification(msg);
        } finally {
            setSubmitting(false);
        }
    });

    // ───── Rendu ─────
    return (
        <div className="min-h-full bg-[#FAF8F3] px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full max-w-3xl mx-auto">
                {/* ─── Breadcrumb ─── */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="uppercase tracking-[0.16em] font-medium">
                        {t('dosimeters.breadcrumbRoot')}
                    </span>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/dosimetry/dosimeters')}
                        className="uppercase tracking-[0.16em] font-medium hover:text-indigo-700 transition"
                    >
                        {t('dosimeters.breadcrumbCurrent')}
                    </button>
                    <IconChevronRight size={10} className="text-slate-400" />
                    <span className="uppercase tracking-[0.16em] text-slate-700 font-medium">
                        {isEdit
                            ? t('dosimeters.form.breadcrumbEdit')
                            : t('dosimeters.form.breadcrumbNew')}
                    </span>
                </div>

                {/* ─── Hero card ─── */}
                <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="relative px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
                        <div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            aria-hidden="true"
                        />
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                                <IconDeviceWatch
                                    size={22}
                                    stroke={1.8}
                                    className="text-white"
                                />
                            </div>
                            <div className="min-w-0">
                                <h1
                                    className="text-slate-900 leading-tight"
                                    style={{
                                        fontFamily: "'Source Serif 4', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: 'clamp(20px, 2.2vw, 26px)',
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    {isEdit
                                        ? t('dosimeters.form.titleEdit')
                                        : t('dosimeters.form.titleNew')}
                                </h1>
                                <p className="text-[13px] text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    {t('dosimeters.form.subtitle')}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/dosimetry/dosimeters')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
                        >
                            <IconArrowLeft size={13} stroke={1.8} />
                            {t('dosimeters.form.back')}
                        </button>
                    </div>
                </div>

                {/* ─── Banner erreur charge ─── */}
                {submitError && (
                    <Alert
                        color="red"
                        icon={<IconAlertOctagon size={16} />}
                        title={t('dosimeters.form.errorGeneric')}
                        mb="md"
                        variant="light"
                    >
                        <Text size="sm">{submitError}</Text>
                    </Alert>
                )}

                {/* ─── Formulaire ─── */}
                <form onSubmit={handleSubmit}>
                    <Paper
                        withBorder
                        radius="lg"
                        p="lg"
                        className="bg-white border-slate-200 shadow-sm"
                    >
                        {loadingInitial ? (
                            <div className="py-12 text-center text-slate-500 text-[13px]">
                                <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2 align-middle" />
                                {t('dosimeters.form.loading')}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Section identite */}
                                <div>
                                    <h2 className="text-[10.5px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-3 inline-flex items-center gap-1.5">
                                        <IconHash size={11} stroke={1.8} />
                                        {t('dosimeters.form.sections.identity')}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <TextInput
                                            label={t('dosimeters.form.fields.serial')}
                                            description={t(
                                                'dosimeters.form.fields.serialDesc',
                                            )}
                                            placeholder={t(
                                                'dosimeters.form.fields.serialPlaceholder',
                                            )}
                                            withAsterisk
                                            size="sm"
                                            leftSection={
                                                <IconHash size={14} stroke={1.6} />
                                            }
                                            {...form.getInputProps('serial')}
                                        />
                                        <Select
                                            label={t('dosimeters.form.fields.type')}
                                            description={t(
                                                'dosimeters.form.fields.typeDesc',
                                            )}
                                            placeholder={t(
                                                'dosimeters.form.fields.typePlaceholder',
                                            )}
                                            withAsterisk
                                            size="sm"
                                            data={ALL_TYPES.map((tp) => ({
                                                value: tp,
                                                label: t(
                                                    `dosimeters.typeValues.${tp}`,
                                                    { defaultValue: tp },
                                                ),
                                            }))}
                                            {...form.getInputProps('type')}
                                        />
                                        <div className="md:col-span-2">
                                            <TextInput
                                                label={t('dosimeters.form.fields.qrCode')}
                                                description={t(
                                                    'dosimeters.form.fields.qrCodeDesc',
                                                )}
                                                placeholder={t(
                                                    'dosimeters.form.fields.qrCodePlaceholder',
                                                )}
                                                size="sm"
                                                leftSection={
                                                    <IconQrcode size={14} stroke={1.6} />
                                                }
                                                rightSectionWidth={120}
                                                rightSection={
                                                    <Button
                                                        size="compact-xs"
                                                        variant="light"
                                                        color="indigo"
                                                        onClick={handleAutoGenerateQr}
                                                        type="button"
                                                    >
                                                        {t(
                                                            'dosimeters.form.fields.qrCodeAuto',
                                                        )}
                                                    </Button>
                                                }
                                                {...form.getInputProps('qrCode')}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section cycle de vie */}
                                <div>
                                    <h2 className="text-[10.5px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-3 inline-flex items-center gap-1.5">
                                        <IconShieldCheck size={11} stroke={1.8} />
                                        {t('dosimeters.form.sections.lifecycle')}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select
                                            label={t('dosimeters.form.fields.status')}
                                            description={t(
                                                'dosimeters.form.fields.statusDesc',
                                            )}
                                            size="sm"
                                            data={ALL_STATUSES.map((s) => ({
                                                value: s,
                                                label: t(
                                                    `dosimeters.statusValues.${s}`,
                                                    { defaultValue: s },
                                                ),
                                            }))}
                                            {...form.getInputProps('status')}
                                        />
                                        <DateInput
                                            label={t(
                                                'dosimeters.form.fields.calibrationDueDate',
                                            )}
                                            description={t(
                                                'dosimeters.form.fields.calibrationDueDateDesc',
                                            )}
                                            placeholder={t(
                                                'dosimeters.form.fields.calibrationDueDatePlaceholder',
                                            )}
                                            size="sm"
                                            valueFormat="DD/MM/YYYY"
                                            clearable
                                            leftSection={
                                                <IconCalendarTime
                                                    size={14}
                                                    stroke={1.6}
                                                />
                                            }
                                            value={form.values.calibrationDueDate}
                                            onChange={(v) =>
                                                form.setFieldValue(
                                                    'calibrationDueDate',
                                                    v as Date | null,
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Footer info ISO/AIEA */}
                                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-[11.5px] text-slate-700">
                                    <IconInfoCircle
                                        size={14}
                                        stroke={1.8}
                                        className="mt-0.5 flex-shrink-0 text-indigo-600"
                                    />
                                    <span>{t('dosimeters.form.isoNotice')}</span>
                                </div>
                            </div>
                        )}
                    </Paper>

                    {/* ─── Actions ─── */}
                    <Group justify="flex-end" gap="sm" mt="lg">
                        <Button
                            variant="default"
                            onClick={() => navigate('/dosimetry/dosimeters')}
                            disabled={submitting}
                        >
                            {t('dosimeters.form.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            color="indigo"
                            loading={submitting}
                            leftSection={<IconDeviceFloppy size={14} />}
                            disabled={!canWrite || loadingInitial}
                        >
                            {isEdit
                                ? t('dosimeters.form.submitUpdate')
                                : t('dosimeters.form.submitCreate')}
                        </Button>
                    </Group>
                </form>
            </div>
        </div>
    );
};

export default DosimeterForm;
