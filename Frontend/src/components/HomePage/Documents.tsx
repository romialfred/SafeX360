import { Divider, Stack, Text } from "@mantine/core";
import { IconBook, IconDownload, IconFileText, IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { getApprovedDocuments } from "../../services/DocumentService";
import { type DocumentSummary } from "../../types/documents";

const Documents = () => {
    const [documents, setDocuments] = useState<DocumentSummary[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        getApprovedDocuments()
            .then((res) => {
                if (!isMounted) return;
                setDocuments(Array.isArray(res) ? res : []);
            })
            .catch(() => {
                if (!isMounted) return;
                setError("Unable to load approved documents.");
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="flex flex-col gap-4 p-6 h-[930px] bg-white rounded-lg shadow-xl border border-gray-200">
            <div className="flex gap-4 items-center p-4">
                <div className="flex items-center gap-3">
                    <IconBook size={30} className="text-blue-500" />
                    <Text size="xl" className="text-gray-900">Important Documents</Text>
                </div>
                <IconSearch size={25} className="text-blue-500 cursor-pointer" />
            </div>

            {loading ? (
                <Text size="sm" c="gray.6" className="px-4">Loading documents…</Text>
            ) : error ? (
                <Text size="sm" c="red.6" className="px-4">{error}</Text>
            ) : (
                <Stack gap="sm">
                    {documents.length === 0 ? (
                        <Text size="sm" c="gray.6" className="px-4">No approved documents available yet.</Text>
                    ) : (
                        documents.map((item, index) => (
                            <div key={item.id}>
                                <div className="flex justify-between items-center p-4 ">
                                    <div className="flex gap-4 items-center">
                                        <IconFileText size={20} />
                                        <div className="flex flex-col">
                                            <Text size="md">{item.documentName}</Text>
                                            <Text size="sm" c="dimmed">{item.description || "No description provided."}</Text>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Text size="sm" className="px-3 py-1 !text-blue-500">
                                            {(item.fileType || item.extension || "FILE").toUpperCase()}
                                        </Text>
                                        <IconDownload size={25} className="text-blue-500 cursor-pointer" />
                                    </div>
                                </div>
                                {index < documents.length - 1 && <Divider />}
                            </div>
                        ))
                    )}
                </Stack>
            )}
        </div>
    );
};

export default Documents;
