import { Button, LoadingOverlay, Modal, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import {
  activateIncidentCategory,
  createIncidentsCategory,
  deactivateIncidentCategory,
  GetAllIncidentCategories,
  updateIncidentCategory,
} from "../../../services/IncidentCategory";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { modals } from '@mantine/modals';
import { Z } from '../../../constants/zIndex';
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import ReferencePanel from '../../NewComponents/Parameters/ReferencePanel';


const IncidentCategoryData = ({ opened, open, close }: any) => {
  // L'écran est utilisable seul (onglet Paramètres) ou piloté par un parent
  // qui fournit son propre bouton de création (écran historique).
  const [selfOpened, selfDisclosure] = useDisclosure(false);
  const controlled = typeof open === 'function' && typeof close === 'function';
  const modalOpened = controlled ? Boolean(opened) : selfOpened;
  const openModal = controlled ? open : selfDisclosure.open;
  const closeModal = controlled ? close : selfDisclosure.close;

  const [edit, setEdit] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const dispatch = useDispatch();
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { name: '' },
    validate: {
      name: (value) => {
        const trimmed = value.trim();
        if (trimmed.length === 0) return "Le nom est obligatoire";

        const wordCount = trimmed.length;
        return wordCount > 50 ? "50 caractères maximum" : null;
      },
    }
  });

  const handleNew = () => {
    setEdit(false);
    setSelectedRow(null);
    form.reset();
    openModal();
  };

  const handleEdit = (rowData: any) => {
    setEdit(true);
    setSelectedRow(rowData);
    form.setValues({ name: rowData.name });
    openModal();
  };

  useEffect(() => {
    setLoading(true);
    GetAllIncidentCategories({})
      .then((res) => {
        const formatted = res.map((item: any) => ({
          ...item,
          status: item.status.toUpperCase(),
        }));
        setData(formatted);
      })
      .catch((err) => {
        errorNotification(err.response?.data?.errorMessage || "Échec du chargement des catégories");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleClose = () => {
    closeModal();
    form.reset();
    setEdit(false);
    setSelectedRow(null);
  };

  const handleStatusChange = (rowData: any) => {
    const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";
    const actionLabel = action === "activate" ? "activer" : "désactiver";
    const actionDone = action === "activate" ? "activée" : "désactivée";

    modals.openConfirmModal({
      title: <span className='text-2xl'>Confirmer l'opération</span>,
      centered: true,
      children: (
        <span className="text-md">
          Voulez-vous <strong>{actionLabel}</strong> la catégorie : <strong>{rowData.name}</strong> ?
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
        const apiCall = action === "activate" ? activateIncidentCategory : deactivateIncidentCategory;
        apiCall(rowData.id)
          .then(() => {
            successNotification(`Catégorie ${actionDone} avec succès`);
            const updatedData = data.map(item =>
              item.id === rowData.id
                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                : item
            );
            setData(updatedData);
          })
          .catch(() => {
            errorNotification(`Échec de l'opération : impossible de ${actionLabel} la catégorie`);
          }
          ).finally(() => {
            dispatch(hideOverlay())
          })
      },
    });
  };

  const handleSubmit = (values: any) => {
    setLoading(true);

    // En modification, refuse une soumission sans changement
    if (edit && values.name.trim() === selectedRow?.name.trim()) {
      form.setErrors({ name: "Modifiez la valeur avant d'enregistrer" });
      setLoading(false);
      return;
    }

    if (edit) {
      const payload = { ...selectedRow, ...values };
      updateIncidentCategory(payload)
        .then(() => {
          successNotification("Catégorie d'incident modifiée avec succès");
          const updatedData = data.map((item) =>
            item.id === selectedRow.id ? { ...item, ...values } : item
          );
          setData(updatedData);
          handleClose();
        })
        .catch((err) => {
          errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
        })
        .finally(() => setLoading(false));
    } else {

      createIncidentsCategory(values)

        .then((res) => {
          successNotification("Catégorie d'incident ajoutée avec succès");
          const newEntry = {
            ...values,
            status: "ACTIVE",
            id: res
          };
          setData(prev => [...prev, newEntry]);
          handleClose();
        })
        .catch((err) => {
          errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
        })
        .finally(() => {
          setLoading(false)

        })
    }
  };

  return (
    <>
      <ReferencePanel<any>
        newLabel={controlled ? undefined : "Nouvelle catégorie d'incident"}
        onNew={controlled ? undefined : handleNew}
        columns={[
          { key: 'name', label: 'Nom' },
        ]}
        rows={data}
        renderRow={(row) => ({
          name: row.name,
        })}
        getRowKey={(row, index) => row.id ?? index}
        searchText={(row) => row.name ?? ''}
        searchPlaceholder="Rechercher une catégorie…"
        loading={loading}
        emptyTitle="Aucune catégorie d'incident"
        emptyHint="Les catégories structurent la classification de premier niveau des événements HSE."
        statusOf={(row) => row.status}
        onToggleStatus={handleStatusChange}
        onEdit={handleEdit}
      />

      {/* Modale de création / modification */}
      <Modal opened={modalOpened} size="lg" onClose={handleClose} centered title={
        <h1 className="text-lg text-blue-500">
          {edit ? "Modifier la catégorie d'incident" : "Créer une catégorie d'incident"}
        </h1>
      }>
        <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 2 }} />
        <form className='flex flex-col gap-4' onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Nom" withAsterisk placeholder='Saisissez le nom' {...form.getInputProps('name')} />
          <Button type="submit" mt="md" variant="gradient">{edit ? "Modifier" : "Ajouter"} </Button>
        </form>
      </Modal>
    </>
  );
}

export default IncidentCategoryData;
