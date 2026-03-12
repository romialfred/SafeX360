import { Breadcrumbs, Modal, Text, Button } from "@mantine/core";
import { Link } from "react-router-dom";
import { useState } from "react";
import ImagePdfDropzone from "../../UtilityComp/ImagePdfDropzone";
import { useForm } from "@mantine/form";

const complianceData = [
    {
        id: 1,
        title: 'Eye Examination',
        description: 'Annual eye examination for all employees working with screens more than 4 hours daily.',
        status: 'Compliant',
    },
    {
        id: 2,
        title: 'Health and Safety Training',
        description: 'Mandatory training on workplace health and safety procedures.',
        status: 'Upcoming Expiry',
    },
    {
        id: 3,
        title: 'Work Permit',
        description: 'Legal documentation confirming the right to work.',
        status: 'Expired < 30 Days',
    },
    {
        id: 4,
        title: 'Forklift Operation Certificate',
        description: 'Certification for operating forklifts and similar machinery.',
        status: 'Missing',
    },
    {
        id: 5,
        title: 'Fire Safety Drill',
        description: 'Scheduled fire safety drills conducted quarterly.',
        status: 'Compliant',
    },
    {
        id: 6,
        title: 'Emergency Evacuation Plan',
        description: 'Plan outlining emergency exits and procedures.',
        status: 'Upcoming Expiry',
    },
    {
        id: 7,
        title: 'Hazard Communication Training',
        description: 'Training to ensure awareness of chemical hazards.',
        status: 'Missing',
    },
    {
        id: 8,
        title: 'Electrical Safety Certificate',
        description: 'Certification for safe electrical equipment handling.',
        status: 'Expired < 30 Days',
    },
    {
        id: 9,
        title: 'First Aid Training',
        description: 'Basic first aid training for emergency response.',
        status: 'Compliant',
    },
    {
        id: 10,
        title: 'Machine Safety Certification',
        description: 'Certification for operating industrial machines.',
        status: 'Compliant',
    },
    {
        id: 11,
        title: 'COVID-19 Safety Protocol',
        description: 'Guidelines and practices for COVID-19 safety.',
        status: 'Upcoming Expiry',
    },
    {
        id: 12,
        title: 'Ergonomic Assessment',
        description: 'Workstation assessments to prevent strain injuries.',
        status: 'Compliant',
    },
    {
        id: 13,
        title: 'Hearing Test',
        description: 'Annual hearing check-up for noisy environments.',
        status: 'Missing',
    },
    {
        id: 14,
        title: 'Respirator Fit Test',
        description: 'Fit testing for workers using respirators.',
        status: 'Expired < 30 Days',
    },
    {
        id: 15,
        title: 'Safety Audit',
        description: 'Routine safety inspections and reports.',
        status: 'Compliant',
    },
    {
        id: 16,
        title: 'Chemical Handling Permit',
        description: 'Permit required for handling hazardous chemicals.',
        status: 'Upcoming Expiry',
    },
    {
        id: 17,
        title: 'Confined Space Training',
        description: 'Training for working in confined spaces.',
        status: 'Expired < 30 Days',
    },
    {
        id: 18,
        title: 'Ladder Safety Certificate',
        description: 'Certification for safe ladder usage.',
        status: 'Missing',
    },
    {
        id: 19,
        title: 'Workplace Violence Prevention',
        description: 'Policy and training on preventing workplace violence.',
        status: 'Compliant',
    },
    {
        id: 20,
        title: 'Incident Reporting Training',
        description: 'Training on how to report workplace incidents.',
        status: 'Compliant',
    },
];


const getStatusColor = (status: string) => {
    switch (status) {
        case "Compliant":
            return "bg-green-100 text-green-700";
        case "Upcoming Expiry":
            return "bg-yellow-100 text-yellow-700";
        case "Expired < 30 Days":
            return "bg-gray-200 text-gray-700";
        case "Missing":
            return "bg-red-100 text-red-700";
        default:
            return "";
    }
};

const UploadDocument = () => {
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const openModal = (item: any) => {
        setSelectedItem(item);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedItem(null);
    };

    const form = useForm({
        initialValues: {

        },
        validate: {

        },
    })

    return (
        <div className="flex flex-col gap-10">
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">
                        Upload Documents
                    </div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/compliance-documents">
                            <Text variant="gradient" className="hover:!underline cursor-pointer">Compliance Documents</Text>
                        </Link>
                        <Text variant="gradient">Upload Documents</Text>
                    </Breadcrumbs>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-300 flex flex-col gap-5">
                <div>
                    <h1 className="text-xl font-medium text-primary">Select Requirement for Upload</h1>
                </div>

                <div className="flex flex-col gap-5 mt-4">
                    {complianceData.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => openModal(item)}
                            className="bg-blue-50 shadow-sm p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-blue-100 transition"
                        >
                            <div>
                                <h2 className="text-lg font-semibold mb-1">{item.title}</h2>
                                <p className="text-sm mb-2">{item.description}</p>
                            </div>
                            <div className={`font-medium px-3 py-1 rounded-full text-sm ${getStatusColor(item.status)}`}>
                                {item.status}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end">
                    <Button variant="outline">Cancel</Button>
                </div>
            </div>

            {/* MODAL */}
            <Modal opened={modalOpen} onClose={closeModal} title={
                <div className="text-lg font-medium text-blue-500">
                    Upload Document
                </div>
            } centered size="lg">
                {selectedItem && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">{selectedItem.title}</h2>
                        <p>{selectedItem.description}</p>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Category:</strong> {selectedItem.category}</p>
                            <p><strong>Renewal:</strong> {selectedItem.renewal}</p>
                            <p><strong>Document Type:</strong> {selectedItem.documentType}</p>
                        </div>

                        <ImagePdfDropzone name="Supporting Documents" id="report.docs" form={form} />

                        <div className="flex justify-end gap-2">
                            <Button variant="default" onClick={closeModal}>Cancel</Button>
                            <Button>Upload</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UploadDocument;
