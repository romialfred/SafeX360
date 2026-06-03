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
    IconUsers,
    IconDeviceFloppy,
    IconX,
    IconCalendar,
    IconShield,
    IconTarget,
    IconFileText,
    IconActivity,
    IconChecklist,
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


const AddHealthMeeting = () => {

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
            type: 'HSM',
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
        getActivitiesByYearStatusAndCategory(new Date().getFullYear(), "PENDING", "HSE").then((res) => {
            console.log(res);
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
                                data={['Employé', 'Manager', 'Superviseur', 'Responsable HSE', 'Auditeur externe']}
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
        console.log(values)
        dispatch(showOverlay())
        createActivity(values).then((_res) => {
            successNotification("Activity created successfully");
            navigate("/hs-Meetings");
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
                    { label: 'Réunions sécurité', to: '/hs-Meetings' },
                    { label: 'Nouvelle réunion' },
                ]}
                icon={<IconUsers size={22} stroke={2} />}
                iconColor="green"
                title="Nouvelle réunion sécurité"
                subtitle="Planification d'une réunion HSE — objectifs, agenda et résultats attendus"
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
                helpTitle="Aide : Réunion sécurité"
                helpSubtitle="ISO 45001 §5.4 — Consultation et participation des travailleurs"
                helpItems={[
                    {
                        key: 'activity',
                        icon: IconActivity,
                        iconColor: 'green',
                        title: 'Activité de référence',
                        content: "Activité du plan annuel HSE associée. Permet le rattachement automatique aux indicateurs de performance.",
                    },
                    {
                        key: 'type',
                        icon: IconChecklist,
                        iconColor: 'indigo',
                        title: 'Type de réunion',
                        content: "Causerie sécurité, comité HSE, retour d'expérience, briefing prise de poste, point CAPA. Détermine le format et les participants.",
                    },
                    {
                        key: 'location',
                        icon: IconMapPin,
                        iconColor: 'pink',
                        title: 'Lieu',
                        content: 'Salle, site ou zone où se tient la réunion. Inclure les modalités hybrides (présentiel/distanciel) si applicable.',
                    },
                    {
                        key: 'datetime',
                        icon: IconCalendar,
                        iconColor: 'orange',
                        title: 'Date et créneau horaire',
                        content: "Privilégier les créneaux compatibles avec les rotations de poste. Durée recommandée : 15-30 min pour causeries, 1-2h pour comités.",
                    },
                    {
                        key: 'objectives',
                        icon: IconTarget,
                        iconColor: 'teal',
                        title: 'Objectifs',
                        content: "Résultats concrets attendus de la réunion. Exemple : « Sensibiliser aux risques de chute en hauteur après l'incident du 12/03 ».",
                    },
                    {
                        key: 'agenda',
                        icon: IconFileText,
                        iconColor: 'slate',
                        title: 'Agenda',
                        content: "Ordre du jour avec horodatage estimatif. Inclure introduction, points à traiter, démonstrations, questions/réponses, conclusion.",
                    },
                    {
                        key: 'expected',
                        icon: IconChecklist,
                        iconColor: 'cyan',
                        title: 'Résultats attendus',
                        content: "Livrables et décisions à acter en fin de réunion : actions correctives, planning de formations, mise à jour de procédures.",
                        isoRef: 'ISO 45001 §5.4.b',
                    },
                    {
                        key: 'participants',
                        icon: IconUsers,
                        iconColor: 'blue',
                        title: 'Participants',
                        content: "Sélectionner les employés concernés. Les représentants du personnel doivent être conviés systématiquement aux comités HSE.",
                    },
                    {
                        key: 'ppe',
                        icon: IconShield,
                        iconColor: 'yellow',
                        title: 'EPI requis',
                        content: "Équipements de protection nécessaires si la réunion se tient en zone à risque ou inclut une démonstration terrain.",
                    },
                ]}
                helpTip="Le compte-rendu de réunion peut être annexé après la session via la fiche détaillée. Les décisions deviennent des actions traçables."
            >
                <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-5">
                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <header className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-green-100 border border-green-200">
                                    <IconUsers size={16} className="text-green-700" />
                                </div>
                                <div>
                                    <h2 className="text-sm text-slate-900">Informations sur la réunion</h2>
                                    <p className="text-xs text-slate-500">Type, lieu, date et créneau</p>
                                </div>
                            </div>
                        </header>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select withAsterisk label="Activité de référence" placeholder="Sélectionner l'activité" data={activities} {...form.getInputProps('activityId')} />
                            <Select withAsterisk label="Type de réunion" placeholder="Sélectionner le type" data={activityTypes} disabled {...form.getInputProps('type')} />
                            <Select label="Lieu" placeholder="Sélectionner le lieu" leftSection={<IconMapPin size={16} />} data={location} withAsterisk {...form.getInputProps('locationId')} />
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
                                    <h2 className="text-sm text-slate-900">Objectifs, agenda et résultats attendus</h2>
                                    <p className="text-xs text-slate-500">Préparation de la réunion conformément à ISO 45001 §5.4</p>
                                </div>
                            </div>
                        </header>
                        <div className="p-5 space-y-4">
                            <TextEditor form={form} id="objectives" title="Objectifs" />
                            <TextEditor form={form} id="agenda" title="Agenda" />
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
                                    <h2 className="text-sm text-slate-900">Participants</h2>
                                    <p className="text-xs text-slate-500">Employés conviés avec attribution des rôles</p>
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
                                    <p className="text-xs text-slate-500">Requis si la réunion inclut une visite ou démonstration terrain</p>
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
                            Créer la réunion
                        </Button>
                    </div>
                </form>
            </FormWithHelp>
        </div>
    )
}

export default AddHealthMeeting
