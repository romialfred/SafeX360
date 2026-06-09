import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useState } from 'react';
import { ActionIcon, Badge, Button, Modal, Select, Stack, Tooltip } from '@mantine/core';
import { IconEye, IconUpload } from '@tabler/icons-react';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import PdfDropzone from '../../UtilityComp/PdfDropzone';
import { getBase64, openPDF } from '../../../utility/DocumentUtility';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { createComplianceDocument } from '../../../services/ComplianceDocumentService';
import { getMedia } from '../../../services/MediaService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import {
    CATEGORY_COLORS,
    categoryLabel,
    empStatusConfig,
    formatDateFr,
} from '../complianceLabels';

type EmpTableProps = {
    requirements: any[];
    docMap: Record<number, any>;
    fetchData?: () => void;
};

/**
 * Exigences du poste d'un employé (LOT 49) : statut par exigence et dépôt
 * de justificatif pour les exigences non conformes.
 */
const EmpTable = ({ requirements, fetchData, docMap }: EmpTableProps) => {
    const [modalOpened, setModalOpened] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const dispatch = useDispatch();
    const { id: employeeId } = useParams<{ id: string }>();

    const form = useForm({
        initialValues: {
            requirementId: '',
            file: [] as any[],
            expiryDate: null as Date | null,
        },
        validate: {
            requirementId: (value) => (value.trim().length > 0 ? null : "L'exigence est obligatoire"),
            file: (value) => (value && value.length > 0 ? null : 'La pièce justificative est obligatoire'),
            expiryDate: (value) => (value ? null : "La date d'expiration est obligatoire"),
        },
    });

    const handleSubmit = async (values: any) => {
        if (!employeeId) {
            errorNotification('Employé introuvable');
            return;
        }
        setSubmitting(true);
        dispatch(showOverlay());
        try {
            const base64: any = await getBase64(values.file[0].file);
            await createComplianceDocument({
                ...values,
                media: {
                    name: values.file[0].file?.name,
                    file: base64.split(',')[1],
                },
                employeeId: Number(employeeId),
            });
            successNotification('Document déposé. Il est en attente de validation HSE.');
            setModalOpened(false);
            form.reset();
            fetchData?.();
        } catch (err: any) {
            errorNotification(err.response?.data?.errorMessage || 'Le dépôt du document a échoué');
        } finally {
            setSubmitting(false);
            dispatch(hideOverlay());
        }
    };

    const openDoc = (docId: any) => {
        dispatch(showOverlay());
        getMedia(docMap[docId]?.docId)
            .then((res) => openPDF(res.file))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Le document n'a pas pu être ouvert");
            })
            .finally(() => dispatch(hideOverlay()));
    };

    const requirementBody = (row: any) => (
        <span className="text-[13px] text-slate-800">{row.requirementName}</span>
    );

    const categoryBody = (row: any) => (
        <Badge color={CATEGORY_COLORS[row.category ?? ''] ?? 'gray'} variant="light" size="sm" radius="sm">
            {categoryLabel(row.category)}
        </Badge>
    );

    const statusBody = (row: any) => {
        const cfg = empStatusConfig(row.status);
        return (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${cfg.chip}`}>
                {cfg.label}
            </span>
        );
    };

    const actionBody = (row: any) =>
        row.docId ? (
            <Tooltip label="Ouvrir le justificatif" withArrow>
                <ActionIcon
                    onClick={() => openDoc(row.docId)}
                    variant="light"
                    size="sm"
                    color="teal"
                    aria-label="Ouvrir le justificatif"
                >
                    <IconEye size={14} stroke={1.5} />
                </ActionIcon>
            </Tooltip>
        ) : null;

    const pendingRequirements = requirements.filter((x) => x.status === 'Non-Compliance');

    return (
        <div>
            <div className="flex justify-end mb-2">
                <Button
                    size="xs"
                    color="teal"
                    leftSection={<IconUpload size={14} />}
                    onClick={() => setModalOpened(true)}
                    disabled={!pendingRequirements.length}
                >
                    Déposer un justificatif
                </Button>
            </div>

            <DataTable
                value={requirements}
                size="small"
                stripedRows
                removableSort
                paginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                dataKey="requirementId"
                className="[&_.p-datatable-tbody]:!text-[13px] [&_.p-datatable-thead_th]:!text-[12px]"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="{first}–{last} sur {totalRecords}"
                emptyMessage={
                    <div className="py-8 text-center text-[13px] text-slate-500">
                        Aucune exigence affectée au poste de cet employé.
                    </div>
                }
            >
                <Column header="Exigence" body={requirementBody} sortable sortField="requirementName" />
                <Column header="Catégorie" body={categoryBody} style={{ width: '8.5rem' }} />
                <Column header="Statut" body={statusBody} style={{ width: '11rem' }} />
                <Column
                    header="Mis à jour le"
                    body={(row: any) => <span className="text-[12.5px] text-slate-600">{row.updatedAt ? formatDateFr(row.updatedAt) : '—'}</span>}
                    style={{ width: '9rem' }}
                />
                <Column
                    header="Expire le"
                    body={(row: any) => <span className="text-[12.5px] text-slate-600">{row.expiryDate ? formatDateFr(row.expiryDate) : '—'}</span>}
                    style={{ width: '9rem' }}
                />
                <Column header="" body={actionBody} headerStyle={{ width: '4rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
            </DataTable>

            <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                title={<span className="text-[15px] text-slate-800">Déposer un justificatif</span>}
                centered
                size="lg"
            >
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack gap="sm">
                        <Select
                            withAsterisk
                            label="Exigence à justifier"
                            placeholder="Choisir une exigence non conforme"
                            size="sm"
                            data={pendingRequirements.map((r) => ({
                                label: r.requirementName,
                                value: String(r.requirementId),
                            }))}
                            {...form.getInputProps('requirementId')}
                        />
                        <PdfDropzone title="Document (PDF)" id="file" form={form} withAsterisk single />
                        <DateInput
                            minDate={new Date()}
                            withAsterisk
                            label="Date d'expiration du justificatif"
                            placeholder="jj/mm/aaaa"
                            valueFormat="DD/MM/YYYY"
                            size="sm"
                            {...form.getInputProps('expiryDate')}
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="default" size="sm" type="button" onClick={() => setModalOpened(false)} disabled={submitting}>
                                Annuler
                            </Button>
                            <Button type="submit" color="teal" size="sm" loading={submitting}>
                                Déposer
                            </Button>
                        </div>
                    </Stack>
                </form>
            </Modal>
        </div>
    );
};

export default EmpTable;
