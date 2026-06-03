import {
    ActionIcon,
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
import { useNavigate } from "react-router-dom";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import {
    IconClock,
    IconSearch,
    IconDeviceFloppy,
    IconX,
    IconCalendar,
    IconMapPin,
    IconAlertTriangle,
    IconShield,
    IconUsers,
    IconTarget,
    IconFileText,
    IconActivity,
} from "@tabler/icons-react";
import TextEditor from "../../UtilityComp/TextEditor";
import { getAllLocations } from "../../../services/LocationService";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { createPgi } from "../../../services/PgiService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { getActivitiesByYearStatusAndCategory } from "../../../services/HSEActivityService";
import PageHeader from "../../UtilityComp/PageHeader";
import FormWithHelp from "../../UtilityComp/FormWithHelp";






const AddPgi = () => {
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const [location, setLocation] = useState<any[]>([]);
    const ref = useRef<HTMLInputElement>(null);
    const ref1 = useRef<HTMLInputElement>(null);
    const [emps, setEmps] = useState<any[]>([]);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [activities, setActivities] = useState<any[]>([]);


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

            activityId: (value) => (value ? null : 'Activity is Required'),

            siteId: (value) => (value?.trim().length > 0 ? null : 'Inspections Site is Required'),
            plannedDate: (value) => (value ? null : 'Planned Date is Required'),
            objectives: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Objectives is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
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
        getActivitiesByYearStatusAndCategory(new Date().getFullYear(), "PENDING", "IGP").then((res) => {
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
                                label="Rôle"
                                placeholder="Sélectionner le rôle"
                                data={['Inspecteur principal', 'Inspecteur', 'Responsable de zone', 'Responsable HSE', 'Auditeur externe']}
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
        createPgi(values).then((_res) => {
            successNotification("Inspection scheduled successfully");
            navigate("/PGI")
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
                    { label: 'Inspections HSE', to: '/PGI' },
                    { label: 'Nouvelle inspection' },
                ]}
                icon={<IconSearch size={22} stroke={2} />}
                iconColor="green"
                title="Nouvelle inspection HSE"
                subtitle="Programmation d'une inspection planifiée — risques, EPI et équipe d'inspection"
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
                helpTitle="Aide : Inspection HSE planifiée"
                helpSubtitle="ISO 45001 §8.1 — Planification et contrôle opérationnels"
                helpItems={[
                    {
                        key: 'activity',
                        icon: IconActivity,
                        iconColor: 'green',
                        title: 'Activité de référence',
                        content: "Sélectionner l'activité du plan annuel HSE à laquelle cette inspection est rattachée (catégorie IGP, statut PENDING).",
                    },
                    {
                        key: 'location',
                        icon: IconMapPin,
                        iconColor: 'pink',
                        title: 'Lieu d\'inspection',
                        content: 'Site, zone ou installation à inspecter. Privilégier le niveau le plus précis disponible.',
                    },
                    {
                        key: 'datetime',
                        icon: IconCalendar,
                        iconColor: 'orange',
                        title: 'Date et heures',
                        content: 'Date planifiée et créneau horaire (début / fin). Respecter une durée raisonnable (généralement 1 à 3 heures).',
                    },
                    {
                        key: 'description',
                        icon: IconFileText,
                        iconColor: 'slate',
                        title: 'Description',
                        content: "Contexte de l'inspection : motif, événements ayant déclenché la planification, points d'attention particuliers.",
                    },
                    {
                        key: 'objectives',
                        icon: IconTarget,
                        iconColor: 'teal',
                        title: 'Objectif',
                        content: "Résultat attendu de l'inspection. Exemple : « Vérifier la conformité des dispositifs LOTO sur l'atelier de maintenance ».",
                    },
                    {
                        key: 'risks',
                        icon: IconAlertTriangle,
                        iconColor: 'red',
                        title: 'Types de risques',
                        content: "Risques HSE prioritaires à évaluer : mécanique, chimique, électrique, environnemental, ergonomique. Détermine la checklist applicable.",
                    },
                    {
                        key: 'ppe',
                        icon: IconShield,
                        iconColor: 'yellow',
                        title: 'EPI obligatoires',
                        content: "Équipements de protection individuelle requis sur la zone inspectée. À vérifier auprès du responsable de zone avant intervention.",
                        isoRef: 'ISO 45001 §8.1.2',
                    },
                    {
                        key: 'participants',
                        icon: IconUsers,
                        iconColor: 'indigo',
                        title: 'Équipe d\'inspection',
                        content: "Inspecteur principal + inspecteurs + responsable de zone + représentant CHSCT si applicable. Attribuer un rôle à chacun.",
                    },
                ]}
                helpTip="L'inspection peut être enregistrée en brouillon. Les EPI et risques doivent être validés avant la visite sur site."
            >
                <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-5">
                    {/* Section 1 — Informations */}
                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <header className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-green-100 border border-green-200">
                                    <IconSearch size={16} className="text-green-700" />
                                </div>
                                <div>
                                    <h2 className="text-sm text-slate-900">Informations sur l'inspection</h2>
                                    <p className="text-xs text-slate-500">Lieu, date, créneau et activité de référence</p>
                                </div>
                            </div>
                        </header>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select withAsterisk label="Activité de référence" placeholder="Sélectionner l'activité" data={activities} {...form.getInputProps('activityId')} />
                            <Select withAsterisk label="Lieu" placeholder="Sélectionner le lieu" data={location} {...form.getInputProps('siteId')} />
                            <DatePickerInput label="Date planifiée" placeholder="JJ/MM/AAAA" withAsterisk {...form.getInputProps('plannedDate')} />
                            <div className="grid grid-cols-2 gap-4">
                                <TimeInput label="Heure de début" ref={ref} rightSection={pickerControl} withAsterisk {...form.getInputProps('startTime')} />
                                <TimeInput label="Heure de fin" ref={ref1} rightSection={pickerControl1} withAsterisk {...form.getInputProps('endTime')} />
                            </div>
                        </div>
                    </section>

                    {/* Section 2 — Description */}
                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <header className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-green-100 border border-green-200">
                                    <IconFileText size={16} className="text-green-700" />
                                </div>
                                <div>
                                    <h2 className="text-sm text-slate-900">Description et contexte</h2>
                                    <p className="text-xs text-slate-500">Motif et points d'attention de l'inspection</p>
                                </div>
                            </div>
                        </header>
                        <div className="p-5">
                            <TextEditor form={form} id="description" title="Description" />
                        </div>
                    </section>

                    {/* Section 3 — Objectif et risques */}
                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <header className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-green-100 border border-green-200">
                                    <IconTarget size={16} className="text-green-700" />
                                </div>
                                <div>
                                    <h2 className="text-sm text-slate-900">Objectif et types de risques</h2>
                                    <p className="text-xs text-slate-500">Résultat attendu et grille de risques à évaluer</p>
                                </div>
                            </div>
                        </header>
                        <div className="p-5 space-y-4">
                            <TextInput label="Objectif" placeholder="Ex. Vérifier la conformité des dispositifs LOTO" {...form.getInputProps('objectives')} />
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
                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <header className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-green-100 border border-green-200">
                                    <IconShield size={16} className="text-green-700" />
                                </div>
                                <div>
                                    <h2 className="text-sm text-slate-900">Équipements de protection individuelle (EPI)</h2>
                                    <p className="text-xs text-slate-500">EPI obligatoires sur la zone inspectée</p>
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

                    {/* Section 5 — Participants */}
                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <header className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-green-100 border border-green-200">
                                    <IconUsers size={16} className="text-green-700" />
                                </div>
                                <div>
                                    <h2 className="text-sm text-slate-900">Équipe d'inspection</h2>
                                    <p className="text-xs text-slate-500">Inspecteurs et observateurs avec attribution des rôles</p>
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
                                targetHeader={`Équipe sélectionnée (${form.values.participants.length})`}
                                sourceStyle={{ height: '24rem' }}
                                targetStyle={{ height: '24rem' }}
                            />
                        </div>
                    </section>

                    <div className="flex gap-2 justify-end pt-2">
                        <Button variant="default" leftSection={<IconX size={15} />} onClick={() => navigate(-1)}>
                            Annuler
                        </Button>
                        <Button type="submit" color="green" leftSection={<IconDeviceFloppy size={15} />}>
                            Créer l'inspection
                        </Button>
                    </div>
                </form>
            </FormWithHelp>
        </div>
    )
}

export default AddPgi