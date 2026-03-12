import { Breadcrumbs, Button, Checkbox, ScrollArea, Select, Text, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { createRequirement } from "../../../services/RequirementService";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { IconClipboardList, IconHelpCircle, IconRepeat, IconShield } from "@tabler/icons-react";


const AddRequirement = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate();




    const form = useForm({
        initialValues: {
            title: '',
            description: '',
            category: '',
            renewalFrequency: '',
            docType: '',
            active: true,

        },
        validate: {
            title: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Tilte is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            description: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Description is required";
                const wordCount = trimmed.length;
                return wordCount > 250 ? "Maximum 250 characters allowed" : null;
            },
            category: (value) => (value?.trim().length > 0 ? null : 'Category is Required'),
            renewalFrequency: (value) => (value ? null : 'Renewal Frequency is Required'),
            docType: (value) => (value?.trim().length > 0 ? null : 'Document Type is Required'),

        }
    });





    const handleSubmit = () => {
        dispatch(showOverlay());
        createRequirement(form.values).then((_res) => {
            successNotification("Requirement created successfully");
            navigate("/compliance-requirements");

        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
        }
        ).finally(() => {
            dispatch(hideOverlay());
        }
        );
    }

    const handleCancel = () => {
        navigate("/compliance-requirements");
    };

    const guidanceCards = [
        {
            icon: IconClipboardList,
            title: "Requirement Overview",
            description: "Give assignees a quick snapshot of what the requirement covers.",
            points: [
                "Keep the title short and specific.",
                "Use the description to highlight the compliance intent."
            ]
        },
        {
            icon: IconRepeat,
            title: "Renewal Frequency",
            description: "Set how often the requirement should be reviewed or renewed.",
            points: [
                "Pick the closest matching frequency option.",
                "Use \"On Demand\" when outside triggers apply."
            ]
        },
        {
            icon: IconShield,
            title: "Documentation Standards",
            description: "Explain what supporting documents reviewers expect.",
            points: [
                "Choose the document type reviewers will accept.",
                "Only enable Active when guidance is complete."
            ]
        }
    ];


    return (
        <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">Add New Requirement</div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/compliance-requirements" ><Text variant="gradient" className="hover:!underline cursor-pointer">Compliance Requirements</Text></Link>
                        <Text variant="gradient">Add New Requirement</Text>
                    </Breadcrumbs>
                </div>
            </div>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow-lg border border-gray-200 p-6 rounded-xl ">
                            <div className="flex flex-col gap-4">
                                <TextInput label="Title" placeholder="Enter title" withAsterisk {...form.getInputProps('title')} />
                                <Textarea label="Description" placeholder="Summarize the compliance requirement" minRows={3} withAsterisk {...form.getInputProps('description')} />
                                <Select label="Category" placeholder="Select category" data={["Medical", "Legal", "Training", "Regulatory", "Safety", "Other"]} searchable withAsterisk {...form.getInputProps('category')} />
                                <Select label="Renewal frequency" placeholder="Select renewal frequency" data={["Monthly", "Quarterly", "Semi-Annually", "Annually", "Biennially", "On Demand"]} searchable withAsterisk {...form.getInputProps('renewalFrequency')} />
                                <Select label="Expected document type" placeholder="Select expected document type" data={["PDF", "Image", "Scan", "Certificate", "Other"]} searchable withAsterisk {...form.getInputProps('docType')} />
                                <Checkbox label="Active" {...form.getInputProps('active', { type: 'checkbox' })} />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="outline" onClick={handleCancel} type="button">Cancel</Button>
                            <Button type="submit" variant="gradient">Create Requirement</Button>
                        </div>
                    </div>

                    <div className="bg-white shadow-lg border border-gray-200 rounded-xl p-6 space-y-6 h-full">
                        <ScrollArea.Autosize

                            mah={500}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                                    <IconHelpCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-blue-600 font-semibold uppercase">Requirement guidance</p>
                                    <p className="text-sm text-gray-500">Best practices to help you capture complete compliance records.</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {guidanceCards.map((card, idx) => {
                                    const IconComponent = card.icon;
                                    return (
                                        <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white text-blue-500 rounded-full p-2 shadow-sm">
                                                    <IconComponent size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-700">{card.title}</p>
                                                    <p className="text-xs text-gray-500">{card.description}</p>
                                                </div>
                                            </div>
                                            <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                                {card.points.map((point, pointIdx) => (
                                                    <li key={pointIdx}>{point}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea.Autosize>
                    </div>
                </div>

            </form >
        </div >
    )
}

export default AddRequirement
