import { Button, Card, Progress, Select, NumberInput, Text } from "@mantine/core";
import { IconClock, IconFileText, IconAlertCircle, IconUser, IconCalendar, IconBulb, IconPencilCheck } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FileDropzone from "../../UtilityComp/FileDropzone";
import { useForm } from "@mantine/form";
import { formatDateShort } from "../../../utility/DateFormats";
import { addActionProcess, getAllActionProcessByActionId } from "../../../services/ActionProcessService";
import { convertFileToBase64DTO } from "../../../utility/DocumentUtility";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { getActionById } from "../../../services/CorrectiveActionService";
import TextEditor from "../../UtilityComp/TextEditor";
import SafeHtml from "../../UtilityComp/SafeHtml";
import { isValidRichText } from "../../../utility/OtherUtilities";
import PageHeader from "../../UtilityComp/PageHeader";
import { CA_STATUS_OPTIONS, caStatusConfig, SERIF } from "./correctiveLabels";

const UpdateCorrectiveAction = () => {
  const { id } = useParams();
  const [actionHistory, setActionHistory] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      status: '',
      description: '',
      progress: 0,
      docs: [] as any[]
    },
    validate: {
      status: (value) => (value?.trim().length > 0 ? null : 'Le statut est requis'),
      progress: (value) => (value !== undefined && value !== null ? null : 'La progression est requise'),
      description: (value) => (isValidRichText(value) ? null : 'La description est requise')
    }
  });

  // Suivi des valeurs initiales et précédentes (synchronisation + retour arrière)
  const [initialStatus, setInitialStatus] = useState<string>('');
  const [initialProgress, setInitialProgress] = useState<number>(0);
  const prevProgressRef = useRef<number>(0);
  const prevStatusRef = useRef<string>('');

  // Synchronisation progression ↔ statut avec retour arrière
  useEffect(() => {
    const progress = Number(form.values.progress ?? 0);
    const status = String(form.values.status || '').toUpperCase();

    // Progression à 100 % → statut Réalisée forcé
    if (progress >= 100 && status !== 'COMPLETED') {
      form.setFieldValue('status', 'COMPLETED');
    }

    // Retour sous 100 % → retour au statut initial
    if (prevProgressRef.current === 100 && progress < 100 && initialStatus) {
      form.setFieldValue('status', initialStatus);
    }

    prevProgressRef.current = progress;
  }, [form.values.progress, initialStatus]);

  useEffect(() => {
    const progress = Number(form.values.progress ?? 0);
    const status = String(form.values.status || '').toUpperCase();

    // Statut Réalisée → progression 100 % forcée
    if (status === 'COMPLETED' && progress < 100) {
      form.setFieldValue('progress', 100);
    }

    // Statut quitté de Réalisée → retour à la progression initiale
    if (prevStatusRef.current === 'COMPLETED' && status !== 'COMPLETED') {
      form.setFieldValue('progress', initialProgress);
    }

    prevStatusRef.current = status;
  }, [form.values.status, initialProgress]);

  const statusUpper = String(selectedRow?.status || '').toUpperCase();
  const isCompleted = (selectedRow?.progress ?? 0) >= 100 || statusUpper === 'COMPLETED';
  const isCancelled = statusUpper === 'CANCELLED';
  const isPending = statusUpper === 'PENDING';
  const cannotUpdate = isCompleted || isCancelled || isPending;

  useEffect(() => {
    if (!id) return;
    getActionById(id)
      .then((res) => {
        setSelectedRow(res);
        form.setValues({
          status: res.status,
          description: res.description,
          progress: res.progress,
          docs: Array.isArray(res.docs) ? res.docs : []
        });
        setInitialStatus(res.status || '');
        setInitialProgress(Number(res.progress ?? 0));
        prevStatusRef.current = String(res.status || '').toUpperCase();
        prevProgressRef.current = Number(res.progress ?? 0);
      }).catch((err) => {
        errorNotification(err.response?.data?.errorMessage || "Échec du chargement de l'action");
      });

    getAllActionProcessByActionId(id)
      .then((res) => setActionHistory(res))
      .catch((err) => {
        errorNotification(err.response?.data?.errorMessage || "Échec du chargement de l'historique");
      });
  }, [id]);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    dispatch(showOverlay());
    const docs = await Promise.all(values.docs?.map(convertFileToBase64DTO));
    // Cohérence progression / statut garantie aussi côté payload
    const sanitizedValues = { ...values } as any;
    const numericProgress = Number(sanitizedValues.progress ?? 0);
    if (numericProgress >= 100) {
      sanitizedValues.progress = 100;
      sanitizedValues.status = 'COMPLETED';
    }
    if (String(sanitizedValues.status || '').toUpperCase() === 'COMPLETED') {
      sanitizedValues.progress = 100;
    }

    const payload = { ...sanitizedValues, correctiveActionId: id, docs };
    addActionProcess(payload)
      .then((_res) => {
        successNotification("Plan d'action mis à jour");
        navigate("/corrective");
      })
      .catch((err) => {
        errorNotification(err.response?.data?.errorMessage || "La mise à jour du plan d'action a échoué");
      })
      .finally(() => {
        setSubmitting(false);
        dispatch(hideOverlay());
      });
  };

  const currentStatusCfg = caStatusConfig(selectedRow?.status);

  return (
    <div className="p-5 space-y-4 w-full">
      <PageHeader
        breadcrumbs={[
          { label: 'Accueil', to: '/' },
          { label: 'Actions correctives', to: '/corrective' },
          { label: "Mise à jour du plan d'action" },
        ]}
        icon={<IconPencilCheck size={22} stroke={2} />}
        iconColor="orange"
        title="Mettre à jour le plan d'action"
        subtitle="Progression, statut et preuves des actions menées"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Colonne principale : contexte + formulaire */}
        <div className='flex self-start flex-col lg:col-span-2 gap-3 bg-white p-4 rounded-xl border border-slate-200'>
          {/* Contexte du plan d'action */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <IconFileText className="w-5 h-5 text-slate-600" aria-hidden="true" />
              <div>
                <p className="text-slate-800" style={{ fontFamily: SERIF, fontSize: '14px', fontWeight: 600 }}>Contexte du plan d'action</p>
                <p className="text-[11.5px] text-slate-500">Source, responsable et état d'avancement actuel.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <span className="p-1.5 rounded-md bg-sky-50 text-sky-600"><IconAlertCircle size={16} aria-hidden="true" /></span>
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider text-slate-500">Source</p>
                  <p className="text-[13px] text-slate-900">{selectedRow?.incidentTitle || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="p-1.5 rounded-md bg-violet-50 text-violet-600"><IconUser size={16} aria-hidden="true" /></span>
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider text-slate-500">Responsable</p>
                  <p className="text-[13px] text-slate-900">{selectedRow?.assignedEmployeeName || '—'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="p-1.5 rounded-md bg-cyan-50 text-cyan-600"><IconFileText size={16} aria-hidden="true" /></span>
              <div className="w-full">
                <p className="text-[10.5px] uppercase tracking-wider text-slate-500">Plan d'action</p>
                <p className="text-[13px] text-slate-900">{selectedRow?.actionName || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-md border border-slate-200 p-3">
                <p className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1"><IconCalendar size={14} aria-hidden="true" /> Échéance</p>
                <p className="text-[13px] text-slate-900">{selectedRow?.deadline ? formatDateShort(selectedRow.deadline) : '—'}</p>
              </div>
              <div className="rounded-md border border-slate-200 p-3">
                <p className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1">Progression actuelle</p>
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-slate-900 tabular-nums">{selectedRow?.progress ?? 0}%</p>
                </div>
                <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${selectedRow?.progress ?? 0}%` }} />
                </div>
              </div>
              <div className="rounded-md border border-slate-200 p-3">
                <p className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1">Statut actuel</p>
                <span className={`inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border ${currentStatusCfg.chip}`}>
                  {currentStatusCfg.label}
                </span>
              </div>
            </div>

            {selectedRow?.description && (
              <div className="rounded-md border border-slate-200 p-3">
                <p className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1">Description</p>
                <SafeHtml html={selectedRow?.description} className="text-slate-700 text-[12.5px]" />
              </div>
            )}
          </div>

          <hr className="my-2 border-t border-slate-200" />

          {/* Saisie de la mise à jour */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <IconClock className="w-5 h-5 text-slate-600" aria-hidden="true" />
              <div>
                <p className="text-slate-800" style={{ fontFamily: SERIF, fontSize: '14px', fontWeight: 600 }}>Mise à jour du statut</p>
                <p className="text-[11.5px] text-slate-500">Actualisez la progression et documentez les actions menées.</p>
              </div>
            </div>
          </div>

          {cannotUpdate ? (
            <Card shadow="xs" padding="md" radius="md" withBorder className={`${isCompleted ? 'bg-emerald-50 border-emerald-200' : isCancelled ? 'bg-rose-50 border-rose-200' : 'bg-violet-50 border-violet-200'}`}>
              {isCompleted && (<Text size="sm" c="green">Cette action est déjà réalisée (100 % ou statut Réalisée). Aucune mise à jour possible.</Text>)}
              {isPending && (<Text size="sm" c="violet">Cette action est en attente de validation. Les mises à jour seront possibles après approbation.</Text>)}
              {isCancelled && (<Text size="sm" c="red">Cette action a été annulée. Aucune mise à jour possible.</Text>)}
            </Card>
          ) : (
            <form className='space-y-3' onSubmit={form.onSubmit(handleSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <NumberInput size="sm" disabled={cannotUpdate} {...form.getInputProps('progress')} label="Progression (%)" max={100} clampBehavior="blur" min={selectedRow.progress} />
                <Select size="sm" disabled={cannotUpdate} label="Statut" data={CA_STATUS_OPTIONS.slice(CA_STATUS_OPTIONS.findIndex((item) => item.value === (actionHistory?.length > 0 ? actionHistory[actionHistory.length - 1]?.status : selectedRow?.status)))} {...form.getInputProps('status')} />
              </div>
              <TextEditor form={form} id="description" title="Description" withAsterisk />
              {!cannotUpdate && <FileDropzone form={form} id="docs" />}
              <div className="flex gap-2 justify-end mt-2">
                <Button variant="default" size="sm" onClick={() => navigate('/corrective')}>Annuler</Button>
                <Button disabled={cannotUpdate} color="teal" size="sm" loading={submitting} type='submit'>Enregistrer</Button>
              </div>
            </form>
          )}
        </div>

        {/* Colonne latérale : historique des mises à jour */}
        {selectedRow.progress >= 0 && (
          <div className="lg:col-span-1 self-start p-4 space-y-4 rounded-xl border border-slate-200 bg-white">
            <p className="flex items-center gap-1.5 text-slate-800" style={{ fontFamily: SERIF, fontSize: '14.5px', fontWeight: 600 }}>
              <IconClock size={16} className="text-amber-600" aria-hidden="true" /> Historique des mises à jour
            </p>
            {actionHistory.length === 0 && (
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <h4 className="text-[13px] text-slate-800 mb-2 flex items-center gap-1"><IconBulb size={16} className="text-amber-600" aria-hidden="true" /> Conseils</h4>
                <ul className="text-[12px] text-slate-600 space-y-1">
                  <li>• Actualisez la progression régulièrement</li>
                  <li>• Décrivez les obstacles rencontrés</li>
                  <li>• Joignez photos ou documents justificatifs</li>
                  <li>• Informez le responsable des changements importants</li>
                </ul>
              </div>
            )}
            {actionHistory.slice().reverse().map((x: any, index: number, arr: any[]) => {
              const previousProgress = index < arr.length - 1 ? arr[index + 1].progress : 0;
              const progressMade = x.progress - previousProgress;
              const histCfg = caStatusConfig(x.status);
              return (
                <Card key={index} shadow="sm" padding="sm" radius="md" withBorder>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <p className="text-[12px] text-slate-600 flex gap-1 items-center">
                        <IconClock size={14} aria-hidden="true" /> {formatDateShort(x.createdAt)}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded border ${histCfg.chip}`}>
                        {histCfg.label}
                      </span>
                    </div>
                    <Progress.Root size={18}>
                      <Progress.Section value={previousProgress} color="blue">
                        <Progress.Label>{previousProgress}</Progress.Label>
                      </Progress.Section>
                      {progressMade > 0 && (
                        <Progress.Section value={progressMade} color="teal">
                          <Progress.Label className="text-xs">{progressMade}</Progress.Label>
                        </Progress.Section>
                      )}
                    </Progress.Root>
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Détail de la mise à jour</p>
                      <SafeHtml html={x.description || "—"} className="text-slate-700 mt-1 text-[12.5px]" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateCorrectiveAction;
