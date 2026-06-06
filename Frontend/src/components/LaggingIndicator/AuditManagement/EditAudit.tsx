import { Breadcrumbs, Button, Fieldset, FileInput, MultiSelect, Select, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { PickList } from "primereact/picklist";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { auditType, PPE } from "../../../Data/IncidentsData";
import { getEmployeeDropdownWithEmail } from "../../../services/EmployeeService";
import { updateAudit } from "../../../services/AuditService";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";



const EditAudit = () => {
    const [target, setTarget] = useState<any[]>([]);
    const [member, setMember] = useState<any[]>([]);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null); // tracks which role is being edited
    const [auditPlanFile, setAuditPlanFile] = useState<File | null>(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams<{ id?: string }>();
    // TODO(refactor): route /audit-management/edit-audit should expose ":id" like EditScheduleAudit.
    //                 Until then, we accept the audit id from path param, location.state.id or ?id= query string.
    const auditId =
        params.id ??
        (location.state as { id?: string | number } | null)?.id ??
        new URLSearchParams(location.search).get("id") ??
        undefined;



    useEffect(() => {
        // Replaces previous hardcoded dummyEmployees stub with the real Employee service call.
        getEmployeeDropdownWithEmail()
            .then((res: any[]) => {
                setMember(
                    (res || []).map((emp: any) => ({
                        id: emp.id,
                        name: emp.name,
                        empNumber: emp.empNumber ?? emp.employeeNumber ?? "",
                        email: emp.email,
                        role: "",
                        pos: "Source",
                    }))
                );
            })
            .catch(() => {
                // Silently fail - PickList will simply be empty if employees cannot be loaded.
                setMember([]);
            });
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
                if (trimmed.length === 0) return "Incident Title is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            type: (value) => (value?.trim().length > 0 ? null : 'Incident Type is Required'),
            ppe: (value) => (value?.trim().length > 0 ? null : 'PPE(Personal Protective Equipment) is Required'),
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
        setEditingRoleId(null); // hide dropdown after selection
    };

    // TODO(refactor): align this payload shape with the AuditRequest backend DTO and the NewAudit step-based form
    //                 (auditCategory, types, purpose, startDate, endDate, areas, auditors, meetings).
    //                 The current EditAudit form only exposes a minimal subset; the rest stays untouched server-side
    //                 until the full step-based edit screen is implemented.
    const handleSubmit = () => {
        form.validate();
        if (!form.isValid()) return;

        if (!auditId) {
            errorNotification("Missing audit id - open this page from the audit list to edit an existing audit.");
            return;
        }

        const payload = {
            id: auditId,
            // Fields from the minimal Edit form
            name: form.values.name,
            type: form.values.type,
            ppe: form.values.ppe,
            // Participants captured via the PickList (target list with roles assigned)
            members: target.map((m) => ({
                id: m.id,
                name: m.name,
                empNumber: m.empNumber,
                email: m.email,
                role: m.role,
            })),
        };

        modals.openConfirmModal({
            title: <span className="text-2xl">Are you sure?</span>,
            centered: true,
            children: (
                <span className="text-md">
                    You want to save changes to this audit?
                </span>
            ),
            labels: { confirm: "Yes, Save", cancel: "Cancel" },
            cancelProps: { color: "red", variant: "filled" },
            confirmProps: { color: "green", variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                updateAudit(payload)
                    .then(() => {
                        successNotification("Audit updated successfully");
                        navigate("/audit-management");
                    })
                    .catch((err: any) => {
                        errorNotification(err?.response?.data?.errorMessage || "Something went wrong");
                    })
                    .finally(() => {
                        dispatch(hideOverlay());
                    });
            },
        });
    };


    const itemTemplate = (item: any) => {
        return (
            <div className={` ${item.pos === "Target" ? "w-[500px]" : "w-[400px]"} flex gap-5 justify-between`}>
                <div className='flex flex-col gap-1'>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-400">{item.empNumber}</span>
                </div>
                {item.pos === "Target" && (
                    <div className='flex items-center gap-2 w-[220px]'>
                        {editingRoleId === item.id || !item.role ? (
                            <Select
                                autoFocus
                                label="role"
                                placeholder="Select role"
                                data={['Auditor', 'Data Analyst', 'Process Owner', 'Counter Party']}
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
    return (
        <div className="p-5">
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-2xl text-blue-500 w-fit">Edit Audit</div>
                    <Breadcrumbs mt="xs" mb="lg">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/teams">
                            <Text variant="gradient">Audit Management</Text>
                        </Link>
                        <Text variant="gradient">Edit Audit</Text>
                    </Breadcrumbs>
                </div>
            </div>

            <div className="flex flex-col gap-5">
                <Fieldset
                    className="grid grid-cols-3 [&>legend]:w-fit gap-5 flex-wrap"
                    legend={<div className="text-lg text-blue-500">Audit Info</div>}
                >
                    <TextInput withAsterisk label="Audit Title" placeholder="Enter Audit Title" {...form.getInputProps('name')} />

                    <Select withAsterisk label="Audit Type" placeholder="Select Audit Type" data={auditType} {...form.getInputProps('type')} />

                    <MultiSelect withAsterisk label="Objective" placeholder="Select Objective" data={['Conformity assessment', 'Continuous improvement', 'ISO certification']} />

                    <MultiSelect withAsterisk label="Concerned Sites" placeholder="Select Concerned Sites" data={['Mining areas', 'Equipment', 'Specific facilities']} />

                    <MultiSelect withAsterisk label="Assessment Indicators" placeholder="Select Assessment Indicators" data={['A', 'B', 'C']} />

                    <FileInput label="Audit Plan" placeholder="Upload file" value={auditPlanFile} onChange={setAuditPlanFile} accept="application/pdf,image/*" withAsterisk rightSectionWidth={80}
                        rightSection={auditPlanFile ? (
                            <Button size="xs" variant="light" onClick={(e) => {
                                e.stopPropagation();
                                const fileUrl = URL.createObjectURL(auditPlanFile);
                                window.open(fileUrl, "_blank");
                            }} >Preview</Button>
                        ) : null
                        }
                    />


                    <Select withAsterisk label="PPE(Personal Protective Equipment)" placeholder="Select Personal Protective Equipment " data={PPE} {...form.getInputProps('ppe')} />
                </Fieldset>

                <Fieldset className="[&>legend]:w-fit" legend={<div className="text-lg text-blue-500">Participants</div>}>
                    <div className='flex gap-5 flex-wrap'>
                        <PickList
                            dataKey="id"
                            filter
                            filterBy="name"
                            sourceFilterPlaceholder="Search by name"
                            targetFilterPlaceholder="Search by name"
                            showTargetControls={false}
                            showSourceControls={false}
                            source={member}
                            target={target}
                            onChange={onChange}
                            itemTemplate={itemTemplate}
                            breakpoint="1280px"
                            sourceHeader={`Available Participants (${member.length})`}
                            targetHeader={`Participants Role (${target.length})`}
                            sourceStyle={{ height: '24rem' }}
                            targetStyle={{ height: '24rem' }}
                        />
                    </div>
                </Fieldset>

                <div className="flex gap-4 justify-end mt-2">
                    <Button variant="default" onClick={() => navigate("/audit-management")}>
                        Cancel
                    </Button>
                    <Button type="button" variant="gradient" onClick={handleSubmit}>
                        Save
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default EditAudit