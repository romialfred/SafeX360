import { formatDateWithDay, formatTo12Hour } from "../../../../utility/DateFormats";
import { ppeRecord } from "../../../../Data/IncidentsData";

const ViewDetailsMeeting = ({ activity }: any) => {
    return (
        <div className="space-y-5" >


            <div className="grid grid-cols-2 gap-3 text-gray-700">
                <div>
                    <p className="font-medium text-lg">Title</p>
                    <p className="text-base">{activity.title}</p>
                </div>
                <div>
                    <p className="font-medium text-lg">Location</p>
                    <p className="text-base">{activity?.location}</p>
                </div>
                <div>
                    <p className="font-medium text-lg">Planned Date</p>
                    <p className="text-base">{formatDateWithDay(activity.plannedDate)}</p>
                </div>
                <div>
                    <p className="font-medium text-lg">Time</p>
                    <p className="text-base">
                        {formatTo12Hour(activity.startTime)} - {formatTo12Hour(activity.endTime)}
                    </p>
                </div>
            </div>

            <div>
                <p className="font-medium text-lg mb-0.5">Objectives</p>
                <p
                    dangerouslySetInnerHTML={{ __html: activity.objectives }}
                    className="text-gray-500 text-base"
                />
            </div>

            <div>
                <p className="font-medium text-lg mb-0.5">Agenda</p>
                <p
                    dangerouslySetInnerHTML={{ __html: activity.agenda }}
                    className="text-gray-500 text-base"
                />
            </div>

            <div>
                <p className="font-medium text-lg mb-0.5">Expected Result</p>
                <p
                    dangerouslySetInnerHTML={{ __html: activity.expectedResults }}
                    className="text-gray-500 text-base"
                />
            </div>

            <div>
                <p className="font-medium text-lg mb-2">Participants</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {activity.participants?.map((emp: any, index: number) => {
                        const initials = emp?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                        return (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition duration-200 shadow-sm border border-purple-100"
                            >
                                <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-bold text-base">
                                    {initials || 'NA'}
                                </div>
                                <div>
                                    <p className="text-purple-600 font-semibold text-base">{emp?.name || 'Unknown'}</p>
                                    <p className="text-gray-500 text-sm">{emp?.role ? emp.role : 'No role available'}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <p className="font-medium text-lg mb-2">Required PPE</p>
                <div className="flex flex-wrap gap-1.5">
                    {activity.ppe?.map((x: any, index: any) => (
                        <div
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm font-medium shadow-sm hover:bg-orange-200 transition"
                        >
                            {ppeRecord[x]}
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

export default ViewDetailsMeeting;