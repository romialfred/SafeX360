import {
    Badge,
    Button,
    Modal,
    NumberInput,
    Select,
    Textarea,
} from "@mantine/core";
import { IconCalendarEvent, IconClipboardCheck, IconClock, IconFileAnalytics, IconFileCheck, IconFileText, IconHistory, IconLock, IconTrendingUp } from "@tabler/icons-react";
import PageHeader from "../../../UtilityComp/PageHeader";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import AuditExecution from "./AuditExecution";
import RecommendationFileTab from "./RecommendationFileTab";
import AuditReportTabs from "./AuditReportTabs";
import { useDisclosure } from "@mantine/hooks";
import { DateInput } from "@mantine/dates";
import { auditStatuses, auditStatusMap } from "../../../../Data/DropdownData";
import { useForm } from "@mantine/form";
import { getEmployeeDropdown } from "../../../../services/EmployeeService";
import AuditHistoryTabs from "./AuditHistoryTabs";
import { getAuditDetails, getAuditorsByAuditId } from "../../../../services/AuditService";
import { formatDateShort } from "../../../../utility/DateFormats";
import { mapIdToName } from "../../../../utility/OtherUtilities";
import { auditCategoryLabel } from "../auditLabels";
import AuditInfoTabs from "./AuditInfoTabs";
import { hideOverlay, showOverlay } from "../../../../slices/OverlaySlice";
import { useDispatch } from "react-redux";
import { addAuditHistory, getAuditHistoryByAuditId } from "../../../../services/AuditHistoryService";
import { errorNotification, successNotification } from "../../../../utility/NotificationUtility";


const AuditDetailsTabs = () => {
    const [activeTab, setActiveTab] = useState('details');
    const [opened, { open, close }] = useDisclosure(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const { id } = useParams();
    const [emps, setEmps] = useState<any[]>([]);
    const [audit, setAudit] = useState<any>({});
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const dispatch = useDispatch();
    const [history, setHistory] = useState<any[]>([]);
    const [auditors, setAuditors] = useState<any[]>([]);
    const [observationVersion, setObservationVersion] = useState(0);
    const isAuditLocked = audit?.status === 'CLOSED' || audit?.status === 'CANCELLED';



    const form = useForm({
        initialValues: {
            ownerId: "",
            date: "",
            status: "",
            comment: "",
            evaluation: undefined,
            closingReport: "",

        },
        validate: {
            ownerId: (value) => value ? null : "Le responsable est requis",
            date: (value) => value ? null : "La date est requise",
            status: (value) => value ? null : "Le statut est requis",
        }
    });
    useEffect(() => {

        dispatch(showOverlay())
        getEmployeeDropdown()
            .then((res) => {
                const mappedEmployees = res.map((emp: any) => ({
                    label: emp.name,
                    value: String(emp.id), // ensure value is string if form field is string
                }));
                setEmps(mappedEmployees);
                setEmpMap(mapIdToName(res));
            })
            .catch((_err) => { });
        getAuditDetails(id)
            .then((res) => {
                setAudit(res);
            })
            .catch((_err) => { })
            .finally(() => {
                dispatch(hideOverlay());
            });
        getAuditorsByAuditId(id).then((res) => {
            setAuditors(res);
        }).catch((_err) => { });
        fetchHistory();

    }, []);

    const fetchHistory = () => {
        getAuditHistoryByAuditId(id).then((res) => {
            setHistory(res);
        }).catch((err) => {
            console.log(err);
        });
    }

    const handleSubmit = async (values: any) => {
        dispatch(showOverlay());

        const payload = {
            ...values,
            auditId: parseInt(id || ""), // ✅ Make sure auditId is included here
        };

        addAuditHistory(payload)
            .then((_res) => {
                successNotification("Statut de l'audit mis à jour");
                close();
                setAudit((prev: any) => ({
                    ...prev,
                    status: values.status,
                }));
                fetchHistory();
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "La mise à jour a échoué");
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };


    const statusOptions = useMemo(() => {
        if (!audit?.status) return auditStatuses;
        const currentIndex = auditStatuses.findIndex((option) => option.value === audit.status);
        if (currentIndex === -1) return auditStatuses;
        return auditStatuses.filter((_option, idx) => idx >= currentIndex);
    }, [audit?.status]);

    const tabData = useMemo(() => ({
        details: {
            label: "Détails de l'audit",
            icon: IconFileText,
            content: <AuditInfoTabs audit={audit} auditors={auditors} />,
            hide: false,
        },
        execution: {
            label: 'Exécution',
            icon: IconTrendingUp,
            content: (
                <AuditExecution
                    audit={audit}
                    employees={emps}
                    empMap={empMap}
                    onObservationAdded={() => setObservationVersion((prev) => prev + 1)}
                />
            ),
            hide: audit?.status === 'PLANNING' || audit?.status == "PREPARATION",
        },
        recommendation: {
            label: 'Recommandations',
            icon: IconFileAnalytics,
            content: <RecommendationFileTab observationVersion={observationVersion} audit={audit} employees={emps} empMap={empMap} />,
            hide: audit?.status === 'PLANNING' || audit?.status == "PREPARATION",
        },
        report: {
            label: 'Rapport',
            icon: IconFileCheck,
            content: <AuditReportTabs />,
            hide: audit?.status === 'PLANNING' || audit?.status == "PREPARATION",
        },
        history: {
            label: 'Historique',
            icon: IconHistory,
            content: <AuditHistoryTabs audit={audit} history={history} empMap={empMap} />,
            hide: false,
        },
    }), [audit, auditors, emps, empMap, observationVersion, history]);

    const availableTabs = useMemo(
        () => Object.entries(tabData)
            .filter(([, value]) => !value.hide)
            .map(([key]) => key),
        [tabData]
    );

    useEffect(() => {
        if (!availableTabs.length) return;

        const tabParam = searchParams.get('tab');

        if (tabParam && availableTabs.includes(tabParam)) {
            if (tabParam !== activeTab) {
                setActiveTab(tabParam);
            }
            return;
        }

        const fallbackTab = availableTabs[0];

        if (fallbackTab !== activeTab) {
            setActiveTab(fallbackTab);
        }

        if (tabParam !== fallbackTab) {
            const params = new URLSearchParams(searchParams);
            params.set('tab', fallbackTab);
            setSearchParams(params, { replace: true });
        }
    }, [searchParams, availableTabs, activeTab, setSearchParams]);

    const handleTabChange = (value: string) => {
        if (!availableTabs.includes(value)) return;

        const params = new URLSearchParams(searchParams);
        params.set('tab', value);
        setSearchParams(params, { replace: true });
        setActiveTab(value);
    };

    const handleStatusChange = () => {
        if (isAuditLocked) return;
        form.setValues({
            ownerId: "",
            date: "",
            status: audit?.status || "",
            comment: "",
            evaluation: undefined,
            closingReport: "",
        });
        open();

    }
    return (
        <div className="p-5 space-y-5 w-full" >
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des Audits', to: '/audit-management' },
                    { label: "Détails de l'audit" },
                ]}
                icon={<IconClipboardCheck size={22} stroke={2} />}
                iconColor="teal"
                title="Détails de l'audit"
                subtitle="Suivi complet du cycle d'audit ISO 19011 — exécution, recommandations et clôture"
            />

            {/* Bandeau d'identification de l'audit */}
            <div className="rounded-xl p-5 space-y-3 bg-gradient-to-br from-teal-600 to-teal-800 shadow-md">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className='flex flex-col gap-1.5'>
                        <h2 className="text-xl flex items-center gap-3 text-white flex-wrap">
                            {audit?.title}
                            <Badge radius="sm" size="md" color="teal.2" variant="filled" className="!text-teal-900">{audit?.refNumber}</Badge>
                        </h2>
                        <div className="flex items-center gap-1.5 text-teal-100 text-sm">
                            <IconCalendarEvent size={16} />
                            <span>{formatDateShort(audit.startDate)} au {formatDateShort(audit.endDate)}</span>
                        </div>
                    </div>

                    <div className="flex items-end gap-2 flex-col">
                        <Button
                            size="sm"
                            leftSection={<IconClock size={15} />}
                            onClick={handleStatusChange}
                            disabled={(audit.planningStatus && audit.planningStatus !== "APPROVED") || isAuditLocked}
                            className="!bg-white !text-teal-700 hover:!bg-teal-50"
                        >
                            {auditStatusMap[audit.status] || "Statut"}
                        </Button>
                        <Badge
                            color={audit.category === "INTERNAL" ? "teal" : "orange"}
                            variant="filled"
                            radius="sm"
                            size="sm"
                        >
                            {auditCategoryLabel(audit.category)}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Onglets professionnels — pill style */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                        {Object.entries(tabData).map(([key, { label, icon: Icon, hide }]) => (
                            !hide && (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleTabChange(key)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${activeTab === key
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                >
                                    <Icon size={14} />
                                    {label}
                                </button>
                            )
                        ))}
                    </div>
                </div>
                <div className="p-5">
                    {Object.entries(tabData).map(([key, { content, hide }]) => (
                        !hide && activeTab === key && (
                            <div key={key}>{content}</div>
                        )
                    ))}
                </div>
            </div>

            <Modal
                opened={opened}
                onClose={close}
                title={
                    <div className='text-base flex items-center gap-2'>
                        <span className='bg-teal-100 text-teal-700 rounded-full p-2'><IconLock size={18} /></span>
                        Changer le statut de l'audit
                    </div>
                }
                centered
                size="xl"
                classNames={{
                    body: 'p-6',
                    header: 'text-lg border-b border-slate-200 mx-2',
                }}
            >
                <form onSubmit={form.onSubmit(handleSubmit)} className="flex flex-col gap-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Responsable"
                            placeholder="Sélectionner le responsable"
                            data={emps}
                            {...form.getInputProps("ownerId")}
                            withAsterisk
                        />

                        <DateInput
                            maxDate={new Date()}
                            label="Date"
                            placeholder="Sélectionner la date"
                            {...form.getInputProps("date")}
                            withAsterisk
                        />
                    </div>

                    <Select
                        label="Statut"
                        placeholder="Sélectionner le statut"
                        data={statusOptions}
                        {...form.getInputProps("status")}
                        withAsterisk
                    />

                    {form.values.status === 'CLOSED' ? (
                        <>
                            <NumberInput
                                label="Évaluation qualité (1-10)"
                                placeholder="Note de qualité de l'audit"
                                withAsterisk
                                {...form.getInputProps("evaluation")}
                            />

                            <Textarea
                                label="Rapport de clôture"
                                placeholder="Synthèse de clôture, validation des actions, commentaires finaux..."
                                withAsterisk
                                minRows={3}
                                {...form.getInputProps("closingReport")}
                            />

                            <Textarea
                                label="Leçons apprises"
                                withAsterisk
                                placeholder="Points d'amélioration pour les futurs audits, bonnes pratiques identifiées, recommandations pour l'organisation"
                                minRows={6}
                                {...form.getInputProps("comment")}
                            />
                        </>
                    ) : (
                        <Textarea
                            label="Commentaire"
                            withAsterisk
                            placeholder="Saisir votre commentaire"
                            minRows={6}
                            {...form.getInputProps("comment")}
                        />
                    )}

                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="default" onClick={close}>
                            Annuler
                        </Button>
                        <Button color="teal" type="submit">
                            Soumettre
                        </Button>
                    </div>
                </form>
            </Modal>

        </div >
    )
}

export default AuditDetailsTabs
