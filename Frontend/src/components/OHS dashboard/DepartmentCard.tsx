import { Divider, ScrollArea, Tooltip, Badge, Avatar } from "@mantine/core";
import { IconBuildingFactory2 } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../../slices/hooks";
import { getMemberTeamDetails, TeamMemberDetailsResponse, TeamMemberDTO } from "../../services/TeamService";
import { errorNotification } from "../../utility/NotificationUtility";

const DepartmentCard = () => {
    const user = useAppSelector((state) => state.user as any);

    const [teamDetails, setTeamDetails] = useState<TeamMemberDetailsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {

        if (user?.empId === null || user?.empId === undefined) {
            setTeamDetails(null);
            setFetchError(null);
            return;
        }

        let cancelled = false;
        const loadTeamDetails = async () => {
            setLoading(true);
            try {
                const details = await getMemberTeamDetails(user?.empId);
                if (!cancelled) {
                    setTeamDetails(details);
                    setFetchError(null);
                }
            } catch (error: any) {
                if (!cancelled) {
                    setTeamDetails(null);
                    const serverMessage = error?.response?.data?.errorMessage;
                    setFetchError(serverMessage || "Unable to load team information.");
                    if (serverMessage) {
                        errorNotification(serverMessage);
                    }
                    console.error("Failed to fetch member team details", error);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadTeamDetails();

        return () => {
            cancelled = true;
        };
    }, [user?.empId]);

    const members = useMemo(() => {
        if (!teamDetails?.members?.length) {
            return [] as TeamMemberDTO[];
        }

        return [...teamDetails.members].sort((a, b) => {
            const nameA = a.employeeName?.toLowerCase?.() ?? "";
            const nameB = b.employeeName?.toLowerCase?.() ?? "";
            return nameA.localeCompare(nameB);
        });
    }, [teamDetails]);

    const headerDepartment = teamDetails?.departmentName || user?.department || "Department unavailable";
    const headerTeam = teamDetails?.teamName || "Team not linked";

    return (
        <div className="backdrop-blur-sm bg-blue-50 border border-gray-300 rounded-xl p-6 shadow-lg flex flex-col gap-4 h-[500px]">
            <div className="flex items-center gap-3">
                <IconBuildingFactory2 size={30} className="text-blue-600" />
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">{headerDepartment}</h2>
                    <p className="text-sm text-gray-700 font-medium">{headerTeam}</p>
                </div>
            </div>

            <Divider />

            <div className="flex flex-col gap-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">Team Members</span>
                    {loading && <span className="text-xs text-gray-500">Loading…</span>}
                </div>
                {fetchError && <p className="text-xs text-red-600">{fetchError}</p>}
                {!loading && !members.length && !fetchError && (
                    <p className="text-xs text-gray-600">No active team members.</p>
                )}
                <ScrollArea.Autosize mah={320} type="auto" className="mt-1">
                    <div className="flex flex-col gap-3 pr-1">
                        {members.map((member) => {
                            const normalizedRole = member.role ?? "";
                            const isTeamLead = normalizedRole === "TEAM_LEAD";
                            const formattedRole = normalizedRole
                                .toLowerCase()
                                .split("_")
                                .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
                                .join(" ");

                            return (
                                <div key={member.id} className="flex items-start gap-3 rounded-lg bg-white/60 border border-blue-200 p-3 shadow-sm">

                                    <Avatar src={null} name={member.employeeName || "User Avatar"} color="initials" radius="xl" size={40} />
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-semibold text-gray-800">{member.employeeName || "Unnamed Member"}</p>
                                            {member.role && (
                                                <Tooltip label={`Role: ${formattedRole}`}
                                                    withArrow
                                                    position="top">
                                                    <Badge size="xs" color={isTeamLead ? "red" : "blue"} radius="sm">{formattedRole}</Badge>
                                                </Tooltip>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                            {member.status && (
                                                <Badge size="xs" color={member.status === "ACTIVE" ? "green" : "gray"} radius="sm">
                                                    {member.status}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea.Autosize>
            </div>
        </div>
    );
};

export default DepartmentCard;
