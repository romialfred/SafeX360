import { Button, Card, NumberInput, Select, Text, Progress, Badge, Group } from "@mantine/core";
import { IconClock, IconFileText, IconCalendar, IconBulb } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "@mantine/form";
import { createFollowup, getRecommendationById, getRecommendationFollowups } from "../../../services/AuditService";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { formatDateShort } from "../../../utility/DateFormats";
import TextEditor from "../../UtilityComp/TextEditor";
import SafeHtml from "../../UtilityComp/SafeHtml";
import PageHeader from "../../UtilityComp/PageHeader";
import { isValidRichText } from "../../../utility/OtherUtilities";
import { REC_STATUS_OPTIONS, recStatusColor, recStatusLabel } from "./auditLabels";

const UpdateRecommendation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('audits');
  // Libellé de statut bilingue : clé i18n `audits:recStatus.*`, repli sur le libellé FR centralisé.
  const tStatus = (code?: string | null): string =>
    code ? t(`recStatus.${String(code).toUpperCase()}`, { defaultValue: recStatusLabel(code) }) : '—';
  const [followups, setFollowups] = useState<any[]>([]);
  const [rec, setRec] = useState<any>(null);
  // Track initial/previous for sync logic
  const [initialStatus, setInitialStatus] = useState<string>('');
  const [initialProgress, setInitialProgress] = useState<number>(0);
  const prevProgressRef = useRef<number>(0);
  const prevStatusRef = useRef<string>('');

  const form = useForm({
    initialValues: {
      progress: 0,
      status: '',
      comment: '',
    },
    validate: {
      status: (v) => (v?.trim()?.length ? null : t('recommendations.statusRequired')),
      comment: (v) => (isValidRichText(v) ? null : t('recommendations.commentRequired')),
    }
  });

  useEffect(() => {
    if (!id) return;
    getRecommendationById(id)
      .then((res) => {
        setRec(res);
        const p = Number(res.progress ?? 0);
        const s = String(res.status ?? '');
        form.setValues({ progress: p, status: s, comment: '' });
        setInitialProgress(p);
        setInitialStatus(s);
        prevProgressRef.current = p;
        prevStatusRef.current = String(s || '').toUpperCase();
      })
      .catch((err) => errorNotification(err.response?.data?.errorMessage || t('recommendations.loadRecommendationFailed')));

    getRecommendationFollowups(id)
      .then(setFollowups)
      .catch((err) => errorNotification(err.response?.data?.errorMessage || t('recommendations.loadHistoryFailed')));
  }, [id]);

  // Keep status/progress in sync like UpdateAdhocAction
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

  const statusUpper = String(rec?.status || '').toUpperCase();
  const isCompleted = (rec?.progress ?? 0) >= 100 || statusUpper === 'COMPLETED';
  const isPending = statusUpper === 'PENDING';
  const cannotUpdate = isCompleted || isPending;

  const handleSubmit = (values: any) => {
    const sanitized = { ...values } as any;
    const numericProgress = Number(sanitized.progress ?? 0);
    if (numericProgress >= 100) {
      sanitized.progress = 100;
      sanitized.status = 'COMPLETED';
    }
    if (String(sanitized.status || '').toUpperCase() === 'COMPLETED') {
      sanitized.progress = 100;
    }
    const payload = { ...sanitized, recommendationId: id };
    createFollowup(payload)
      .then(() => {
        successNotification(t('recommendations.updatedToast'));
        navigate('/audit-recommendations');
      })
      .catch((err) => errorNotification(err.response?.data?.errorMessage || t('recommendations.saveFailed')));
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <PageHeader
        breadcrumbs={[
          { label: t('recommendations.breadcrumbHome'), to: '/' },
          { label: t('recommendations.breadcrumbTracking'), to: '/audit-recommendations' },
          { label: t('recommendations.breadcrumbUpdate') },
        ]}
        icon={<IconBulb size={22} stroke={2} />}
        iconColor="indigo"
        title={t('recommendations.updateTitle')}
        subtitle={t('recommendations.updateSubtitle')}
      />

      {/* LOT 40 P1: responsive grid breakpoints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Left Side: Details + Update */}
        <div className="col-span-2 border border-gray-200 rounded-md p-5 shadow-sm flex flex-col gap-3">
          {/* Recommendation Details box */}
          <div className="bg-white rounded-md">
            <div className="mb-5">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <IconFileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-900">{t('recommendations.detailBoxTitle')}</p>
                    <p className="text-xs text-blue-700">{t('recommendations.detailBoxHint')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {/* Top meta: Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <span className="p-1.5 rounded-md bg-cyan-50 text-cyan-600"><IconFileText size={16} /></span>
                  <div>
                    <p className="text-xs tracking-wide text-gray-500">{t('recommendations.fieldTitle')}</p>
                    <p className="text-sm text-gray-900">{rec?.title || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs tracking-wide text-gray-500 mb-1 flex items-center gap-1"><IconCalendar size={14} /> {t('recommendations.colDeadline')}</p>
                  <p className="text-sm text-gray-900">{rec?.deadline ? formatDateShort(rec.deadline) : '—'}</p>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs tracking-wide text-gray-500 mb-1">{t('recommendations.currentProgress')}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-900">{rec?.progress ?? 0}%</p>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${rec?.progress ?? 0}%` }} />
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs tracking-wide text-gray-500 mb-1">{t('recommendations.currentStatus')}</p>
                  <Badge size="sm" radius="sm" variant="light" color={recStatusColor(rec?.status)}>
                    <Group gap={4}><IconClock size={14} /> {tStatus(rec?.status)}</Group>
                  </Badge>
                </div>
              </div>

              {rec?.description && (
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs tracking-wide text-gray-500 mb-1">{t('recommendations.description')}</p>
                  {/* LOT 41 P0 XSS fix */}
                  <SafeHtml html={rec?.description} className="text-gray-700 text-sm" />
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
                  <p className="text-sm text-blue-900">{t('recommendations.updateBoxTitle')}</p>
                  <p className="text-xs text-blue-700">{t('recommendations.updateBoxHint')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Update form */}
          {cannotUpdate ? (
            <Card shadow="xs" padding="md" radius="md" withBorder className={`${isCompleted ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              {isCompleted && (
                <Text c="green">{t('recommendations.alreadyCompleted')}</Text>
              )}
              {isPending && (
                <Text c="yellow">{t('recommendations.pendingNotice')}</Text>
              )}
            </Card>
          ) : (
            <form className="space-y-3" onSubmit={form.onSubmit(handleSubmit)}>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput size="sm" disabled={cannotUpdate} {...form.getInputProps('progress')} label={t('recommendations.progressLabel')} max={100} clampBehavior="blur" min={rec?.progress ?? 0} />
                <Select size="sm" disabled={cannotUpdate} {...form.getInputProps('status')} label={t('recommendations.statusLabel')} placeholder={t('recommendations.selectStatus')} data={REC_STATUS_OPTIONS.slice(REC_STATUS_OPTIONS.findIndex((x) => x.value === (followups?.length > 0 ? followups[followups.length - 1]?.status : rec?.status))).map((o) => ({ value: o.value, label: t(`recStatus.${o.value}`, { defaultValue: o.label }) }))} />
              </div>
              <TextEditor form={form} id="comment" title={t('recommendations.comment')} withAsterisk />
              <div className="flex gap-2 mt-2">
                <Button variant="default" onClick={() => navigate('/audit-recommendations')}>{t('recommendations.cancel')}</Button>
                <Button type="submit" color="indigo">{t('recommendations.save')}</Button>
              </div>
            </form>
          )}
        </div>

        {/* Right Side: History */}
        <div className="col-span-1 self-start p-5 space-y-5 rounded-md border shadow-sm border-gray-200">
          <p className="text-lg items-center mb-4 flex gap-1 text-amber-600"><IconClock /> {t('recommendations.followupsHistory')}</p>
          {followups.length === 0 && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h4 className="text-sm text-blue-900 mb-2 flex items-center gap-1"><IconBulb size={16} /> {t('recommendations.tipsTitle')}</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• {t('recommendations.tip1')}</li>
                <li>• {t('recommendations.tip2')}</li>
                <li>• {t('recommendations.tip3')}</li>
              </ul>
            </div>
          )}
          {followups.slice().reverse().map((x: any, index: number, arr: any[]) => {
            const previous = index < arr.length - 1 ? arr[index + 1].progress : 0;
            const progressMade = x.progress - previous;
            return (
              <Card key={index} shadow="sm" padding="sm" radius="md" withBorder>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="rounded-4xl">
                      <p className="text-sm text-amber-800 flex gap-1 p-1 items-center">
                        <IconClock /> {formatDateShort(x.followupDate)}
                      </p>
                    </div>
                    <Badge radius="sm" variant="outline" color={recStatusColor(x.status)}>{tStatus(x.status)}</Badge>
                  </div>
                  <Progress.Root size={20}>
                    <Progress.Section value={previous} color="blue">
                      <Progress.Label>{previous}</Progress.Label>
                    </Progress.Section>
                    {progressMade > 0 && (
                      <Progress.Section value={progressMade} color="teal">
                        <Progress.Label className="text-xs">{progressMade}</Progress.Label>
                      </Progress.Section>
                    )}
                  </Progress.Root>
                  <div className="bg-blue-50 shadow-sm rounded-lg p-2">
                    <p className="text-blue-400">{t('recommendations.followupDetail')}</p>
                    {/* LOT 41 P0 XSS fix */}
                    <SafeHtml html={x.comment || '-'} className="text-gray-700 mt-1 text-sm" />
                  </div>
                </div>
              </Card>
            );
          })}
          {followups.length > 0 && null}
        </div>
      </div>
    </div>
  );
};

export default UpdateRecommendation;
