import { Breadcrumbs, Text, Card, Badge, Group, Progress as MantineProgress } from "@mantine/core";
import { IconClock, IconUser, IconCalendar, IconPhoto } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getActionById } from "../../../services/CorrectiveActionService";
import { getAllActionProcessByActionId } from "../../../services/ActionProcessService";
import { actionStatusesMap } from "../../../Data/DropdownData";
import { formatDateShort } from "../../../utility/DateFormats";
import { handlePreview, getFriendlyFileType } from "../../../utility/DocumentUtility";

const AdhocActionDetails = () => {
  const { id } = useParams();
  const [action, setAction] = useState<any>({});
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    getActionById(id)
      .then((res) => setAction(res))
      .catch((_err) => {});

    getAllActionProcessByActionId(id)
      .then((res) => setHistory(res))
      .catch((_err) => {});
  }, [id]);

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">Improvement Idea Details</div>
          <Breadcrumbs mt="xs">
            <Link className="hover:!underline" to="/">
              <Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text>
            </Link>
            <Link className="hover:!underline" to="/adhoc-actions">
              <Text variant="gradient" className="hover:!underline cursor-pointer">Improvement Ideas</Text>
            </Link>
            <Text variant="gradient">Details</Text>
          </Breadcrumbs>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Full details, no inputs */}
        <div className="col-span-2 self-start p-5 space-y-4 rounded-md border shadow-sm border-gray-200 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold text-gray-900">{action?.actionName || '-'}</h2>
              <div className="mt-2 flex flex-wrap gap-2 items-center text-sm">
                <div className="inline-flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-1 rounded-full border border-blue-200">
                  <IconUser size={16} />
                  <span>{action?.assignedEmployeeName || '-'}</span>
                </div>
                <div className="inline-flex items-center gap-1 text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full border border-yellow-200">
                  <IconCalendar size={16} />
                  <span>Due: {action?.deadline ? formatDateShort(action.deadline) : '-'}</span>
                </div>
                <Badge radius="xs" color="violet" variant="light" className="!capitalize">
                  {action?.status ? actionStatusesMap[action.status] : '-'}
                </Badge>
              </div>
            </div>
            <div className="w-[90px]">
              <div className="text-sm font-medium text-gray-700 mb-1">Progress</div>
              <MantineProgress.Root size={14} className="!rounded-full" style={{ width: 90 }}>
                <MantineProgress.Section value={Number(action?.progress || 0)} color="teal">
                  <MantineProgress.Label>{action?.progress ?? 0}%</MantineProgress.Label>
                </MantineProgress.Section>
              </MantineProgress.Root>
            </div>
          </div>

          {action?.description && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-blue-600 text-sm font-medium mb-1">Description</p>
              <Text size="sm" className="text-gray-700" dangerouslySetInnerHTML={{ __html: action.description }} />
            </div>
          )}

          {Array.isArray(action?.docs) && action.docs.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-gray-700 text-sm font-medium mb-2">Attachments</p>
              <div className="flex flex-wrap gap-2">
                {action.docs.map((doc: any, idx: number) => (
                  <Badge key={idx} className="!cursor-pointer" color="orange" variant="light" leftSection={<IconPhoto size={12} />} onClick={() => handlePreview(doc)}>
                    {doc?.name} ({getFriendlyFileType(doc?.type)})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Update history */}
        <div className="col-span-1 self-start p-5 space-y-5 rounded-md border shadow-sm border-gray-200 bg-white">
          <p className="text-lg items-center font-semibold mb-2 flex gap-1 text-amber-600">
            <IconClock /> Update History
          </p>
          {history.length === 0 && (<div className="text-gray-600">No updates available</div>)}

          {history.slice().reverse().map((x: any, index: number, arr: any[]) => {
            const previousProgress = index < arr.length - 1 ? arr[index + 1].progress : 0;
            const progressMade = (x.progress ?? 0) - (previousProgress ?? 0);

            return (
              <Card key={index} shadow="sm" padding="sm" radius="md" withBorder>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="rounded-4xl">
                      <p className="text-sm font-medium text-amber-800 flex gap-1 p-1 items-center">
                        <IconClock /> {x?.createdAt ? formatDateShort(x.createdAt) : '-'}
                      </p>
                    </div>
                    <Badge radius="sm" variant="outline" color="purple" className="!capitalize">
                      {x?.status ? actionStatusesMap[x.status] : '-'}
                    </Badge>
                  </div>

                  <MantineProgress.Root size={20}>
                    <MantineProgress.Section value={previousProgress} color="blue">
                      <MantineProgress.Label>{previousProgress}</MantineProgress.Label>
                    </MantineProgress.Section>
                    {progressMade > 0 && (
                      <MantineProgress.Section value={progressMade} color="teal">
                        <MantineProgress.Label className="text-xs">{progressMade}</MantineProgress.Label>
                      </MantineProgress.Section>
                    )}
                  </MantineProgress.Root>

                  <div className="bg-blue-50 shadow-sm rounded-lg p-2">
                    <p className="text-blue-400">Update Details</p>
                    <Text size="sm" className="text-gray-700 mt-1" dangerouslySetInnerHTML={{ __html: x?.description || '-' }} />
                  </div>

                  {Array.isArray(x?.docs) && x.docs.length > 0 && (
                    <Group>
                      {x.docs.map((doc: any, i: number) => (
                        <Badge key={i} size='sm' className='!cursor-pointer' onClick={() => handlePreview(doc)} leftSection={<IconPhoto size={12} />} color="orange" variant="light">
                          {doc.name}
                        </Badge>
                      ))}
                    </Group>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdhocActionDetails;
