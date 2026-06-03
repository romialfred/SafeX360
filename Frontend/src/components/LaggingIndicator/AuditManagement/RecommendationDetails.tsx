import { Breadcrumbs, Text, LoadingOverlay } from "@mantine/core";
import {
    IconCalendar,
    IconClock,
    IconFile,
    IconMessageCircle,
    IconPaperclip,
    IconUser,
} from "@tabler/icons-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    getRecommendationById,
    getRecommendationFollowups,
} from "../../../services/AuditService";
import { formatDate } from "../../../utility/DateFormats";

const RecommendationDetails = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [recommendation, setRecommendation] = useState<any>(null);
    const [followups, setFollowups] = useState<any[]>([]);

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        Promise.all([
            getRecommendationById(id),
            getRecommendationFollowups(id),
        ])
            .then(([rec, followup]) => {
                setRecommendation(rec);
                setFollowups(followup);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    return (
        <div className="relative">
            <LoadingOverlay visible={loading} />
            {!loading && recommendation && (
                <div className="flex flex-col gap-10">
                    {/* Breadcrumb */}
                    <div>
                        <div className="text-2xl text-blue-500 w-fit">
                            Recommendation Details
                        </div>
                        <Breadcrumbs mt="xs" mb="lg">
                            <Link className="hover:!underline" to="/">
                                <Text variant="gradient">Home</Text>
                            </Link>
                            <Link className="hover:!underline" to="/audit-management">
                                <Text variant="gradient">Audit Management</Text>
                            </Link>
                            <Link className="hover:!underline" to="/audit-recommendations">
                                <Text variant="gradient">Recommendation Followup</Text>
                            </Link>
                            <Text variant="gradient">Recommendation Details</Text>
                        </Breadcrumbs>
                    </div>

                    <div className="bg-white rounded-2xl border-gray-300 border shadow-sm p-6 flex flex-col gap-5">
                        {/* Title, Status, Created Date */}
                        <div className="flex flex-col">
                            <div className="flex justify-between">
                                <h1 className="text-2xl">
                                    {recommendation.title || "Untitled"}
                                </h1>
                                <div className="bg-amber-100 rounded-4xl p-2">
                                    <p className="flex text-amber-700 gap-1 items-center text-lg">
                                        <IconClock />
                                        {recommendation.status
                                            ? recommendation.status.toLowerCase().replace("_", " ")
                                            : "Unknown"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <p className="flex items-center text-gray-500 gap-1">
                                    <IconCalendar color="gray" />
                                    Created: {formatDate(recommendation.createdAt)}
                                </p>
                                <p className="flex items-center text-gray-500 gap-1">
                                    <IconCalendar />
                                    Updated: {formatDate(recommendation.updatedAt)}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <p className="text-lg text-gray-600">Description</p>
                            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                                {recommendation.description ? (
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: recommendation.description,
                                        }}
                                    />
                                ) : (
                                    <p className="text-gray-400 italic">No description provided.</p>
                                )}
                            </div>
                        </div>

                        {/* Followups */}
                        <div className="flex flex-col gap-4">
                            <h1 className="text-2xl">Update History</h1>
                            {followups.length > 0 ? (
                                followups.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-col bg-gray-50 rounded-xl p-4 shadow-sm gap-5 border border-gray-300"
                                    >
                                        <div className="flex justify-between">
                                            <div className="flex gap-4 items-center">
                                                <div className="bg-white rounded-4xl p-2 w-fit shadow-sm">
                                                    <p className="flex items-center gap-2 text-gray-800">
                                                        <IconUser color="blue" />
                                                        {item.updatedBy || "Unknown"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-lg text-gray-500">
                                                        {formatDate(item.followupDate)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-amber-100 rounded-4xl p-2">
                                                <p className="flex text-amber-700 gap-1 items-center text-sm">
                                                    <IconClock />
                                                    {item.status || "N/A"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Comment */}
                                        {item.comment && (
                                            <div className="flex gap-1 bg-gray-50 rounded-xl p-2 shadow-sm">
                                                <IconMessageCircle color="blue" />
                                                <div className="flex flex-col gap-1 text-lg text-gray-500 w-1/2">
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: item.comment,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Attachment */}
                                        {item.attachmentName && (
                                            <div>
                                                <div className="flex gap-1">
                                                    <IconPaperclip color="blue" />
                                                    <p className="text-gray-500 text-lg">
                                                        Attachments
                                                    </p>
                                                </div>
                                                <div className="bg-white border border-gray-300 rounded-xl p-2 w-fit shadow-sm">
                                                    <p className="flex items-center gap-2 text-gray-500">
                                                        <IconFile color="blue" />
                                                        {item.attachmentName}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 italic">No followups found.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecommendationDetails;
