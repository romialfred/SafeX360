import { Button, Tooltip } from "@mantine/core";
import { IconDots, IconEdit, IconEye } from "@tabler/icons-react";
import { capitalizeFirstLetter } from "../../../utility/OtherUtilities";

type AuditPlan = {
    id: string;
    refNumber: string;
    title: string;
    scopeId?: string;
    auditArea?: string; // fallback if needed
    leadAuditor: string;
    category: 'Internal' | 'External';
    startDate: string;
    endDate: string;
    planningStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PLANNED' | 'IN PROGRESS' | 'COMPLETED' | 'CANCELLED';
    type: string;
};
interface AnnualAuditCardProps {
    audit: AuditPlan;
    onEdit: (audit: AuditPlan) => void;
    onView: (audit: AuditPlan) => void;
    onApprove: (audit: AuditPlan) => void;
    onReject: (audit: AuditPlan) => void;
    auditAreaMap: Record<string, any>;
    leadAuditor?: any; // Optional, if leadAuditor is not part of audit object

}

const AnnualAuditCard = ({ audit, onEdit, onView, onApprove, onReject, auditAreaMap, leadAuditor }: AnnualAuditCardProps) => {

    // Category chip color
    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'Internal':
                return 'bg-blue-100 text-blue-700';
            case 'External':
                return 'bg-purple-100 text-purple-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };
    // Status chip color
    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-100 text-green-700';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-700';
            case 'PLANNED':
            case 'IN PROGRESS':
                return 'bg-blue-100 text-blue-800';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryStyles(capitalizeFirstLetter(audit.category))}`}>{capitalizeFirstLetter(audit.category)}</span>
                    <span className="text-gray-600 text-sm">{auditAreaMap[audit?.scopeId || ""]?.name}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(audit.planningStatus)}`}>{capitalizeFirstLetter(audit.planningStatus)}</span>
            </div>
            <h3 className="text-lg font-semibold !line-clamp-1 text-slate-800 mb-3 ">{audit.title}</h3>
            <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div>
                    <span className="font-medium">Audit Date:</span> {formatDate(audit.startDate)}
                </div>
                {leadAuditor && <div>
                    <span className="font-medium">Lead Auditor:</span> {leadAuditor?.name ?? "-"}
                </div>}
                <div>
                    <span className="font-medium">Reference:</span> {audit.refNumber}
                </div>
                <div>
                    <span className="font-medium">End Date:</span> {formatDate(audit.endDate)}
                </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-auto">
                <div className="flex items-center gap-3">
                    {audit.planningStatus === 'PENDING' && (
                        <>
                            <Tooltip label="Approve">
                                <Button
                                    variant="light"
                                    color="green"
                                    size="xs"
                                    leftSection={<IconDots size={16} />}
                                    onClick={() => onApprove(audit)}
                                >
                                    Approve
                                </Button>
                            </Tooltip>
                            <Tooltip label="Reject">
                                <Button
                                    variant="light"
                                    color="red"
                                    size="xs"
                                    leftSection={<IconDots size={16} />}
                                    onClick={() => onReject(audit)}
                                >
                                    Reject
                                </Button>
                            </Tooltip>
                            <Tooltip label="Edit">
                                <Button
                                    variant="subtle"
                                    color="teal"
                                    size="xs"
                                    leftSection={<IconEdit size={16} />}
                                    onClick={() => onEdit(audit)}
                                >
                                    Edit
                                </Button>
                            </Tooltip>
                        </>
                    )}
                    {audit.planningStatus === 'APPROVED' && (
                        <Tooltip label="Approved — editing disabled">
                            <Button
                                variant="subtle"
                                color="gray"
                                size="xs"
                                leftSection={<IconEdit size={16} />}
                                disabled
                            >
                                Edit
                            </Button>
                        </Tooltip>
                    )}
                    <Tooltip label="View">
                        <Button
                            variant="subtle"
                            color="orange"
                            size="xs"
                            leftSection={<IconEye size={16} />}
                            onClick={() => onView(audit)}
                        >
                            View
                        </Button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}

export default AnnualAuditCard
