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
import { modals } from "@mantine/modals";
import { removeMedia } from "../../services/MediaService";
import { errorNotification, successNotification } from "../../utility/NotificationUtility";

const FileUpdateDropzone = ({ title, id, form }: any) => {
    // `form.errors` est indexé par le CHEMIN du champ, celui-là même que reçoit
    // `id` — on lit donc l'erreur exactement comme le ferait getInputProps.
    const fieldError = form?.errors?.[id];
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
    const [previewFile, setPreviewFile] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<string | null>(null);
    const theme = useMantineTheme();

    const handleRemoveFile = (index: number, fileId: any) => {
        if (fileId) {
            modals.openConfirmModal({
                title: <span className='text-2xl'>Are you sure?</span>,
                centered: true,
                children: (
                    <span className="text-md">
                        You want to remove this file? This action cannot be undone.
                    </span>
                ),
                labels: { confirm: `Yes, Remove`, cancel: 'Cancel' },
                cancelProps: { color: 'red', variant: "filled" },
                confirmProps: { color: 'green', variant: "filled" },
                closeOnEscape: false,
                closeOnClickOutside: false,
                withCloseButton: false,
                onConfirm: () => {
                    const newFiles = [...uploadedFiles];
                    newFiles.splice(index, 1);
                    setUploadedFiles(newFiles);
                    form.setFieldValue(id, newFiles);
                    removeMedia(fileId)
                        .then(() => successNotification("File removed successfully"))
                        .catch((err) =>
                            errorNotification(err?.response?.data?.errorMessage || "Something went wrong")
                        );
                },
            });
        } else {
            const newFiles = [...uploadedFiles];
            newFiles.splice(index, 1);
            setUploadedFiles(newFiles);
            form.setFieldValue(id, newFiles);
        }
    };

    const handleView = (fileObj: any) => {
        const file = fileObj.file;
        const mimeType = file.type || (file.name?.endsWith(".pdf") ? "application/pdf" : "image/*");
        const blob = new Blob([file], { type: mimeType });
        const url = URL.createObjectURL(blob);


        setPreviewFile(url);
        setPreviewType(mimeType);
    };

    const show = (fileObj: any) => {
        const file = fileObj.file;
        const mimeType = file.type || (file.name?.endsWith(".pdf") ? "application/pdf" : "image/*");
        const blob = new Blob([file], { type: mimeType });
        const url = URL.createObjectURL(blob);
        return url;
    };

    useEffect(() => {
        const vals = form.getInputProps(id).value;
        if (vals && vals.length > 0) {
            setUploadedFiles(vals);
        }
    }, [form.getInputProps(id).value]);

    return (
        <div>
            <h3 className="text-gray-800 mb-1">{title}</h3>

            <Dropzone
                onDrop={(files: File[]) => {
                    const formattedFiles = files.map((file: any) => ({ file }));
                    const newFiles = [...uploadedFiles, ...formattedFiles];
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

            {/* ERREUR DE VALIDATION — ce composant ne restituait AUCUNE erreur.
                Un champ de pièce jointe déclaré obligatoire (ex. la preuve d'une
                non-conformité d'audit) échouait donc en silence : le formulaire
                refusait de se soumettre sans rien afficher, puisque le seul
                endroit où le message aurait pu apparaître ne le lisait pas.
                Aligné sur la restitution d'erreur des champs Mantine. */}
            {fieldError && (
                <Text c="red" fz="sm" mt="xs" role="alert">
                    {fieldError}
                </Text>
            )}

            {uploadedFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedFiles.map((fileObj, index) => {
                        const file = fileObj.file;
                        const type = file.type
                        const isImage = type?.startsWith("image/");
                        const isPDF = type?.startsWith("application/pdf");
                        console.log(type, isImage, isPDF, fileObj);

                        return (
                            <div key={index} className="relative group border p-5 rounded shadow bg-white">
                                <div className="w-full h-[200px] flex items-center justify-center">
                                    {isImage ? (
                                        <img
                                            src={show(fileObj)}
                                            alt={file.name}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    ) : isPDF ? (
                                        <div className="text-center flex flex-col items-center justify-center text-gray-600">
                                            <IconFileText size={64} />
                                            <Text fz="sm" mt="xs" lineClamp={1} >
                                                {file.name}
                                            </Text>
                                        </div>
                                    ) : null}
                                </div>

                                {/* View Button */}
                                <Tooltip label="View" withArrow position="top">
                                    <button
                                        type="button"
                                        onClick={() => handleView(fileObj)}
                                        className="absolute top-2 right-12 bg-white text-blue-600 p-2 rounded-full shadow hover:scale-105 transition-all opacity-0 group-hover:opacity-100 z-10"
                                    >
                                        <IconEye size={18} />
                                    </button>
                                </Tooltip>

                                {/* Delete Button */}
                                <Tooltip label="Delete" withArrow position="top">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFile(index, fileObj.id)}
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
                {previewType?.startsWith("application/pdf") && previewFile && (
                    <iframe
                        src={previewFile}
                        title="PDF Preview"
                        width="100%"
                        height="600px"
                        className="border rounded shadow-md"
                        allow="autoplay"
                    />
                )}
            </Modal>
        </div>
    );
};

export default FileUpdateDropzone;