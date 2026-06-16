import { useState } from "react";
import { ActionIcon, Badge, Group, Modal } from "@mantine/core";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
    IconActivity,
    IconUsers,
    IconDeviceDesktop,
    IconMapPin,
    IconClock,
    IconAlertTriangle,
    IconShield,
    IconGlobe,
    IconPointer,
    IconEye,
} from "@tabler/icons-react";
import { mockUsers } from "../data/users";
import { mockUserSessions, mockUserActivities } from "../data/userTracking";

const OnlineUsers = () => {
    const [users] = useState<any[]>(mockUsers);
    const [userSessions] = useState<any[]>(mockUserSessions);
    const [userActivities] = useState<any[]>(mockUserActivities);
    const [selectedUserForTracking, setSelectedUserForTracking] =
        useState<any | null>(null);
    const [showUserTrackingModal, setShowUserTrackingModal] = useState(false);

    const activeSessions = userSessions.filter((session) => session.isActive);
    const onlineUsers = users.filter((user) => user.isOnline);

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor(
            (now.getTime() - time.getTime()) / (1000 * 60)
        );

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const handleViewUserTracking = (user: any) => {
        setSelectedUserForTracking(user);
        setShowUserTrackingModal(true);
    };

    // Helpers for modal
    const getUserSessions = (userId: string) => {
        return userSessions.filter((session) => session.userId === userId);
    };

    const getUserActivities = (userId: string) => {
        return userActivities.filter((activity) => activity.userId === userId);
    };

    const getActionIcon = (action: string) => {
        if (action.includes("Login"))
            return <IconGlobe className="w-4 h-4 text-green-500" />;
        if (action.includes("Page Visit"))
            return <IconPointer className="w-4 h-4 text-blue-500" />;
        if (action.includes("Incident"))
            return <IconAlertTriangle className="w-4 h-4 text-red-500" />;
        if (action.includes("Audit"))
            return <IconShield className="w-4 h-4 text-purple-500" />;
        if (action.includes("Risk"))
            return <IconAlertTriangle className="w-4 h-4 text-orange-500" />;
        if (action.includes("Document"))
            return <IconEye className="w-4 h-4 text-indigo-500" />;
        return <IconActivity className="w-4 h-4 text-gray-500" />;
    };

    // Table cell templates
    const userBodyTemplate = (rowData: any) => (
        <Group>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center relative">
                <IconUsers size={18} className="text-gray-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
                <div className="font-medium">
                    {rowData.firstName} {rowData.lastName}
                </div>
                <div className="text-gray-500 text-xs">{rowData.email}</div>
            </div>
        </Group>
    );

    const statusBodyTemplate = () => (
        <Badge color="green" variant="light">
            Online
        </Badge>
    );

    const lastActivityBodyTemplate = (rowData: any) => (
        <span>
            {rowData.lastActivity ? formatTimeAgo(rowData.lastActivity) : "Unknown"}
        </span>
    );

    const sessionBodyTemplate = (rowData: any) => {
        const session = activeSessions.find((s) => s.userId === rowData.id);
        return session ? (
            <div>
                <div>Duration: {formatTimeAgo(session.loginTime)}</div>
                <div className="text-xs text-gray-400">{session.actionsPerformed} actions</div>
            </div>
        ) : (
            "No session data"
        );
    };

    const actionsBodyTemplate = (rowData: any) => (
        <ActionIcon
            color="blue"
            variant="subtle"
            onClick={() => handleViewUserTracking(rowData)}
        >
            <IconActivity size={16} />
        </ActionIcon>
    );

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-gray-300 shadow-sm">
                <div className="flex justify-between">
                    <h2 className="text-lg text-primary">
                        Currently Online Users
                    </h2>
                    <div className="p-1 rounded-full border border-green-600 bg-green-50 text-green-500">
                        <p className="text-sm">
                            {onlineUsers.length} users currently active
                        </p>
                    </div>
                </div>

                <DataTable
                    value={onlineUsers}
                    paginator
                    stripedRows
                    emptyMessage="No users online."
                    removableSort
                    tableStyle={{ minWidth: "60rem" }}
                    className="[&_.p-datatable-tbody]:!text-sm"
                    size="small"
                    rows={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    dataKey="id"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
                >
                    <Column
                        style={{ fontWeight: "normal", fontSize: "14px" }}
                        field="user"
                        header="User"
                        body={userBodyTemplate}
                    />
                    <Column
                        style={{ fontWeight: "normal", fontSize: "14px" }}
                        field="status"
                        header="Status"
                        body={statusBodyTemplate}
                    />
                    <Column
                        style={{ fontWeight: "normal", fontSize: "14px" }}
                        field="lastActivity"
                        header="Last Activity"
                        body={lastActivityBodyTemplate}
                    />
                    <Column
                        style={{ fontWeight: "normal", fontSize: "14px" }}
                        field="session"
                        header="Session"
                        body={sessionBodyTemplate}
                    />
                    <Column
                        style={{ fontWeight: "normal", fontSize: "14px" }}
                        body={actionsBodyTemplate}
                    />
                </DataTable>
            </div>

            {/* Tracking Modal (same as tracking component) */}
            <Modal
                opened={showUserTrackingModal}
                onClose={() => setShowUserTrackingModal(false)}
                size="90%"
                radius="lg"
                padding="lg"
                overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            >
                {selectedUserForTracking && (
                    <>
                        <div className="border-b border-gray-200 pb-4 mb-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg text-blue-500">
                                    User Activity Tracking
                                </h2>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                {(() => {
                                    const user = users.find((u) => u.id === selectedUserForTracking.id);
                                    return user
                                        ? `${user.firstName} ${user.lastName} - ${user.email}`
                                        : "Unknown User";
                                })()}
                            </p>
                        </div>

                        <div className="overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* User Sessions */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="text-lg text-gray-900 mb-4 flex items-center">
                                        <IconDeviceDesktop className="w-5 h-5 mr-2 text-blue-500" />
                                        Sessions
                                    </h3>
                                    <div className="space-y-3">
                                        {getUserSessions(selectedUserForTracking.id).map(
                                            (session) => (
                                                <div
                                                    key={session.id}
                                                    className="bg-white p-4 rounded-lg border border-gray-200"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span
                                                            className={`px-2 py-1 text-xs rounded-full ${session.isActive
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-gray-100 text-gray-800"
                                                                }`}
                                                        >
                                                            {session.isActive ? "Active" : "Ended"}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(session.loginTime).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-500">IP Address:</span>
                                                            <div className="font-medium">
                                                                {session.ipAddress}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Actions:</span>
                                                            <div className="font-medium">
                                                                {session.actionsPerformed}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2">
                                                        <span className="text-gray-500 text-sm">
                                                            Pages Visited:
                                                        </span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {session.pagesVisited.map(
                                                                (page: any, index: any) => (
                                                                    <span
                                                                        key={index}
                                                                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                                                    >
                                                                        {page}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* User Activities */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="text-lg text-gray-900 mb-4 flex items-center">
                                        <IconActivity className="w-5 h-5 mr-2 text-purple-500" />
                                        Recent Activities
                                    </h3>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {getUserActivities(selectedUserForTracking.id).map(
                                            (activity) => (
                                                <div
                                                    key={activity.id}
                                                    className="bg-white p-4 rounded-lg border border-gray-200"
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <div className="flex-shrink-0 mt-1">
                                                            {getActionIcon(activity.action)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-gray-900">
                                                                    {activity.action}
                                                                </h4>
                                                                <span className="text-sm text-gray-500">
                                                                    {formatTimeAgo(activity.timestamp)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {activity.page}
                                                            </p>
                                                            {activity.details && (
                                                                <p className="text-sm text-gray-500 mt-1">
                                                                    {activity.details}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                                                <span className="flex items-center">
                                                                    <IconMapPin className="w-3 h-3 mr-1" />
                                                                    {activity.ipAddress}
                                                                </span>
                                                                <span className="flex items-center">
                                                                    <IconClock className="w-3 h-3 mr-1" />
                                                                    {new Date(
                                                                        activity.timestamp
                                                                    ).toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default OnlineUsers;
