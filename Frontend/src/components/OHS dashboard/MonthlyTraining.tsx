import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Center, Loader, Text, TextInput } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconFile, IconSchool, IconSearch } from "@tabler/icons-react";
import TrainingCard from "./TrainingCard";
import { Carousel } from "@mantine/carousel";
import ComplianceDocumentCard from "./ComplianceDocumentCard";
import { getApprovedDocuments } from "../../services/DocumentService";
import { type DocumentSummary } from "../../types/documents";

const trainingSessions = [
    {
        status: "Upcoming",
        title: "ISO 45001 Implementation Guidelines",
        duration: "2 hours",
        instructor: "Sarah Johnson",
        description:
            "Comprehensive training on ISO 45001 OH&S management system and key requirements.",
        enrollment: {
            completed: 13,
            total: 18,
            action: "Enroll Now",
        },
    },
    {
        status: "Full",
        title: "Emergency Response Procedures",
        duration: "4 hours",
        instructor: "Mike Wilson",
        description:
            "Hands-on training for emergency evacuation and response procedures including fire safety protocols.",
        enrollment: {
            completed: 30,
            total: 30,
            action: "Training Full",
        },
    },
    {
        status: "Available",
        title: "Chemical Safety & MSDS Training",
        duration: "3 hours",
        instructor: "Lisa Brown",
        description:
            "Training on chemical handling, storage, and Material Safety Data Sheet interpretation and compliance.",
        enrollment: {
            completed: 11,
            total: 15,
            action: "Enroll Now",
        },
    },
    {
        status: "Available",
        title: "Chemical Safety & MSDS Training",
        duration: "3 hours",
        instructor: "Lisa Brown",
        description:
            "Training on chemical handling, storage, and Material Safety Data Sheet interpretation and compliance.",
        enrollment: {
            completed: 11,
            total: 15,
            action: "Enroll Now",
        },
    },
]

const MonthlyTraining = () => {
    const [activeTab, setActiveTab] = useState("documents"); // "training" | "documents"
    const [documents, setDocuments] = useState<DocumentSummary[]>([]);
    const [documentsLoading, setDocumentsLoading] = useState<boolean>(false);
    const [documentsError, setDocumentsError] = useState<string | null>(null);
    const [documentsSearch, setDocumentsSearch] = useState<string>("");

    useEffect(() => {
        let isMounted = true;
        setDocumentsLoading(true);
        setDocumentsError(null);
        getApprovedDocuments()
            .then((res) => {
                if (!isMounted) return;
                setDocuments(Array.isArray(res) ? res : []);
            })
            .catch(() => {
                if (!isMounted) return;
                setDocumentsError("Unable to load approved documents.");
            })
            .finally(() => {
                if (isMounted) setDocumentsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredDocuments = useMemo(() => {
        if (!documentsSearch) return documents;
        const term = documentsSearch.toLowerCase();
        return documents.filter((doc) =>
            doc.documentName.toLowerCase().includes(term) ||
            (doc.description ?? "").toLowerCase().includes(term) ||
            (doc.category ?? "").toLowerCase().includes(term) ||
            (doc.fileType ?? "").toLowerCase().includes(term)
        );
    }, [documents, documentsSearch]);

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-300 gap-6 flex flex-col">
            {/* Toggle Buttons */}
            <div className="flex gap-4">
                <Button
                    leftSection={<IconFile />}
                    onClick={() => setActiveTab("documents")}
                    variant={activeTab === "documents" ? "filled" : "outline"}
                    color={activeTab === "documents" ? "blue" : "gray"}
                >
                    Health & Safety Documents
                </Button>
                <Button
                    leftSection={<IconSchool />}
                    onClick={() => setActiveTab("training")}
                    variant={activeTab === "training" ? "filled" : "outline"}
                    color={activeTab === "training" ? "blue" : "gray"}
                >
                    Monthly Training
                </Button>
            </div>

            {/* Title Section */}
            {activeTab === "training" && (
                <>
                    <div className="flex justify-between">
                        <div>
                            <p className="text-lg">March 2024 Training Schedule</p>
                            <p className="text-sm text-gray-600">Enroll in upcoming OH&S training sessions</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 text-blue-700 rounded-full p-2 cursor-pointer">
                                <p>6 Sessions Available</p>
                            </div>
                            <div className="bg-gray-100 text-gray-700 rounded-full p-2 cursor-pointer">
                                <p>March 2024</p>
                            </div>
                        </div>
                    </div>

                    {/* Carousel */}
                    <div className="mt-5">
                        <Carousel
                            slideSize="33.3333%"
                            slideGap="md"
                            align="start"
                            loop
                            controlSize={48}
                            nextControlIcon={<IconChevronRight size={32} />}
                            previousControlIcon={<IconChevronLeft size={32} />}

                            styles={{
                                control: {
                                    backgroundColor: "#1e40af",
                                    color: "white",
                                    borderRadius: "9999px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                                    "&:hover": {
                                        backgroundColor: "#1d4ed8",
                                    },
                                },
                            }}
                        >
                            {trainingSessions.map((session, index) => (
                                <Carousel.Slide key={index}>
                                    <TrainingCard trainingSessions={session} />
                                </Carousel.Slide>
                            ))}
                        </Carousel>
                    </div>
                </>
            )}

            {/* Placeholder for Health & Safety Documents */}
            {activeTab === "documents" && (
                <>
                    <div className="flex justify-between">
                        <div>
                            <p className="text-lg">OH&S Document Library</p>
                            <p className="text-sm text-gray-600">Download important health and safety documents, policies, and procedures</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <TextInput
                                leftSection={<IconSearch />}
                                placeholder="Search Documents...."
                                className="text-gray-400"
                                value={documentsSearch}
                                onChange={(event) => setDocumentsSearch(event.currentTarget.value)}
                            />
                        </div>
                    </div>

                    {/* Carousel */}
                    <div className="flex flex-col flex-wrap">
                        {documentsLoading && (
                            <Center h={180}>
                                <Loader color="red" />
                            </Center>
                        )}

                        {!documentsLoading && documentsError && (
                            <Alert color="red" radius="md">{documentsError}</Alert>
                        )}

                        {!documentsLoading && !documentsError && filteredDocuments.length === 0 && (
                            <Center h={140}>
                                <Text size="sm" c="gray.6">No approved documents match your search.</Text>
                            </Center>
                        )}

                        {!documentsLoading && !documentsError && filteredDocuments.length > 0 && (
                            <Carousel
                                slideSize={{ base: "100%", md: "50%", lg: "33.3333%" }}
                                slideGap="md"
                                align="start"
                                loop={filteredDocuments.length > 3}
                                controlSize={48}
                                nextControlIcon={<IconChevronRight size={32} />}
                                previousControlIcon={<IconChevronLeft size={32} />}
                                styles={{
                                    control: {
                                        backgroundColor: "#1e40af",
                                        color: "white",
                                        borderRadius: "9999px",
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                        "&:hover": {
                                            backgroundColor: "#1d4ed8",
                                        },
                                    },
                                }}
                            >
                                {filteredDocuments.map((doc) => (
                                    <Carousel.Slide key={doc.id}>
                                        <ComplianceDocumentCard doc={doc} />
                                    </Carousel.Slide>
                                ))}
                            </Carousel>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default MonthlyTraining;
