import {
    ActionIcon,
    Alert,
    Button,
    Checkbox,
    Group,
    Select,
    Text,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { PickList } from "primereact/picklist";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import {
    IconClock,
    IconDeviceFloppy,
    IconEdit,
    IconFileText,
    IconShield,
    IconTarget,
    IconUsers,
    IconX,
} from "@tabler/icons-react";
import TextEditor from "../../UtilityComp/TextEditor";
import PageHeader from "../../UtilityComp/PageHeader";
import { getAllLocations } from "../../../services/LocationService";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { getPgiById, updatePgi } from "../../../services/PgiService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { getActivitiesByYearStatusAndCategory } from "../../../services/HSEActivityService";
import { mapIdToName } from "../../../utility/OtherUtilities";
import { PPE_ITEM_OPTIONS, TEAM_ROLES } from "./pgiLabels";

/**
 * Modification d'une inspection HSE planifiée. Les inspections terminées
 * ou annulées sont verrouillées en lecture seule.
 */
const EditPgi = () => {
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const [location, setLocation] = useState<any[]>([]);
    const ref = useRef<HTMLInputElement>(null);
    const ref1 = useRef<HTMLInputElement>(null);
    const [emps, setEmps] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<any>({});
    const dispatch = useDispatch();
    const { id } = useParams();
    const navigate = useNavigate();
    const [activities, setActivities] = useState<any[]>([]);
    const [lockedInfo, setLockedInfo] = useState<{ locked: boolean; status: string }>({ locked: false, status: '' });

    // Référentiel EPI : codes backend (helmet, goggles…) + libellés FR centralisés
    const ppe = PPE_ITEM_OPTIONS;

    const form = useForm({
        initialValues: {
            id: 0,
            activityId: undefined,
            siteId: '',
            plannedDate: undefined,
            description: '',
            riskTypes: [],
            objectives: '',
            ppe: [],
            startTime: '',
            endTime: '',
            participants: [],
        },
        validate: {
            activityId: (value) => (value ? null : "L'activité de référence est obligatoire"),
            siteId: (value) => (value?.trim().length > 0 ? null : "Le lieu d'inspection est obligatoire"),
            plannedDate: (value) => (value ? null : 'La date planifiée est obligatoire'),
            objectives: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "L'objectif est obligatoire";
                return trimmed.length > 50 ? '50 caractères maximum' : null;
            },
            startTime: (value) => (value ? null : "L'heure de début est obligatoire"),
            endTime: (value) => (value ? null : "L'heure de fin est obligatoire"),
        },
    });

    useEffect(() => {
        dispatch(showOverlay());
        getPgiById(id).then((res) => {
            form.setValues({
                ...res,
                id: res.id,
                plannedDate: new Date(res.plannedDate),
                activityId: String(res.activityId),
                siteId: String(res.locationId),
                participants: res.participants.map((x: any) => ({ ...x, pos: "Target" })),
            });
            const statusUpper = String(res?.status || '').toUpperCase();
            if (['COMPLETED', 'CANCELLED'].includes(statusUpper)) {
                setLockedInfo({ locked: true, status: statusUpper });
            }
        }).catch((_err) => {
        }).finally(() => {
            dispatch(hideOverlay());
        });

        getEmployeeDropdown().then((res: any) => {
            setEmpMap(mapIdToName(res));
            setEmps(res);
        }).catch((_err: any) => { });

        getAllLocations({}).then((res) => {
            setLocation(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        }).catch((_err: any) => { });

        getActivitiesByYearStatusAndCategory(new Date().getFullYear(), "PENDING", "IGP").then((res) => {
            setActivities(res.map((x: any) => ({ label: x.title, value: String(x.id) })));
        }).catch(() => { });
    }, []);

    const employees = emps.filter((emp: any) => !form.values.participants.some((p: any) => p.id === emp.id));

    const onChange = (event: any) => {
        form.setFieldValue('participants', (event.target?.map((x: any) => ({ ...x, pos: "Target" }))));
    };

    const handleRoleChange = (roleEmpId: number, value: string) => {
        const selEmp: any = form.values.participants;
        form.setFieldValue(
            'participants',
            selEmp.map((item: any) => (item.id === roleEmpId ? { ...item, role: value } : item))
        );
        setEditingRoleId(null);
    };

    const itemTemplate = (item: any) => {
        return (
            <div className={`${item.pos === "Target" ? "w-[500px]" : "w-[400px]"} flex gap-5 justify-between self-center`}>
                <div className='flex flex-col gap-1'>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm">{empMap[item.id]?.empNumber}</span>
                </div>
                {item.pos === "Target" && (
                    <div className='flex items-center gap-2 w-[220px]'>
                        {editingRoleId === item.id || !item.role ? (
                            <Select
                                autoFocus
                                label="Rôle"
                                placeholder="Sélectionner le rôle"
                                data={TEAM_ROLES}
                                value={item.role}
                                onChange={(val) => handleRoleChange(item.id, val!)}
                                className="w-full"
                            />
                        ) : (
                            <div
                                className="cursor-pointer text-sm px-3 py-2 bg-slate-100 rounded hover:bg-slate-200"
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

    const isLocked = lockedInfo.locked;
    const lockedMessage =
        lockedInfo.status === 'COMPLETED'
            ? 'Cette inspection est terminée. Aucune modification possible.'
            : 'Cette inspection est annulée. Aucune modification possible.';

    const handleSubmit = (values: any) => {
        if (isLocked) {
            errorNotification(lockedMessage);
            return;
        }
        dispatch(showOverlay());
        updatePgi(values).then((_res) => {
            successNotification("Inspection mise à jour");
            navigate("/PGI");
        })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "La mise à jour de l'inspection a échoué");
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };

    const pickerControl = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref.current?.showPicker()} aria-label="Ouvrir le sélecteur d'heure de début">
            <IconClock size={16} stroke={1.5} />
        </ActionIcon>
    );

    const pickerControl1 = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref1.current?.showPicker()} aria-label="Ouvrir le sélecteur d'heure de fin">
            <IconClock size={16} stroke={1.5} />
        </ActionIcon>
    );

    const sectionHeader = (icon: React.ReactNode, title: string, subtitle: string) => (
        <header className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">
            <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-green-100 border border-green-200">{icon}</div>
                <div>
                    <h2
                        className="text-slate-900"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600 }}
                    >
                        {title}
                    </h2>
                    <p className="text-[11.5px] text-slate-500">{subtitle}</p>
                </div>
            </div>
        </header>
    );

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Inspections HSE', to: '/PGI' },
                    { label: "Modifier l'inspection" },
                ]}
                icon={<IconEdit size={22} stroke={2} />}
                iconColor="green"
                title="Modifier l'inspection"
                subtitle="Ajuster le lieu, le créneau, les risques, les EPI et l'équipe d'inspection"
                actions={
                    <Button variant="default" size="sm" leftSection={<IconX size={14} />} onClick={() => navigate(-1)}>
                        Annuler
                    </Button>
                }
            />

            {isLocked && (
                <Alert color={lockedInfo.status === 'COMPLETED' ? 'green' : 'red'} variant="light" className="border">
                    <Text size="sm">{lockedMessage}</Text>
                </Alert>
            )}

            <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-4">
                {/* Section 1 — Informations */}
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {sectionHeader(
                        <IconEdit size={16} className="text-green-700" />,
                        "Informations sur l'inspection",
                        'Activité de référence, lieu, date et créneau horaire'
                    )}
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            disabled
                            withAsterisk
                            label="Activité de référence"
                            placeholder="Sélectionner l'activité"
                            data={activities}
                            size="sm"
                            {...form.getInputProps('activityId')}
                        />
                        <Select
                            withAsterisk
                            label="Lieu"
                            placeholder="Sélectionner le lieu"
                            data={location}
                            size="sm"
                            {...form.getInputProps('siteId')}
                        />
                        <DatePickerInput
                            label="Date planifiée"
                            placeholder="JJ/MM/AAAA"
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('plannedDate')}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TimeInput label="Heure de début" ref={ref} rightSection={pickerControl} withAsterisk size="sm" {...form.getInputProps('startTime')} />
                            <TimeInput label="Heure de fin" ref={ref1} rightSection={pickerControl1} withAsterisk size="sm" {...form.getInputProps('endTime')} />
                        </div>
                    </div>
                </section>

                {/* Section 2 — Description */}
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {sectionHeader(
                        <IconFileText size={16} className="text-green-700" />,
                        'Description et contexte',
                        "Motif et points d'attention de l'inspection"
                    )}
                    <div className="p-5">
                        <TextEditor form={form} id="description" title="Description" />
                    </div>
                </section>

                {/* Section 3 — Objectif et risques */}
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {sectionHeader(
                        <IconTarget size={16} className="text-green-700" />,
                        'Objectif et types de risques',
                        'Résultat attendu et grille de risques à évaluer'
                    )}
                    <div className="p-5 space-y-4">
                        <TextInput
                            label="Objectif"
                            placeholder="ex. Vérifier la conformité des dispositifs LOTO"
                            size="sm"
                            {...form.getInputProps('objectives')}
                        />
                        <Checkbox.Group {...form.getInputProps('riskTypes')} label="Types de risques à évaluer" withAsterisk>
                            <Group my={2}>
                                <Checkbox value="mechanical" label="Mécanique" />
                                <Checkbox value="chemical" label="Chimique" />
                                <Checkbox value="electrical" label="Électrique" />
                                <Checkbox value="environmental" label="Environnemental" />
                                <Checkbox value="erogonomic" label="Ergonomique" />
                            </Group>
                        </Checkbox.Group>
                    </div>
                </section>

                {/* Section 4 — EPI */}
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {sectionHeader(
                        <IconShield size={16} className="text-green-700" />,
                        'Équipements de protection individuelle (EPI)',
                        'EPI obligatoires sur la zone inspectée'
                    )}
                    <div className="p-5">
                        <Checkbox.Group size="md" {...form.getInputProps("ppe")} label="">
                            <div className="flex flex-wrap gap-2">
                                {ppe.map((item: any) => (
                                    <Checkbox.Card
                                        key={item.id}
                                        value={item.id}
                                        radius="md"
                                        className="group border border-slate-300 transition-colors duration-150 cursor-pointer
                                            hover:!border-green-500 hover:!bg-green-50
                                            data-[checked]:!border-green-500 data-[checked]:!bg-green-50"
                                        p="xs"
                                    >
                                        <Group align="center" gap="xs">
                                            <Checkbox.Indicator size="xs" className="text-green-600" />
                                            <Text
                                                size="xs"
                                                className="text-slate-800 group-data-[checked]:text-green-900 group-data-[checked]:font-medium"
                                            >
                                                {item.name}
                                            </Text>
                                        </Group>
                                    </Checkbox.Card>
                                ))}
                            </div>
                        </Checkbox.Group>
                    </div>
                </section>

                {/* Section 5 — Équipe */}
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {sectionHeader(
                        <IconUsers size={16} className="text-green-700" />,
                        "Équipe d'inspection",
                        'Inspecteurs et observateurs avec attribution des rôles'
                    )}
                    <div className="p-5">
                        <PickList
                            dataKey="id"
                            filter
                            filterBy="name"
                            sourceFilterPlaceholder="Rechercher par nom"
                            targetFilterPlaceholder="Rechercher par nom"
                            showTargetControls={false}
                            showSourceControls={false}
                            source={employees}
                            target={form.values.participants}
                            onChange={onChange}
                            itemTemplate={itemTemplate}
                            breakpoint="1280px"
                            sourceHeader={`Employés disponibles (${employees.length})`}
                            targetHeader={`Équipe sélectionnée (${form.values.participants.length})`}
                            sourceStyle={{ height: '24rem' }}
                            targetStyle={{ height: '24rem' }}
                        />
                    </div>
                </section>

                <div className="flex gap-2 justify-end pt-2">
                    <Button variant="default" size="sm" leftSection={<IconX size={14} />} onClick={() => navigate(-1)}>
                        Annuler
                    </Button>
                    <Button type="submit" color="teal" size="sm" leftSection={<IconDeviceFloppy size={14} />} disabled={isLocked}>
                        Enregistrer les modifications
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default EditPgi
