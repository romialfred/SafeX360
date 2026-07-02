import { ActionIcon, Alert, Button, Checkbox, Group, Select, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { PickList } from "primereact/picklist";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import {
    IconClock,
    IconDeviceFloppy,
    IconFileText,
    IconMapPin,
    IconRoute,
    IconShield,
    IconUsers,
    IconX,
} from "@tabler/icons-react";
import TextEditor from "../../UtilityComp/TextEditor";
import { getAllLocations } from "../../../services/LocationService";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { getActivityById, updateActivity } from "../../../services/HsActivityService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { getActivitiesByYearStatusAndCategory } from "../../../services/HSEActivityService";
import { toLocalDate } from "../../../utility/dateConversion";
import PageHeader from "../../UtilityComp/PageHeader";
import { TOUR_PPE_OPTIONS, TOUR_ROLES, TOUR_TYPE_OPTIONS, SERIF } from "./tourLabels";

/** En-tête de section : icône chip + titre serif + sous-titre. */
const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
    <header className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">
        <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-green-100 border border-green-200">
                <Icon size={16} className="text-green-700" />
            </div>
            <div>
                <h2 className="text-slate-900" style={{ fontFamily: SERIF, fontSize: '14px', fontWeight: 600 }}>{title}</h2>
                <p className="text-[11.5px] text-slate-500">{subtitle}</p>
            </div>
        </div>
    </header>
);

const EditTour = () => {
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const [location, setLocation] = useState<any[]>([]);
    const ref = useRef<HTMLInputElement>(null);
    const ref1 = useRef<HTMLInputElement>(null);
    const [emps, setEmps] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const dispatch = useDispatch();
    const [lockedInfo, setLockedInfo] = useState<{ locked: boolean; status: string }>({ locked: false, status: '' });
    const navigate = useNavigate();
    const { id } = useParams();

    const form = useForm({
        initialValues: {
            activityId: '',
            type: 'TDM',
            locationId: '',
            plannedDate: undefined,
            startTime: '',
            endTime: '',
            objectives: '',
            agenda: '',
            expectedResults: '',
            ppe: [],
            participants: [],
        },
        validate: {
            activityId: (value) => (value ? null : "L'activité de référence est requise"),
            type: (value) => (value ? null : 'Le type est requis'),
            locationId: (value) => (value ? null : 'La zone visitée est requise'),
            plannedDate: (value) => (value ? null : 'La date est requise'),
            startTime: (value) => (value ? null : "L'heure de début est requise"),
            endTime: (value) => (value ? null : "L'heure de fin est requise"),
        },
    });

    useEffect(() => {
        getEmployeeDropdown().then((res: any) => {
            setEmps(res);
        }).catch((_err: any) => console.error(_err));

        getAllLocations({}).then((res) => {
            setLocation(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        }).catch((_err: any) => console.error(_err));

        getActivitiesByYearStatusAndCategory(new Date().getFullYear(), "PENDING", "TDM").then((res) => {
            setActivities(res.map((x: any) => ({ label: x.title, value: String(x.id) })));
        }).catch((err) => console.error(err));

        getActivityById(id).then((res) => {
            form.setValues({
                ...res,
                plannedDate: new Date(res.plannedDate),
                activityId: String(res.activityId),
                locationId: String(res.locationId),
                participants: res.participants.map((x: any) => ({ ...x, pos: "Target" })),
            });
            const statusUpper = String(res?.status || '').toUpperCase();
            if (['COMPLETED', 'CANCELLED'].includes(statusUpper)) {
                setLockedInfo({ locked: true, status: statusUpper });
            }
        }).catch((err) => console.error(err));
    }, []);

    const employees = emps.filter((emp: any) => !form.values.participants.some((p: any) => p.id === emp.id));

    const onChange = (event: any) => {
        form.setFieldValue('participants', (event.target?.map((x: any) => ({ ...x, pos: "Target" }))));
    };

    const handleRoleChange = (id: number, value: string) => {
        const selEmp: any = form.values.participants;
        form.setFieldValue('participants', selEmp.map((item: any) =>
            item.id === id ? { ...item, role: value } : item
        ));
        setEditingRoleId(null);
    };

    const itemTemplate = (item: any) => {
        return (
            <div className={` ${item.pos === "Target" ? "w-[500px]" : "w-[400px]"} flex gap-5 justify-between self-center`}>
                <div className='flex flex-col gap-1'>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm">{item.empNumber}</span>
                </div>
                {item.pos === "Target" && (
                    <div className='flex items-center gap-2 w-[220px]'>
                        {editingRoleId === item.id || !item.role ? (
                            <Select
                                autoFocus
                                label="Rôle"
                                placeholder="Sélectionner le rôle"
                                data={TOUR_ROLES}
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

    const lockedMessage = lockedInfo.status === 'COMPLETED'
        ? 'Cette tournée est réalisée. Aucune modification possible.'
        : 'Cette tournée est annulée. Aucune modification possible.';

    const handleSubmit = (values: any) => {
        if (lockedInfo.locked) {
            errorNotification(lockedMessage);
            return;
        }
        setSubmitting(true);
        dispatch(showOverlay());
        // LocalDate backend : sérialisation 'yyyy-MM-dd' en fuseau LOCAL (pas UTC)
        updateActivity({ ...values, plannedDate: toLocalDate(values.plannedDate) })
            .then((_res) => {
                successNotification("Tournée mise à jour");
                navigate("/steering-tours");
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "La mise à jour de la tournée a échoué");
            })
            .finally(() => {
                setSubmitting(false);
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

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Tournées Leadership', to: '/steering-tours' },
                    { label: 'Modifier la tournée' },
                ]}
                icon={<IconRoute size={22} stroke={2} />}
                iconColor="green"
                title="Modifier la tournée Leadership"
                subtitle="Mise à jour du créneau, des participants et de la préparation de la visite"
                actions={
                    <>
                        <Button variant="default" size="sm" leftSection={<IconX size={15} />} onClick={() => navigate(-1)}>
                            Annuler
                        </Button>
                        <Button color="teal" size="sm" loading={submitting} disabled={lockedInfo.locked} leftSection={<IconDeviceFloppy size={15} />} onClick={() => form.onSubmit(handleSubmit)()}>
                            Enregistrer
                        </Button>
                    </>
                }
            />

            {lockedInfo.locked && (
                <Alert color={lockedInfo.status === 'COMPLETED' ? 'green' : 'red'} variant="light" className="border">
                    <Text size="sm">{lockedMessage}</Text>
                </Alert>
            )}

            <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-4">
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <SectionHeader icon={IconRoute} title="Informations sur la tournée" subtitle="Type, zone, date et créneau de la visite" />
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select size="sm" withAsterisk disabled label="Activité de référence" placeholder="Sélectionner l'activité" data={activities} {...form.getInputProps('activityId')} />
                        <Select size="sm" withAsterisk label="Type de tournée" placeholder="Sélectionner le type" data={TOUR_TYPE_OPTIONS} disabled {...form.getInputProps('type')} />
                        <Select size="sm" label="Zone visitée" placeholder="Sélectionner la zone" leftSection={<IconMapPin size={16} />} data={location} withAsterisk {...form.getInputProps('locationId')} />
                        <DatePickerInput size="sm" label="Date" placeholder="Sélectionner la date" withAsterisk {...form.getInputProps('plannedDate')} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                            <TimeInput size="sm" label="Heure de début" ref={ref} rightSection={pickerControl} withAsterisk {...form.getInputProps('startTime')} />
                            <TimeInput size="sm" label="Heure de fin" ref={ref1} rightSection={pickerControl1} withAsterisk {...form.getInputProps('endTime')} />
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <SectionHeader icon={IconFileText} title="Objectifs, itinéraire et résultats attendus" subtitle="Préparation détaillée de la visite terrain" />
                    <div className="p-4 space-y-4">
                        <TextEditor form={form} id="objectives" title="Objectifs" />
                        <TextEditor form={form} id="agenda" title="Itinéraire" />
                        <TextEditor form={form} id="expectedResults" title="Résultats attendus" />
                    </div>
                </section>

                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <SectionHeader icon={IconUsers} title="Participants à la tournée" subtitle="Sponsor direction + équipe HSE + responsables de zone" />
                    <div className="p-4">
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
                            targetHeader={`Participants (${form.values.participants.length})`}
                            sourceStyle={{ height: '24rem' }}
                            targetStyle={{ height: '24rem' }}
                        />
                    </div>
                </section>

                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <SectionHeader icon={IconShield} title="Équipements de protection individuelle (EPI)" subtitle="EPI obligatoires sur la zone visitée" />
                    <div className="p-4">
                        <Checkbox.Group size="md" {...form.getInputProps("ppe")} label="">
                            <div className="flex flex-wrap gap-2">
                                {TOUR_PPE_OPTIONS.map((item) => (
                                    <Checkbox.Card key={item.id}
                                        value={item.id}
                                        radius="md"
                                        className="group border border-slate-300 transition-colors duration-150 cursor-pointer
                                            hover:!border-green-500 hover:!bg-green-50
                                            data-[checked]:!border-green-500 data-[checked]:!bg-green-50
                                            data-[checked]:shadow-sm"
                                        p="xs"
                                    >
                                        <Group align="center" gap="xs">
                                            <Checkbox.Indicator size="xs" className="text-green-600" />
                                            <Text
                                                size="xs"
                                                className="text-slate-800 group-data-[checked]:text-green-900 group-data-[checked]:font-medium"
                                            >
                                                {item.label}
                                            </Text>
                                        </Group>
                                    </Checkbox.Card>
                                ))}
                            </div>
                        </Checkbox.Group>
                    </div>
                </section>

                <div className="flex gap-2 justify-end pt-2">
                    <Button variant="default" size="sm" leftSection={<IconX size={15} />} onClick={() => navigate(-1)}>
                        Annuler
                    </Button>
                    <Button type="submit" color="teal" size="sm" loading={submitting} disabled={lockedInfo.locked} leftSection={<IconDeviceFloppy size={15} />}>
                        Enregistrer les modifications
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditTour;
