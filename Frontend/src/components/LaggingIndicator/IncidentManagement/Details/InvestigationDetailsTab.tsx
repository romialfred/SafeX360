import { IconUsersGroup, IconUser, IconPencil, IconCalculator, IconAlertTriangle, IconCheckbox, IconPhoto } from "@tabler/icons-react";
import { Badge, Card, Group, List, Modal, Progress, Text, ThemeIcon, Timeline, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { Carousel } from "@mantine/carousel";
import { getBase64FileSize, handlePreview } from "../../../../utility/DocumentUtility";
import { investMethodMap } from "../../../../Data/DropdownData";
import { formatDateWithDay } from "../../../../utility/DateFormats";
import { statusColors, statusLabels } from "../../../../Data/IncidentsData";

const InvestigationDetailsTab = ({ investigation, processes }: any) => {
    const [opened, { open, close }] = useDisclosure(false);
    const [startIndex, setStartIndex] = useState(0);



    const handleImageClick = (index: number) => {
        setStartIndex(index);
        open();
    };
    const sectionStyles: any = {
        human: {
            bg: "bg-blue-50",
            border: "border-blue-400",
            icon: <IconUser size={20} className="text-blue-600" />,
            title: "Human Actions",
        },
        task: {
            bg: "bg-pink-50",
            border: "border-pink-400",
            icon: <IconPencil size={20} className="text-pink-600" />,
            title: "Task-related Factors",
        },
        working: {
            bg: "bg-green-50",
            border: "border-green-400",
            icon: <IconCalculator size={20} className="text-green-600" />,
            title: "Working Conditions",
        },
        organization: {
            bg: "bg-violet-50",
            border: "border-violet-400",
            icon: <IconAlertTriangle size={20} className="text-violet-600" />,
            title: "Organizational & Latent Failures",
        },
    };

    return (
        <div className="flex flex-col gap-6 ">
            <h2 className="text-lg font-semibold text-gray-800">Investigation Details</h2>

            {/* Method and Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                    <h4 className="text-gray-500 text-sm font-medium mb-1">Method</h4>
                    <p className="text-base font-medium text-gray-800">{investMethodMap[investigation.method] || "N/A"}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                    <h4 className="text-gray-500 text-sm font-medium mb-1">Start Date</h4>
                    <p className="text-base font-medium text-gray-800">{formatDateWithDay(investigation.startDate) || "N/A"}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                    <h4 className="text-gray-500 text-sm font-medium mb-1">End Date</h4>
                    <p className="text-base font-medium text-gray-800">{investigation.endDate ? formatDateWithDay(investigation.endDate) : "Ongoing"}</p>
                </div>
            </div>

            {/* Team */}
            <div className="border border-gray-300 rounded-xl p-4 bg-white shadow-sm">
                <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <IconUsersGroup size={20} className="text-blue-500" /> Investigation Team
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {investigation.team?.map((member: any, index: number) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition border border-blue-100"
                        >
                            <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-medium text-xs">
                                {member.name
                                    ?.split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                            </div>
                            <div>
                                <p className="text-blue-700 font-semibold text-xs">{member.name}</p>
                                <p className="text-xs text-gray-600">{member.role} </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Analysis Sections */}
            {["human", "task", "working", "organization"].map((type) => (
                <div
                    key={type}
                    className={`border-l-4 rounded-xl p-4 shadow-sm ${sectionStyles[type].bg} ${sectionStyles[type].border}`}
                >
                    <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        {sectionStyles[type].icon} {sectionStyles[type].title}
                    </h4>
                    <List
                        spacing="xs"
                        size="sm"
                        center
                        icon={
                            <ThemeIcon color="teal" variant="transparent" size={20} radius="xl">
                                <IconCheckbox size={20} />

                            </ThemeIcon>
                        }
                    >
                        <div className="flex  items-center gap-5">
                            {investigation[`${type}Causes`]?.length > 0 ? (
                                investigation[`${type}Causes`].map((cause: string, i: number) => (
                                    <List.Item mt={0} key={i}>{cause}</List.Item>
                                ))
                            ) : (
                                <List.Item>No causes found</List.Item>
                            )}
                        </div>
                    </List>
                    <div
                        className="prose max-w-none mt-3 text-gray-800"
                        dangerouslySetInnerHTML={{
                            __html: investigation[`${type}Analysis`] || "<p>No analysis provided.</p>",
                        }}
                    />
                </div>
            ))}

            {/* Final Report */}
            <div className="border border-gray-300 rounded-xl p-4 bg-white shadow-sm">
                <h4 className="text-lg font-semibold text-gray-700 mb-2">Investigation Report</h4>
                <div
                    className="prose max-w-none text-gray-800"
                    dangerouslySetInnerHTML={{ __html: investigation.report || "<p>No report available.</p>" }}
                />
            </div>

            {investigation.evidence?.length > 0 && <div className="">
                <h4 className="text-2xl font-bold mb-4 text-gray-800">Evidence</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 border border-gray-300 rounded-xl p-6 bg-gray-50">
                    {[...(investigation.evidence ?? [])]?.map((image: any, index: number) => (
                        <div key={index} className="flex gap-4 bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition duration-200" onClick={() => handleImageClick(index)}>
                            <img
                                src={`data:image/png;base64,${image.file}`}
                                alt={image.name}
                                className="w-20 h-20 object-cover rounded-md border"
                            />
                            <div className="flex flex-col justify-center">
                                <p className="text-sm font-semibold text-gray-800">{image.name}</p>
                                <p className="text-sm text-gray-500">{getBase64FileSize(image.file)} KB</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>}
            {processes?.length > 0 && (
                <div className="p-4 bg-white border border-gray-300 rounded-lg shadow flex flex-col gap-4">
                    <Title order={4} className="text-primary">
                        Progress Timeline
                    </Title>

                    <Timeline
                        active={processes.length}
                        bulletSize={20}
                        variant="filled"

                        lineWidth={2}
                        className="space-y-4"
                    >
                        {processes.map((process: any, index: number) => {
                            const previousProgress = index > 0 ? processes[index - 1]?.progress : 0;
                            const progressMade = process?.progress - previousProgress;
                            return <Timeline.Item key={index}>
                                <Card
                                    shadow="sm"
                                    padding="xs"
                                    radius="md"
                                    withBorder
                                    className="bg-gray-50 space-y-3"
                                >
                                    <Group className="!flex !justify-between">
                                        <Badge size="sm" color={statusColors[process.status]}>
                                            {statusLabels[process.status]}
                                        </Badge>
                                        <div className="p-1 bg-yellow-100 border border-yellow-600 rounded-full shadow">
                                            <Text className="!text-sm !text-yellow-500">
                                                {formatDateWithDay(process.date)}
                                            </Text>
                                        </div>
                                    </Group>
                                    <Progress.Root size={20}>
                                        <Progress.Section value={previousProgress} color="blue">
                                            <Progress.Label>{previousProgress}</Progress.Label>
                                        </Progress.Section>
                                        {progressMade > 0 && (
                                            <Progress.Section value={progressMade} color="teal">
                                                <Progress.Label className="text-xs">{progressMade}</Progress.Label>
                                            </Progress.Section>
                                        )}
                                    </Progress.Root>
                                    <div className="flex flex-col gap-2">
                                        <Text className="!text-gray-500 !text-sm">
                                            {process.description}
                                        </Text>

                                        <Group>
                                            {process.docs?.map((doc: any, i: number) => (
                                                <Badge
                                                    key={i}
                                                    size="sm"
                                                    className="!cursor-pointer"
                                                    onClick={() => handlePreview(doc)}
                                                    leftSection={<IconPhoto size={12} />}
                                                    color="orange"
                                                    variant="light"
                                                >
                                                    {doc.name}
                                                </Badge>
                                            ))}
                                        </Group>
                                    </div>
                                </Card>
                            </Timeline.Item>
                        }
                        )}

                    </Timeline>
                </div>
            )}



            <Modal
                opened={opened}
                onClose={close}
                size="xl"

                title="Evidence Preview"
                centered
                overlayProps={{
                    backgroundOpacity: 0.55,
                    blur: 3,
                }}
            >
                < Carousel className='[&_.mantine-Carousel-control]:!bg-primary  [&_.mantine-Carousel-control]:!text-white'
                    classNames={{
                        indicator: 'mantine-Carousel-indicator bg-white opacity-80 data-[active=true]:!bg-primary transition',
                    }} initialSlide={startIndex} withIndicators controlSize={40} height={500} loop>
                    {[...(investigation.evidence ?? []), ...(investigation.supportingEvidence ?? [])]?.map((image: any, index: number) => (
                        <Carousel.Slide key={index}>
                            <img
                                src={`data:image/png;base64,${image.file}`}
                                alt={image.name}
                                className="w-full h-full object-contain rounded-md"
                            />
                        </Carousel.Slide>
                    ))}
                </Carousel>
            </Modal>
        </div>
    );
};

export default InvestigationDetailsTab;