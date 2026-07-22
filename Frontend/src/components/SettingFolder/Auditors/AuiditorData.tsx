import { Button, LoadingOverlay, Modal, Select, TextInput } from "@mantine/core";
import { IconUsers, IconUserCheck, IconBuildingCommunity } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { useDispatch } from "react-redux";
import { modals } from "@mantine/modals";
import { Z } from '../../../constants/zIndex';
import { getAllEmployeeWithDirection } from "../../../services/EmployeeService";
import { activateAuditors, createAuditors, deactivateAuditors, getAllAuditors, updateAuditors } from "../../../services/AuditorsService";
import { mapIdToName } from "../../../utility/OtherUtilities";
import { auditorRoles } from "../../../Data/DropdownData";
import ReferencePanel from '../../NewComponents/Parameters/ReferencePanel';

// Les rôles sont stockés en anglais côté base (DropdownData) : on ne traduit
// que l'affichage, la valeur envoyée au serveur reste strictement identique.
const ROLE_LABELS: Record<string, string> = {
    "Lead Auditor": "Auditeur principal",
    "Auditor": "Auditeur",
    "Technical Expert": "Expert technique",
    "Observer": "Observateur",
    "Audit Reporter": "Rapporteur d'audit",
};

const roleLabel = (role: string) => ROLE_LABELS[role] ?? role ?? '—';

const roleOptions = auditorRoles.map((role: string) => ({ value: role, label: roleLabel(role) }));

const AuiditorData = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [emps, setEmps] = useState<{ label: string; value: string }[]>([]);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const form = useForm({
        initialValues: {
            employeeId: '',
            role: '',

        },
        validate: {
            employeeId: (value) => (value.trim().length > 0 ? null : "Le nom de l'employé est obligatoire"),
            role: (value) => (value.trim().length > 0 ? null : "Le rôle est obligatoire"),

        }
    });

    useEffect(() => {
        setLoading(true);
        getAllEmployeeWithDirection()
            .then((res) => {
                const empOptions = res.map((item: any) => ({
                    label: item.name,
                    value: String(item.id),
                }));
                setEmps(empOptions);
                setEmpMap(mapIdToName(res));
            })
            .catch(() => {

            });

        getAllAuditors()
            .then((res) => {
                setData(res);
            })
            .catch(() => {

            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = (values: any) => {
        setLoading(true);

        if (edit) {
            const changed = Object.keys(values).some((key) => {
                return values[key] !== selectedRow[key];
            });

            if (!changed) {
                form.setErrors({ name: "Modifiez au moins un champ avant de valider" });
                setLoading(false);
                return;
            }

            const payload = {
                ...selectedRow,
                ...values,
            };

            updateAuditors(payload)
                .then(() => {
                    successNotification("Auditeur interne modifié avec succès");


                    const updatedData = data.map(item =>
                        item.id === selectedRow.id
                            ? {
                                ...item,
                                ...values,
                                employeeName: emps.find(emp => emp.value === values.employeeId)?.label || item.employeeName,
                                status: item.status,
                            }
                            : item
                    );
                    setData(updatedData);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue lors de la modification");
                })
                .finally(() => setLoading(false));
        } else {
            createAuditors(values)
                .then(() => {
                    successNotification("Auditeur interne ajouté avec succès");


                    getAllAuditors()
                        .then((res) => {
                            setData(res);
                        });

                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue lors de la création");
                })
                .finally(() => setLoading(false))
        }
    };
    useEffect(() => {

    }, [form.values.employeeId]);

    const handleEdit = (rowData: any) => {
        setEdit(true);
        setSelectedRow(rowData);
        form.setValues({
            employeeId: String(rowData.employeeId),
            role: rowData.role
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

        modals.openConfirmModal({
            title: <span className='text-2xl'>Confirmer l'action</span>,
            centered: true,
            children: (
                <span className="text-md">
                    Voulez-vous <strong>{actionLabel}</strong> l'auditeur interne :{" "}
                    <strong>{rowData.employeeName || rowData.name}</strong> ?
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
                const apiCall = action === "activate" ? activateAuditors : deactivateAuditors;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(
                            action === "activate"
                                ? "Auditeur interne activé avec succès"
                                : "Auditeur interne désactivé avec succès"
                        );
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(
                            action === "activate"
                                ? "Échec de l'activation de l'auditeur interne"
                                : "Échec de la désactivation de l'auditeur interne"
                        );
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
                stats={[
                    { label: 'Auditeurs', value: data.length, icon: IconUsers, tone: 'teal' },
                    { label: 'Actifs', value: data.filter((d: any) => String(d?.status).toUpperCase() === 'ACTIVE').length, icon: IconUserCheck, tone: 'emerald' },
                    { label: 'Directions', value: new Set(data.map((d: any) => d?.direction).filter(Boolean)).size, icon: IconBuildingCommunity, tone: 'indigo' },
                ]}
                newLabel="Nouvel auditeur"
                onNew={open}
                loading={loading}
                columns={[
                    { key: 'employeeName', label: 'Employé' },
                    { key: 'email', label: 'E-mail', hideOnTablet: true },
                    { key: 'direction', label: 'Direction', hideOnTablet: true },
                    { key: 'role', label: 'Rôle' },
                    { key: 'domains', label: 'Domaines', hideOnTablet: true },
                ]}
                rows={data}
                getRowKey={(row: any, index: number) => row?.id ?? index}
                searchPlaceholder="Rechercher un auditeur…"
                searchText={(row: any) =>
                    [row?.employeeName, row?.email, row?.direction, roleLabel(row?.role), row?.role, row?.domains, row?.qualifications]
                        .filter(Boolean)
                        .join(' ')
                }
                renderRow={(row: any) => ({
                    employeeName: (
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-slate-800 truncate">
                                {row?.employeeName || '—'}
                            </span>
                            {row?.leadQualified && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 ring-1 ring-teal-200 flex-shrink-0 whitespace-nowrap">
                                    Auditeur principal
                                </span>
                            )}
                        </div>
                    ),
                    email: <span className="text-slate-600">{row?.email || '—'}</span>,
                    direction: row?.direction || '—',
                    role: roleLabel(row?.role),
                    domains: <span className="text-slate-600">{row?.domains || '—'}</span>,
                })}
                statusOf={(row: any) => row?.status}
                onToggleStatus={handleStatusChange}
                onEdit={handleEdit}
                emptyTitle="Aucun auditeur interne"
                emptyHint="Déclarez les employés habilités à conduire les audits internes (compétences ISO 19011)."
            />

            <Modal opened={opened} size="lg" onClose={handleClose} centered title={
                <h1 className="text-lg text-blue-500">
                    {edit ? "Modifier l'auditeur" : "Ajouter un auditeur"}
                </h1>
            }>
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
                <form className='flex flex-col gap-4' onSubmit={form.onSubmit(handleSubmit)}>

                    {edit ? <Select searchable label="Employé" placeholder="Sélectionner un employé" data={emps} withAsterisk disabled {...form.getInputProps('employeeId')} /> : <Select searchable label="Employé" placeholder="Sélectionner un employé" data={emps.filter((x: any) => !data.some((y: any) => x.value == y.employeeId))} withAsterisk {...form.getInputProps('employeeId')} />}
                    <TextInput disabled value={empMap[form.values.employeeId]?.email} label="E-mail" withAsterisk placeholder="E-mail" />


                    <TextInput disabled label="Direction" value={empMap[form.values.employeeId]?.direction} withAsterisk placeholder="Direction" />

                    <Select label="Rôle" placeholder="Sélectionner un rôle" data={roleOptions} withAsterisk {...form.getInputProps('role')} />



                    <Button type="submit" mt="md" variant="gradient">{edit ? "Modifier" : "Ajouter"}</Button>
                </form>
            </Modal>


        </>
    )
}

export default AuiditorData
