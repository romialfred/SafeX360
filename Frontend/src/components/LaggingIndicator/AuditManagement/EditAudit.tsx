import { Button, Fieldset, FileInput, MultiSelect, Select, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { IconClipboardCheck } from "@tabler/icons-react";
import { PickList } from "primereact/picklist";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { auditType, PPE } from "../../../Data/IncidentsData";
import { getEmployeeDropdownWithEmail } from "../../../services/EmployeeService";
import { updateAudit } from "../../../services/AuditService";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import PageHeader from "../../UtilityComp/PageHeader";



const EditAudit = () => {
    const [target, setTarget] = useState<any[]>([]);
    const [member, setMember] = useState<any[]>([]);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null); // tracks which role is being edited
    const [auditPlanFile, setAuditPlanFile] = useState<File | null>(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams<{ id?: string }>();
    // TODO(refactor): route /audit-management/edit-audit should expose ":id" like EditScheduleAudit.
    //                 Until then, we accept the audit id from path param, location.state.id or ?id= query string.
    const auditId =
        params.id ??
        (location.state as { id?: string | number } | null)?.id ??
        new URLSearchParams(location.search).get("id") ??
        undefined;



    useEffect(() => {
        // Replaces previous hardcoded dummyEmployees stub with the real Employee service call.
        getEmployeeDropdownWithEmail()
            .then((res: any[]) => {
                setMember(
                    (res || []).map((emp: any) => ({
                        id: emp.id,
                        name: emp.name,
                        empNumber: emp.empNumber ?? emp.employeeNumber ?? "",
                        email: emp.email,
                        role: "",
                        pos: "Source",
                    }))
                );
            })
            .catch(() => {
                // Silently fail - PickList will simply be empty if employees cannot be loaded.
                setMember([]);
            });
    }, []);

    const form = useForm({
        initialValues: {
            name: '',
            type: '',
            ppe: '',
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Le titre de l'audit est requis";

                return trimmed.length > 50 ? "Maximum 50 caractères" : null;
            },
            type: (value) => (value?.trim().length > 0 ? null : "Le type d'audit est requis"),
            ppe: (value) => (value?.trim().length > 0 ? null : "Les EPI requis doivent être renseignés"),
        },
    });



    const onChange = (event: any) => {
        setMember(event.source?.map((x: any) => ({ ...x, pos: "Source" })));
        setTarget(event.target?.map((x: any) => ({ ...x, pos: "Target" })));
    };

    const handleRoleChange = (id: number, value: string) => {
        setTarget((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, role: value } : item
            )
        );
        setEditingRoleId(null); // hide dropdown after selection
    };

    // TODO(refactor): align this payload shape with the AuditRequest backend DTO and the NewAudit step-based form
    //                 (auditCategory, types, purpose, startDate, endDate, areas, auditors, meetings).
    //                 The current EditAudit form only exposes a minimal subset; the rest stays untouched server-side
    //                 until the full step-based edit screen is implemented.
    const handleSubmit = () => {
        form.validate();
        if (!form.isValid()) return;

        if (!auditId) {
            errorNotification("Identifiant d'audit manquant — ouvrez cette page depuis le registre des audits.");
            return;
        }

        const payload = {
            id: auditId,
            // Fields from the minimal Edit form
            name: form.values.name,
            type: form.values.type,
            ppe: form.values.ppe,
            // Participants captured via the PickList (target list with roles assigned)
            members: target.map((m) => ({
                id: m.id,
                name: m.name,
                empNumber: m.empNumber,
                email: m.email,
                role: m.role,
            })),
        };

        modals.openConfirmModal({
            title: <span className="text-base">Confirmer la mise à jour</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Enregistrer les modifications de cet audit ?
                </span>
            ),
            labels: { confirm: "Oui, enregistrer", cancel: "Annuler" },
            cancelProps: { color: "gray", variant: "default" },
            confirmProps: { color: "indigo", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                updateAudit(payload)
                    .then(() => {
                        successNotification("Audit mis à jour");
                        navigate("/audit-management");
                    })
                    .catch((err: any) => {
                        errorNotification(err?.response?.data?.errorMessage || "L'enregistrement a échoué");
                    })
                    .finally(() => {
                        dispatch(hideOverlay());
                    });
            },
        });
    };


    const itemTemplate = (item: any) => {
        return (
            <div className={` ${item.pos === "Target" ? "w-[500px]" : "w-[400px]"} flex gap-5 justify-between`}>
                <div className='flex flex-col gap-1'>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-400">{item.empNumber}</span>
                </div>
                {item.pos === "Target" && (
                    <div className='flex items-center gap-2 w-[220px]'>
                        {editingRoleId === item.id || !item.role ? (
                            <Select
                                autoFocus
                                label="Rôle"
                                placeholder="Sélectionner le rôle"
                                data={[
                                    { value: 'Auditor', label: 'Auditeur' },
                                    { value: 'Data Analyst', label: 'Analyste données' },
                                    { value: 'Process Owner', label: 'Pilote processus' },
                                    { value: 'Counter Party', label: 'Partie auditée' },
                                ]}
                                value={item.role}
                                onChange={(val) => handleRoleChange(item.id, val!)}
                                className="w-full"
                            />
                        ) : (
                            <div
                                className="cursor-pointer text-sm px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                onClick={() => setEditingRoleId(item.id)}
                            >
                                {item.role}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };
    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des audits', to: '/audit-management' },
                    { label: "Modifier l'audit" },
                ]}
                icon={<IconClipboardCheck size={22} stroke={2} />}
                iconColor="indigo"
                title="Modifier l'audit"
                subtitle="Mise à jour des informations générales et des participants"
            />

            <div className="flex flex-col gap-5">
                <Fieldset
                    className="grid grid-cols-3 [&>legend]:w-fit gap-5 flex-wrap"
                    legend={<div className="text-base text-indigo-700">Informations de l'audit</div>}
                >
                    <TextInput withAsterisk label="Titre de l'audit" placeholder="Saisir le titre de l'audit" {...form.getInputProps('name')} />

                    <Select withAsterisk label="Type d'audit" placeholder="Sélectionner le type" data={auditType} {...form.getInputProps('type')} />

                    <MultiSelect withAsterisk label="Objectifs" placeholder="Sélectionner les objectifs" data={['Évaluation de conformité', 'Amélioration continue', 'Certification ISO']} />

                    <MultiSelect withAsterisk label="Sites concernés" placeholder="Sélectionner les sites" data={["Zone d'exploitation", 'Équipements', 'Installations spécifiques']} />

                    <MultiSelect withAsterisk label="Indicateurs d'évaluation" placeholder="Sélectionner les indicateurs" data={['TRIFR', 'LTIFR', 'Taux de fermeture CAPA']} />

                    <FileInput label="Plan d'audit" placeholder="Téléverser un document" value={auditPlanFile} onChange={setAuditPlanFile} accept="application/pdf,image/*" withAsterisk rightSectionWidth={80}
                        rightSection={auditPlanFile ? (
                            <Button size="xs" variant="light" onClick={(e) => {
                                e.stopPropagation();
                                const fileUrl = URL.createObjectURL(auditPlanFile);
                                window.open(fileUrl, "_blank");
                            }} >Aperçu</Button>
                        ) : null
                        }
                    />


                    <Select withAsterisk label="EPI requis" placeholder="Sélectionner les EPI" data={PPE} {...form.getInputProps('ppe')} />
                </Fieldset>

                <Fieldset className="[&>legend]:w-fit" legend={<div className="text-base text-indigo-700">Participants</div>}>
                    <div className='flex gap-5 flex-wrap'>
                        <PickList
                            dataKey="id"
                            filter
                            filterBy="name"
                            sourceFilterPlaceholder="Rechercher par nom"
                            targetFilterPlaceholder="Rechercher par nom"
                            showTargetControls={false}
                            showSourceControls={false}
                            source={member}
                            target={target}
                            onChange={onChange}
                            itemTemplate={itemTemplate}
                            breakpoint="1280px"
                            sourceHeader={`Participants disponibles (${member.length})`}
                            targetHeader={`Rôles des participants (${target.length})`}
                            sourceStyle={{ height: '24rem' }}
                            targetStyle={{ height: '24rem' }}
                        />
                    </div>
                </Fieldset>

                <div className="flex gap-4 justify-end mt-2">
                    <Button variant="default" onClick={() => navigate("/audit-management")}>
                        Annuler
                    </Button>
                    <Button type="button" color="indigo" onClick={handleSubmit}>
                        Enregistrer
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default EditAudit