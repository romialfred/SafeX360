import { Button, Modal, MultiSelect } from "@mantine/core";
import { useState } from "react";
import { IconCheck } from "@tabler/icons-react";

const BodyPartSelect = ({ bodyParts, form, id }: any) => {
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);

    const handleConfirm = () => {
        form.setFieldValue(id, selectedImages);
        setImageModalOpen(false);
    };

    const toggleSelection = (name: string) => {
        setSelectedImages((prev) =>
            prev.includes(name)
                ? prev.filter((n) => n !== name)
                : [...prev, name]
        );
    };

    return (
        <div>
            <MultiSelect
                label="Body Parts Affected"
                placeholder="Select body parts"
                data={bodyParts}
                readOnly
                onClick={() => setImageModalOpen(true)}
                {...form.getInputProps(id)}
            />

            <Modal
                centered
                opened={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                title="Select Body Parts"
                size="70%"
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {bodyParts.map((item: any) => {
                        const isSelected = selectedImages.includes(item.value);
                        return (
                            <div
                                key={item.value}
                                onClick={() => toggleSelection(item.value)}
                                className={`relative cursor-pointer rounded-lg shadow transition-all flex flex-col gap-5 p-5 border-2 ${isSelected ? "border-blue-600 ring-2 ring-blue-300" : "border-gray-300"
                                    }`}
                            >
                                <img
                                    src={`data:image/png;base64,${item.file}`}
                                    alt={item.name}
                                    className={`w-60 h-30  object-contain bg-white ${isSelected ? "opacity-90" : "opacity-70"
                                        }`}
                                />
                                <div className=" bg-white bg-opacity-80 text-lg mx-auto font-medium">
                                    {item.name}
                                </div>
                                {isSelected && (
                                    <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-1 shadow">
                                        <IconCheck size={16} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 text-right">
                    <Button onClick={handleConfirm} variant="gradient">Confirm</Button>
                </div>
            </Modal>
        </div>
    );
};

export default BodyPartSelect;