import { Badge, Button, Tooltip } from "@mantine/core";
import { IconBook, IconEdit, IconSearch } from "@tabler/icons-react";
import { incidentStatusMap } from "../../../Data/DropdownData";
import { Link, useNavigate } from "react-router-dom";
import { formatDateShort } from "../../../utility/DateFormats";

interface IncidentData {
    id: number;
    severityLevelName?: string;
    maxSeverityLevel?: string;
    incidentCategoryName?: string;
    subDepartment?: string;
    status?: string;
    title: string;
    description: string;
    incidentDate: string;
    reporterId: number;
}

const badgeColors: any = {
    severity: {
        4: 'bg-red-100 text-red-500',       // Most severe
        3: 'bg-orange-100 text-orange-500',           // Major
        2: 'bg-yellow-100 text-yellow-500',           // Moderate
        1: 'bg-green-100 text-green-500',            // Minor
        5: 'bg-brown-100 text-brown-500',
    },
    status: {
        REPORTED: 'bg-orange-100 text-orange-500',
        IN_PROGRESS: 'bg-yellow-100 text-yellow-500',
        RESOLVED: 'bg-green-100 text-green-500',
    },
};

const getSeverityClass = (severity?: string) => {
    return badgeColors.severity?.[severity ?? ''] || 'bg-gray-300 text-black';
};




const IncidentCard = ({ incidentData, emps }: { incidentData: IncidentData, emps: any }) => {
    const navigate = useNavigate();
    return (
        <div className="rounded-xl border border-gray-300 shadow-sm p-4 bg-white flex flex-col gap-3 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary">
            <div className="flex gap-4 ">
                <span className={`text-sm px-2 py-1 rounded-lg font-medium ${getSeverityClass(incidentData.maxSeverityLevel)}`}>
                    {incidentData.severityLevelName}
                </span>
                <span className="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded-lg font-medium">
                    {incidentData.incidentCategoryName}
                </span>
                <Badge radius="xs"
                    size="lg"
                    color="orange"
                    className="!capitalize"
                    variant="outline"

                >{incidentData.status ? incidentStatusMap[incidentData.status] : ""}</Badge>
            </div>
            <Link to={`${incidentData.id}`} className=" font-semibold text-gray-900">{incidentData.title}</Link>
            {/* <p className="font-medium text-gray-600">{incidentData.description}</p> */}
            <div className=" text-gray-500 text-sm font-medium">
                Incident Date: {formatDateShort(incidentData.incidentDate)}
            </div>
            <div className=" text-gray-500 text-sm font-medium">
                Reporter: {emps ? emps[incidentData.reporterId]?.name || "Unknown" : "Unknown"}
            </div>


            <div className="flex justify-center grow gap-4">
                {(() => {
                    const statusUpper = String(incidentData?.status || '').toUpperCase();
                    const canEdit = !['CLOSED', 'REJECTED'].includes(statusUpper);
                    const tooltip = canEdit ? 'Edit' : (statusUpper === 'CLOSED' ? 'Closed — modification not possible' : 'Rejected — modification not possible');
                    return (
                        <Tooltip label={tooltip}>
                            <span className="inline-flex">
                                <Button onClick={() => { if (canEdit) navigate("edit/" + incidentData.id); }} size="xs" variant="subtle" leftSection={<IconEdit size={15} />} color="primary" disabled={!canEdit}>Edit</Button>
                            </span>
                        </Tooltip>
                    );
                })()}
                {(() => {
                    const statusUpper = String(incidentData?.status || '').toUpperCase();
                    const canInvestigate = !['CLOSED', 'REJECTED'].includes(statusUpper);
                    const tooltip = canInvestigate ? 'Investigation' : (statusUpper === 'CLOSED' ? 'Closed — investigation not allowed' : 'Rejected — investigation not allowed');
                    return (
                        <Tooltip label={tooltip}>
                            <span className="inline-flex">
                                <Button size="xs" onClick={() => { if (canInvestigate) navigate("investigation/" + incidentData.id); }} variant="subtle" leftSection={<IconSearch size={15} />} color="blue" disabled={!canInvestigate}>Investigation</Button>
                            </span>
                        </Tooltip>
                    );
                })()}
                <Button size="xs" onClick={() => navigate("" + incidentData.id + "?tab=lessons")} variant="subtle" leftSection={<IconBook size={15} />} color="green" >Lesson</Button>
            </div>
        </div>
    );
};

export default IncidentCard;
