import { Badge } from "@mantine/core"
import { statusColors, statusLabels } from "../../../../Data/IncidentsData"
import { formatDateWithDay } from "../../../../utility/DateFormats"

const ActionPlansTab = ({ actions }: any) => {
    return (
        <div>
            <h4 className="text-lg mb-4 text-gray-800">Action Plans</h4>

            {actions?.map((x: any, index: any) => (
                <div
                    key={index}
                    className="border border-gray-300 bg-white rounded-lg p-4 shadow-sm mb-4 flex flex-col gap-1"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className=" text-gray-800">{x.actionName}</p>
                            <p className="text-sm text-gray-500">Assigned To: <strong>{x.assignedEmployeeName}</strong></p>
                        </div>

                        <Badge variant="light" color={statusColors[x.status]}>
                            {statusLabels[x.status]}
                        </Badge>
                    </div>

                    <div
                        dangerouslySetInnerHTML={{ __html: x.description }}
                        className="text-gray-600 text-sm"
                    />

                    <div className="text-sm text-gray-700">
                        <b>Deadline:</b>{' '}
                        <span className="text-blue-700">{formatDateWithDay(x.deadline)}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default ActionPlansTab