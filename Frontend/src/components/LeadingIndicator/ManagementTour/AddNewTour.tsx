import { ActionIcon, Button, Checkbox, Group, Select, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { PickList } from "primereact/picklist";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import {
    IconClock,
    IconMapPin,
    IconRoute,
    IconDeviceFloppy,
    IconX,
    IconUsers,
    IconShield,
    IconTarget,
    IconFileText,
    IconActivity,
    IconChecklist,
    IconCalendar,
    IconEye,
} from "@tabler/icons-react";
import TextEditor from "../../UtilityComp/TextEditor";
import { getAllLocations } from "../../../services/LocationService";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { createActivity } from "../../../services/HsActivityService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { activityTypes } from "../../../Data/DropdownData";
import { getActivitiesByYearStatusAndCategory } from "../../../services/HSEActivityService";
import PageHeader from "../../UtilityComp/PageHeader";
import FormWithHelp from "../../UtilityComp/FormWithHelp";


const AddNewTour = () => {

    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const [location, setLocation] = useState<any[]>([]);
    const ref = useRef<HTMLInputElement>(null);
    const ref1 = useRef<HTMLInputElement>(null);
    const [emps, setEmps] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    // const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());


    const [ppe, _setPPE] = useState([
        { id: 'helmet', name: 'Safety Helmet', required: false, worn: false },
        { id: 'goggles', name: 'Safety Goggles', required: false, worn: false },
        { id: 'gloves', name: 'Safety Gloves', required: false, worn: false },
        { id: 'boots', name: 'Safety Boots', required: false, worn: false },
        { id: 'vest', name: 'High-Visibility Vest', required: false, worn: false },
        { id: 'mask', name: 'Respiratory Mask', required: false, worn: false },
        { id: 'harness', name: 'Safety Harness', required: false, worn: false }
    ]);


    const form = useForm({
        initialValues: {
            activityId: '',
            type: 'ST',
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
            activityId: (value) => (value ? null : "Activity is required"),
            type: (value) => (value ? null : 'Type is Required'),
            locationId: (value) => (value ? null : 'Location is Required'),
            plannedDate: (value) => (value ? null : 'Planned Date is Required'),
            startTime: (value) => (value ? null : 'Start Time is Required'),
            endTime: (value) => (value ? null : 'End Time is Required'),



        },
    });



    useEffect(() => {
        getEmployeeDropdown().then((res: any) => {

            setEmps(res);
        }).catch((_err: any) => { });

        getAllLocations({}).then((res) => {
            setLocation(res.map((item: any) => ({ label: item.name, value: "" + item.id })));
        })
            .catch((_err: any) => {

            })
        getActivitiesByYearStatusAndCategory(new Date().getFullYear(), "PENDING", "TDM").then((res) => {
            setActivities(res.map((x: any) => ({ label: x.title, value: String(x.id) })));
        }).catch(() => { })
    }, []);


    const onChange = (event: any) => {
        setEmps(event.source?.map((x: any) => ({ ...x, pos: "Source" })));

        form.setFieldValue('participants', (event.target?.map((x: any) => ({ ...x, pos: "Target" }))));
    };

    const handleRoleChange = (id: number, value: string) => {
        let selEmp: any = form.values.participants
        form.setFieldValue('participants', selEmp.map((item: any) =>

            item.id === id ? { ...item, role: value } : item)

        )
        setEditingRoleId(null); // hide dropdown after selection
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
                                label="Role"
                                placeholder="Sélectionner le rôle"
                                data={['Sponsor (Direction)', 'Manager', 'Superviseur', 'Responsable HSE', 'Responsable de zone', 'Observateur']}
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
    const handleSubmit = (values: any) => {
        dispatch(showOverlay())
        createActivity(values).then((_res) => {
            successNotification("Tour created successfully");
            navigate("/steering-tours");
        })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Something went wrong");
            })
            .finally(() => {
                dispatch(hideOverlay())
            })
    }






    const pickerControl = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref.current?.showPicker()}>
            <IconClock size={16} stroke={1.5} />
        </ActionIcon>
    );

    const pickerControl1 = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref1.current?.showPicker()}>
            <IconClock size={16} stroke={1.5} />
        </ActionIcon>
    );


    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Tournées Leadership', to: '/leadership-tour' },
                    { label: 'Nouvelle tournée' },
                ]}
                icon={<IconRoute size={22} stroke={2} />}
                iconColor="green"
                title="Nouvelle tournée Leadership"
                subtitle="Visite terrain proactive — vérifier la conformité et l'engagement HSE"
                actions={
                    <>
                        <Button variant="default" size="sm" leftSection={<IconX size={15} />} onClick={() => navigate(-1)}>
                            Annuler
                        </Button>
                        <Button color="green" size="sm" leftSection={<IconDeviceFloppy size={15} />} onClick={() => form.onSubmit(handleSubmit)()}>
                            Enregistrer
                        </Button>
                    </>
                }
            />

            <FormWithHelp
                helpAccentColor="green"
                helpTitle="Aide : Tournée Leadership (Leadership Walk)"
                helpSubtitle="Engagement de la direction sur le terrain — ISO 45001 §5.1"
                helpItems={[
                    {
                        key: 'activity',
                        icon: IconActivity,
                        iconColor: 'green',
                        title: 'Activité de référence',
                        content: "Activité du plan annuel HSE (catégorie TDM). Les tournées sont rattachées au programme de leadership visible.",
                    },
                    {
                        key: 'type',
                        icon: IconChecklist,
                        iconColor: 'indigo',
                        title: 'Type de tournée',
                        content: "Tournée managériale, visite DG, tournée HSE, audit de comportement (BBS). Détermine les attendus et la durée.",
                    },
                    {
                        key: 'location',
                        icon: IconMapPin,
                        iconColor: 'pink',
                        title: 'Zone visitée',
                        content: "Site, atelier ou zone d'exploitation à parcourir. Privilégier les zones à risque élevé ou n'ayant pas reçu de visite récente.",
                    },
                    {
                        key: 'datetime',
                        icon: IconCalendar,
                        iconColor: 'orange',
                        title: 'Date et créneau',
                        content: "Préférer les horaires d'activité réelle pour observer les pratiques. Durée typique : 1 à 2 heures.",
                    },
                    {
                        key: 'objectives',
                        icon: IconTarget,
                        iconColor: 'teal',
                        title: 'Objectifs de la tournée',
                        content: "Ce que la tournée doit accomplir : sensibilisation, observation comportementale, dialogue terrain, validation des contrôles critiques.",
                        isoRef: 'ISO 45001 §5.1.b',
                    },
                    {
                        key: 'agenda',
                        icon: IconFileText,
                        iconColor: 'slate',
                        title: 'Itinéraire',
                        content: "Points de passage avec horodatage : zone A, zone B, atelier, point d'écoute opérateurs, débriefing.",
                    },
                    {
                        key: 'expected',
                        icon: IconEye,
                        iconColor: 'cyan',
                        title: 'Résultats attendus',
                        content: "Observations clés à remonter, actions correctives à initier, communications à émettre suite à la tournée.",
                    },
                    {
                        key: 'participants',
                        icon: IconUsers,
                        iconColor: 'blue',
                        title: 'Participants',
                        content: "Manager / Directeur (sponsor) + responsable HSE + responsable de zone + observateurs. La présence d'un membre de direction est essentielle.",
                    },
                    {
                        key: 'ppe',
                        icon: IconShield,
                        iconColor: 'yellow',
                        title: 'EPI requis',
                        content: "EPI conformes à la zone visitée. La direction donne l'exemple en portant systématiquement les EPI obligatoires.",
                    },
                ]}
                helpTip="Le rapport de tournée et les observations seront saisis depuis la fiche détaillée après la visite sur site."
            >
                <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-5">
                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <header className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-green-100 border border-green-200">
                                    <IconRoute size={16} className="text-green-700" />
                                </div>
                                <div>
                                    <h2 className="text-sm text-slate-900">Informations sur la tournée</h2>
                                    <p className="text-xs text-slate-500">Type, zone, date et créneau de la visite</p>
                                </div>
                            </div>
                        </header>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select withAsterisk label="Activité de référence" placeholder="Sélectionner l'activité" data={activities} {...form.getInputProps('activityId')} />
                            <Select withAsterisk label="Type de tournée" placeholder="Sélectionner le type" data={activityTypes} disabled {...form.getInputProps('type')} />
                            <Select label="Zone visitée" placeholder="Sélectionner la zone" leftSection={<IconMapPin size={16} />} data={location} withAsterisk {...form.getInputProps('locationId')} />
                            <DatePickerInput label="Date" placeholder="Sélectionner la date" withAsterisk {...form.getInputProps('plannedDate')} />
                            <div className="grid grid-cols-2 gap-4 md:col-span-2">
                                <TimeInput label="Heure de début" ref={ref} rightSection={pickerControl} withAsterisk {...form.getInputProps('startTime')} />
                                <TimeInput label="Heure de fin" ref={ref1} rightSection={pickerControl1} withAsterisk {...form.getInputProps('endTime')} />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <header className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-green-100 border border-green-200">
                                    <IconFileText size={16} className="text-green-700" />
                                </div>
                                <div>
                                    <h2 className="text-sm text-slate-900">Objectifs, itinéraire et résultats attendus</h2>
                                    <p className="text-xs text-slate-500">Préparation détaillée de la visite terrain</p>
                                </div>
                            </div>
                        </header>
                        <div className="p-5 space-y-4">
                            <TextEditor form={form} id="objectives" title="Objectifs" />
                            <TextEditor form={form} id="agenda" title="Itinéraire" />
                            <TextEditor form={form} id="expectedResults" title="Résultats attendus" />
                        </div>
                    </section>

                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <header className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-green-100 border border-green-200">
                                    <IconUsers size={16} className="text-green-700" />
                                </div>
                                <div>
                                    <h2 className="text-sm text-slate-900">Participants à la tournée</h2>
                                    <p className="text-xs text-slate-500">Sponsor direction + équipe HSE + responsables de zone</p>
                                </div>
                            </div>
                        </header>
                        <div className="p-5">
                            <PickList
                                dataKey="id"
                                filter
                                filterBy="name"
                                sourceFilterPlaceholder="Rechercher par nom"
                                targetFilterPlaceholder="Rechercher par nom"
                                showTargetControls={false}
                                showSourceControls={false}
                                source={emps}
                                target={form.values.participants}
                                onChange={onChange}
                                itemTemplate={itemTemplate}
                                breakpoint="1280px"
                                sourceHeader={`Employés disponibles (${emps.length})`}
                                targetHeader={`Participants (${form.values.participants.length})`}
                                sourceStyle={{ height: '24rem' }}
                                targetStyle={{ height: '24rem' }}
                            />
                        </div>
                    </section>

                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <header className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-green-100 border border-green-200">
                                    <IconShield size={16} className="text-green-700" />
                                </div>
                                <div>
                                    <h2 className="text-sm text-slate-900">Équipements de protection individuelle (EPI)</h2>
                                    <p className="text-xs text-slate-500">EPI obligatoires sur la zone visitée</p>
                                </div>
                            </div>
                        </header>
                        <div className="p-5">
                            <Checkbox.Group size="md" {...form.getInputProps("ppe")} label="">
                                <div className="flex flex-wrap gap-2">
                                    {ppe.map((item: any) => (
                                        <Checkbox.Card key={item.id}
                                            value={item.id}
                                            radius="md"
                                            className="group border border-slate-300 transition duration-150 cursor-pointer
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
                                                    {item.name}
                                                </Text>
                                            </Group>
                                        </Checkbox.Card>
                                    ))}
                                </div>
                            </Checkbox.Group>
                        </div>
                    </section>

                    <div className="flex gap-2 justify-end pt-2">
                        <Button variant="default" leftSection={<IconX size={15} />} onClick={() => navigate(-1)}>
                            Annuler
                        </Button>
                        <Button type="submit" color="green" leftSection={<IconDeviceFloppy size={15} />}>
                            Créer la tournée
                        </Button>
                    </div>
                </form>
            </FormWithHelp>
        </div>
    )
}

export default AddNewTour
