import {
    Group,
    Modal,
    Text,
    Tooltip,
    useMantineTheme,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import {
    IconCloudUpload,
    IconDownload,
    IconEye,
    IconTrash,
    IconX,
    IconFileText,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

const FileDropzone = ({ title, id, form }: any) => {
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [previewFile, setPreviewFile] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<string | null>(null);
    const theme = useMantineTheme();

    const handleRemoveFile = (index: number) => {
        const newFiles = [...uploadedFiles];
        newFiles.splice(index, 1);
        setUploadedFiles(newFiles);
        form.setFieldValue(id, newFiles);
    };

    useEffect(() => {
        if (form.values[id] && form.values[id].length > 0) {
            setUploadedFiles(form.values[id]);
        }
    }, [form.values[id]]);

    const handleView = (file: File) => {
        const url = URL.createObjectURL(file);
        setPreviewFile(url);
        setPreviewType(file.type);
    };

    return (
        <div>
            <h3 className="text-gray-800 mb-1">{title}</h3>

            <Dropzone
                onDrop={(files: File[]) => {
                    const newFiles = [...uploadedFiles, ...files];
                    setUploadedFiles(newFiles);
                    form.setFieldValue(id, newFiles);
                }}
                accept={["image/*", "application/pdf"]}
                maxSize={30 * 1024 * 1024}
                multiple
            >
                <div style={{ pointerEvents: "none" }}>
                    <Group justify="center">
                        <Dropzone.Accept>
                            <IconDownload size={50} color={theme.colors.blue[6]} stroke={1.5} />
                        </Dropzone.Accept>
                        <Dropzone.Reject>
                            <IconX size={50} color={theme.colors.red[6]} stroke={1.5} />
                        </Dropzone.Reject>
                        <Dropzone.Idle>
                            <IconCloudUpload size={50} stroke={1.5} />
                        </Dropzone.Idle>
                    </Group>
                    <Text ta="center" fz="lg" mt="xs">
                        <Dropzone.Accept>Drop PDF or image files here</Dropzone.Accept>
                        <Dropzone.Reject>Only PDF/Image files under 30MB</Dropzone.Reject>
                        <Dropzone.Idle>Upload PDF or image files</Dropzone.Idle>
                    </Text>
                    <Text ta="center" fz="sm" mt="xs" c="dimmed">
                        Drag & drop PDFs or images. You can upload multiple files under 30MB each.
                    </Text>
                </div>
            </Dropzone>

            {uploadedFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedFiles.map((file, index) => {
                        const isImage = file?.type?.startsWith("image/");
                        const isPDF = file.type === "application/pdf";

                        return (
                            <div key={index} className="relative group border p-5 rounded shadow bg-white">
                                <div className="w-full h-[200px] flex items-center justify-center">
                                    {isImage ? (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    ) : isPDF ? (
                                        <div className="text-center flex flex-col items-center justify-center text-gray-600">
                                            <IconFileText size={64} />
                                            <Text fz="sm" mt="xs" className="truncate max-w-full">
                                                {file.name}
                                            </Text>
                                        </div>
                                    ) : null}
                                </div>

                                {/* View Button */}
                                <Tooltip label="View" withArrow position="top">
                                    <button
                                        type="button"
                                        onClick={() => handleView(file)}
                                        className="absolute top-2 right-12 bg-white text-blue-600 p-2 rounded-full shadow hover:scale-105 transition-all opacity-0 group-hover:opacity-100 z-10"
                                    >
                                        <IconEye size={18} />
                                    </button>
                                </Tooltip>

                                {/* Delete Button */}
                                <Tooltip label="Delete" withArrow position="top">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFile(index)}
                                        className="absolute top-2 right-2 bg-white text-red-600 p-2 rounded-full shadow hover:scale-105 transition-all opacity-0 group-hover:opacity-100 z-10"
                                    >
                                        <IconTrash size={18} />
                                    </button>
                                </Tooltip>
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
                {previewType?.startsWith("image/") && (
                    <div className="flex justify-center items-center">
                        <img
                            src={previewFile!}
                            alt="Preview"
                            className="max-w-full max-h-[75vh] rounded shadow-md object-contain"
                        />
                    </div>
                )}
                {previewType === "application/pdf" && (
                    <iframe
                        src={previewFile!}
                        title="PDF Preview"
                        width="100%"
                        height="600px"
                        className="border rounded shadow-md"
                    />
                )}
            </Modal>
        </div>
    );
};

export default FileDropzone;