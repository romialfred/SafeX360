import { useEffect, useState } from "react";
import { Alert, Button, Select } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconAlertCircle, IconCloudUpload, IconUpload, IconUser } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import PageHeader from "../../UtilityComp/PageHeader";
import PdfDropzone from "../../UtilityComp/PdfDropzone";
import {
    createComplianceDocument,
    getEmployeeComplianceStatus,
    getRequirementsByEmpId,
} from "../../../services/ComplianceDocumentService";
import { getBase64 } from "../../../utility/DocumentUtility";
import { toIsoDateLocal } from "../complianceLabels";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";

/**
 * Dépôt d'un document de conformité (LOT 49).
 *
 * Remplace l'ancienne page maquette (données fictives, bouton inactif) par un
 * dépôt réel : choix de l'employé, exigence à justifier, pièce PDF et date
 * d'expiration. Le document part en statut « En attente de validation ».
 */

interface EmployeeOption {
    value: string;
    label: string;
}

const UploadDocument = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [requirements, setRequirements] = useState<any[]>([]);
    const [loadingRequirements, setLoadingRequirements] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm({
        initialValues: {
            employeeId: '',
            requirementId: '',
            file: [] as any[],
            expiryDate: null as Date | null,
        },
        validate: {
            employeeId: (value) => (value ? null : "L'employé est obligatoire"),
            requirementId: (value) => (value ? null : "L'exigence à justifier est obligatoire"),
            file: (value) => (value && value.length > 0 ? null : 'La pièce justificative est obligatoire'),
            expiryDate: (value) => (value ? null : "La date d'expiration est obligatoire"),
        },
    });

    useEffect(() => {
        getEmployeeComplianceStatus()
            .then((res) => {
                setEmployees(
                    (res ?? []).map((emp: any) => ({
                        value: String(emp.id),
                        label: emp.position ? `${emp.name} — ${emp.position}` : emp.name,
                    }))
                );
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'La liste des employés est indisponible');
            });
    }, []);

    const handleEmployeeChange = (employeeId: string | null) => {
        form.setFieldValue('employeeId', employeeId ?? '');
        form.setFieldValue('requirementId', '');
        setRequirements([]);
        if (!employeeId) return;
        setLoadingRequirements(true);
        getRequirementsByEmpId(employeeId)
            .then((res) => setRequirements(res?.requirements ?? []))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Les exigences du poste sont indisponibles');
            })
            .finally(() => setLoadingRequirements(false));
    };

    const pendingRequirements = requirements.filter((r) => r.status === 'Non-Compliance');

    const handleSubmit = async (values: typeof form.values) => {
        setSubmitting(true);
        dispatch(showOverlay());
        try {
            const base64: any = await getBase64(values.file[0].file);
            const payload = {
                requirementId: Number(values.requirementId),
                // Sérialisation en date locale : évite le recul d'un jour via l'ISO UTC.
                expiryDate: values.expiryDate ? toIsoDateLocal(values.expiryDate) : null,
                employeeId: Number(values.employeeId),
                media: {
                    name: values.file[0].file?.name,
                    file: base64.includes(',') ? base64.split(',')[1] : base64,
                },
            };
            await createComplianceDocument(payload);
            successNotification('Document déposé. Il est en attente de validation HSE.');
            navigate('/compliance-documents');
        } catch (err: any) {
            errorNotification(err.response?.data?.errorMessage || "Le dépôt du document a échoué");
        } finally {
            setSubmitting(false);
            dispatch(hideOverlay());
        }
    };

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Conformité Réglementaire' },
                    { label: 'Documents', to: '/compliance-documents' },
                    { label: 'Déposer un document' },
                ]}
                icon={<IconCloudUpload size={22} stroke={2} />}
                iconColor="teal"
                title="Déposer un document de conformité"
                subtitle="Justificatif d'une exigence réglementaire pour un employé : certificat, habilitation, examen médical"
            />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="max-w-3xl mx-auto flex flex-col gap-4">
                    <section className="bg-white rounded-xl border border-slate-200 p-4">
                        <h3
                            className="text-slate-800 mb-3 pb-3 border-b border-slate-100"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}
                        >
                            Employé et exigence concernés
                        </h3>
                        <div className="flex flex-col gap-3">
                            <Select
                                label="Employé"
                                placeholder="Rechercher un employé"
                                leftSection={<IconUser size={14} />}
                                data={employees}
                                searchable
                                withAsterisk
                                size="sm"
                                value={form.values.employeeId || null}
                                onChange={handleEmployeeChange}
                                error={form.errors.employeeId}
                            />
                            <Select
                                label="Exigence à justifier"
                                placeholder={
                                    !form.values.employeeId
                                        ? "Choisir d'abord un employé"
                                        : loadingRequirements
                                            ? 'Chargement des exigences…'
                                            : pendingRequirements.length
                                                ? 'Choisir une exigence non conforme'
                                                : 'Aucune exigence en attente pour cet employé'
                                }
                                data={pendingRequirements.map((r) => ({
                                    value: String(r.requirementId),
                                    label: r.requirementName,
                                }))}
                                disabled={!form.values.employeeId || loadingRequirements || !pendingRequirements.length}
                                searchable
                                withAsterisk
                                size="sm"
                                {...form.getInputProps('requirementId')}
                            />
                            {form.values.employeeId && !loadingRequirements && !pendingRequirements.length && (
                                <Alert color="teal" variant="light" icon={<IconAlertCircle size={14} />}>
                                    <span className="text-[12.5px]">
                                        Toutes les exigences de cet employé sont déjà couvertes par un justificatif valide ou en attente.
                                    </span>
                                </Alert>
                            )}
                        </div>
                    </section>

                    <section className="bg-white rounded-xl border border-slate-200 p-4">
                        <h3
                            className="text-slate-800 mb-3 pb-3 border-b border-slate-100"
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}
                        >
                            Pièce justificative
                        </h3>
                        <div className="flex flex-col gap-3">
                            <PdfDropzone title="Document (PDF)" id="file" form={form} withAsterisk single />
                            <DateInput
                                label="Date d'expiration du justificatif"
                                placeholder="jj/mm/aaaa"
                                withAsterisk
                                size="sm"
                                valueFormat="DD/MM/YYYY"
                                {...form.getInputProps('expiryDate')}
                            />
                        </div>
                    </section>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            type="button"
                            disabled={submitting}
                            onClick={() => navigate('/compliance-documents')}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            color="teal"
                            size="sm"
                            loading={submitting}
                            leftSection={<IconUpload size={15} />}
                        >
                            Déposer le document
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UploadDocument;
