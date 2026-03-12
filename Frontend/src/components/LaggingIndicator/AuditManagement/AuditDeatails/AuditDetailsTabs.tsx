import {
    Badge,
    Breadcrumbs,
    Button,
    Modal,
    NumberInput,
    Select,
    Tabs,
    Text,
    Textarea,
} from "@mantine/core";
import { IconCalendarEvent, IconClock, IconFileAnalytics, IconFileCheck, IconFileText, IconHistory, IconLock, IconTrendingUp } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
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
import { capitalizeFirstLetter, mapIdToName } from "../../../../utility/OtherUtilities";
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
            ownerId: (value) => value ? null : "Owner is required",
            date: (value) => value ? null : "Date is required",
            status: (value) => value ? null : "Status is required",
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
                successNotification("Status changed successfully");
                close();
                setAudit((prev: any) => ({
                    ...prev,
                    status: values.status,
                }));
                fetchHistory();
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Something went wrong");
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
            label: 'Audit Details',
            icon: IconFileText,
            content: <AuditInfoTabs audit={audit} auditors={auditors} />,
            hide: false,
        },
        execution: {
            label: 'Execution',
            icon: IconTrendingUp,
            content: (
                <AuditExecution
                    audit={audit}
                    employees={emps}
                    empMap={empMap}
                    onObservationAdded={() => setObservationVersion((prev) => prev + 1)}
                />
            ),
            hide: audit?.status === 'PLANNING' || audit?.status == "PREPARATION", // Hide if audit is not planned
        },
        recommendation: {
            label: 'Recommendation',
            icon: IconFileAnalytics,
            content: <RecommendationFileTab observationVersion={observationVersion} audit={audit} employees={emps} empMap={empMap} />,
            hide: audit?.status === 'PLANNING' || audit?.status == "PREPARATION",
        },
        report: {
            label: 'Report',
            icon: IconFileCheck,
            content: <AuditReportTabs />,
            hide: audit?.status === 'PLANNING' || audit?.status == "PREPARATION",
        },
        history: {
            label: 'History',
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

    const handleTabChange = (value: string | null) => {
        if (!value || !availableTabs.includes(value)) return;

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
        <div className=" space-y-6" >
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Audit details</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/audit-management" ><Text variant="gradient" className="hover:!underline cursor-pointer">Audit Management</Text></Link>
                        <Text variant="gradient">Audit details</Text>
                    </Breadcrumbs>
                </div>

            </div>


            <div className="  rounded-lg p-5 space-y-3 bg-home">
                <div className="flex justify-between">
                    <div className='flex flex-col gap-1'>
                        <h2 className="text-2xl flex items-center gap-5 font-semibold text-white">{audit?.title}<Badge radius="xs" size='md'>{audit?.refNumber}</Badge></h2>

                        <div className="flex items-center gap-1 text-white">
                            <IconCalendarEvent size={18} />
                            <span>{formatDateShort(audit.startDate)} - {formatDateShort(audit.endDate)}</span>
                        </div>
                    </div>

                    <div className="flex items-end gap-2  flex-col">

                        <Button leftSection={<IconClock />} onClick={handleStatusChange} disabled={(audit.planningStatus && audit.planningStatus !== "APPROVED") || isAuditLocked} className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-sm">{auditStatusMap[audit.status]}</Button>
                        <p className='text-sm text-white'>
                            <Badge color={audit.category === "INTERNAL" ? "orange" : "red"} className="!capitalize" radius="xs">{capitalizeFirstLetter(audit.category)}</Badge>
                        </p>
                    </div>
                </div>

            </div>


            <div className="">
                <Tabs

                    value={activeTab}
                    onChange={handleTabChange}

                >
                    <Tabs.List className='bg-white border border-slate-200 rounded-lg p-2 !flex !gap-1'>
                        {Object.entries(tabData).map(([key, { label, icon: Icon, hide }]) => (
                            !hide && <Tabs.Tab key={key} value={key} leftSection={<Icon size={15} />} className="!text-slate-600 hover:!text-blue-600 data-[active]:!bg-blue-100 data-[active]:!text-blue-800 data-[active]:!border-blue-500 !rounded-lg px-3 py-1.5 text-sm transition-all duration-200">
                                {label}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>

                    {Object.entries(tabData).map(([key, { content, hide }]) => (
                        !hide && <Tabs.Panel value={key} key={key} pt="md">

                            <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                                <div className="p-2">{content}</div>
                            </div>

                        </Tabs.Panel>
                    ))}
                </Tabs>
            </div>

            <Modal
                opened={opened}
                onClose={close}
                title={
                    <div className='text-lg flex items-center gap-2'>
                        <span className='bg-gray-100 rounded-full p-2'><IconLock /></span>
                        Manage Audit Status
                    </div>
                }
                centered
                size="xl"
                classNames={{
                    body: 'p-6',
                    header: 'text-lg font-semibold border-b border-gray-500 mx-2',
                }}
            >
                <form onSubmit={form.onSubmit(handleSubmit)} className="flex flex-col gap-4 mt-4">
                    {/* <div className="bg-blue-50 rounded-lg p-4 flex flex-col gap-2">
                        <Checkbox label="All corrective actions have been completed and verified" />
                        <p>Current status: 1/3 actions completed (33.3%)</p>
                    </div> */}

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Owner"
                            placeholder="Select owner"
                            data={emps}
                            {...form.getInputProps("ownerId")}
                            withAsterisk
                        />

                        <DateInput
                            maxDate={new Date()}
                            label="Date"
                            placeholder='Select date'
                            {...form.getInputProps("date")}
                            withAsterisk
                        />


                    </div>

                    <Select
                        label="Status"
                        placeholder="Select Status"
                        data={statusOptions}
                        {...form.getInputProps("status")}
                        withAsterisk
                    />

                    {form.values.status === 'CLOSED' ? (
                        <>
                            <NumberInput
                                label="Quality Evaluation (1-10)"
                                placeholder="Enter Quality Evaluation"
                                withAsterisk
                                {...form.getInputProps("evaluation")}
                            />

                            <Textarea
                                label="Closing Report"
                                placeholder="Summary of the closure, validation of action, final comments....."
                                withAsterisk
                                minRows={3}
                                {...form.getInputProps("closingReport")}
                            />

                            <Textarea
                                label="Lessons Learned"
                                withAsterisk
                                placeholder="Points for improvements for future audits, best practices identified, recommendations for the organization"
                                minRows={6}
                                {...form.getInputProps("comment")}
                            />
                        </>
                    ) : (
                        <Textarea
                            label="Comment"
                            withAsterisk
                            placeholder="Enter your comment"
                            minRows={6}
                            {...form.getInputProps("comment")}
                        />
                    )}

                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={close}>
                            Cancel
                        </Button>
                        <Button color="primary" type='submit'>
                            Submit
                        </Button>
                    </div>
                </form>
            </Modal>

        </div >
    )
}

export default AuditDetailsTabs
