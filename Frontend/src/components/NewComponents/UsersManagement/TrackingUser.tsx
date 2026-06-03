import {
    IconActivity,
    IconAlertTriangle,
    IconClock,
    IconDeviceDesktop,
    IconEye,
    IconGlobe,
    IconMapPin,
    IconPointer,
    IconShield,
    IconUsers,
} from "@tabler/icons-react";
import { useState } from "react";
import { mockUserActivities, mockUserSessions } from "../data/userTracking";
import { mockUsers } from "../data/users";
import { Badge, ActionIcon, Modal } from "@mantine/core";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const TrackingUser = () => {
    const [userSessions] = useState<any[]>(mockUserSessions);
    const [selectedUserForTracking, setSelectedUserForTracking] = useState<string | null>(null);
    const [showUserTrackingModal, setShowUserTrackingModal] = useState(false);
    const [users] = useState<any[]>(mockUsers);
    const [userActivities] = useState<any[]>(mockUserActivities);

    const handleViewUserTracking = (userId: string) => {
        setSelectedUserForTracking(userId);
        setShowUserTrackingModal(true);
    };

    const getUserSessions = (userId: string) => {
        return userSessions.filter((session) => session.userId === userId);
    };

    const getUserActivities = (userId: string) => {
        return userActivities.filter((activity) => activity.userId === userId);
    };

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const getActionIcon = (action: string) => {
        if (action.includes("Login")) return <IconGlobe className="w-4 h-4 text-green-500" />;
        if (action.includes("Page Visit")) return <IconPointer className="w-4 h-4 text-blue-500" />;
        if (action.includes("Incident")) return <IconAlertTriangle className="w-4 h-4 text-red-500" />;
        if (action.includes("Audit")) return <IconShield className="w-4 h-4 text-purple-500" />;
        if (action.includes("Risk")) return <IconAlertTriangle className="w-4 h-4 text-orange-500" />;
        if (action.includes("Document")) return <IconEye className="w-4 h-4 text-indigo-500" />;
        return <IconActivity className="w-4 h-4 text-gray-500" />;
    };

    // Table templates
    const userBodyTemplate = (rowData: any) => (
        <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center relative">
                <IconUsers className="w-5 h-5 text-gray-500" />
                {rowData.isActive && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                )}
            </div>
            <div className="ml-3">
                <div className="text-sm">{rowData.userName}</div>
                <div className="text-xs text-gray-500">{rowData.ipAddress}</div>
            </div>
        </div>
    );

    const statusBodyTemplate = (rowData: any) => (
        <Badge color={rowData.isActive ? "green" : "gray"} variant="light">
            {rowData.isActive ? "Active" : "Ended"}
        </Badge>
    );

    const loginTimeBodyTemplate = (rowData: any) => (
        <div>
            <div>{new Date(rowData.loginTime).toLocaleDateString()}</div>
            <div className="text-xs text-gray-400">{new Date(rowData.loginTime).toLocaleTimeString()}</div>
        </div>
    );

    const pagesBodyTemplate = (rowData: any) => (
        <div className="max-w-xs">
            <div className="font-medium">{rowData.pagesVisited.length} pages</div>
            <div className="text-xs text-gray-400 truncate">
                {rowData.pagesVisited.slice(0, 2).join(", ")}
                {rowData.pagesVisited.length > 2 && "..."}
            </div>
        </div>
    );

    const actionsPerformedTemplate = (rowData: any) => (
        <div>
            <div className="font-medium">{rowData.actionsPerformed}</div>
            <div className="text-xs text-gray-400">actions performed</div>
        </div>
    );

    const detailsBodyTemplate = (rowData: any) => (
        <ActionIcon
            color="blue"
            variant="subtle"
            onClick={() => handleViewUserTracking(rowData.userId)}
        >
            <IconEye size={16} />
        </ActionIcon>
    );

    return (
        <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg text-primary">User Activity Tracking</h2>
                    <p className="text-sm text-gray-600 mt-1">Monitor user sessions and activities</p>
                </div>

                <DataTable
                    value={userSessions}
                    paginator
                    rows={10}
                    stripedRows
                    dataKey="id"
                    emptyMessage="No user sessions found."





                    removableSort
                    tableStyle={{ minWidth: "60rem" }}
                    className="[&_.p-datatable-tbody]:!text-sm p-4"
                    size="small"

                    rowsPerPageOptions={[10, 25, 50]}

                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} risks"
                >
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="user" header="User" body={userBodyTemplate} />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="status" header="Session Status" body={statusBodyTemplate} />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="loginTime" header="Login Time" body={loginTimeBodyTemplate} />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="pagesVisited" header="Pages Visited" body={pagesBodyTemplate} />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="actionsPerformed" header="Actions" body={actionsPerformedTemplate} />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} body={detailsBodyTemplate} />
                </DataTable>
            </div>

            {/* Mantine Modal for User Tracking */}
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
                                <h2 className="text-lg text-blue-500">User Activity Tracking</h2>

                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                {(() => {
                                    const user = users.find((u) => u.id === selectedUserForTracking);
                                    return user ? `${user.firstName} ${user.lastName} - ${user.email}` : "Unknown User";
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
                                        {getUserSessions(selectedUserForTracking).map((session) => (
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
                                                        <div className="font-medium">{session.ipAddress}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Actions:</span>
                                                        <div className="font-medium">{session.actionsPerformed}</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2">
                                                    <span className="text-gray-500 text-sm">Pages Visited:</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {session.pagesVisited.map((page: any, index: any) => (
                                                            <span
                                                                key={index}
                                                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                                            >
                                                                {page}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* User Activities */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="text-lg text-gray-900 mb-4 flex items-center">
                                        <IconActivity className="w-5 h-5 mr-2 text-purple-500" />
                                        Recent Activities
                                    </h3>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {getUserActivities(selectedUserForTracking).map((activity) => (
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
                                                            <h4 className="text-gray-900">{activity.action}</h4>
                                                            <span className="text-sm text-gray-500">
                                                                {formatTimeAgo(activity.timestamp)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">{activity.page}</p>
                                                        {activity.details && (
                                                            <p className="text-sm text-gray-500 mt-1">{activity.details}</p>
                                                        )}
                                                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                                            <span className="flex items-center">
                                                                <IconMapPin className="w-3 h-3 mr-1" />
                                                                {activity.ipAddress}
                                                            </span>
                                                            <span className="flex items-center">
                                                                <IconClock className="w-3 h-3 mr-1" />
                                                                {new Date(activity.timestamp).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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

export default TrackingUser;
