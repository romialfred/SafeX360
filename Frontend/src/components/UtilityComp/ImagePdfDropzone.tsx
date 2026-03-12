import { Group, Modal, Text, Tooltip, useMantineTheme } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { modals } from "@mantine/modals";
import {
    IconCloudUpload,
    IconDownload,
    IconEye,
    IconTrash,
    IconX,
    IconFileText,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { removeMedia } from "../../services/MediaService";
import {
    errorNotification,
    successNotification,
} from "../../utility/NotificationUtility";

const ImagePdfDropzone = ({ title, id, form, withAsterisk, single }: any) => {
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
    const [previewFile, setPreviewFile] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<"image" | "pdf" | null>(null);
    const theme = useMantineTheme();

    const handleRemoveFile = (index: number, fileId: any) => {
        if (fileId) {
            modals.openConfirmModal({
                title: <span className="font-semibold text-2xl">Are you sure?</span>,
                centered: true,
                children: (
                    <span className="text-md">
                        You want to remove this file? This action cannot be undone.
                    </span>
                ),
                labels: { confirm: `Yes, Remove`, cancel: "Cancel" },
                cancelProps: { color: "red", variant: "filled" },
                confirmProps: { color: "green", variant: "filled" },
                closeOnEscape: false,
                closeOnClickOutside: false,
                withCloseButton: false,
                onConfirm: () => {
                    const newFiles = [...uploadedFiles];
                    newFiles.splice(index, 1);
                    setUploadedFiles(newFiles);
                    form.setFieldValue(id, newFiles);
                    removeMedia(fileId)
                        .then(() => {
                            successNotification("File removed successfully");
                        })
                        .catch((err) => {
                            errorNotification(
                                err.response?.data?.errorMessage || "Something went wrong"
                            );
                        });
                },
            });
        } else {
            const newFiles = [...uploadedFiles];
            newFiles.splice(index, 1);
            setUploadedFiles(newFiles);
            form.setFieldValue(id, newFiles);
        }
    };

    const handlePreview = (file: File) => {
        const url = URL.createObjectURL(file);
        if (file.type.startsWith("image")) {
            setPreviewType("image");
        } else if (file.type === "application/pdf") {
            setPreviewType("pdf");
        }
        setPreviewFile(url);
    };

    useEffect(() => {
        const values = form.getInputProps(id)?.value;
        if (values && values.length > 0) {
            setUploadedFiles(values);
        }
    }, [form.getInputProps(id), id]);

    return (
        <div>
            <h3 className="font-medium flex gap-2 text-gray-800 mb-1">{title} {withAsterisk && <Text color='red'>*</Text>}</h3>
            <Text color='red'>{form.getInputProps(id).error}</Text>
            <Dropzone
                onDrop={(files: File[]) => {
                    const newFiles = files.map((file) => ({ file }));
                    const updated = [...uploadedFiles, ...newFiles];
                    setUploadedFiles(updated);
                    form.setFieldValue(id, updated);
                }}
                accept={["image/*", "application/pdf"]}
                maxSize={30 * 1024 * 1024}
                multiple={!single}
            >
                <div style={{ pointerEvents: "none" }}>
                    <Group justify="center">
                        <Dropzone.Accept>
                            <IconDownload
                                size={50}
                                color={theme.colors.blue[6]}
                                stroke={1.5}
                            />
                        </Dropzone.Accept>
                        <Dropzone.Reject>
                            <IconX size={50} color={theme.colors.red[6]} stroke={1.5} />
                        </Dropzone.Reject>
                        <Dropzone.Idle>
                            <IconCloudUpload size={50} stroke={1.5} />
                        </Dropzone.Idle>
                    </Group>
                    <Text ta="center" fw={700} fz="lg" mt="xl">
                        <Dropzone.Accept>Drop image or PDF files here</Dropzone.Accept>
                        <Dropzone.Reject>
                            Only files under 30MB are allowed
                        </Dropzone.Reject>
                        <Dropzone.Idle>Upload images or PDFs</Dropzone.Idle>
                    </Text>
                    <Text ta="center" fz="sm" mt="xs" c="dimmed">
                        Drag & drop to upload. Images and PDFs supported (max 30MB each).
                    </Text>
                </div>
            </Dropzone>

            {uploadedFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedFiles.map((item: any, index: number) => {
                        const file = item.file;
                        const isImage = file.type.startsWith("image");
                        const fileUrl = URL.createObjectURL(file);

                        return (
                            <div
                                key={index}
                                className="relative group border p-4 rounded shadow bg-white"
                            >
                                <div className="w-full h-[200px] flex items-center justify-center">
                                    {isImage ? (
                                        <img
                                            src={fileUrl}
                                            alt={`upload-${index}`}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    ) : (
                                        <IconFileText size={48} />
                                    )}
                                </div>

                                {/* Preview Button */}
                                <Tooltip label="View" withArrow position="top">
                                    <button
                                        type="button"
                                        onClick={() => handlePreview(file)}
                                        className="absolute top-2 right-12 bg-white text-blue-600 p-2 rounded-full shadow hover:scale-105 transition-all opacity-0 group-hover:opacity-100 z-10"
                                    >
                                        <IconEye size={18} />
                                    </button>
                                </Tooltip>

                                {/* Delete Button */}
                                <Tooltip label="Delete" withArrow position="top">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFile(index, item.id)}
                                        className="absolute top-2 right-2 bg-white text-red-600 p-2 rounded-full shadow hover:scale-105 transition-all opacity-0 group-hover:opacity-100 z-10"
                                    >
                                        <IconTrash size={18} />
                                    </button>
                                </Tooltip>

                                <Text ta="center" fz="xs" className="truncate !p-2">
                                    {file.name}
                                </Text>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Preview Modal */}
            <Modal
                opened={!!previewFile}
                onClose={() => {
                    setPreviewFile(null);
                    setPreviewType(null);
                }}
                title="File Preview"
                centered
                size="lg"
                withCloseButton
                overlayProps={{ blur: 3 }}
            >
                {previewFile && previewType === "image" && (
                    <div className="flex justify-center items-center">
                        <img
                            src={previewFile}
                            alt="Preview"
                            className="max-w-full max-h-[75vh] rounded shadow-md object-contain"
                        />
                    </div>
                )}
                {previewFile && previewType === "pdf" && (
                    <iframe
                        src={previewFile}
                        title="PDF Preview"
                        width="100%"
                        height="600px"
                        className="rounded shadow"
                    />
                )}
            </Modal>
        </div>
    );
};

export default ImagePdfDropzone;