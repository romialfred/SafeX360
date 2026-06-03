import { Button, FileInput, MultiSelect, Select, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { PickList } from "primereact/picklist";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auditType, PPE } from "../../../Data/IncidentsData";
import PageHeader from "../../UtilityComp/PageHeader";
import FormWithHelp from "../../UtilityComp/FormWithHelp";
import {
    IconClipboardCheck,
    IconTarget,
    IconBuildingFactory,
    IconChartBar,
    IconPaperclip,
    IconShield,
    IconUsers,
    IconCertificate,
    IconFileText,
    IconDeviceFloppy,
    IconX,
} from "@tabler/icons-react";

const AddAudit = () => {
    const navigate = useNavigate();
    const [target, setTarget] = useState<any[]>([]);
    const [member, setMember] = useState<any[]>([]);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const [auditPlanFile, setAuditPlanFile] = useState<File | null>(null);

    useEffect(() => {
        const dummyEmployees = [
            { id: 1, name: 'John Doe', empNumber: 'EMP001', role: '' },
            { id: 2, name: 'Jane Smith', empNumber: 'EMP002', role: '' },
            { id: 3, name: 'Robert Johnson', empNumber: 'EMP003', role: '' },
        ];
        setMember(dummyEmployees.map(emp => ({ ...emp, pos: "Source" })));
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
                return trimmed.length > 80 ? "Maximum 80 caractères" : null;
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
        setEditingRoleId(null);
    };

    const itemTemplate = (item: any) => {
        return (
            <div className={`${item.pos === "Target" ? "w-[500px]" : "w-[400px]"} flex gap-5 justify-between self-center`}>
                <div className="flex flex-col gap-1">
                    <span className="text-slate-800">{item.name}</span>
                    <span className="text-xs text-slate-500">{item.empNumber}</span>
                </div>
                {item.pos === "Target" && (
                    <div className="flex items-center gap-2 w-[220px]">
                        {editingRoleId === item.id || !item.role ? (
                            <Select
                                autoFocus
                                label="Rôle"
                                placeholder="Sélectionner le rôle"
                                data={['Auditeur principal', 'Auditeur', 'Analyste données', 'Pilote processus', 'Observateur']}
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

    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des Audits', to: '/audit-management' },
                    { label: 'Programmer un audit' },
                ]}
                icon={<IconClipboardCheck size={22} stroke={2} />}
                iconColor="indigo"
                title="Programmer un audit"
                subtitle="Définition du périmètre, des objectifs et de l'équipe conformément à ISO 19011"
                actions={
                    <>
                        <Button variant="default" size="sm" leftSection={<IconX size={15} />} onClick={() => navigate(-1)}>
                            Annuler
                        </Button>
                        <Button color="indigo" size="sm" leftSection={<IconDeviceFloppy size={15} />}>
                            Enregistrer
                        </Button>
                    </>
                }
            />

            <FormWithHelp
                helpAccentColor="indigo"
                helpTitle="Aide : Programmation d'audit"
                helpSubtitle="ISO 19011 — Lignes directrices pour l'audit des systèmes de management"
                helpItems={[
                    {
                        key: 'title',
                        icon: IconFileText,
                        iconColor: 'teal',
                        title: "Titre de l'audit",
                        content: "Intitulé court et factuel (max. 80 caractères). Exemple : « Audit SST atelier de maintenance Q2 2026 ».",
                    },
                    {
                        key: 'type',
                        icon: IconClipboardCheck,
                        iconColor: 'indigo',
                        title: "Type d'audit",
                        content: "Interne (1ère partie), fournisseur (2ème partie) ou certification (3ème partie). Détermine les exigences de compétence des auditeurs.",
                        isoRef: 'ISO 19011 §3.2',
                    },
                    {
                        key: 'objective',
                        icon: IconTarget,
                        iconColor: 'orange',
                        title: "Objectifs",
                        content: "Définir ce que l'audit doit accomplir : conformité réglementaire, performance du système, identification d'opportunités d'amélioration.",
                        isoRef: 'ISO 19011 §5.4.2',
                    },
                    {
                        key: 'scope',
                        icon: IconBuildingFactory,
                        iconColor: 'cyan',
                        title: "Périmètre / sites concernés",
                        content: "Délimitation physique et processuelle : sites, départements, processus, fonctions, période couverte. Doit être clair et cohérent avec les objectifs.",
                        isoRef: 'ISO 19011 §5.4.3',
                    },
                    {
                        key: 'indicators',
                        icon: IconChartBar,
                        iconColor: 'blue',
                        title: "Indicateurs d'évaluation",
                        content: "KPIs HSE mesurables : TRIFR, LTIFR, taux de fermeture des actions, taux de formation, conformité audits internes précédents.",
                    },
                    {
                        key: 'plan',
                        icon: IconPaperclip,
                        iconColor: 'slate',
                        title: "Plan d'audit",
                        content: "Document joint décrivant le programme détaillé : agenda, équipe, sites visités, critères et méthodes. Formats : PDF, DOCX. Max. 10 Mo.",
                        isoRef: 'ISO 19011 §6.3.2',
                    },
                    {
                        key: 'ppe',
                        icon: IconShield,
                        iconColor: 'yellow',
                        title: "EPI requis sur site",
                        content: "Équipements de protection individuelle obligatoires pour l'équipe d'audit selon les zones visitées (chaussures S3, casque, lunettes, gants, harnais).",
                    },
                    {
                        key: 'team',
                        icon: IconUsers,
                        iconColor: 'green',
                        title: "Équipe d'audit",
                        content: "Auditeur principal (chef d'équipe), auditeurs, experts techniques, observateurs. Compétences à valider selon ISO 19011 §7.",
                        isoRef: 'ISO 19011 §5.5.4',
                    },
                    {
                        key: 'independence',
                        icon: IconCertificate,
                        iconColor: 'violet',
                        title: "Indépendance & impartialité",
                        content: "Les auditeurs ne doivent pas auditer leur propre travail. Vérifier l'absence de conflit d'intérêts avant validation de l'équipe.",
                        isoRef: 'ISO 19011 §4.d',
                    },
                ]}
                helpTip="Vous pouvez sauvegarder en brouillon à tout moment. Le plan d'audit peut être ajouté ultérieurement avant la phase de préparation."
            >
                {/* Section 1 — Informations générales */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <header className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-white">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-indigo-100 border border-indigo-200">
                                <IconClipboardCheck size={16} className="text-indigo-700" />
                            </div>
                            <div>
                                <h2 className="text-sm text-slate-900">Informations générales</h2>
                                <p className="text-xs text-slate-500">Identification, type et périmètre de l'audit</p>
                            </div>
                        </div>
                    </header>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <TextInput withAsterisk label="Titre de l'audit" placeholder="Ex. Audit SST atelier maintenance Q2" {...form.getInputProps('name')} />
                        <Select withAsterisk label="Type d'audit" placeholder="Sélectionner le type" data={auditType} {...form.getInputProps('type')} />
                        <MultiSelect withAsterisk label="Objectifs" placeholder="Sélectionner les objectifs" data={['Évaluation de conformité', 'Amélioration continue', 'Certification ISO', 'Vérification CAPA', 'Préparation audit externe']} />
                        <MultiSelect withAsterisk label="Sites concernés" placeholder="Sélectionner les sites" data={['Zone d\'exploitation', 'Équipements', 'Installations spécifiques', 'Bureaux', 'Stockage carburant', 'Atelier maintenance']} />
                        <MultiSelect withAsterisk label="Indicateurs d'évaluation" placeholder="Sélectionner les indicateurs" data={['TRIFR', 'LTIFR', 'Taux de fermeture CAPA', 'Conformité formations', 'Heures sans incident']} />
                        <FileInput
                            label="Plan d'audit"
                            placeholder="Téléverser un document"
                            value={auditPlanFile}
                            onChange={setAuditPlanFile}
                            accept="application/pdf,image/*"
                            withAsterisk
                            rightSectionWidth={80}
                            rightSection={
                                auditPlanFile ? (
                                    <Button
                                        size="xs"
                                        variant="light"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const fileUrl = URL.createObjectURL(auditPlanFile);
                                            window.open(fileUrl, "_blank");
                                        }}
                                    >
                                        Aperçu
                                    </Button>
                                ) : null
                            }
                        />
                        <Select withAsterisk label="EPI requis" placeholder="Sélectionner les EPI" data={PPE} {...form.getInputProps('ppe')} />
                    </div>
                </section>

                {/* Section 2 — Équipe d'audit */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <header className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-white">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-indigo-100 border border-indigo-200">
                                <IconUsers size={16} className="text-indigo-700" />
                            </div>
                            <div>
                                <h2 className="text-sm text-slate-900">Équipe d'audit</h2>
                                <p className="text-xs text-slate-500">Sélection et attribution des rôles conformément à ISO 19011 §5.5.4</p>
                            </div>
                        </div>
                    </header>
                    <div className="p-5">
                        <div className="flex gap-5 flex-wrap">
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
                                targetHeader={`Équipe d'audit (${target.length})`}
                                sourceStyle={{ height: '24rem' }}
                                targetStyle={{ height: '24rem' }}
                            />
                        </div>
                    </div>
                </section>
            </FormWithHelp>
        </div>
    );
};

export default AddAudit;
