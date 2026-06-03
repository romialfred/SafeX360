import { Badge, Button, Group, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconDownload, IconEye, IconFileAnalytics, IconFileSpreadsheet, IconFileText } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useCallback, useMemo, useState, type JSX } from "react";
import { getLatestMediaByDocumentId, type MediaDTO } from "../../services/DocumentVersionService";
import { type DocumentSummary } from "../../types/documents";
import { handleDownload, handlePreview } from "../../utility/DocumentUtility";

const fileTypeIconMap: Record<string, JSX.Element> = {
    PDF: <IconFileText size={26} />,
    DOC: <IconFileAnalytics size={26} />,
    DOCX: <IconFileAnalytics size={26} />,
    XLS: <IconFileSpreadsheet size={26} />,
    XLSX: <IconFileSpreadsheet size={26} />,
};

const fileTypeColorMap: Record<string, string> = {
    PDF: "red",
    DOC: "blue",
    DOCX: "blue",
    XLS: "green",
    XLSX: "green",
};

const colorClassMap: Record<string, string> = {
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    indigo: "bg-indigo-50 text-indigo-700",
};


const deriveDateLabel = (doc: DocumentSummary) => {
    const dateValue = doc.reviewDate || doc.updatedAt || doc.expiryDate || doc.createdAt;
    if (!dateValue) return "No review date";
    return dayjs(dateValue).isValid() ? dayjs(dateValue).format("DD MMM YYYY") : String(dateValue);
};

const ComplianceDocumentCard = ({ doc }: { doc: DocumentSummary }) => {
    const type = (doc.fileType || doc.mimeType || doc.extension || "").toUpperCase();
    const icon = fileTypeIconMap[type] ?? <IconFileText size={26} />;
    const accentColor = fileTypeColorMap[type] ?? "indigo";
    const accentClass = colorClassMap[accentColor] ?? colorClassMap.indigo;
    const categoryLabel = doc.category || (doc as any).categoryName || doc.department || doc.accessLevel || "General";
    const [loading, setLoading] = useState(false);
    const dateLabel = deriveDateLabel(doc);
    // const sizeLabel = deriveFileSizeLabel(doc);

    const isDownloadable = useMemo(() => {
        const explicitFlags = [doc.allowDownload, doc.downloadAllowed, doc.canDownload];
        for (const flag of explicitFlags) {
            if (typeof flag === "boolean") return flag;
        }
        const collections = [doc.allowedActions, doc.actions, doc.availableActions];
        const actions = new Set<string>();
        collections
            .filter(Array.isArray)
            .forEach((arr: any[]) => arr.forEach((item) => typeof item === "string" && actions.add(item.toUpperCase())));
        return actions.has("DOWNLOAD") || actions.has("DOWNLOAD_LATEST");
    }, [doc]);

    const isViewable = useMemo(() => {
        const explicitFlags = [doc.viewAllowed, doc.canView];
        for (const flag of explicitFlags) {
            if (typeof flag === "boolean") return flag;
        }
        const permissionsObj = doc.permissions;
        if (permissionsObj && typeof permissionsObj === "object") {
            const keys = ["viewAllowed", "canView", "viewPermission", "previewAllowed", "previewPermission"];
            for (const key of keys) {
                if (typeof permissionsObj[key] === "boolean") return permissionsObj[key];
            }
        }
        const collections = [doc.allowedActions, doc.actions, doc.availableActions];
        const actions = new Set<string>();
        collections
            .filter(Array.isArray)
            .forEach((arr: any[]) => arr.forEach((item) => typeof item === "string" && actions.add(item.toUpperCase())));
        return actions.has("VIEW") || actions.has("PREVIEW") || actions.has("READ") || actions.has("OPEN");
    }, [doc]);

    const normalizeMedia = (media: MediaDTO | null | undefined) => {
        if (!media) return media;
        let { type: mediaType } = media;
        if (!mediaType || !mediaType.startsWith("data:")) {
            mediaType = mediaType ? `data:${mediaType.includes(";") ? mediaType : `${mediaType};base64`}` : "data:application/octet-stream;base64";
        }
        return { ...media, type: mediaType };
    };

    const handleAccess = useCallback(async () => {
        if (!doc.id) {
            notifications.show({ color: "red", message: "Document identifier missing." });
            return;
        }
        if (!isDownloadable && !isViewable) {
            notifications.show({ color: "red", message: "You do not have permission to access this document." });
            return;
        }

        setLoading(true);
        try {
            const media = await getLatestMediaByDocumentId(doc.id);
            if (!media) {
                notifications.show({ color: "red", message: "Latest document version is unavailable." });
                return;
            }

            const normalized = normalizeMedia(media) as MediaDTO;

            if (isDownloadable) {
                handleDownload(normalized);
            } else if (isViewable) {
                handlePreview(normalized);
            }
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 404) {
                notifications.show({ color: "red", message: "No versions available for this document." });
                return;
            }
            notifications.show({ color: "red", message: err?.response?.data?.errorMessage || "Unable to access document." });
        } finally {
            setLoading(false);
        }
    }, [doc.id, isDownloadable, isViewable]);

    const actionLabel = isDownloadable ? "Download" : isViewable ? "View" : "Restricted";
    const actionIcon = isDownloadable ? <IconDownload size={16} /> : <IconEye size={16} />;
    const isActionDisabled = (!isDownloadable && !isViewable) || loading;
    return (
        <div className="bg-white rounded-2xl hover:-translate-y-1 transition-all duration-300 ease-in-out p-4 border border-gray-200 flex flex-col gap-4">
            <Group justify="space-between" align="flex-start">
                <div className={`p-2 rounded-md ${accentClass}`}>{icon}</div>
                <Stack gap={6} align="flex-end">
                    {/* <Text size="sm" c="gray.6">{sizeLabel}</Text> */}
                    <Badge color={accentColor} variant="light" radius="md">{categoryLabel}</Badge>
                </Stack>
            </Group>

            <Stack gap={6}>
                <Text size="lg" c="gray.8" lineClamp={2}>
                    {doc.documentName}
                </Text>
                <Text size="sm" c="gray.6" lineClamp={3}>
                    {doc.description || "No description provided."}
                </Text>
            </Stack>

            <Stack gap={4} className="text-sm text-gray-600">
                {/* <Text><strong>Status:</strong> {doc.status || "Approved"}</Text> */}
                <Text><strong>Review date:</strong> {dateLabel}</Text>
                <Text><strong>Type:</strong> {type || "File"}</Text>
            </Stack>

            <Button
                size="xs"
                fullWidth
                color={isDownloadable ? accentColor : "blue"}
                variant="light"
                leftSection={actionIcon}
                onClick={handleAccess}
                disabled={isActionDisabled}
                loading={loading}
            >
                {actionLabel}
            </Button>
        </div>
    );
};

export default ComplianceDocumentCard;
