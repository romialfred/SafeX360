import { Breadcrumbs, Card, ScrollArea, Tabs, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom"; // ✅ Get employeeId from URL
import EmpTable from "./EmpTable";
import DocumentTable from "./DocumentTable";
import { getByEmployeeId, getRequirementsByEmpId } from "../../../services/ComplianceDocumentService";
import { errorNotification } from "../../../utility/NotificationUtility";
import { mapIdToName } from "../../../utility/OtherUtilities";

const EmployeeDetails = () => {
    const { id: employeeId } = useParams();
    const [activeTab, setActiveTab] = useState('expired');
    const [documents, setDocuments] = useState<any[]>([]);
    const [employeeInfo, setEmployeeInfo] = useState<{ empName: string; position: string; department: string; email: string } | null>(null);
    const [requirements, setRequirements] = useState<any[]>([]);
    const [docMap, setDocMap] = useState<Record<number, any>>({});

    useEffect(() => {
        if (!employeeId) return;

        // Fetch requirements
        fetchData();
    }, [employeeId]);

    const fetchData = () => {
        getRequirementsByEmpId(employeeId)
            .then((res) => {
                setEmployeeInfo({
                    empName: res.empName,
                    position: res.position,
                    department: res.department,
                    email: res.email,
                });

                setRequirements(res.requirements);

            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Failed to fetch requirements");
            });

        // Fetch documents
        getByEmployeeId(employeeId)
            .then((res) => {
                setDocMap(mapIdToName(res));
                setDocuments(res);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Failed to fetch documents");
            });
    }



    const tabData = {
        expired: {
            label: 'Requirements',
            content: <EmpTable requirements={requirements} fetchData={fetchData} docMap={docMap} />,
        },
        upcoming: {
            label: 'Document',
            content: <DocumentTable documents={documents} />,
        },
    };

    return (
        <div className="flex flex-col gap-10">
            {/* Header and Breadcrumbs */}
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-2xl font-semibold text-slate-900">Employee Assignments Details</div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/employee-assignment" ><Text variant="gradient" className="hover:!underline cursor-pointer">Employee Assignments</Text></Link>
                        <Text variant="gradient">Employee Assignments Details</Text>
                    </Breadcrumbs>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-lg border border-gray-300 shadow-lg p-4 flex flex-col gap-5">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl text-primary">{employeeInfo?.empName || "Loading..."}</h1>
                        <p className="text-gray-500 text-lg">{employeeInfo?.position || "-"}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <p className="text-lg text-blue-800">Department:</p>
                            <p className="text-gray-500">{employeeInfo?.department || "-"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-lg text-blue-800">Email:</p>
                            <p className="text-gray-500">{employeeInfo?.email || "-"}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs
                    value={activeTab}
                    onChange={(value) => value && setActiveTab(value)}
                    classNames={{ tab: 'hover:underline hover:text-blue-600' }}
                >
                    <Tabs.List>
                        {Object.entries(tabData).map(([key, { label }]) => (
                            <Tabs.Tab key={key} value={key} className="!text-lg !!text-gray-600">
                                {label}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>

                    {Object.entries(tabData).map(([key, { content }]) => (
                        <Tabs.Panel value={key} key={key} pt="md">
                            <Card shadow="sm" radius="md" withBorder>
                                <ScrollArea h={300}>
                                    <div className="p-0">{content}</div>
                                </ScrollArea>
                            </Card>
                        </Tabs.Panel>
                    ))}
                </Tabs>
            </div>
        </div>
    );
};

export default EmployeeDetails;
