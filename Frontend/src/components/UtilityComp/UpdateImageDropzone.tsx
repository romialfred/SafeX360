import { Group, Modal, Text, Tooltip, useMantineTheme } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { modals } from "@mantine/modals";
import { IconCloudUpload, IconDownload, IconEye, IconTrash, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { removeMedia } from "../../services/MediaService";
import { errorNotification, successNotification } from "../../utility/NotificationUtility";

const UpdateImageDropzone = ({ title, id, form }: any) => {

    const [uploadedImages, setUploadedImages] = useState<File[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const theme = useMantineTheme();

    const handleRemoveImage = (index: number, id: any) => {
        if (id) {
            modals.openConfirmModal({
                title: <span className='font-semibold text-2xl'>Are you sure?</span>,
                centered: true,
                children: (
                    <span className="text-md">
                        You want to remove this image? This action cannot be undone.
                    </span>
                ),
                labels: { confirm: `Yes, Remove`, cancel: 'Cancel' },
                cancelProps: { color: 'red', variant: "filled" },
                confirmProps: { color: 'green', variant: "filled" },

                closeOnEscape: false,
                closeOnClickOutside: false,
                withCloseButton: false,
                onConfirm: () => {
                    const newImages = [...uploadedImages];
                    newImages.splice(index, 1);
                    setUploadedImages(newImages);
                    removeMedia(id)
                        .then((_res) => {
                            successNotification("Image removed successfully");
                            form.setFieldValue(id, newImages);
                        }
                        ).catch((err) => {
                            errorNotification(err.response?.data?.errorMessage || "Something went wrong");
                        }
                        )
                },
            });
        }
        else {
            const newImages = [...uploadedImages];
            newImages.splice(index, 1);
            setUploadedImages(newImages);
        }

    };

    useEffect(() => {
        if (form.values[id] && form.values[id].length > 0) {
            setUploadedImages(form.values[id]);
        }
    }, [form.values[id]]);
    return (
        <div>
            <h3 className="font-medium text-gray-800 mb-1">{title}</h3>

            <Dropzone
                onDrop={(files: any) => {
                    // setUploadedImages([...uploadedImages, ...files])
                    form.setFieldValue(id, [...uploadedImages, ...(files.map((file: any) => ({ file })))])
                }
                }
                accept={['image/*']}
                maxSize={30 * 1024 * 1024}
                multiple
            >
                <div style={{ pointerEvents: 'none' }}>
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
                    <Text ta="center" fw={700} fz="lg" mt="xl">
                        <Dropzone.Accept>Drop image files here</Dropzone.Accept>
                        <Dropzone.Reject>Only image files under 30MB are allowed</Dropzone.Reject>
                        <Dropzone.Idle>Upload images</Dropzone.Idle>
                    </Text>
                    <Text ta="center" fz="sm" mt="xs" c="dimmed">
                        Drag & drop images here to upload. You can upload multiple images under 30MB each.
                    </Text>
                </div>
            </Dropzone>

            {uploadedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedImages.map((image: any, index: any) => (
                        <div key={index} className="relative group border p-5 rounded shadow bg-white">
                            <div className="w-full h-[200px] flex items-center justify-center">
                                <img
                                    src={URL.createObjectURL(image.file)}
                                    alt={`upload-${index}`}
                                    className="max-h-full max-w-full object-contain"
                                />
                            </div>

                            {/* Eye Button */}
                            <Tooltip label="View" withArrow position="top">
                                <button
                                    onClick={() => setPreviewImage(URL.createObjectURL(image.file))}
                                    className="absolute top-2 right-12 bg-white text-blue-600 p-2 rounded-full shadow hover:scale-105 transition-all opacity-0 group-hover:opacity-100 z-10"
                                >
                                    <IconEye size={18} />
                                </button>
                            </Tooltip>

                            {/* Delete Button */}
                            <Tooltip label="Delete" withArrow position="top">
                                <button
                                    onClick={() => handleRemoveImage(index, image.id)}
                                    className="absolute top-2 right-2 bg-white text-red-600 p-2 rounded-full shadow hover:scale-105 transition-all opacity-0 group-hover:opacity-100 z-10"
                                >
                                    <IconTrash size={18} />
                                </button>
                            </Tooltip>

                            <Text ta="center" fz="xs" className="truncate !p-2">
                                {image.file?.name}
                            </Text>
                        </div>
                    ))}
                </div>
            )}

            {/* Image preview modal */}
            <Modal
                opened={!!previewImage}
                onClose={() => setPreviewImage(null)}
                title="Image Preview"
                centered
                size="lg"
                withCloseButton
                overlayProps={{ blur: 3 }}
            >
                {previewImage && (
                    <div className="flex justify-center items-center">
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[75vh] rounded shadow-md object-contain"
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UpdateImageDropzone;
