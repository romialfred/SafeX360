import Calendar from './Calender';

// const eventsData = [
//     {
//         title: 'Monthly Safety Meeting',
//         date: '3/15/2024',
//         icon: <IconUsers stroke={2} />,
//         iconLabel: 'General safety review and updates',
//         bgColor: 'bg-blue-100', // light blue
//         iconColor: 'text-blue-500', // blue icon color
//         titleColor: 'text-blue-700', // dark blue title color
//     },
//     {
//         title: 'Fire Safety Audit',
//         date: '3/16/2024',
//         icon: <IconFileCheck stroke={2} />,
//         iconLabel: 'Annual fire safety compliance audit',
//         bgColor: 'bg-red-100', // light red
//         iconColor: 'text-red-500', // red icon color
//         titleColor: 'text-red-700', // dark red title color
//     },
//     {
//         title: 'Workplace Inspection',
//         date: '3/17/2024',
//         icon: <IconSearch stroke={2} />,
//         iconLabel: 'Quarterly workplace safety inspection',
//         bgColor: 'bg-yellow-100', // light yellow
//         iconColor: 'text-yellow-500', // yellow icon color
//         titleColor: 'text-yellow-700', // dark yellow title color
//     },
//     {
//         title: 'Emergency Response Drill',
//         date: '3/18/2024',
//         icon: <IconAlertTriangle stroke={2} />,
//         iconLabel: 'Emergency evacuation procedure practice',
//         bgColor: 'bg-orange-100', // light orange
//         iconColor: 'text-orange-500', // orange icon color
//         titleColor: 'text-orange-700', // dark orange title color
//     },
//     {
//         title: 'Safety Committee Meeting',
//         date: '3/19/2024',
//         icon: <IconUsersGroup stroke={2} />,
//         iconLabel: 'Review of monthly safety metrics',
//         bgColor: 'bg-green-100', // light green
//         iconColor: 'text-green-500', // green icon color
//         titleColor: 'text-green-700', // dark green title color
//     },
//     {
//         title: 'Equipment Safety Audit',
//         date: '3/20/2024',
//         icon: <IconFileCheck stroke={2} />,
//         iconLabel: 'Heavy machinery safety compliance check',
//         bgColor: 'bg-purple-100', // light purple
//         iconColor: 'text-purple-500', // purple icon color
//         titleColor: 'text-purple-700', // dark purple title color
//     },
// ];

const Events = () => {

    return (
        <div className="bg-white rounded-lg shadow-xl p-10 flex flex-col gap-10 border border-gray-200 ">
            <div>
                <p className="text-3xl  font-bold">Safety Events Calendar</p>
            </div>


            <div className='grid grid-cols-1 gap-5 '>
                {/* <div className="p-6 col-span-1 bg-white rounded-lg shadow-xl border border-gray-300">
                    <Group>
                        <IconCalendarWeek size={30} color="gray" />
                        <Text className="!text-2xl !font-bold !text-gray-400">Upcoming Events</Text>
                    </Group>

                    {eventsData.map((event, index) => (
                        <div
                            key={index}
                            className={`mt-4 flex flex-col ${event.bgColor} rounded-lg shadow-xl p-6 gap-2`}
                        >
                            <div className='flex gap-2 items-center'>
                                <div className={`${event.iconColor}`}>
                                    {event.icon}
                                </div>
                                <div className={`${event.iconColor}`}>
                                    <Text className='!text-lg'>{event.title}</Text>
                                </div>

                            </div>
                            <div className="flex flex-col">
                                <div className="flex gap-2 items-center">
                                    <IconClock size={18} color='gray' />
                                    <Text color='dimmed'>{event.date}</Text>
                                </div>

                                <div>
                                    <Text color='dimmed' className='!text-sm'>{event.iconLabel}</Text>
                                </div>
                            </div>
                        </div>
                    ))}
                </div> */}


                <Calendar />


            </div>



        </div>
    );
};

export default Events;
