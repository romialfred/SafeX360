
import { Alert, Anchor, Badge, Breadcrumbs, Button, Modal, Select, Tabs, Text, Textarea, Tooltip } from '@mantine/core';
import {
    IconCalendarEvent,
    IconClock,
    IconBook,
    IconTrendingUp,
    IconFileText,
    IconSearch,
    IconCalendarFilled,
    IconLock,
    IconAlertOctagon,
    IconArrowLeft,
    IconMapPin,
    IconUser,
    IconEdit,
    IconPrinter,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getIncidentById } from '../../../../services/IncidentService';
import { mapIdToName } from '../../../../utility/OtherUtilities';
import { formatDate } from '../../../../utility/DateFormats';
import { getEmployeeDropdown, getEmployeesByIds } from '../../../../services/EmployeeService';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../../slices/OverlaySlice';

import IncidentDetailsTab from './IncidentDetailsTab';
import ImpactAnalysis from '../ImpactAnalysis';
import Lesson from './Lesson';
import { incidentHistoryStatus, incidentStatusMap } from '../../../../Data/DropdownData';
import RiskAssessment from '../RiskAssessment';
import { getInvestigationByIncidentId } from '../../../../services/InvestigationService';
import InvestigationDetailsTab from './InvestigationDetailsTab';
import { getCorrectiveActionByIncidentId } from '../../../../services/CorrectiveActionService';
import ActionPlansTab from './ActionPlansTab';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { errorNotification, successNotification } from '../../../../utility/NotificationUtility';
import { addIncidentHistory, getIncidentHistoryByIncidentId } from '../../../../services/IncidentHistoryService';
import IncidentHistory from './IncidentHistoryTab';
import { getWeathersByIds } from '../../../../services/WeatherService';
import { getAllInvestigationProcessByInvestigationId } from '../../../../services/InvestigationFileService';

const ViewDetails = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    const [employees, setEmployees] = useState<Record<number, any>>([]);
    const [incident, setIncident] = useState<any>({});
    const [activeTab, setActiveTab] = useState('details');
    const incidentId = Number(id);
    const [investigation, setInvestigation] = useState<any>({});
    const [locked, setLocked] = useState<{ locked: boolean; status: string }>({ locked: false, status: '' });
    const [actions, setActions] = useState<any[]>([]);
    const [opened, { open, close }] = useDisclosure(false);
    const [emps, setEmps] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [weatherMap, setWeatherMap] = useState<Record<number, any>>({});
    const [investigationProcesses, setInvestigationProcesses] = useState<any[]>([]);



    useEffect(() => {
        dispatch(showOverlay());
        getIncidentById(id).then((res) => {
            setIncident(res);
            console.log(res);
            const statusUpper = String(res?.status || '').toUpperCase();
            if (['CLOSED', 'REJECTED'].includes(statusUpper)) {
                setLocked({ locked: true, status: statusUpper });
            }
            dispatch(hideOverlay());
            let emps = Array.from(new Set([...res.involvedPersons, ...res.witnesses, res.reporterId]));
            getEmployeesByIds(emps).then((res: any) => {
                setEmployees(mapIdToName(res));
            }).catch((_err) => {

            });
            getWeathersByIds(res.weatherConditions).then((weatherRes) => {

                setWeatherMap(mapIdToName(weatherRes));
            }).catch((err) => {
                console.log(err);
            })
        }
        ).catch((err) => {
            console.log(err);
        }).finally(() => {
            dispatch(hideOverlay());
        });

        getEmployeeDropdown()
            .then((res) => {
                const mappedEmployees = res.map((emp: any) => ({
                    label: emp.name,
                    value: String(emp.id), // ensure value is string if form field is string
                }));
                setEmps(mappedEmployees);
            })
            .catch((_err) => { });

        getInvestigationByIncidentId(id).then((res) => {
            setInvestigation(res);
            getAllInvestigationProcessByInvestigationId(res.id).then((processes) => {
                setInvestigationProcesses(processes);
            }).catch((_err) => { });

        }).catch((err) => {
            console.log(err);
        })

        getCorrectiveActionByIncidentId(id).then((res) => {
            setActions(res);
        }).catch((err) => {
            console.log(err);
        });

        fetchHistory();



    }, []);
    useEffect(() => {
        if (!searchParams) return;
        const tab = searchParams.get('tab')
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const fetchHistory = () => {
        getIncidentHistoryByIncidentId(id).then((res) => {
            setHistory(res);
            console.log(res);

        }).catch((err) => {
            console.log(err);
        });
    }



    const handleStatusChange = () => {
        if (locked.locked) return;
        open();

    }
    const form = useForm({
        initialValues: {
            ownerId: "",
            date: "",
            status: "",
            comment: "",
            incidentId: incidentId
        },
        validate: {
            ownerId: (value) => value ? null : "Owner is required",
            date: (value) => value ? null : "Date is required",
            status: (value) => value ? null : "Status is required",
        }
    });

    const handleSubmit = async (values: any) => {
        if (locked.locked) {
            errorNotification(locked.status === 'CLOSED' ? 'This incident is closed. Modifications are not allowed.' : 'This incident is rejected. Modifications are not allowed.');
            return;
        }
        dispatch(showOverlay());
        addIncidentHistory(values).then((_res) => {
            successNotification("Status changed successfully");
            close();
            setIncident((prev: any) => ({
                ...prev,
                status: values.status,
            }));
            fetchHistory();
        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
        }).finally(() => {
            dispatch(hideOverlay());
        });
    };


    const tabData = {
        details: {
            label: 'Détails',
            icon: IconFileText,
            content: <IncidentDetailsTab
                incident={incident}
                employees={employees}
                weatherMap={weatherMap}
            />,
            hide: false
        },
        analysis: {
            label: 'Analyse d\'Impact',
            icon: IconTrendingUp,
            content: <ImpactAnalysis
                incident={incident}
                employees={employees}
            />,
            hide: false
        },
        risks: {
            label: 'Évaluation Risque',
            icon: IconClock,
            content: <RiskAssessment incident={incident} />,
            hide: false
        },
        investigation: {
            label: 'Investigation',
            icon: IconSearch,
            content: <InvestigationDetailsTab investigation={investigation} processes={investigationProcesses} />,
            hide: !investigation || Object.keys(investigation).length === 0,
        },
        actions: {
            label: 'Plans d\'Actions',
            icon: IconCalendarFilled,
            content: <ActionPlansTab actions={actions} />,
            hide: !actions || actions.length === 0,
        },
        lessons: {
            label: 'Leçons Apprises',
            icon: IconBook,
            content: <Lesson incidentId={incidentId} />,
            hide: false
        },
        history: {
            label: "Historique",
            icon: IconCalendarEvent,
            content: <IncidentHistory incident={incident} history={history} />,
            hide: history.length === 0
        }
    };

    // Helpers — affichage robuste face aux données partielles (évite "Invalid Date")
    const safeDate = (v: any) => {
        if (!v) return '—';
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    };
    const safeTime = (v: any) => {
        if (!v) return '';
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };
    const statusColorMap: Record<string, string> = {
        'PENDING': 'gray',
        'REPORTED': 'blue',
        'INVESTIGATION': 'cyan',
        'INVESTIGATION_COMPLETED': 'yellow',
        'CORRECTIVE_ACTIONS': 'orange',
        'CLOSED': 'green',
        'REJECTED': 'red',
    };
    const currentStatusKey = String(incident?.status || '').toUpperCase();
    const statusColor = statusColorMap[currentStatusKey] || 'gray';
    const statusLabel = incidentStatusMap[incident?.status] || (incident?.status ? String(incident.status) : '—');
    const reporterName = employees[incident?.reporterId]?.name || 'Inconnu';

    const isLoading = !incident?.id;

    return (
        <div className="p-5 space-y-5 w-full">
            {/* Page header — breadcrumb + titre + actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-3 border-b border-slate-200">
                <div className="flex-1 min-w-0">
                    <Breadcrumbs separator="›" className="!text-xs">
                        <Anchor component={Link} to="/" size="xs" c="dimmed">Accueil</Anchor>
                        <Anchor component={Link} to="/incidents" size="xs" c="dimmed">Gestion des incidents</Anchor>
                        <Text size="xs" c="teal">{incident?.number || (isLoading ? '...' : 'Détail')}</Text>
                    </Breadcrumbs>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                            <IconAlertOctagon className="text-red-600" size={22} stroke={2} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight truncate">
                                {isLoading ? (
                                    <span className="inline-block h-7 w-72 bg-slate-200 rounded animate-pulse align-middle" />
                                ) : (incident?.title || '—')}
                            </h1>
                            <p className="text-sm text-slate-500 mt-0.5">Dossier incident — référentiel ISO 45001 §10.2</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="default" leftSection={<IconArrowLeft size={14} />} onClick={() => window.history.back()}>
                        Retour
                    </Button>
                    <Tooltip label="Imprimer le rapport d'incident">
                        <Button size="sm" variant="default" leftSection={<IconPrinter size={14} />}>Imprimer</Button>
                    </Tooltip>
                    <Tooltip label="Modifier les informations de l'incident" disabled={locked.locked}>
                        <Button size="sm" variant="default" leftSection={<IconEdit size={14} />} disabled={locked.locked} onClick={() => window.location.href = `/incidents/update/${incidentId}`}>
                            Modifier
                        </Button>
                    </Tooltip>
                </div>
            </div>

            {/* Identification : badges + métadonnées clés sur une seule rangée */}
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <div className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge color="dark" variant="light" radius="sm" size="sm" className="font-mono">
                                    {incident?.number || '—'}
                                </Badge>
                                <Badge color={statusColor} variant="filled" radius="sm" size="sm">
                                    {statusLabel}
                                </Badge>
                                {locked.locked && (
                                    <Badge color="gray" variant="light" radius="sm" size="sm" leftSection={<IconLock size={11} />}>
                                        Verrouillé
                                    </Badge>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-3 text-sm">
                                <div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Survenance</div>
                                    <div className="flex items-center gap-1.5 text-slate-800">
                                        <IconCalendarEvent size={13} className="text-slate-400 flex-shrink-0" />
                                        <span className="text-sm">{safeDate(incident?.occurredAt)}</span>
                                        {safeTime(incident?.occurredAt) && <span className="text-xs text-slate-500">{safeTime(incident?.occurredAt)}</span>}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Découverte</div>
                                    <div className="flex items-center gap-1.5 text-slate-800">
                                        <IconClock size={13} className="text-slate-400 flex-shrink-0" />
                                        <span className="text-sm">{safeDate(incident?.discoveryTime)}</span>
                                        {safeTime(incident?.discoveryTime) && <span className="text-xs text-slate-500">{safeTime(incident?.discoveryTime)}</span>}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Déclarant</div>
                                    <div className="flex items-center gap-1.5 text-slate-800">
                                        <IconUser size={13} className="text-slate-400 flex-shrink-0" />
                                        <span className="text-sm truncate">{reporterName}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Lieu</div>
                                    <div className="flex items-center gap-1.5 text-slate-800">
                                        <IconMapPin size={13} className="text-slate-400 flex-shrink-0" />
                                        <span className="text-sm truncate">{incident?.location?.name || incident?.locationName || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-64 flex-shrink-0">
                            <Tooltip label={locked.locked ? (locked.status === 'CLOSED' ? 'Incident clôturé, le statut ne peut plus être modifié' : 'Incident rejeté, le statut ne peut plus être modifié') : 'Changer le statut'}>
                                <span className="inline-flex w-full">
                                    <Button
                                        fullWidth
                                        size="md"
                                        color="teal"
                                        leftSection={<IconClock size={18} />}
                                        onClick={handleStatusChange}
                                        disabled={locked.locked}
                                    >
                                        Changer le statut
                                    </Button>
                                </span>
                            </Tooltip>
                            <p className="text-xs text-slate-500 mt-2 text-center">
                                Workflow ISO 45001 : transitions tracées dans l'historique
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {locked.locked && (
                <Alert
                    color={locked.status === 'CLOSED' ? 'green' : 'red'}
                    variant="light"
                    icon={<IconLock size={18} />}
                    title={locked.status === 'CLOSED' ? 'Incident clôturé' : 'Incident rejeté'}
                >
                    {locked.status === 'CLOSED'
                        ? 'Cet incident est clôturé. Les modifications ne sont plus autorisées. Le dossier conserve sa valeur de preuve réglementaire (ISO 45001 §7.5.3).'
                        : 'Cet incident a été rejeté lors de l\'analyse préliminaire. Aucune modification n\'est autorisée.'}
                </Alert>
            )}

            {/* Workflow ISO 45001 — étapes visuelles */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <div className="p-1 rounded bg-slate-200">
                        <IconCalendarFilled size={14} className="text-slate-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider flex-1">
                        Workflow ISO 45001 — Étapes du dossier
                    </h2>
                    <span className="text-[10px] text-slate-500">
                        ISO 45001 §10.2.1 (a→f)
                    </span>
                </header>
                <div className="p-4">
                    {(() => {
                        const stepsOrder = ['REPORTED', 'INVESTIGATION', 'INVESTIGATION_COMPLETED', 'CORRECTIVE_ACTIONS', 'CLOSED'];
                        const stepLabels: Record<string, string> = {
                            REPORTED: 'Déclaré',
                            INVESTIGATION: 'Investigation',
                            INVESTIGATION_COMPLETED: 'Analyse complétée',
                            CORRECTIVE_ACTIONS: 'Actions correctives',
                            CLOSED: 'Clôturé',
                        };
                        const currentIdx = stepsOrder.indexOf(currentStatusKey);
                        const rejected = currentStatusKey === 'REJECTED';
                        return (
                            <div className="flex items-center gap-1 overflow-x-auto">
                                {stepsOrder.map((step, i) => {
                                    const isDone = !rejected && currentIdx >= i;
                                    const isCurrent = currentIdx === i;
                                    return (
                                        <div key={step} className="flex items-center gap-1 flex-shrink-0">
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] transition-all
                                                ${isCurrent ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                                                  : isDone ? 'bg-teal-50 text-teal-700 border-teal-200'
                                                  : rejected && i === 0 ? 'bg-red-50 text-red-700 border-red-200'
                                                  : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px]
                                                    ${isCurrent ? 'bg-white text-teal-700'
                                                      : isDone ? 'bg-teal-200 text-teal-800'
                                                      : 'bg-slate-200 text-slate-500'}`}>
                                                    {i + 1}
                                                </span>
                                                <span className="whitespace-nowrap">{stepLabels[step]}</span>
                                            </div>
                                            {i < stepsOrder.length - 1 && (
                                                <div className={`w-6 h-0.5 ${currentIdx > i ? 'bg-teal-400' : 'bg-slate-200'}`} />
                                            )}
                                        </div>
                                    );
                                })}
                                {rejected && (
                                    <div className="ml-2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border bg-red-50 text-red-700 border-red-200 text-[11px]">
                                        <IconLock size={11} />
                                        Dossier rejeté
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onChange={(value) => value && setActiveTab(value)}
                color="teal"
                variant="pills"
            >
                <Tabs.List className="bg-white border border-slate-200 rounded-xl p-1.5 !flex !gap-0.5">
                    {Object.entries(tabData).map(([key, { label, icon: Icon, hide }]) => (
                        !hide && (
                            <Tabs.Tab
                                key={key}
                                value={key}
                                leftSection={<Icon size={15} />}
                                className="!text-slate-600 hover:!text-teal-700 hover:!bg-teal-50 data-[active]:!bg-teal-600 data-[active]:!text-white !rounded-lg !px-3 !py-2 !text-sm !transition-all"
                            >
                                {label}
                            </Tabs.Tab>
                        )
                    ))}
                </Tabs.List>

                {Object.entries(tabData).map(([key, { content }]) => (
                    <Tabs.Panel value={key} key={key} pt="md">
                        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
                            {content}
                        </div>
                    </Tabs.Panel>
                ))}
            </Tabs>

            <Modal
                opened={opened}
                onClose={close}
                title={<div className='text-base flex items-center gap-2'><span className='bg-teal-50 text-teal-700 rounded-lg p-1.5'><IconLock size={18} /></span>Changement de statut</div>}
                centered
                size="lg"
                radius="lg"
            >
                <form onSubmit={form.onSubmit(handleSubmit)} className="flex flex-col gap-4 mt-2">
                    <Text size="sm" c="dimmed">
                        Chaque changement de statut est tracé dans l'historique de l'incident pour conformité ISO 45001 §7.5.3.
                    </Text>

                    <Select
                        label="Responsable du changement"
                        placeholder="Sélectionner le responsable"
                        data={emps}
                        {...form.getInputProps("ownerId")}
                        searchable
                        withAsterisk
                    />

                    <DateInput
                        maxDate={new Date()}
                        label="Date effective"
                        placeholder="Sélectionner la date"
                        minDate={history?.length > 0
                            ? new Date(Math.max(...history.map(h => new Date(h.date).getTime())))
                            : incident.discoveryTime
                                ? new Date(incident.discoveryTime)
                                : undefined}
                        {...form.getInputProps("date")}
                        withAsterisk
                    />
                    <Select
                        label="Nouveau statut"
                        placeholder="Sélectionner le statut"
                        data={incidentHistoryStatus.slice(incidentHistoryStatus.findIndex((item) => item.value === (history.length > 0 ? history[history.length - 1]?.status : incident.status)))}
                        {...form.getInputProps("status")}
                        withAsterisk
                    />
                    <Textarea
                        label="Commentaire justificatif"
                        placeholder="Justifier le changement de statut (visible dans l'audit trail)"
                        {...form.getInputProps("comment")}
                        minRows={3}
                    />

                    <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-200">
                        <Button variant="default" onClick={close}>
                            Annuler
                        </Button>
                        <Button color="teal" type="submit" disabled={locked.locked}>
                            Valider le changement
                        </Button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

export default ViewDetails;
