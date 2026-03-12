import {
    Card,
    Group,
    Badge,
    Button,
    Text,
    Modal,
    Textarea,
    Select,
    Breadcrumbs,
    MultiSelect,
    LoadingOverlay,
} from '@mantine/core';
import { IconCheck, IconX, IconEye, IconClipboardList } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { Link } from 'react-router-dom';
import { getActivePPE } from '../../services/PPEService';
import { getEmployeesWithDepartment } from '../../services/EmployeeService';
import { createPpeRequest, getAllPpeRequests, approvePpeRequest, rejectPpeRequest } from '../../services/PpeRequestService';
import { errorNotification, successNotification } from '../../utility/NotificationUtility';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { mapIdToName } from '../../utility/OtherUtilities';

const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
        case 'high': return 'red';
        case 'medium': return 'orange';
        case 'low': return 'green';
        default: return 'gray';
    }
};
const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'pending': return 'yellow';
        case 'approved': return 'green';
        case 'rejected': return 'red';
        default: return 'gray';
    }
};

const PPERequestsTable = () => {
    // State and form for creating new request
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [employees, setEmployees] = useState<any>([]);
    const [ppe, setPpe] = useState<any>([]);
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    // State for modals and selected request
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [viewData, setViewData] = useState<any>(null);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});
    const [ppeMap, setPpeMap] = useState<Record<string, any>>({});
    const requestForm = useForm({
        initialValues: {
            empIds: [] as string[],
            ppeIds: [] as string[],
            desiredDate: null as Date | null,
            priority: 'Medium',
            reason: ''
        },
        validate: {
            empIds: (value) => (value.length > 0 ? null : 'Please select at least one employee'),
            ppeIds: (value) => (value.length > 0 ? null : 'Please select at least one PPE'),
            desiredDate: (value) => (value ? null : 'Please select a desired date'),
            priority: (value) => (value ? null : 'Please select a priority'),
            reason: (value) => (value ? null : 'Please provide a reason')
        }
    });
    // Forms for approve and reject
    const approveForm = useForm({ initialValues: { comment: '' } });
    const rejectForm = useForm({
        initialValues: { comment: '' },
        validate: { comment: (val) => (val.trim() ? null : 'Comment is required') }
    });




    useEffect(() => {
        getEmployeesWithDepartment().then((data) => {
            setEmployees(data);
            setEmpMap(mapIdToName(data));
        }).catch((_err) => { })
        getActivePPE().then((data) => {
            setPpe(data);
            setPpeMap(mapIdToName(data));
        }).catch((_err) => { })
        fetchRequests();
    }, []);


    const fetchRequests = () => {
        getAllPpeRequests()
            .then((data) => {
                setRequests(data);
                console.log("Fetched PPE Requests: ", data);
            })
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || "Failed to fetch PPE requests");
            })

    };

    // Handlers for modals
    const openApproveModal = (row: any) => { setSelectedRequest(row); approveForm.reset(); setShowApproveModal(true); };
    const openRejectModal = (row: any) => { setSelectedRequest(row); rejectForm.reset(); setShowRejectModal(true); };
    const openViewModal = async (row: any) => {
        setViewData(row);
        setShowViewModal(true);
    };

    const handleApprove = async (values: typeof approveForm.values) => {
        try {
            setLoading(true);
            await approvePpeRequest(selectedRequest.id, values.comment);
            successNotification('Request approved');
            setShowApproveModal(false);
            fetchRequests();
            setLoading(false);
        } catch (err: any) {
            errorNotification(err.response?.data?.errorMessage || 'Approval failed');
        }
    };
    const handleReject = async (values: typeof rejectForm.values) => {
        try {
            setLoading(true);
            await rejectPpeRequest(selectedRequest.id, values.comment);
            successNotification('Request rejected');
            setShowRejectModal(false);
            fetchRequests();
            setLoading(false);
        } catch (err: any) {
            errorNotification(err.response?.data?.errorMessage || 'Rejection failed');
        }
    };

    const handleSubmitRequest = (values: typeof requestForm.values) => {

        const empSize = values.empIds?.length || 0;
        let error = "";

        for (const x of values.ppeIds) {
            const ppe = ppeMap[x];
            if (ppe.stock < empSize) {
                error = `Not enough stock for ${ppe.name}`;
                break; // stops checking further
            }
        }

        if (error) {
            errorNotification(error);
            return;
        }

        setLoading(true);
        createPpeRequest(values)
            .then(() => {
                successNotification("PPE request created successfully");
                setShowRequestForm(false);
                requestForm.reset();
                fetchRequests();
            })
            .catch((error) => {
                errorNotification(error.response?.data?.errorMessage || "Failed to create PPE request");
            })
            .finally(() => {
                setLoading(false);
            });
    };



    // --- Priority Badge ---
    const priorityTemplate = (rowData: any) => {
        return <Badge color={getPriorityColor(rowData.priority)} variant="light">
            {rowData.priority}
        </Badge>;
    };

    // --- Status Badge ---
    const statusTemplate = (rowData: any) => {
        return (
            <Badge color={getStatusColor(rowData.status)} variant="filled">
                {rowData.status.charAt(0).toUpperCase() + rowData.status.slice(1).toLowerCase()}
            </Badge>
        );
    };

    // --- Employee Name ---
    const employeeTemplate = (rowData: any) => {
        const emps = rowData.empIds;
        return (
            <div>
                {emps.map((id: any) => {
                    const employee = empMap[id];
                    return (
                        <div key={id} style={{ fontSize: "0.8rem" }}>
                            {employee ? `${employee.name}` : "N/A"}
                        </div>
                    );
                })}
            </div>
        );
    };

    // --- Requested PPEs ---
    const requestedEppTemplate = (rowData: any) => {
        const requestedEPPs = rowData.ppeIds;
        return (
            <div>
                {requestedEPPs.map((eppId: any) => {
                    const epp = ppeMap[eppId];
                    return (
                        <div key={eppId} style={{ fontSize: "0.8rem" }}>
                            {epp ? `${epp.name}` : "N/A"}
                        </div>
                    );
                })}
            </div>
        );
    };

    // --- Reason (truncate with ellipsis) ---
    const reasonTemplate = (rowData: any) => {
        return (
            <span
                style={{
                    display: "block",
                    maxWidth: "200px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
                title={rowData.reason}
            >
                {rowData.reason}
            </span>
        );
    };

    // --- Actions ---
    const actionTemplate = (rowData: any) => {
        return <Group gap="xs">
            {rowData.status === 'PENDING' && <>
                <Button variant="light" color="green" size='compact-xs' leftSection={<IconCheck size={16} />} onClick={() => openApproveModal(rowData)}>Approve</Button>
                <Button variant="light" color="red" size='compact-xs' leftSection={<IconX size={16} />} onClick={() => openRejectModal(rowData)}>Reject</Button>
            </>
            }
            <Button variant="light" color="blue" size='compact-xs' leftSection={<IconEye size={16} />} onClick={() => openViewModal(rowData)}>View</Button>
        </Group>
    };


    return (
        <div className='flex flex-col gap-5'>
            <div className='flex justify-between items-center'>

                <div>
                    <div className="font-semibold text-2xl text-blue-500 w-fit">Pending PPE Requests</div>
                    <Breadcrumbs mt="xs" >
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/ppe-management">
                            <Text variant="gradient">PPE Dashboard</Text>
                        </Link>
                        <Text variant="gradient">Pending PPE Requests</Text>
                    </Breadcrumbs>
                </div>
                <Button leftSection={<IconClipboardList size={16} />} color="green" onClick={() => setShowRequestForm(true)}>
                    New Request
                </Button>
            </div>
            <p className=' italic'>Streamlined process for employees to request and receive required PPE</p>
            {/* New Request Modal */}
            <Modal opened={showRequestForm} onClose={() => setShowRequestForm(false)} title="New PPE Request" size="xl" centered>
                <LoadingOverlay visible={loading} />
                <form className='grid grid-cols-1 gap-5' onSubmit={requestForm.onSubmit(handleSubmitRequest)}>

                    <MultiSelect
                        label="Employees"
                        placeholder="Select employees"
                        data={employees.map((emp: any) => ({ value: "" + emp.id, label: `${emp.name}` }))}
                        multiple
                        searchable
                        hidePickedOptions
                        withAsterisk
                        {...requestForm.getInputProps('empIds')}
                    />
                    <MultiSelect
                        label="PPE Requested"
                        placeholder="Select PPE"
                        data={ppe.map((epp: any) => ({ value: "" + epp.id, label: `${epp.name} - ${epp.category} (Stock: ${epp.stock})` }))}
                        multiple
                        hidePickedOptions
                        searchable
                        withAsterisk
                        {...requestForm.getInputProps('ppeIds')}
                    />
                    <div className='grid grid-cols-2 gap-4'>

                        <DateInput
                            label="Requested Date"
                            placeholder="When do you need the PPE?"
                            withAsterisk
                            {...requestForm.getInputProps('desiredDate')}
                            minDate={new Date()}
                        />
                        <Select
                            label="Priority"
                            placeholder="Select priority"
                            data={['Low', 'Medium', 'High']}
                            withAsterisk
                            {...requestForm.getInputProps('priority')}
                        />
                    </div>
                    <Textarea
                        label="Reason"
                        placeholder="Explain why these PPE are needed"
                        rows={3}
                        withAsterisk
                        {...requestForm.getInputProps('reason')}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="outline" onClick={() => setShowRequestForm(false)}>Cancel</Button>
                        <Button type="submit" leftSection={<IconClipboardList size={16} />}>Submit Request</Button>
                    </Group>
                </form>
            </Modal>
            {/* Approve Modal */}
            <Modal opened={showApproveModal} onClose={() => setShowApproveModal(false)} title="Approve PPE Request" centered>
                <LoadingOverlay visible={loading} />
                <form onSubmit={approveForm.onSubmit(handleApprove)}>
                    <Textarea label="Comment (optional)" placeholder="Add a comment" {...approveForm.getInputProps('comment')} />
                    <Group justify="flex-end" mt="md">
                        <Button variant="outline" onClick={() => setShowApproveModal(false)}>Cancel</Button>
                        <Button type="submit" leftSection={<IconCheck size={16} />}>Approve</Button>
                    </Group>
                </form>
            </Modal>

            {/* Reject Modal */}
            <Modal opened={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject PPE Request" centered>
                <LoadingOverlay visible={loading} />
                <form onSubmit={rejectForm.onSubmit(handleReject)}>
                    <Textarea label="Comment (required)" placeholder="Provide reason for rejection" withAsterisk {...rejectForm.getInputProps('comment')} />
                    <Group justify="flex-end" mt="md">
                        <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                        <Button type="submit" color="red" leftSection={<IconX size={16} />}>Reject</Button>
                    </Group>
                </form>
            </Modal>

            {/* View Modal */}
            <Modal opened={showViewModal} onClose={() => setShowViewModal(false)} title="Request Details" size="lg" centered>
                <LoadingOverlay visible={loading} />
                {viewData ? (
                    <div className="flex flex-col gap-2">
                        <Text><strong>Employees:</strong> {viewData.empIds.map((id: string) => empMap[id]?.name).join(', ')}</Text>
                        <Text><strong>PPE:</strong> {viewData.ppeIds.map((id: string) => ppeMap[id]?.name).join(', ')}</Text>
                        <Text><strong>Reason:</strong> {viewData.reason}</Text>
                        <Text><strong>Priority:</strong> {viewData.priority}</Text>
                        <Text><strong>Date:</strong> {viewData.desiredDate}</Text>
                        <Text><strong>Status:</strong> {viewData.status}</Text>
                        {viewData.comment && <Text><strong>Comment:</strong> {viewData.comment}</Text>}
                    </div>
                ) : <LoadingOverlay visible />}
                <Group justify="flex-end" mt="md">
                    <Button variant="outline" onClick={() => setShowViewModal(false)}>Close</Button>
                </Group>
            </Modal>
            <div className='flex flex-col gap-2' >






                <Card shadow="sm" padding="md" radius="md" withBorder>
                    <DataTable
                        value={requests}
                        stripedRows
                        paginator
                        rows={10}
                        responsiveLayout="scroll"
                        size='small'
                    >
                        {/* <Column field="id" header="Request ID" sortable /> */}
                        <Column header="Employee" body={employeeTemplate} />
                        <Column header="PPE Requested" body={requestedEppTemplate} />
                        <Column header="Reason" body={reasonTemplate} />
                        <Column header="Priority" body={priorityTemplate} />
                        <Column field="desiredDate" header="Date" />
                        <Column header="Status" body={statusTemplate} />
                        <Column header="Actions" body={actionTemplate} />
                    </DataTable>

                </Card>
            </div>

        </div>
    );
};

export default PPERequestsTable;
