import { Select, MultiSelect, ActionIcon, Tooltip } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
    IconLayersIntersect,
    IconArrowsSplit2,
    IconFish,
    IconBinaryTree,
    IconSitemap,
    IconSettings,
    IconTargetArrow,
    IconCheck,
    IconCalendarEvent,
    IconUsers,
    IconRosetteDiscountCheck,
    IconListCheck,
    IconArrowRight,
    IconUserPlus,
    IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { investMethod } from "../../../../Data/DropdownData";
import { INVESTIGATION_ROLE_LABELS, INVESTIGATION_ROLE_OPTIONS } from "../incidentLabels";
import { getDateDifferenceInDays } from "../../../../utility/DateFormats";

/**
 * Étape 1 du wizard d'investigation — LOT 57 v2.
 *  • Méthode : tuiles compactes à icônes colorées + aperçu dynamique.
 *  • Équipe : MultiSelect de recherche + liste compacte avec rôle (remplace le PickList).
 */

// Métadonnées VISUELLES uniquement (icône, couleur) — les libellés (short, level,
// desc, when, steps) sont résolus via i18n (namespace incidents.investigation.method.*).
const METHOD_META: Record<string, {
    icon: any;
    iconColor: string;
}> = {
    ICAM: { icon: IconLayersIntersect, iconColor: 'bg-teal-100 text-teal-700' },
    M5P: { icon: IconArrowsSplit2, iconColor: 'bg-blue-100 text-blue-700' },
    ISH: { icon: IconFish, iconColor: 'bg-emerald-100 text-emerald-700' },
    AC: { icon: IconBinaryTree, iconColor: 'bg-violet-100 text-violet-700' },
    FTA: { icon: IconSitemap, iconColor: 'bg-amber-100 text-amber-700' },
    SMS: { icon: IconSettings, iconColor: 'bg-cyan-100 text-cyan-700' },
    RCA: { icon: IconTargetArrow, iconColor: 'bg-rose-100 text-rose-700' },
};

const SectionCard = ({ band, icon: Icon, title, hint, children }: any) => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className={`flex items-center gap-2 border-b px-4 py-2.5 ${band}`}>
            <span className="rounded-lg bg-white/70 p-1.5 text-slate-700"><Icon size={15} /></span>
            <span className="text-[11px] uppercase tracking-wider text-slate-700">{title}</span>
            {hint && <span className="ml-auto text-[11px] text-slate-500">{hint}</span>}
        </div>
        <div className="p-4">{children}</div>
    </div>
);

const initialsOf = (name?: string) => (name || '?').split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

const InvestigationDetails = ({ incident, form, employees }: any) => {
    const { t } = useTranslation('incidents');
    // Libellés de méthode (court, niveau, description, recommandation, étapes) résolus par i18n.
    const methodKey = (code: string) => `investigation.method.${code}`;
    const team: any[] = form.values.team || [];

    const setTeam = (next: any[]) => form.setFieldValue('team', next);

    const onAddChange = (ids: string[]) => {
        const next = ids.map((idStr) => {
            const existing = team.find((t) => String(t.id) === idStr);
            if (existing) return existing;
            const emp = employees.find((e: any) => String(e.id) === idStr);
            return { ...emp, pos: 'Target', role: '' };
        });
        setTeam(next);
    };

    const handleRoleChange = (id: number, value: string) => setTeam(team.map((m) => (m.id === id ? { ...m, role: value } : m)));
    const removeMember = (id: number) => setTeam(team.filter((m) => m.id !== id));

    const selectedMethod = String(form.values.method || 'ICAM');
    const meta = METHOD_META[selectedMethod] ?? METHOD_META.ICAM;
    const metaCode = METHOD_META[selectedMethod] ? selectedMethod : 'ICAM';
    const metaSteps = [1, 2, 3, 4, 5].map((i) => t(`${methodKey(metaCode)}.step${i}`));

    return (
        <div className="mt-3 flex flex-col gap-5">

            {/* Méthode — tuiles compactes à icônes colorées + aperçu dynamique */}
            <SectionCard band="bg-teal-50/60 border-teal-200/70" icon={IconRosetteDiscountCheck} title={t('investigation.details.methodSection')} hint={t('investigation.details.methodHint')}>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                    {investMethod.map((m: any) => {
                        const mm = METHOD_META[m.value] ?? METHOD_META.ICAM;
                        const codeKey = METHOD_META[m.value] ? m.value : 'ICAM';
                        const Icon = mm.icon;
                        const selected = selectedMethod === m.value;
                        return (
                            <button
                                key={m.value}
                                type="button"
                                onClick={() => form.setFieldValue('method', m.value)}
                                title={m.label}
                                className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition ${selected ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-200' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-sm'}`}
                            >
                                {selected && <IconCheck size={12} className="absolute right-1.5 top-1.5 text-teal-600" />}
                                <span className={`inline-flex rounded-lg p-1.5 ${mm.iconColor}`}><Icon size={17} /></span>
                                <span className="text-[11.5px] leading-tight text-slate-800">{t(`${methodKey(codeKey)}.short`)}</span>
                                <span className="rounded bg-slate-100 px-1 py-px text-[8.5px] uppercase tracking-wider text-slate-500">{t(`${methodKey(codeKey)}.level`)}</span>
                            </button>
                        );
                    })}
                </div>
                {form.errors.method && <div className="mt-2 text-sm text-red-500">{form.errors.method}</div>}

                {/* Aperçu dynamique */}
                <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-teal-200/70 bg-teal-50/40 p-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2">
                            <span className={`rounded-lg p-1.5 ${meta.iconColor}`}><meta.icon size={16} /></span>
                            <h3 className="text-slate-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '15px', fontWeight: 600 }}>{t(`${methodKey(metaCode)}.short`)}</h3>
                        </div>
                        <p className="mt-2 text-[13px] leading-relaxed text-slate-700">{t(`${methodKey(metaCode)}.desc`)}</p>
                        <p className="mt-2 text-[12.5px] text-slate-600"><span className="text-slate-500">{t('investigation.details.recommendedFor')}</span> {t(`${methodKey(metaCode)}.when`)}</p>
                        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-teal-700"><IconArrowRight size={13} /> {t('investigation.details.step2Adapts')}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <p className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500"><IconListCheck size={13} /> {t('investigation.details.flow')}</p>
                        <ol className="space-y-1.5">
                            {metaSteps.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-[12.5px] text-slate-700">
                                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[9px] text-teal-700">{i + 1}</span>
                                    {s}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </SectionCard>

            {/* Calendrier */}
            <SectionCard band="bg-blue-50/60 border-blue-200/70" icon={IconCalendarEvent} title={t('investigation.details.scheduleSection')}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <DateInput minDate={incident.discoveryDate ? new Date(incident.discoveryDate) : undefined} maxDate={form.values.endDate ?? undefined} {...form.getInputProps("startDate")} label={t('investigation.details.startDateLabel')} placeholder={t('investigation.details.startDatePlaceholder')} withAsterisk />
                    <DateInput {...form.getInputProps("endDate")} minDate={form.values.startDate} label={t('investigation.details.endDateLabel')} placeholder={t('investigation.details.endDatePlaceholder')} />
                </div>
                {(form.values.startDate && form.values.endDate) && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-sm text-emerald-700">{t('investigation.details.durationLabel')} <strong>{t('investigation.details.durationDays', { count: getDateDifferenceInDays(form.values.startDate, form.values.endDate) })}</strong></p>
                    </div>
                )}
            </SectionCard>

            {/* Équipe — composant compact (MultiSelect + liste à rôles) */}
            <SectionCard band="bg-violet-50/60 border-violet-200/70" icon={IconUsers} title={t('investigation.details.teamSection')} hint={t('investigation.details.teamCount', { count: team.length })}>
                <MultiSelect
                    data={employees.map((e: any) => ({ value: String(e.id), label: `${e.name}${e.empNumber ? ` · ${e.empNumber}` : ''}` }))}
                    value={team.map((m) => String(m.id))}
                    onChange={onAddChange}
                    searchable
                    clearable
                    hidePickedOptions
                    nothingFoundMessage={t('investigation.details.noEmployee')}
                    leftSection={<IconUserPlus size={15} />}
                    placeholder={team.length ? t('investigation.details.addMember') : t('investigation.details.searchAddMembers')}
                    maxDropdownHeight={240}
                />
                {form.errors.team && <div className="mt-2 text-sm text-red-500">{form.errors.team}</div>}

                {team.length > 0 ? (
                    <div className="mt-3 flex flex-col gap-2">
                        {team.map((m) => {
                            const missingRole = !m.role;
                            return (
                                <div key={m.id} className={`flex flex-wrap items-center gap-3 rounded-lg border bg-white px-3 py-2 ${missingRole ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200'}`}>
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] text-violet-700">{initialsOf(m.name)}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] text-slate-800">{m.name}</p>
                                        {m.empNumber && <p className="text-[11px] text-slate-500">{m.empNumber}</p>}
                                    </div>
                                    <Select
                                        size="xs"
                                        w={190}
                                        placeholder={t('investigation.details.assignRole')}
                                        data={INVESTIGATION_ROLE_OPTIONS}
                                        value={m.role || null}
                                        onChange={(v) => handleRoleChange(m.id, v!)}
                                        allowDeselect={false}
                                        comboboxProps={{ withinPortal: true }}
                                    />
                                    {m.role && <span className="hidden text-[11px] text-slate-400 sm:inline">{INVESTIGATION_ROLE_LABELS[m.role] ?? ''}</span>}
                                    <Tooltip label={t('investigation.details.remove')}>
                                        <ActionIcon variant="subtle" color="red" size="sm" onClick={() => removeMember(m.id)}><IconX size={15} /></ActionIcon>
                                    </Tooltip>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-center text-[12.5px] text-slate-400">
                        {t('investigation.details.emptyTeam')}
                    </p>
                )}
            </SectionCard>
        </div>
    );
};

export default InvestigationDetails;
