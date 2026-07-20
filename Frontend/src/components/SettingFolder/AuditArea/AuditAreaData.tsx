import { Button, LoadingOverlay, Modal, Select, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { useDispatch } from "react-redux";
import { modals } from "@mantine/modals";
import { Z } from '../../../constants/zIndex';
import { auditAreadata } from "../../../Data/DropdownData";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { activateAuditArea, createAuditArea, deactivateAuditArea, GetAllAuditArea, updateAuditArea } from "../../../services/AuditAreaService";
import ReferencePanel from '../../NewComponents/Parameters/ReferencePanel';

/**
 * Libellés français des types de zone d'audit. Les VALEURS restent celles du
 * référentiel partagé (DropdownData) : seul l'affichage est traduit, le payload
 * envoyé au serveur est inchangé.
 */
const AUDIT_TYPE_LABELS: Record<string, string> = {
    'PROCESS': 'Processus',
    'SYSTEM': 'Système',
    'PEOPLE': 'Personnel',
    'OPEX ACCOUNT': 'Compte OPEX',
    'APEX ACCOUNT': 'Compte APEX',
    'OTHER': 'Autre',
};

const auditTypeOptions = auditAreadata.map((option: { label: string; value: string }) => ({
    value: option.value,
    label: AUDIT_TYPE_LABELS[option.value] ?? option.label,
}));

const auditTypeLabel = (value: any) => AUDIT_TYPE_LABELS[String(value ?? '').toUpperCase()] ?? value ?? '';

const AuditAreaData = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [emps, setEmps] = useState<{ label: string; value: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const form = useForm({
        initialValues: {
            name: '',
            type: '',
            owner: '',
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Le nom de la zone d'audit est obligatoire";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "50 caractères maximum" : null;
            },
            type: (value) => (value.trim().length > 0 ? null : "Le type d'audit est obligatoire"),
            owner: (value) => (value.trim().length > 0 ? null : "Le responsable est obligatoire"),
        }
    });

    useEffect(() => {
        setLoading(true);
        getEmployeeDropdown()
            .then((res) => {
                // res est un tableau de {id, name}
                const empOptions = res.map((item: any) => ({
                    label: item.name,
                    value: String(item.id),
                }));
                setEmps(empOptions);
            })
            .catch(() => {
                errorNotification("Échec du chargement des employés");
            });

        GetAllAuditArea({})
            .then((res) => {
                // res est un tableau de zones d'audit avec leur statut
                const formatted = res.map((item: any) => ({
                    ...item,
                    status: item.status.toUpperCase(),
                    ownerName: item.ownerName || '', // ownerName fourni par l'API le cas échéant
                }));
                setData(formatted);
            })
            .catch(() => {
                errorNotification("Échec du chargement des zones d'audit");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = (values: any) => {
        setLoading(true);

        if (edit) {
            // Vérifie qu'au moins un champ a changé
            const changed = Object.keys(values).some((key) => {
                const newValue = values[key]?.trim?.() ?? values[key];
                const oldValue = selectedRow[key]?.trim?.() ?? selectedRow[key];
                return newValue !== oldValue;
            });

            if (!changed) {
                form.setErrors({ name: "Modifiez au moins un champ avant d'enregistrer" });
                setLoading(false);
                return;
            }

            const payload = {
                ...selectedRow,
                ...values,
            };

            updateAuditArea(payload)
                .then(() => {
                    successNotification("Zone d'audit modifiée avec succès");

                    // Met à jour l'état local avec le responsable résolu depuis emps
                    const updatedData = data.map(item =>
                        item.id === selectedRow.id
                            ? {
                                ...item,
                                ...values,
                                ownerName: emps.find(emp => emp.value === values.owner)?.label || item.ownerName,
                                status: item.status, // le statut reste inchangé
                            }
                            : item
                    );
                    setData(updatedData);
                    handleClose();
                })
                .catch(() => {
                    errorNotification("Une erreur est survenue lors de la modification");
                })
                .finally(() => setLoading(false));
        } else {
            // Création d'une nouvelle zone d'audit
            createAuditArea(values)
                .then((res) => {
                    successNotification("Zone d'audit ajoutée avec succès");

                    // res correspond à l'identifiant renvoyé par le serveur
                    const newEntry = {
                        ...values,
                        id: res,
                        status: "ACTIVE",
                        ownerName: emps.find(emp => emp.value === values.owner)?.label || '',
                    };

                    setData(prev => [...prev, newEntry]);
                    handleClose();
                })
                .catch(() => {
                    errorNotification("Une erreur est survenue lors de la création");
                })
                .finally(() => setLoading(false));
        }
    };

    const handleEdit = (rowData: any) => {
        setEdit(true);
        setSelectedRow(rowData);
        form.setValues({
            name: rowData.name,
            type: rowData.type,
            owner: rowData.owner ? String(rowData.owner) : '',
        });
        open();
    };

    const handleClose = () => {
        close();
        form.reset();
        setEdit(false);
        setSelectedRow(null);
    };

    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";
        const actionLabel = action === "activate" ? "activer" : "désactiver";
        const doneLabel = action === "activate" ? "activée" : "désactivée";

        modals.openConfirmModal({
            title: <span className='text-2xl'>Confirmer l'opération</span>,
            centered: true,
            children: (
                <span className="text-md">
                    Voulez-vous <strong>{actionLabel}</strong> la zone d'audit : <strong>{rowData.name}</strong> ?
                </span>
            ),
            labels: { confirm: `Oui, ${actionLabel}`, cancel: 'Annuler' },
            cancelProps: { color: 'red', variant: "filled" },
            confirmProps: { color: action === 'activate' ? 'green' : 'red', variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                const apiCall = action === "activate" ? activateAuditArea : deactivateAuditArea;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Zone d'audit ${doneLabel} avec succès`);
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Échec de l'opération : impossible de ${actionLabel} la zone d'audit`);
                    })
                    .finally(() => {
                        dispatch(hideOverlay());
                    });
            },
        });
    };

    return (
        <>
            <ReferencePanel<any>
                newLabel="Nouvelle zone d'audit"
                onNew={open}
                columns={[
                    { key: 'name', label: 'Nom' },
                    { key: 'type', label: 'Type' },
                    { key: 'ownerName', label: 'Responsable', hideOnTablet: true },
                ]}
                rows={data}
                renderRow={(row) => ({
                    name: row.name,
                    type: auditTypeLabel(row.type),
                    ownerName: row.ownerName,
                })}
                getRowKey={(row, index) => row.id ?? row.name ?? index}
                searchText={(row) => `${row.name ?? ''} ${auditTypeLabel(row.type)} ${row.ownerName ?? ''}`}
                searchPlaceholder="Rechercher une zone d'audit…"
                loading={loading}
                emptyTitle="Aucune zone d'audit"
                emptyHint="Définissez les zones à auditer (processus, système, personnel…) et leur responsable."
                statusOf={(row) => row.status}
                onToggleStatus={handleStatusChange}
                onEdit={handleEdit}
            />

            {/* Modale de création / modification */}
            <Modal opened={opened} size="lg" onClose={handleClose} centered title={
                <h1 className="text-lg text-blue-500">
                    {edit ? "Modifier la zone d'audit" : "Créer une zone d'audit"}
                </h1>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='flex flex-col gap-4' onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Nom" withAsterisk placeholder='Saisir le nom' {...form.getInputProps('name')} />
                    <Select
                        withAsterisk
                        placeholder="Sélectionner un type"
                        label="Type"
                        data={auditTypeOptions}
                        {...form.getInputProps('type')}
                    />

                    <Select
                        withAsterisk
                        placeholder="Sélectionner un responsable"
                        label="Responsable"
                        data={emps}
                        {...form.getInputProps('owner')}
                    />

                    <Button type="submit" mt="md" variant="gradient">{edit ? "Modifier" : "Ajouter"}</Button>
                </form>
            </Modal>


        </>
    )
}

export default AuditAreaData
