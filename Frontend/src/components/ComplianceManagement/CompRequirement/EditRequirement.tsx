import { Breadcrumbs, Button, Checkbox, Select, Text, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { getRequirementById, updateRequirement } from "../../../services/RequirementService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { useEffect } from "react";

const EditRequirement = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();

    const form = useForm({
        initialValues: {
            title: '',
            description: '',
            category: '',
            renewalFrequency: '',
            docType: ''
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

    useEffect(() => {
        if (id) {
            dispatch(showOverlay());
            getRequirementById(id)
                .then((res) => {

                    form.setValues({
                        title: res.title,
                        description: res.description,
                        category: res.category,
                        renewalFrequency: res.renewalFrequency,
                        docType: res.docType
                    });
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Failed to fetch requirement");
                })
                .finally(() => {
                    dispatch(hideOverlay());
                });
        }
    }, [id]); // ✅ Add dependency array


    const handleSubmit = () => {



        dispatch(showOverlay());
        updateRequirement({ id, ...form.values }).then((_res) => {
            successNotification("Team created successfully");
            navigate("/compliance-requirements");
        }).catch((err) => {
            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
        }
        ).finally(() => {
            dispatch(hideOverlay());
        }
        );
    }
    return (
        <div className="flex flex-col gap-10">
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-2xl font-semibold text-slate-900">Update Requirement</div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/compliance-requirements" ><Text variant="gradient" className="hover:!underline cursor-pointer">Compliance Requirements</Text></Link>
                        <Text variant="gradient"> Update Requirement</Text>
                    </Breadcrumbs>
                </div>
            </div>

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <div className="bg-white shadow-lg border border-gray-300 p-4 rounded-lg ">

                    <div className="flex flex-col gap-4 ">
                        <TextInput label="Title" placeholder="Enter Title" withAsterisk  {...form.getInputProps('title')} />
                        <Textarea label="Description" placeholder="Enter description" withAsterisk  {...form.getInputProps('description')} />
                        <Select label="Category" placeholder="Select Category" data={["Medical", "Leagal", "Training", "Regulatory", "Safety", "Other"]} searchable withAsterisk  {...form.getInputProps('category')} />
                        <Select label="Renewal Frequency " placeholder="Select Renewal Frequency " data={["Monthly", "Quartely", "Semi-Annually", "Annually", "Biennially", "On Deamand"]} searchable withAsterisk   {...form.getInputProps('renewalFrequency')} />

                        <Select label="Expected Document Type " placeholder="Select Expected Document Type " data={["PDF", "Image", "Scan", "Certificate", "Other"]} searchable withAsterisk   {...form.getInputProps('docType')} />
                        <Checkbox label="Active" />
                    </div>
                </div>

                <div className="flex justify-center  gap-4 mt-5">
                    <Button variant="outline">Cancel</Button>
                    <Button type="submit" variant="gradient">Update Requirement</Button>
                </div>
            </form>
        </div>
    )
}

export default EditRequirement