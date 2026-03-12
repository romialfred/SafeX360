import { Breadcrumbs, Text, Button, Card, Progress, Select, NumberInput, Badge, Group } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconClock, IconFileText, IconCalendar, IconBulb } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FileDropzone from "../../UtilityComp/FileDropzone";
import { useForm } from "@mantine/form";
import { actionStatuses, actionStatusesMap, investMethodMap } from "../../../Data/DropdownData";
import { formatDateShort } from "../../../utility/DateFormats";
import { addInvestigationProcess, getAllInvestigationProcessByInvestigationId } from "../../../services/InvestigationFileService";
import { convertFileToBase64DTO } from "../../../utility/DocumentUtility";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import TextEditor from "../../UtilityComp/TextEditor";
import { isValidRichText } from "../../../utility/OtherUtilities";
import { getInvestigationById } from "../../../services/InvestigationService";
import dayjs from "dayjs";

const UpdateInvestigation = () => {
  const { id } = useParams();
  const [history, setHistory] = useState<any[]>([]);
  const [investigation, setInvestigation] = useState<any>({});
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      status: '',
      description: '',
      progress: 0,
      date: new Date(),
      docs: [] as any[]
    },
    validate: {
      status: (value) => (value?.trim().length > 0 ? null : 'Status is Required'),
      progress: (value) => (value !== undefined && value !== null ? null : 'Progress is Required'),
      description: (value) => (isValidRichText(value) ? null : 'Description is Required'),
      date: (value) => (value ? null : 'Date is Required'),
    }
  });

  // Track initial and previous values for sync + revert logic
  const [initialStatus, setInitialStatus] = useState<string>('');
  const [initialProgress, setInitialProgress] = useState<number>(0);
  const prevProgressRef = useRef<number>(0);
  const prevStatusRef = useRef<string>('');

  // UI sync: progress <-> status with revert
  useEffect(() => {
    const progress = Number(form.values.progress ?? 0);
    const status = String(form.values.status || '').toUpperCase();

    if (progress >= 100 && status !== 'COMPLETED') {
      form.setFieldValue('status', 'COMPLETED');
    }
    if (prevProgressRef.current === 100 && progress < 100 && initialStatus) {
      form.setFieldValue('status', initialStatus);
    }
    prevProgressRef.current = progress;
  }, [form.values.progress, initialStatus]);

  useEffect(() => {
    const progress = Number(form.values.progress ?? 0);
    const status = String(form.values.status || '').toUpperCase();

    if (status === 'COMPLETED' && progress < 100) {
      form.setFieldValue('progress', 100);
    }
    if (prevStatusRef.current === 'COMPLETED' && status !== 'COMPLETED') {
      form.setFieldValue('progress', initialProgress);
    }
    prevStatusRef.current = status;
  }, [form.values.status, initialProgress]);

  const statusUpper = String(investigation?.status || '').toUpperCase();
  const isCompleted = (investigation?.progress ?? 0) >= 100 || statusUpper === 'COMPLETED';
  const isCancelled = statusUpper === 'CANCELLED';
  const isPending = statusUpper === 'PENDING';
  const cannotUpdate = isCompleted || isCancelled || isPending;

  useEffect(() => {
    if (!id) return;
    getInvestigationById(id)
      .then((res) => {
        setInvestigation(res);
        form.setValues({
          status: res.status,
          description: res.description || '',
          progress: res.progress,
          date: new Date(),
          docs: []
        });
        setInitialStatus(res.status || '');
        setInitialProgress(Number(res.progress ?? 0));
        prevStatusRef.current = String(res.status || '').toUpperCase();
        prevProgressRef.current = Number(res.progress ?? 0);
      })
      .catch((err) => errorNotification(err.response?.data?.errorMessage || 'Failed to load investigation'));

    getAllInvestigationProcessByInvestigationId(Number(id))
      .then((res) => setHistory(res))
      .catch((err) => errorNotification(err.response?.data?.errorMessage || 'Failed to load history'));
  }, [id]);

  const handleSubmit = async (values: any) => {
    const docs = await Promise.all(values.docs?.map(convertFileToBase64DTO));
    const sanitized = { ...values } as any;
    const numericProgress = Number(sanitized.progress ?? 0);
    if (numericProgress >= 100) {
      sanitized.progress = 100;
      sanitized.status = 'COMPLETED';
    }
    if (String(sanitized.status || '').toUpperCase() === 'COMPLETED') {
      sanitized.progress = 100;
    }

    const payload = {
      status: sanitized.status,
      progress: sanitized.progress,
      description: sanitized.description,
      date: dayjs(sanitized.date).format('YYYY-MM-DD'),
      docs,
      investigationId: id,
    };

    addInvestigationProcess(payload)
      .then(() => {
        successNotification('Investigation Updated.');
        navigate('/investigation');
      })
      .catch((err) => errorNotification(err.response?.data?.errorMessage || 'Something went wrong'));
  };

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">Update Investigation</div>
          <Breadcrumbs mt="xs">
            <Link className="hover:!underline" to="/"><Text variant="gradient">Home</Text></Link>
            <Link className="hover:!underline" to="/investigation"><Text variant="gradient">Investigations</Text></Link>
            <Text variant="gradient">Update</Text>
          </Breadcrumbs>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left Side: Details + Update */}
        <div className='flex self-start flex-col col-span-2 gap-3 shadow-sm p-5 rounded-md border border-gray-200'>
          {/* Details box */}
          <div className="bg-white rounded-md">
            <div className="mb-5">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <IconFileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Investigation Details</p>
                    <p className="text-xs text-blue-700">Review the context for the ongoing investigation.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className=" space-y-4">
              {/* Incident title */}
              {/* <div className="flex items-start gap-2">
                <span className="p-1.5 rounded-md bg-blue-50 text-blue-600"><IconAlertCircle size={16} /></span>
                <div>
                  <p className="text-xs capitalize tracking-wide text-gray-500">Incident</p>
                  <p className="text-sm text-gray-900">{investigation?.incidentTitle || '-'}</p>
                </div>
              </div> */}

              {/* Stats row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs capitalize tracking-wide text-gray-500 mb-1">Method</p>
                  <p className="text-sm text-gray-900">{investMethodMap[investigation?.method] || investigation?.method || '-'}</p>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs capitalize tracking-wide text-gray-500 mb-1 flex items-center gap-1"><IconCalendar size={14} /> Start Date</p>
                  <p className="text-sm text-gray-900">{investigation?.startDate ? formatDateShort(investigation.startDate) : '-'}</p>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs capitalize tracking-wide text-gray-500 mb-1 flex items-center gap-1"><IconCalendar size={14} /> End Date</p>
                  <p className="text-sm text-gray-900">{investigation?.endDate ? formatDateShort(investigation.endDate) : '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs capitalize tracking-wide text-gray-500 mb-1">Current Progress</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-900">{investigation?.progress ?? 0}%</p>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${investigation?.progress ?? 0}%` }} />
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs capitalize tracking-wide text-gray-500 mb-1">Current Status</p>
                  <Badge size="sm" radius="sm" variant="light" color="yellow" className="!capitalize">
                    <Group gap={4}><IconClock size={14} /> {actionStatusesMap[investigation?.status] || '-'}</Group>
                  </Badge>
                </div>
              </div>

              {investigation?.description && (
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs capitalize tracking-wide text-gray-500 mb-1">Description</p>
                  <Text size="sm" className="text-gray-700" dangerouslySetInnerHTML={{ __html: investigation?.description }} />
                </div>
              )}
            </div>
          </div>

          {/* Separator */}
          <hr className="my-2 border-t border-gray-200" />

          {/* Update heading */}
          <div className="px-1">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <IconClock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Status Update</p>
                  <p className="text-xs text-blue-700">Update progress and document investigation notes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Update form */}
          {cannotUpdate ? (
            <Card shadow="xs" padding="md" radius="md" withBorder className={`${isCompleted ? 'bg-green-50 border-green-200' : isCancelled ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
              {isCompleted && (<Text c="green" fw={600}>This investigation is already completed. Further updates are not allowed.</Text>)}
              {isPending && (<Text c="yellow" fw={600}>This investigation is pending approval. Updates are not allowed until it is approved.</Text>)}
              {isCancelled && (<Text c="red" fw={600}>This investigation has been cancelled. Further updates are not allowed.</Text>)}
            </Card>
          ) : (
            <form className='space-y-3' onSubmit={form.onSubmit(handleSubmit)}>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput size="sm" disabled={cannotUpdate} {...form.getInputProps('progress')} label="Progress (%)" max={100} clampBehavior="blur" min={investigation.progress ?? 0} />
                <Select size="sm" disabled={cannotUpdate} label="Status" data={actionStatuses.slice(actionStatuses.findIndex((item) => item.value === (history?.length > 0 ? history[history.length - 1]?.status : investigation?.status)))}  {...form.getInputProps('status')} />
              </div>
              <DateInput disabled={cannotUpdate} label="Date" valueFormat="YYYY-MM-DD" {...form.getInputProps('date')} minDate={history?.length > 0
                ? new Date(Math.max(...history.map(h => new Date(h.date).getTime())))
                : investigation?.startDate ? new Date(investigation?.startDate) : undefined} />
              <TextEditor form={form} id="description" title="Description" withAsterisk />
              {!cannotUpdate && <FileDropzone form={form} id="docs" />}
              <div className="flex gap-2 mt-2">
                <Button variant='default' onClick={() => navigate('/investigation')}>Cancel</Button>
                <Button disabled={cannotUpdate} variant='gradient' type='submit'>Save</Button>
              </div>
            </form>
          )}
        </div>

        {/* Right Side: History */}
        {investigation.progress >= 0 && (
          <div className="col-span-1 self-start p-5 space-y-5 rounded-md border shadow-sm border-gray-200 ">
            <p className="text-lg items-center font-semibold mb-4 flex gap-1 text-amber-600"><IconClock /> Update History</p>
            {history.length === 0 && (
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-1"><IconBulb size={16} /> Tips</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Update progress regularly</li>
                  <li>• Add details about obstacles encountered</li>
                  <li>• Attach photos or documents if necessary</li>
                  <li>• Notify the assignee of important changes</li>
                </ul>
              </div>
            )}
            {history.slice().reverse().map((x: any, index: number, arr: any[]) => {
              const previousProgress = index < arr.length - 1 ? arr[index + 1].progress : 0;
              const progressMade = x.progress - previousProgress;
              return (
                <Card key={index} shadow="sm" padding="sm" radius="md" withBorder className="">
                  <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <div className="rounded-4xl">
                        <p className="text-sm font-medium text-amber-800 flex gap-1 p-1 items-center">
                          <IconClock /> {formatDateShort(x.date)}
                        </p>
                      </div>
                      <Badge radius="sm" variant="outline" color="purple" className="!capitalize">{actionStatusesMap[x.status]}</Badge>
                    </div>
                    {/* Progress Section */}
                    <Progress.Root size={20}>
                      <Progress.Section value={previousProgress} color="blue">
                        <Progress.Label>{previousProgress}</Progress.Label>
                      </Progress.Section>
                      {progressMade > 0 && (
                        <Progress.Section value={progressMade} color="teal">
                          <Progress.Label className="text-xs">{progressMade}</Progress.Label>
                        </Progress.Section>
                      )}
                    </Progress.Root>
                    <div className="bg-blue-50 shadow-sm rounded-lg p-2">
                      <p className="text-blue-400">Update Details</p>
                      <Text dangerouslySetInnerHTML={{ __html: x.description || "-" }} size="sm" className="text-gray-700 mt-1" />
                    </div>
                  </div>
                </Card>
              );
            })}
            {history.length > 0 && null}
          </div>
        )}
      </div>
    </div>
  );
}

export default UpdateInvestigation;
