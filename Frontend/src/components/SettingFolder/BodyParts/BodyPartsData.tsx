import { ActionIcon, Button, FileInput, LoadingOverlay, Modal, TextInput, Tooltip } from "@mantine/core";
import { IconEye, IconPhotoOff } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { useDispatch } from "react-redux";
import { modals } from "@mantine/modals";
import { Z } from '../../../constants/zIndex';
import { activateBodyParts, createBodyParts, deactivateBodyParts, GetAllBodyParts, updateBodyParts } from "../../../services/BodyPartsService";
import { base64ToFile, getBase64 } from "../../../utility/DocumentUtility";
import ReferencePanel from '../../NewComponents/Parameters/ReferencePanel';


const BodyPartsData = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const [edit, setEdit] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();


    const form = useForm({
        initialValues: {
            name: '',
            file: null
        },
        validate: {
            name: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Le nom est obligatoire";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "50 caractères maximum" : null;
            },
            file: (value) => (!edit && !value ? "L'image est obligatoire" : null)
        }
    });

    useEffect(() => {

        GetAllBodyParts({})
            .then((res) => {

                const formatted = res.map((item: any) => ({
                    ...item,

                }));
                setData(formatted);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Échec du chargement des parties du corps");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (values: any) => {
        setLoading(true);
        // En édition sans nouveau fichier (image effacée), conserver l'image existante :
        // getBase64(null) renvoie null et .split planterait silencieusement (échec save).
        const filePart: any = values.file
            ? ((await getBase64(values.file)) as string)?.split(',')[1] ?? null
            : (edit ? selectedRow?.file : null);
        if (edit) {
            // Vérifie qu'au moins un champ a changé
            const changed = Object.keys({ ...values, file: filePart }).some((key) => {
                const newValue = values[key]?.trim?.() ?? values[key];
                const oldValue = selectedRow[key]?.trim?.() ?? selectedRow[key];
                return newValue !== oldValue;
            });

            if (!changed) {
                form.setErrors({ name: "Modifiez au moins un champ avant d'enregistrer" });
                setLoading(false);
                return;
            }

            const payload = { ...selectedRow, ...values, file: filePart };

            updateBodyParts(payload)
                .then(() => {
                    successNotification("Partie du corps mise à jour");
                    const updatedData = data.map((item) =>
                        item.id === selectedRow.id
                            ? {
                                ...payload
                            }
                            : item
                    );
                    setData(updatedData);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
                })
                .finally(() => setLoading(false));
        } else {

            createBodyParts({ ...values, file: filePart })
                .then((res) => {
                    successNotification("Partie du corps ajoutée");


                    const newEntry = {
                        ...values,
                        status: "ACTIVE",
                        id: res,
                        file: filePart

                    };
                    setData(prev => [...prev, newEntry]);
                    handleClose();
                })
                .catch((err) => {
                    errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
                })
                .finally(() => {
                    setLoading(false)
                });
        }
    };

    const handleNew = () => {
        setEdit(false);
        setSelectedRow(null);
        form.reset();
        open();
    };

    const handleEdit = (rowData: any) => {
        setEdit(true);
        setSelectedRow(rowData);
        form.setValues({
            name: rowData.name,
            file: base64ToFile(rowData.file, rowData.name + ".png", "image/png")

        });
        open();
    };

    const handleClose = () => {
        close();
        form.reset();
        setEdit(false);
        setSelectedRow(null);
    };

    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";
        const actionLabel = action === "activate" ? "activer" : "désactiver";

        modals.openConfirmModal({
            title: <span className='text-2xl'>Confirmer l'action</span>,
            centered: true,
            children: (
                <span className="text-md">
                    Voulez-vous <strong>{actionLabel}</strong> la partie du corps : <strong>{rowData.name}</strong> ?
                </span>
            ),
            labels: { confirm: `Oui, ${actionLabel}`, cancel: 'Annuler' },
            cancelProps: { color: 'red', variant: "filled" },
            confirmProps: { color: action === 'activate' ? 'green' : 'green', variant: "filled" },

            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay())
                const apiCall = action === "activate" ? activateBodyParts : deactivateBodyParts;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(action === "activate" ? "Partie du corps activée" : "Partie du corps désactivée");
                        const updatedData = data.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setData(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Impossible de ${actionLabel} la partie du corps`);
                    }
                    ).finally(() => {
                        dispatch(hideOverlay())
                    })
            },
        });
    };

    /** Ouvre l'image (base64) dans un nouvel onglet — logique d'aperçu d'origine. */
    const openImagePreview = (base64: string) => {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });

        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
    };

    const thumbnail = (rowData: any) => {
        const base64 = rowData.file;

        if (!base64) {
            return (
                <span
                    className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-400"
                    title="Aucune image"
                >
                    <IconPhotoOff size={14} stroke={1.6} />
                </span>
            );
        }

        return (
            <Tooltip label="Voir l'image" withArrow openDelay={300}>
                <button
                    type="button"
                    aria-label={`Voir l'image de ${rowData.name}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        openImagePreview(base64);
                    }}
                    className="block rounded ring-1 ring-slate-200 hover:ring-teal-400 transition-all"
                >
                    <img
                        src={`data:image/png;base64,${base64}`}
                        alt={rowData.name}
                        className="w-7 h-7 rounded object-cover"
                    />
                </button>
            </Tooltip>
        );
    };

    return (
        <>
            <ReferencePanel<any>
                newLabel="Nouvelle partie du corps"
                onNew={handleNew}
                columns={[
                    { key: 'preview', label: 'Aperçu', className: 'w-[80px]' },
                    { key: 'name', label: 'Nom' },
                ]}
                rows={data}
                renderRow={(row) => ({
                    preview: thumbnail(row),
                    name: <span className="font-medium text-slate-900">{row.name}</span>,
                })}
                getRowKey={(row, index) => row.id ?? index}
                searchText={(row) => row.name ?? ''}
                searchPlaceholder="Rechercher une partie du corps…"
                loading={loading}
                emptyTitle="Aucune partie du corps"
                emptyHint="Créez les zones anatomiques sélectionnables lors de la déclaration d'une blessure."
                statusOf={(row) => row.status}
                onToggleStatus={handleStatusChange}
                onEdit={handleEdit}
            />

            {/* Modale de création / modification */}
            <Modal
                opened={opened}
                size="lg"
                onClose={handleClose}
                centered
                title={
                    <h1 className="text-lg text-blue-500">
                        {edit ? 'Modifier la partie du corps' : 'Créer une partie du corps'}
                    </h1>
                }
            >
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: 'sm', blur: 2 }} />

                <form className="flex flex-col gap-4" onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Nom" withAsterisk placeholder="Saisissez le nom" {...form.getInputProps('name')} />

                    <FileInput
                        label="Image"
                        placeholder="Sélectionnez une image"
                        accept="image/*"
                        withAsterisk
                        {...form.getInputProps('file')}
                        rightSection={
                            form.values.file ? (
                                <Tooltip label="Voir l'image">
                                    <ActionIcon
                                        size="lg"
                                        variant="light"
                                        onClick={() => {
                                            const file: any = form.values.file;
                                            const fileUrl = URL.createObjectURL(file);
                                            window.open(fileUrl, '_blank');
                                        }}
                                    >
                                        <IconEye style={{ height: "90%", width: "90%" }} />
                                    </ActionIcon></Tooltip>
                            ) : null
                        }
                    />

                    <Button type="submit" mt="md" variant="gradient">
                        {edit ? 'Mettre à jour' : 'Ajouter'}
                    </Button>
                </form>
            </Modal>
        </>
    )
}

export default BodyPartsData
