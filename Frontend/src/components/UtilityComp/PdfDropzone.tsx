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

const PdfDropzone = ({ title, id, form, withAsterisk }: any) => {
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
    const [previewFile, setPreviewFile] = useState<string | null>(null);
    const theme = useMantineTheme();

    const handleRemoveFile = (_index: number, fileId: any) => {
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
                    setUploadedFiles([]);
                    form.setFieldValue(id, []);
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
            setUploadedFiles([]);
            form.setFieldValue(id, []);
        }
    };

    const handlePreview = (file: File) => {
        const url = URL.createObjectURL(file);
        setPreviewFile(url);
    };

    useEffect(() => {
        const values = form.getInputProps(id)?.value;
        if (values && values.length > 0) {
            setUploadedFiles(values);
        }
    }, [form.getInputProps(id), id]);

    const uploadedFile = uploadedFiles[0]?.file;

    return (
        <div>
            <h3 className="font-medium flex gap-2 text-gray-800 mb-1">
                {title} {withAsterisk && <Text color="red">*</Text>}
            </h3>
            <Text color="red">{form.getInputProps(id).error}</Text>

            <Dropzone
                onDrop={(files: File[]) => {
                    const newFile = { file: files[0] };
                    setUploadedFiles([newFile]);
                    form.setFieldValue(id, [newFile]);
                }}
                accept={["application/pdf"]}
                maxSize={30 * 1024 * 1024}
                multiple={false}
            >
                <div className="relative w-full h-[200px] flex items-center justify-center flex-col">
                    {!uploadedFile ? (
                        <div >
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
                                <Dropzone.Accept>Drop PDF file here</Dropzone.Accept>
                                <Dropzone.Reject>
                                    Only PDF files under 30MB allowed
                                </Dropzone.Reject>
                                <Dropzone.Idle>Upload a PDF file</Dropzone.Idle>
                            </Text>
                            <Text ta="center" fz="sm" mt="xs" c="dimmed">
                                Drag & drop to upload. Only PDF supported (max 30MB).
                            </Text>
                        </div>
                    ) : (
                        <div className="relative group w-full h-full flex flex-col items-center justify-center" style={{ pointerEvents: "none" }}>
                            <IconFileText size={48} />
                            <Text ta="center" fz="xs" className="truncate mt-2 px-2">
                                {uploadedFile.name}
                            </Text>

                            <div className="absolute top-2 right-2 flex gap-2">
                                <Tooltip label="View" withArrow position="top">
                                    <button style={{ pointerEvents: 'all' }}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePreview(uploadedFile)
                                        }
                                        }
                                        className="bg-white text-blue-600 p-2 rounded-full shadow hover:scale-105 transition-all"
                                    >
                                        <IconEye size={18} />
                                    </button>
                                </Tooltip>
                                <Tooltip label="Delete" withArrow position="top">
                                    <button style={{ pointerEvents: 'all' }}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemoveFile(0, uploadedFiles[0]?.id || null)
                                        }}
                                        className="bg-white text-red-600 p-2 rounded-full shadow hover:scale-105 transition-all"
                                    >
                                        <IconTrash size={18} />
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    )}
                </div>
            </Dropzone>

            {/* Preview Modal */}
            <Modal
                opened={!!previewFile}
                onClose={() => setPreviewFile(null)}
                title="File Preview"
                centered
                size="lg"
                withCloseButton
                overlayProps={{ blur: 3 }}
            >
                {previewFile && (
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

export default PdfDropzone;