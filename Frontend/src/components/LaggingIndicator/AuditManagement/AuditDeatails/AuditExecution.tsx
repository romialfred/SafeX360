import { useEffect, useState } from "react";
import { ActionIcon, Badge, Button, Group, Select, TextInput } from "@mantine/core";
import { IconArrowUpRight, IconPhoto, IconPlus, IconTrash } from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { isValidRichText } from "../../../../utility/OtherUtilities";
import TextEditor from "../../../UtilityComp/TextEditor";
import SafeHtml from "../../../UtilityComp/SafeHtml";
import FileUpdateDropzone from "../../../UtilityComp/FileUpdateDropzone";
import { formatDateShort } from "../../../../utility/DateFormats";
import { GetAllAuditArea } from "../../../../services/AuditAreaService";
import { mantineColorToLevel } from "../../../../Data/DropdownData";
import {
    auditIsoErrorMessage,
    isNcClassification,
    OBS_CLASSIFICATION_OPTIONS,
    obsClassificationColor,
    obsClassificationLabel,
    OBS_SEVERITY_LABELS,
    OBS_SEVERITY_OPTIONS,
    OBSERVATION_TYPE_LABELS,
    OBSERVATION_TYPE_OPTIONS,
} from "../auditLabels";
import { modals } from "@mantine/modals";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { createObservation, getObservationByAuditId } from "../../../../services/ObservationService";
import { escalateObservation, getAuditChecklist } from "../../../../services/AuditIsoService";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";
import { convertFilesToBase64New, handlePreview } from "../../../../utility/DocumentUtility";
import { useParams } from "react-router-dom";

/** LOT 52 — id du datalist des clauses issues de la checklist initialisée. */
const CLAUSE_DATALIST_ID = "audit-observation-clause-options";

const AuditExecution = ({ employees, empMap, audit, onObservationAdded }: any) => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [showForm, setShowForm] = useState(false);

    const [auditAreas, setAuditAreas] = useState<any[]>([]);
    const [observations, setObservations] = useState<any[]>([]);
    // LOT 52 — clauses du/des référentiels initialisés pour le datalist Clause.
    const [checklistClauses, setChecklistClauses] = useState<string[]>([]);


    useEffect(() => {

        GetAllAuditArea({}).then((res) => {
            setAuditAreas(res.map((item: any) => {
                return {
                    ...item,
                    value: "" + item.id,
                    label: item.name,
                }
            }));
        }).catch((_err) => {
            setAuditAreas([]);
        });

        fetchObservations();

        getAuditChecklist(Number(id)).then((res) => {
            const clauses = Array.from(new Set(res.map((item) => item.clause).filter(Boolean)));
            clauses.sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
            setChecklistClauses(clauses);
        }).catch((_err) => {
            setChecklistClauses([]);
        });
    }, []);

    const fetchObservations = () => {
        getObservationByAuditId(Number(id)).then((res) => {

            setObservations(res);
        }).catch((_err) => {
            setObservations([]);
        });

    }

    const empForm = useForm({
        initialValues: {
            id: '',
            date: new Date(),
        },
        validate: {
            id: (value) => (value ? null : "L'employé est requis"),
            date: (value) => (value ? null : 'La date est requise'),
        }
    });


    const handleAddInterviewee = () => {
        empForm.validate();
        if (!empForm.isValid()) {
            return;
        }
        form.setFieldValue('interviews', [...form.values.interviews, empForm.values]);
        empForm.reset();
    };

    const handleRemoveInterviewee = (id: number) => {
        let updatedInterviewees = form.values.interviews.filter((entry: any) => entry.id !== id);
        form.setFieldValue('interviews', updatedInterviewees);
    };



    const handleCancel = () => {
        setShowForm(false);
    };


    const form = useForm({
        initialValues: {
            title: "",
            date: new Date() as any,
            observedFact: '',
            reference: '',
            type: '',

            severity: '',
            zoneId: '',
            description: '',
            evidence: [] as any[],
            interviews: [] as any,

            // LOT 52 — classification ISO 19011 + clause du référentiel.
            classification: '',
            clause: '',

        },
        validate: {
            date: (value) => (value ? null : 'La date est requise'),
            type: (value) => (value ? null : 'Le type est requis'),
            observedFact: (value) => (value?.trim()?.length > 0 ? null : 'Le fait observé est requis'),
            reference: (value) => (value?.trim()?.length > 0 ? null : 'La référence au critère est requise'),
            severity: (value) => (value ? null : 'La gravité est requise'),
            zoneId: (value) => (value ? null : 'La zone est requise'),
            description: (value) => (isValidRichText(value) ? null : 'La description est requise'),
            // LOT 52 — rigueur ISO alignée backend : une NC exige clause + preuve.
            clause: (value, values) =>
                isNcClassification(values.classification) && !value?.trim()
                    ? 'La clause du référentiel est obligatoire pour une non-conformité'
                    : null,
            evidence: (value, values) =>
                isNcClassification(values.classification) && (!value || value.length === 0)
                    ? 'Au moins une preuve est obligatoire pour une non-conformité'
                    : null,

        }
    });


    const handleSubmit = () => {

        form.validate();
        if (!form.isValid()) return;


        let values = form.values;

        modals.openConfirmModal({
            title: <span className="text-base">Confirmer le constat</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Enregistrer ce constat d'audit ?
                </span>
            ),
            labels: { confirm: "Oui, enregistrer", cancel: "Annuler" },
            cancelProps: { color: "gray", variant: "default" },
            confirmProps: { color: "indigo", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: async () => {
                const evidence = await convertFilesToBase64New(values.evidence);
                dispatch(showOverlay());
                createObservation({ ...values, evidence, auditId: id })
                    .then(() => {
                        successNotification("Constat enregistré");
                        form.reset();
                        empForm.reset();
                        setShowForm(false);
                        fetchObservations();
                        onObservationAdded?.();
                    }
                    ).catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || "L'enregistrement a échoué");
                    }
                    ).finally(() => {
                        dispatch(hideOverlay());
                    }
                    )
            },
        });



    };

    // LOT 52 — escalade d'un constat classé NC vers les Constats centraux
    // (NonConformity). Idempotent côté backend : renvoie l'existant sinon.
    const handleEscalate = (obs: any) => {
        modals.openConfirmModal({
            title: <span className="text-base">Escalader vers les Constats centraux</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Créer un Constat central (non-conformité) à partir du constat « {obs.title} » ?
                    Le traitement de l'écart sera suivi dans le module Constats.
                </span>
            ),
            labels: { confirm: "Oui, escalader", cancel: "Annuler" },
            cancelProps: { color: "gray", variant: "default" },
            confirmProps: { color: "indigo", variant: "filled" },
            onConfirm: () => {
                dispatch(showOverlay());
                escalateObservation(obs.id)
                    .then((res) => {
                        successNotification(
                            `${res?.message || 'Constat escaladé vers les Constats centraux'} — Constat central n° ${res?.nonConformityId}`
                        );
                        fetchObservations();
                        onObservationAdded?.();
                    })
                    .catch((err) => {
                        errorNotification(auditIsoErrorMessage(err, "L'escalade du constat a échoué"));
                    })
                    .finally(() => {
                        dispatch(hideOverlay());
                    });
            },
        });
    };

    return (
        <div className="   p-6 bg-white rounded-xl shadow-sm border border-gray-300">
            {!showForm ? (
                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <p className="text-lg text-gray-700">Constats d'exécution</p>
                        {audit.status !== "CLOSED" && audit.status != "CANCELLED" && <Button onClick={() => setShowForm(true)} leftSection={<IconPlus />}>Nouveau constat</Button>}
                    </div>

                    {observations.length === 0 ? (
                        <p className="text-gray-500 italic">Aucun constat enregistré pour cet audit.</p>
                    ) : (
                        observations.map((obs: any) => (
                            <div
                                key={obs.id}
                                className="p-6 rounded-2xl border border-gray-200 shadow-md bg-white space-y-2 transition-shadow hover:shadow-lg"
                            >
                                {/* Top Info Row */}
                                <div className="flex flex-wrap justify-between items-center">
                                    <div className="flex gap-3 flex-wrap items-center">
                                        <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full uppercase">
                                            {OBSERVATION_TYPE_LABELS[obs.type] ?? obs.type}
                                        </span>
                                        <Badge variant="outline" color={mantineColorToLevel[obs.severity]} >
                                            {OBS_SEVERITY_LABELS[obs.severity] ?? obs.severity}
                                        </Badge>
                                        {/* LOT 52 — classification ISO + clause */}
                                        {obs.classification && (
                                            <Badge variant="light" color={obsClassificationColor(obs.classification)} radius="sm">
                                                {obsClassificationLabel(obs.classification)}
                                            </Badge>
                                        )}
                                        {obs.clause && (
                                            <Badge variant="outline" color="gray" radius="sm">
                                                Clause {obs.clause}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {/* LOT 52 — escalade NC vers les Constats centraux */}
                                        {isNcClassification(obs.classification) && (
                                            obs.nonConformityId ? (
                                                <Badge variant="light" color="indigo" radius="sm" leftSection={<IconArrowUpRight size={12} />}>
                                                    Escaladé — Constat central n° {obs.nonConformityId}
                                                </Badge>
                                            ) : (
                                                audit.status !== "CLOSED" && audit.status !== "CANCELLED" && (
                                                    <Button
                                                        size="xs"
                                                        variant="light"
                                                        color="indigo"
                                                        leftSection={<IconArrowUpRight size={14} />}
                                                        onClick={() => handleEscalate(obs)}
                                                    >
                                                        Escalader vers les Constats centraux
                                                    </Button>
                                                )
                                            )
                                        )}
                                        <p className="text-xs text-gray-500">{formatDateShort(obs.date)}</p>
                                    </div>

                                </div>

                                {/* Observation Content */}
                                <div className="space-y-2">
                                    <h3 className="text-lg text-gray-800 leading-snug">
                                        {obs.observedFact?.replace(/<\/?[^>]+(>|$)/g, "")}
                                    </h3>
                                    <p className="text-sm text-gray-600">Réf. : {obs.reference}</p>
                                </div>

                                {/* Metadata Section */}
                                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                                    <div>
                                        <strong className="block text-gray-500 mb-1">Description des preuves :</strong>
                                        {/* LOT 41 P0 XSS fix */}
                                        <SafeHtml html={obs.description} />
                                    </div>
                                    <div>
                                        <strong className="block text-gray-500 mb-1">Zone :</strong>
                                        {auditAreas.find(area => area.value == obs.zoneId)?.label || "—"}
                                    </div>
                                    {obs.interviews?.length > 0 && (
                                        <div className="md:col-span-2">
                                            <strong className="block text-gray-500 mb-1">Entretiens :</strong>
                                            <div className="flex flex-wrap gap-2">
                                                {obs.interviews.map((emp: any, i: number) => (
                                                    <span key={i} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-xs">
                                                        {emp.name} ({formatDateShort(emp.date)})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {obs.evidence?.length > 0 && (
                                        <div className="md:col-span-2">
                                            <strong className="block text-gray-500 mb-1">Pièces jointes :</strong>
                                            <Group className="flex flex-wrap gap-2">
                                                {obs.evidence.map((doc: any) => (
                                                    <Badge
                                                        key={doc.name}
                                                        size="lg"
                                                        className="!cursor-pointer"
                                                        onClick={() => handlePreview(doc)}
                                                        leftSection={<IconPhoto size={14} />}
                                                        color="orange"
                                                        variant="light"
                                                    >
                                                        {doc.name}
                                                    </Badge>
                                                ))}
                                            </Group>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {/* New Observation Form */}
                    <div className="flex justify-between items-center">

                        <h2 className="text-lg text-gray-700 ">Nouveau constat</h2>
                        <Button color="red" variant="light" onClick={handleCancel}>
                            Annuler
                        </Button>
                    </div>
                    <div className="flex flex-col gap-5">


                        <div className="grid grid-cols-2 gap-4">
                            <TextInput label="Titre" placeholder="Titre du constat" withAsterisk {...form.getInputProps('title')} />
                            <DateInput label="Date du constat" placeholder="Sélectionner la date" minDate={audit?.startDate ? new Date(audit?.startDate) : undefined} withAsterisk {...form.getInputProps('date')} />
                            <div className="col-span-2">

                                <TextEditor title="Fait observé" form={form} withAsterisk id='observedFact' />
                            </div>
                            <TextInput label="Référence au critère" placeholder="ISO 45001:2018 — 8.1.1" withAsterisk {...form.getInputProps('reference')} />
                            <Select label="Type" placeholder="Sélectionner le type" data={OBSERVATION_TYPE_OPTIONS} withAsterisk  {...form.getInputProps('type')} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Gravité" placeholder="Sélectionner la gravité" withAsterisk data={OBS_SEVERITY_OPTIONS}  {...form.getInputProps('severity')} />
                            <Select label="Lieu / zone" placeholder="Sélectionner le lieu" data={auditAreas} withAsterisk {...form.getInputProps('zoneId')} />
                        </div>

                        {/* LOT 52 — classification ISO 19011 du constat + clause du référentiel */}
                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Classification ISO"
                                placeholder="Sélectionner la classification"
                                description="Une non-conformité (majeure ou mineure) exige la clause et au moins une preuve"
                                data={OBS_CLASSIFICATION_OPTIONS}
                                clearable
                                {...form.getInputProps('classification')}
                            />
                            <div>
                                <TextInput
                                    label="Clause du référentiel"
                                    placeholder={checklistClauses.length > 0 ? `ex. ${checklistClauses[0]}` : 'ex. 8.1.2'}
                                    description={checklistClauses.length > 0
                                        ? 'Suggestions issues de la checklist initialisée de cet audit'
                                        : 'Aucune checklist initialisée : saisir la clause librement'}
                                    list={CLAUSE_DATALIST_ID}
                                    withAsterisk={isNcClassification(form.values.classification)}
                                    {...form.getInputProps('clause')}
                                />
                                <datalist id={CLAUSE_DATALIST_ID}>
                                    {checklistClauses.map((clause) => (
                                        <option key={clause} value={clause} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        <div>

                            <TextEditor title="Description des preuves" form={form} withAsterisk id="description" />
                        </div>

                        <div className="flex flex-col ">
                            <p className="font-medium">Fichiers de preuve (PDF, images)</p>
                            <FileUpdateDropzone form={form} id="evidence" />
                        </div>

                        <div className="flex flex-col gap-3">
                            <p className="">Employés interrogés</p>
                            <div className=" bg-blue-50 p-4 rounded-lg flex flex-col gap-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        placeholder="Choisir un employé"
                                        label="Employé"
                                        data={employees.filter((emp: any) => !(form.values.interviews.some((entry: any) => entry.id === emp.value) && emp.value !== empForm.values.id))}

                                        {...empForm.getInputProps('id')}
                                    />
                                    <DateInput label="Date de l'entretien" placeholder="Sélectionner la date" {...empForm.getInputProps('date')} maxDate={new Date()} />
                                </div>

                                <div className="">
                                    <Button leftSection={<IconPlus />} onClick={handleAddInterviewee}>
                                        Ajouter à la liste
                                    </Button>
                                </div>
                            </div>

                            {/* Added Interviewee Cards */}
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                {form.values.interviews?.map((entry: any) => (
                                    <div
                                        key={entry.id}
                                        className="bg-green-50 border flex items-center justify-between border-green-300 rounded-lg p-4 relative"
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="text-green-600">
                                                <strong className="text-green-600 ">Employé :</strong> {empMap[entry.id] ? empMap[entry.id].name : '—'}
                                            </div>
                                            <div className="text-green-600">
                                                <strong className="text-green-600 ">Date de l'entretien :</strong> {formatDateShort(entry.date)}
                                            </div>
                                        </div>
                                        <ActionIcon
                                            type="button"
                                            onClick={() => handleRemoveInterviewee(entry.id)}
                                            color="red"
                                            aria-label="Retirer l'employé interrogé"
                                        >
                                            <IconTrash size={18} />
                                        </ActionIcon>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-3 mt-6">

                        <Button color="indigo" onClick={handleSubmit}>Enregistrer</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AuditExecution
