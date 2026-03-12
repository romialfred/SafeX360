import { Badge, Button } from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { formatDateShort } from "../../../utility/DateFormats";
import { riskMap } from "../../../Data/DropdownData";


const RiskCards = ({ risk, department, process, owner, getStatusColor }: any) => {
    const navigate = useNavigate();
    const updatedLabel = risk?.updatedAt ? formatDateShort(risk.updatedAt) : '';
    const createdLabel = risk?.createdAt ? formatDateShort(risk.createdAt) : '';
    const datePrefix = updatedLabel ? 'Updated' : 'Created';
    const dateLabel = updatedLabel || createdLabel || '-';

    return (

        <div
            key={risk.id}
            className="rounded-xl border border-gray-300 shadow-sm p-4 bg-white flex flex-col gap-3 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary"
        >
            {/* Badges row */}
            <div className="flex gap-2 items-center justify-between flex-wrap">
                <span className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded-lg font-medium">
                    {process}
                </span>

                <Badge size="xs" color={getStatusColor(risk.status)} fw={500}>
                    {risk?.status?.toLowerCase()}
                </Badge>
            </div>

            {/* Title */}
            <div
                className="text-sm font-semibold text-gray-900"
                onClick={() => navigate("")}
            >
                {risk.title}
            </div>

            {/* Description */}
            <div className="text-gray-600 text-xs line-clamp-2">
                {risk.description}
            </div>

            {/* Extra Info */}
            <div className="text-gray-500 text-xs flex justify-between font-medium">
                <span>Owner:</span> <span className="font-semibold">{owner}</span>
            </div>
            {risk.riskLevel && <div className="text-gray-500 text-xs flex justify-between font-medium">
                <span>Risk Level:</span> <Badge color={riskMap[risk.riskLevel]?.color} variant="filled">{riskMap[risk.riskLevel]?.level}</Badge>
            </div>}
            <div className="text-gray-500 text-xs flex justify-between font-medium">
                <span>Process:</span> <span className="font-semibold">{process}</span>
            </div>
            <div className="text-gray-500 text-xs flex justify-between font-medium">
                <span>Department:</span> <span className="font-semibold">{department}</span>
            </div>



            {/* Footer Actions */}
            <div className="flex justify-between items-center mt-2">
                <div className="flex gap-2">
                    <Button
                        size="compact-xs"
                        leftSection={<IconEye size={15} />}
                        color="yellow"
                        variant="subtle"
                        onClick={() => navigate(`register-details/${risk.id}`)}
                    >
                        View
                    </Button>
                </div>
                <span className="text-xs text-gray-400">{datePrefix}: {dateLabel}</span>
            </div>
        </div>
    );

};

export default RiskCards;
