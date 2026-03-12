import { Button } from "@mantine/core";
import { formatDateShort } from "../../../utility/DateFormats";
import { capitalizeFirstLetter } from "../../../utility/OtherUtilities";
import { useNavigate } from "react-router-dom";
import { auditStatusMap } from "../../../Data/DropdownData";
import { IconEdit, IconEye } from "@tabler/icons-react";


const AuditCard = ({ incidentData, auditAreaMap }: any) => {
    const navigate = useNavigate();

    return (
        <div className="rounded-xl border border-gray-300 shadow-sm p-4 bg-white flex flex-col gap-3 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary">
            <div className="flex gap-4 items-center justify-between">

                <span className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded-lg font-medium">
                    {capitalizeFirstLetter(incidentData.category)}
                </span>
                <span className="text-xs bg-purple-50 text-purple-800 px-2 py-1 rounded-lg font-medium">
                    {auditAreaMap[incidentData.scopeId]?.name}
                </span>
                <Button
                    color="orange"
                    size="compact-xs"
                    variant="outline"
                >{auditStatusMap[incidentData.status ?? ""]}</Button>
            </div>

            <div className="text-sm font-semibold text-gray-900">{incidentData.title}</div>

            <div className="text-gray-500 text-xs font-medium">
                Audit Date: {formatDateShort(incidentData.startDate)}
            </div>
            <div className="text-gray-500 text-xs font-medium">
                Type: {Object.keys(incidentData.auditTypes).join(", ")}
            </div>
            <div className="text-gray-500 text-xs font-medium">
                Lead Auditor:
            </div>

            <div className="flex justify-center grow gap-4">
                {/* <Button
                    size="compact-xs"
                    // leftSection={<IconPlayerPlay />}
                    color="indigo"
                    onClick={() => navigate(`execute/${incidentData.id}`)}
                >
                    Execute
                </Button> */}
                <Button
                    size="compact-xs"
                    leftSection={<IconEdit size={15} />}
                    color="primary"
                    variant="subtle"
                    onClick={() => navigate(`edit-schedule/${incidentData.id}`)}
                >
                    Edit
                </Button>
                <Button
                    size="compact-xs"
                    leftSection={<IconEye size={15} />}
                    color="yellow"
                    variant="subtle"
                    onClick={() => navigate(`details/${incidentData.id}`)}
                >
                    View
                </Button>
            </div>
        </div>
    )
}

export default AuditCard