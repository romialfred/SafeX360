
import { Card } from "@mantine/core";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Tag } from "primereact/tag";
import { getPgiById } from "../../../../services/PgiService";
import { formatDateWithDay, formatTo12Hour } from "../../../../utility/DateFormats";
import { capitalizeFirstLetter, getSeverity } from "../../../../utility/OtherUtilities";
import { inspectionTypesMap } from "../../../../Data/DropdownData";

const DetailsInspection = () => {

    const { id } = useParams();
    const [inspection, setInspection] = useState<any>({});
    useEffect(() => {
        getPgiById(id)
            .then((res) => {
                setInspection(res);
            })
            .catch((_err) => {
            })
    }, []);
    return (
        <div className="flex flex-col gap-5">

            <Card shadow="sm" radius="md" withBorder className=" !p-6 bg-white space-y-6">
                <h2 className="text-3xl font-medium flex gap-5 items-center text-primary"> {inspection.title} <Tag severity={getSeverity(inspection.status)} value={inspection.status} /></h2>

                <div className="grid grid-cols-2 gap-4  text-gray-700">
                    <div>
                        <p className="font-medium text-xl"> Site</p>
                        <p>{inspection.site}</p>
                    </div>
                    <div>
                        <p className="font-medium text-xl"> Frequency</p>
                        <p>{capitalizeFirstLetter(inspection.frequency)}</p>
                    </div>
                    <div>
                        <p className="font-medium text-xl" > Planned Date</p>
                        <p>{formatDateWithDay(inspection.plannedDate)}</p>
                    </div>
                    <div>
                        <p className="font-medium text-xl"> Time</p>
                        <p>{formatTo12Hour(inspection.startTime)} - {formatTo12Hour(inspection.endTime)}</p>
                    </div>
                </div>

                <div>
                    <p className="font-medium  text-xl"> Description</p>
                    <p dangerouslySetInnerHTML={{ __html: inspection.description }} className="text-gray-500 text-lg" />
                </div>

                <div>
                    <p className="font-medium  text-xl">Objectives</p>
                    {/* <ul className="list-disc list-inside text-gray-500 text-lg">
              <li>Verify compliance with safety protocols</li>
              <li>Check equipment conditions</li>
              <li>Assess ventilation systems</li>
            </ul> */}
                    <p className="text-gray-500 text-lg">{inspection.objectives}</p>
                </div>

                <div>
                    <p className="font-medium  text-xl"> Risk Types</p>
                    <div className="flex gap-2 mt-1">
                        {inspection.riskTypes?.map((x: any, index: any) => <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-lg">{inspectionTypesMap[x]}</span>)}
                        {/* <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-lg">Environmental</span> */}
                    </div>
                </div>

                <div>
                    <p className="font-medium  text-xl mb-4"> Inspectors</p>
                    <div className="grid grid-cols-4 gap-5">
                        {inspection.participants?.map((emp: any, index: number) => {
                            const initials = emp?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                            return (
                                <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition duration-200 shadow-sm border border-purple-100">
                                    <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-bold text-lg">
                                        {initials || 'NA'}
                                    </div>
                                    <div>
                                        <p className="text-purple-600 font-semibold text-lg">{emp?.name || 'Unknown'}</p>
                                        <p className="text-gray-500 text-sm">{emp?.role ? ` ${emp.role}` : 'No role available'}</p>
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                </div>

                <div>
                    <p className="font-medium  text-xl mb-5"> Required PPE</p>
                    <div className="flex flex-wrap gap-2">
                        {inspection.ppe?.map((x: any, index: any) => (
                            <div
                                key={index}
                                className="inline-flex items-center px-4 py-2 rounded-full bg-orange-100 text-orange-800 text-sm font-medium shadow-sm hover:bg-orange-200 transition"
                            >
                                {x}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    )
};

export default DetailsInspection;
