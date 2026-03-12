import { Breadcrumbs, Button, Fieldset, FileInput, MultiSelect, Select, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { PickList } from "primereact/picklist";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auditType, PPE } from "../../../Data/IncidentsData";

const AddAudit = () => {
    const [target, setTarget] = useState<any[]>([]);
    const [member, setMember] = useState<any[]>([]);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null); // tracks which role is being edited
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
                if (trimmed.length === 0) return "Incident Tilte is required";

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


    const itemTemplate = (item: any) => {
        return (
            <div className={` ${item.pos === "Target" ? "w-[500px]" : "w-[400px]"} flex gap-5 justify-between self-center`}>
                <div className='flex flex-col gap-1'>
                    <span className="font-bold">{item.name}</span>
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
                                className="cursor-pointer text-sm font-medium px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
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
                    <div className="font-semibold text-2xl text-blue-500 w-fit">Schedule Audit</div>
                    <Breadcrumbs mt="xs" mb="lg">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/audit-management">
                            <Text variant="gradient">Audit Management</Text>
                        </Link>
                        <Text variant="gradient">Schedule Audit</Text>
                    </Breadcrumbs>
                </div>
            </div>

            <div className="flex flex-col gap-5">
                <Fieldset
                    className="grid grid-cols-3 [&>legend]:w-fit gap-5 flex-wrap"
                    legend={<div className="text-lg font-medium text-blue-500">Audit Info</div>}
                >
                    <TextInput withAsterisk label="Audit Title" placeholder="Enter Audit Title" {...form.getInputProps('name')} />

                    <Select withAsterisk label="Audit Type" placeholder="Select Audit Type" data={auditType} {...form.getInputProps('type')} />

                    <MultiSelect withAsterisk label="Objective" placeholder="Select Objective" data={['Conformity assessment', 'Continuous improvement', 'ISO certification']} />

                    <MultiSelect withAsterisk label="Concerned Sites" placeholder="Select Concerned Sites" data={['Mining areas', 'Equipment', 'Specific facilities']} />

                    <MultiSelect withAsterisk label="Assessment Indicators" placeholder="Select Assessment Indicators" data={['A', 'B', 'C']} />


                    {/* File Input for Audit Plan */}

                    <FileInput
                        label="Audit Plan"
                        placeholder="Upload file"
                        value={auditPlanFile}
                        onChange={setAuditPlanFile}
                        accept="application/pdf,image/*"
                        withAsterisk
                        rightSectionWidth={80} // 👈 ensure there's space for button
                        rightSection={
                            auditPlanFile ? (
                                <Button
                                    size="xs"
                                    variant="light"
                                    onClick={(e) => {
                                        e.stopPropagation(); // prevent triggering file input
                                        const fileUrl = URL.createObjectURL(auditPlanFile);
                                        window.open(fileUrl, "_blank");
                                    }}
                                >
                                    Preview
                                </Button>
                            ) : null
                        }
                    />


                    <Select withAsterisk label="PPE(Personal Protective Equipment)" placeholder="Select Personal Protective Equipment " data={PPE} {...form.getInputProps('ppe')} />
                </Fieldset>

                <Fieldset className="[&>legend]:w-fit" legend={<div className="text-lg font-medium text-blue-500">Participants</div>}>
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
            </div>
        </div>
    );
};

export default AddAudit;
