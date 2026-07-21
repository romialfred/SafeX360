import React, { useEffect, useState } from 'react';
import {
    IconPlus,
    IconCalendar,
    IconUsers,
    IconRoute,
    IconShield,
    IconCalendarStats,
} from '@tabler/icons-react';
import ActivityCard from './ActivityCard';
import { Button, Group, Modal, Select, SelectProps, Text, TextInput } from '@mantine/core';
import { DateTimePicker, MonthPickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { createActivity, deleteActivity, updateActivity } from '../../../services/HSEActivityService';
import { getThemesByYear } from '../../../services/HSEThemeService';
import { modals } from '@mantine/modals';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { useDispatch } from 'react-redux';
import { toIsoDateLocal } from '../planningLabels';


interface AnnualPlanningGridProps {
    year: number;
    selectedMonth: string;
    selectedCategory: string;
    selectedDepartment: string;
    selectedEmployee: string;
    onStatsUpdate?: (stats: { igp: number; rss: number; tdm: number }) => void;
    onEmployeesUpdate?: (employees: string[]) => void;
    planningStats: { igp: number; rss: number; tdm: number };
    emps: any[];
    empMap: any;
    allActivities: any[];
    setAllActivities: (activities: any[]) => void;
}

export default function AnnualPlanningGrid({
    year, selectedMonth, selectedCategory, selectedDepartment, selectedEmployee,
    onStatsUpdate, onEmployeesUpdate, planningStats: _planningStats,
    emps, empMap, allActivities, setAllActivities
}: AnnualPlanningGridProps) {

    const [opened, setOpened] = useState(false);
    const dispatch = useDispatch();
    const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

    // Thèmes réels du calendrier (module Thèmes mensuels), cloisonnés par mine
    // côté serveur : plus de liste FR codée en dur, la saisie reste alignée sur
    // ce que le HSE a réellement planifié pour l'année.
    const [themes, setThemes] = useState<any[]>([]);

    useEffect(() => {
        let cancelled = false;
        getThemesByYear(year)
            .then((data) => {
                if (!cancelled) setThemes(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                // Repli silencieux : l'absence de thèmes ne doit pas bloquer la
                // saisie d'une activité (le Select passera en mode "non configuré").
                if (!cancelled) setThemes([]);
            });
        return () => { cancelled = true; };
    }, [year]);

    const filteredActivities = allActivities.filter(activity => {
        const matchesMonth = selectedMonth === 'all' || (activity.month && (activity.month.endsWith(`-${String(selectedMonth).padStart(2, '0')}-01`) || activity.month === selectedMonth));
        const matchesDepartment = selectedDepartment === 'all' || activity.department === selectedDepartment;
        const matchesEmployee = selectedEmployee === 'all' || String(activity.responsibleId) === selectedEmployee || activity.responsibleId === selectedEmployee;
        const matchesCategory = selectedCategory === 'all' || (activity.category && activity.category.toString() === selectedCategory);
        return matchesMonth && matchesDepartment && matchesEmployee && matchesCategory;
    });

    // Mois en français
    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const monthsShort = ['Jan.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'inProgress': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'planned': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'IGP': return 'bg-blue-500/10 text-blue-700 border-blue-200';
            case 'HSE': return 'bg-green-500/10 text-green-700 border-green-200';
            case 'TDM': return 'bg-indigo-500/10 text-indigo-700 border-indigo-200';
            default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'IGP': return IconShield;
            case 'HSE': return IconUsers;
            case 'TDM': return IconRoute;
            default: return IconShield;
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'IGP': return 'IGP';
            case 'HSE': return 'RSS';
            case 'TDM': return 'TDM';
            default: return 'IGP';
        }
    };

    const getMonthAccent = (monthIndex: number) => {
        // Couleur d'accent par trimestre — sobre, professionnel
        if (monthIndex < 3) return { ring: 'border-l-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', label: 'T1' };
        if (monthIndex < 6) return { ring: 'border-l-teal-500', bg: 'bg-teal-50', text: 'text-teal-700', label: 'T2' };
        if (monthIndex < 9) return { ring: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'T3' };
        return { ring: 'border-l-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', label: 'T4' };
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filtrage par mois (déjà appliqué dans le parent)
    const getFilteredActivities = (monthIndex: number) => {
        const monthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
        return filteredActivities.filter(activity => activity.month === monthStr);
    };

    const handleAddActivity = () => {
        setOpened(true);
    };

    const form = useForm({
        initialValues: {
            title: "",
            responsibleId: '',
            category: '',
            month: undefined as Date | undefined,
            dateTime: undefined as Date | undefined,
            theme: '',
        },
        validate: {
            title: (value) => (value ? null : "Le titre est requis"),
            responsibleId: (value) => (value ? null : "Le responsable est requis"),
            category: (value) => (value ? null : "La catégorie est requise"),
            month: (value) => (value ? null : "Le mois est requis")
        },
    });

    useEffect(() => {
        if (selectedActivity) {
            let monthDate: Date | undefined = undefined;
            if (selectedActivity.month && typeof selectedActivity.month === 'string' && selectedActivity.month.match(/^\d{4}-\d{2}-\d{2}$/)) {
                monthDate = new Date(selectedActivity.month);
            }
            const parsedDate = selectedActivity.dateTime ? new Date(selectedActivity.dateTime) : undefined;
            const isValidDate = parsedDate instanceof Date && !isNaN(parsedDate as any);
            form.setValues({
                title: selectedActivity.title || '',
                responsibleId: "" + selectedActivity.responsibleId || '',
                category: selectedActivity.category || '',
                month: monthDate,
                dateTime: isValidDate ? parsedDate : undefined,
                theme: selectedActivity.theme || '',
            });
        } else {
            form.reset();
        }
    }, [selectedActivity]);

    // Catégorie d'activité (codes backend) → catégorie de thème (ThemeCategory).
    const THEME_CATEGORY_OF_ACTIVITY: Record<string, string> = { HSE: 'RSS', TDM: 'TDM' };

    /**
     * Thèmes proposés pour la catégorie en cours. Un thème sans catégorie est
     * considéré transverse (proposé pour RSS comme pour TDM). Le thème déjà
     * enregistré sur l'activité est réinjecté même s'il n'est plus au calendrier,
     * pour qu'une modification ne l'efface pas silencieusement.
     */
    const themeOptions = React.useMemo(() => {
        const wanted = THEME_CATEGORY_OF_ACTIVITY[form.values.category];
        const titles = themes
            .filter((t) => !t.category || t.category === wanted)
            .map((t) => t.title)
            .filter((title: string) => !!title);
        const current = form.values.theme;
        if (current && !titles.includes(current)) {
            titles.push(current);
        }
        return Array.from(new Set(titles)).map((title: string) => ({ label: title, value: title }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [themes, form.values.category, form.values.theme]);

    const handleSaveActivity = async (values: any) => {
        dispatch(showOverlay());

        let monthStr = '';
        if (values.month instanceof Date && !isNaN(values.month as any)) {
            const y = values.month.getFullYear();
            const m = String(values.month.getMonth() + 1).padStart(2, '0');
            monthStr = `${y}-${m}-01`;
        }

        // dateTime (DateTimePicker) sérialisé en LocalDateTime local, SANS « Z » :
        // envoyer la Date brute laissait axios produire un ISO UTC, décalant l'heure
        // (voire le jour) au parse LocalDateTime côté serveur.
        let dateTimeStr: string | null = null;
        if (values.dateTime instanceof Date && !isNaN(values.dateTime as any)) {
            const dt: Date = values.dateTime;
            const pad = (n: number) => String(n).padStart(2, '0');
            dateTimeStr = `${toIsoDateLocal(dt)}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
        }

        const payload = {
            title: values.title,
            responsibleId: Number(values.responsibleId),
            category: values.category,
            dateTime: dateTimeStr,
            month: monthStr,
            theme: values.theme || null,
        };

        try {
            let newActivities;
            if (selectedActivity && selectedActivity.id) {
                await updateActivity({ ...payload, id: selectedActivity.id });
                newActivities = allActivities.map(act => act.id === selectedActivity.id ? { ...act, ...payload, id: selectedActivity.id } : act);
                successNotification('Activité mise à jour avec succès');
            } else {
                const created = await createActivity(payload);
                const newActivity = created && created.id ? created : { ...payload, id: Date.now().toString() };
                newActivities = [...allActivities, newActivity];
                successNotification('Activité créée avec succès');
            }

            setAllActivities(newActivities);

            const uniqueEmployees = Array.from(new Set(newActivities.map(activity => activity.responsible))).sort();
            if (onEmployeesUpdate) {
                onEmployeesUpdate(uniqueEmployees);
            }

            const stats = {
                igp: newActivities.filter(a => a.category === 'IGP').length,
                rss: newActivities.filter(a => a.category === 'HSE').length,
                tdm: newActivities.filter(a => a.category === 'TDM').length,
            };
            if (onStatsUpdate) {
                onStatsUpdate(stats);
            }

            form.reset();
            setOpened(false);
            setSelectedActivity(null);

        } catch (err: any) {
            errorNotification(err.response?.data?.errorMessage || "Une erreur est survenue");
        } finally {
            dispatch(hideOverlay());
        }
    };

    const renderSelectOption: SelectProps['renderOption'] = ({ option }: any) => (
        <Group wrap='nowrap'>
            <div>
                <Text size="sm" className="flex gap-2">{option.label}</Text>
                <Text size="xs" color="dimmed">
                    {empMap[option.value]?.department}
                </Text>
            </div>
        </Group>
    );

    const handleDeleteActivity = (id: string) => {
        const activity = allActivities.find((a) => a.id === id);
        modals.openConfirmModal({
            title: <span className="text-base">Supprimer l'activité</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Souhaitez-vous supprimer l'activité : <strong>{activity?.title ?? 'sans titre'}</strong> ?
                    Cette action est irréversible.
                </span>
            ),
            labels: { confirm: 'Oui, supprimer', cancel: 'Annuler' },
            cancelProps: { color: 'gray', variant: 'default' },
            confirmProps: { color: 'red', variant: 'filled' },
            onConfirm: () => {
                dispatch(showOverlay());
                deleteActivity(id)
                    .then(() => {
                        successNotification('Activité supprimée du planning');
                        setAllActivities(allActivities.filter((a) => a.id !== id));
                    })
                    .catch((err: any) => {
                        errorNotification(err.response?.data?.errorMessage || 'La suppression a échoué');
                    })
                    .finally(() => dispatch(hideOverlay()));
            },
        });
    };

    React.useEffect(() => {
        const uniqueEmployees = Array.from(new Set(allActivities.map(activity => activity.responsible))).sort();
        if (onEmployeesUpdate) {
            onEmployeesUpdate(uniqueEmployees);
        }
    }, [allActivities, onEmployeesUpdate]);

    React.useEffect(() => {
        const stats = {
            igp: allActivities.filter(a => a.category === 'IGP').length,
            rss: allActivities.filter(a => a.category === 'HSE').length,
            tdm: allActivities.filter(a => a.category === 'TDM').length,
        };
        if (onStatsUpdate) {
            onStatsUpdate(stats);
        }
    }, [allActivities, onStatsUpdate]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header de la grille avec titre, sous-titre et bouton */}
            <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex justify-between items-center flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100 border border-amber-200">
                            <IconCalendarStats size={18} className="text-amber-700" />
                        </div>
                        <div>
                            <h3 className="text-base text-slate-900">Planning annuel {year}</h3>
                            <p className="text-xs text-slate-500">Vue d'ensemble des activités HSE par mois — {filteredActivities.length} activité{filteredActivities.length > 1 ? 's' : ''} affichée{filteredActivities.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    <Button
                        size="sm"
                        color="amber"
                        leftSection={<IconPlus size={15} />}
                        onClick={() => handleAddActivity()}
                    >
                        Nouvelle activité
                    </Button>
                </div>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {months.map((month: any, index: any) => {
                        if (selectedMonth !== 'all' && parseInt(selectedMonth) !== index + 1) {
                            return null;
                        }

                        const monthActivities = getFilteredActivities(index);
                        const accent = getMonthAccent(index);
                        const isCurrentMonth = currentYear === year && currentMonth === index;

                        return (
                            <div
                                key={month}
                                className={`group border border-slate-200 ${accent.ring} border-l-4 rounded-lg overflow-hidden transition-[box-shadow] hover:shadow-md ${isCurrentMonth ? 'ring-2 ring-amber-300 ring-offset-1' : ''}`}
                            >
                                <div className={`px-4 py-2.5 border-b border-slate-200 flex items-center justify-between ${accent.bg}`}>
                                    <div className="flex items-center gap-2">
                                        <h4 className={`text-sm ${accent.text}`}>{month}</h4>
                                        <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                            {accent.label}
                                        </span>
                                        {isCurrentMonth && (
                                            <span className="text-[10px] uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                                                En cours
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                                        {monthActivities.length}
                                    </span>
                                </div>

                                <div className="p-3 min-h-[280px] bg-white">
                                    {monthActivities.length === 0 ? (
                                        <div className="text-center text-slate-400 py-10">
                                            <IconCalendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                            <p className="text-xs">Aucune activité planifiée</p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const monthDate = new Date(year, index, 1);
                                                    form.setFieldValue('month', monthDate);
                                                    setOpened(true);
                                                }}
                                                className="mt-3 text-xs text-amber-700 hover:text-amber-800 hover:underline inline-flex items-center gap-1"
                                            >
                                                <IconPlus size={12} />
                                                Ajouter en {monthsShort[index]}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {monthActivities.map(activity => (
                                                <ActivityCard
                                                    key={activity.id}
                                                    activity={activity}
                                                    CategoryIcon={getCategoryIcon(activity.category)}
                                                    getCategoryColor={getCategoryColor}
                                                    getCategoryLabel={getCategoryLabel}
                                                    getStatusColor={getStatusColor}
                                                    onDelete={handleDeleteActivity}
                                                    empMap={empMap}
                                                    onEdit={(activity) => {
                                                        setSelectedActivity(activity);
                                                        setOpened(true);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal — Nouvelle / Modifier activité */}
            <Modal
                opened={opened}
                onClose={() => {
                    setOpened(false);
                    setSelectedActivity(null);
                }}
                title={
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-100 border border-amber-200">
                            <IconCalendarStats size={16} className="text-amber-700" />
                        </div>
                        <h2 className="text-base text-slate-900">
                            {selectedActivity ? "Modifier l'activité" : "Nouvelle activité HSE"}
                        </h2>
                    </div>
                }
                centered
                size="lg"
                classNames={{
                    body: 'p-6',
                    header: 'border-b border-slate-200 mx-2',
                }}
                overlayProps={{
                    backgroundOpacity: 0.55,
                    blur: 3,
                }}
            >
                {/* LOT 40 P1: responsive 2-col grid */}
                <form onSubmit={form.onSubmit(handleSaveActivity)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <TextInput
                            size="sm"
                            label="Titre de l'activité"
                            placeholder="Ex. Causerie sécurité — Risques de chute"
                            withAsterisk
                            {...form.getInputProps("title")}
                        />
                    </div>

                    <MonthPickerInput
                        size="sm"
                        label="Mois de planification"
                        placeholder="Sélectionner le mois"
                        withAsterisk
                        {...form.getInputProps("month")}
                    />

                    <DateTimePicker
                        size="sm"
                        label="Date et heure"
                        placeholder="Sélectionner date et heure"
                        {...form.getInputProps("dateTime")}
                    />

                    <Select
                        size="sm"
                        data={emps}
                        label="Responsable"
                        placeholder="Sélectionner un responsable"
                        withAsterisk
                        searchable
                        renderOption={renderSelectOption}
                        {...form.getInputProps("responsibleId")}
                    />

                    <Select
                        size="sm"
                        data={[
                            { label: "IGP : Inspection HSE", value: "IGP" },
                            { label: "RSS : Réunion sécurité", value: "HSE" },
                            { label: "TDM : Tournée Leadership", value: "TDM" },
                        ]}
                        label="Catégorie"
                        placeholder="Sélectionner la catégorie"
                        withAsterisk
                        {...form.getInputProps("category")}
                    />

                    {(form.values.category === 'HSE' || form.values.category === 'TDM') && (
                        <div className="col-span-2">
                            <Select
                                size="sm"
                                label="Thème"
                                placeholder={
                                    themeOptions.length
                                        ? 'Sélectionner un thème'
                                        : `Aucun thème défini pour ${year}`
                                }
                                data={themeOptions}
                                disabled={!themeOptions.length}
                                searchable
                                clearable
                                description={
                                    themeOptions.length
                                        ? undefined
                                        : 'Définissez les sujets de l’année dans « Thèmes mensuels » pour pouvoir en associer un.'
                                }
                                {...form.getInputProps('theme')}
                            />
                        </div>
                    )}

                    <div className="flex col-span-2 items-center justify-end gap-2 pt-2">
                        {/* LOT 40 P1: explicit type for non-submit cancel button */}
                        <Button
                            type="button"
                            variant="default"
                            onClick={() => {
                                setOpened(false);
                                setSelectedActivity(null);
                            }}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" color="amber">
                            {selectedActivity ? "Mettre à jour" : "Créer l'activité"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
