import { useEffect, useState } from 'react';
import ThemeCard from './ThemeCard';
import { IconBook, IconBookmark, IconPlus } from '@tabler/icons-react';
import { Button, Modal, Select, Textarea, TextInput } from '@mantine/core';
import { modals } from '@mantine/modals';
import PageHeader from '../../UtilityComp/PageHeader';
import EmptyState from '../../UtilityComp/EmptyState';
import { useForm } from '@mantine/form';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { createTheme, deleteTheme, getThemesByYear, updateTheme } from '../../../services/HSEThemeService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import {
    MONTHS_FR,
    THEME_CATEGORY_OPTIONS,
    THEME_TYPE_CONFIG,
    THEME_TYPE_OPTIONS,
    themeTypeConfig,
} from '../planningLabels';

/**
 * Thèmes mensuels des causeries et tournées : répartition par type,
 * calendrier annuel par mois, création / modification / suppression.
 */

/** Convertit un thème renvoyé par l'API vers le format interne d'affichage. */
const mapTheme = (item: any) => {
    const currentYear = new Date().getFullYear();
    let monthIdx = 0;
    let monthStr = '';
    if (item.month) {
        if (typeof item.month === 'string' && item.month.includes('-')) {
            monthIdx = parseInt(item.month.split('-')[1], 10) - 1;
            monthStr = item.month;
        } else if (typeof item.month === 'number') {
            monthIdx = item.month - 1;
            monthStr = `${currentYear}-${String(item.month).padStart(2, '0')}-01`;
        }
    }
    return {
        ...item,
        month: monthStr,
        _monthIdx: monthIdx,
    };
};

export default function ThemeManagement() {
    const [themes, setThemes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();
    const [opened, setOpened] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState<any | null>(null);
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        setLoading(true);
        getThemesByYear(currentYear)
            .then((data) => {
                setThemes((data ?? []).map(mapTheme));
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Échec du chargement des thèmes');
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const form = useForm({
        initialValues: {
            title: '',
            description: '',
            category: undefined as any,
            type: '',
            month: undefined as any,
        },
        validate: {
            title: (value) => (value?.trim() ? null : "L'intitulé du thème est obligatoire"),
            description: (value) => (value?.trim() ? null : 'La description est obligatoire'),
            type: (value) => (value ? null : 'Le type est obligatoire'),
            month: (value) => (value ? null : 'Le mois est obligatoire'),
        },
    });

    const handleSaveTheme = async (values: any) => {
        dispatch(showOverlay());

        const payload = {
            title: values.title.trim(),
            description: values.description.trim(),
            category: values.category || null,
            type: values.type,
            month: `${currentYear}-${String(MONTHS_FR.indexOf(values.month) + 1).padStart(2, '0')}-01`,
        };

        try {
            if (selectedTheme && selectedTheme.id) {
                const updatedTheme = await updateTheme({ ...payload, id: selectedTheme.id });
                const mapped = mapTheme({ ...updatedTheme, id: selectedTheme.id });
                setThemes((prev) => prev.map((theme) => (theme.id == selectedTheme.id ? mapped : theme)));
                successNotification('Thème mis à jour');
            } else {
                const newTheme = await createTheme(payload);
                setThemes((prev) => [...prev, mapTheme(newTheme)]);
                successNotification('Thème ajouté au calendrier');
            }

            form.reset();
            setOpened(false);
            setSelectedTheme(null);
        } catch (err: any) {
            errorNotification(err.response?.data?.errorMessage || "L'enregistrement a échoué");
        } finally {
            dispatch(hideOverlay());
        }
    };

    useEffect(() => {
        if (selectedTheme) {
            let monthName = '';
            if (selectedTheme.month && typeof selectedTheme.month === 'string' && selectedTheme.month.includes('-')) {
                const monthIdx = parseInt(selectedTheme.month.split('-')[1], 10) - 1;
                if (monthIdx >= 0 && monthIdx < MONTHS_FR.length) {
                    monthName = MONTHS_FR[monthIdx];
                }
            }
            form.setValues({
                title: selectedTheme.title || '',
                description: selectedTheme.description || '',
                category: selectedTheme.category || '',
                type: selectedTheme.type || '',
                month: monthName || '',
            });
        } else {
            form.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTheme]);

    const handleDeleteTheme = (theme: any) => {
        modals.openConfirmModal({
            title: <span className="text-base">Supprimer le thème</span>,
            centered: true,
            children: (
                <span className="text-sm">
                    Souhaitez-vous supprimer le thème : <strong>{theme.title}</strong> ? Cette action est irréversible.
                </span>
            ),
            labels: { confirm: 'Oui, supprimer', cancel: 'Annuler' },
            cancelProps: { color: 'gray', variant: 'default' },
            confirmProps: { color: 'red', variant: 'filled' },
            onConfirm: () => {
                dispatch(showOverlay());
                deleteTheme(theme.id)
                    .then(() => {
                        successNotification('Thème supprimé du calendrier');
                        setThemes((prev) => prev.filter((t) => t.id !== theme.id));
                    })
                    .catch((err) => {
                        errorNotification(err.response?.data?.errorMessage || 'La suppression a échoué');
                    })
                    .finally(() => dispatch(hideOverlay()));
            },
        });
    };

    const getThemesByMonth = (monthIndex: number) => themes.filter((theme) => theme._monthIdx === monthIndex);

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Planification annuelle', to: '/hs-activities-planning' },
                    { label: 'Thèmes mensuels' },
                ]}
                icon={<IconBookmark size={22} stroke={2} />}
                iconColor="amber"
                title="Thèmes mensuels"
                subtitle="Calendrier des sujets de causeries sécurité et de tournées Leadership"
                actions={
                    <Button color="amber" size="sm" leftSection={<IconPlus size={15} />} onClick={() => setOpened(true)}>
                        Nouveau thème
                    </Button>
                }
            />

            {/* Répartition par type */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2.5">
                    <h2
                        className="text-slate-800"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontSize: '14px',
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        Répartition par type
                    </h2>
                    <span className="text-[11.5px] text-slate-500">
                        {loading ? 'Chargement…' : `${themes.length} thème${themes.length > 1 ? 's' : ''} en ${currentYear}`}
                    </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {Object.entries(THEME_TYPE_CONFIG).map(([typeId, cfg]) => {
                        const count = themes.filter((theme) => theme.type === typeId).length;
                        return (
                            <div key={typeId} className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} aria-hidden="true" />
                                <div className="min-w-0">
                                    <p className="text-[15px] text-slate-800 tabular-nums leading-tight">{loading ? '…' : count}</p>
                                    <p className="text-[10.5px] uppercase tracking-wider text-slate-500 truncate">{cfg.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Calendrier annuel */}
            <div className="bg-white rounded-xl border border-slate-200">
                <div className="px-4 py-3 border-b border-slate-200">
                    <h2
                        className="text-slate-800"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontSize: '14px',
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        Thèmes par mois
                    </h2>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                        Sujets retenus pour les réunions sécurité (RSS) et les tournées Leadership (TDM)
                    </p>
                </div>

                <div className="p-4">
                    {loading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3" aria-busy="true">
                            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                                <div key={i} className="h-40 rounded-lg bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : !themes.length ? (
                        <EmptyState
                            icon={<IconBook size={24} />}
                            title="Aucun thème défini pour l'année"
                            description="Planifiez les premiers sujets de causeries pour cadrer les réunions sécurité et tournées Leadership."
                            compact
                            action={
                                <Button size="xs" color="amber" leftSection={<IconPlus size={14} />} onClick={() => setOpened(true)}>
                                    Nouveau thème
                                </Button>
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                            {MONTHS_FR.map((month, index) => {
                                const monthThemes = getThemesByMonth(index);
                                return (
                                    <div key={month} className="border border-slate-200 rounded-lg overflow-hidden">
                                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                                            <h3 className="text-[13px] text-slate-800">{month}</h3>
                                            <span className="text-[10.5px] text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded tabular-nums">
                                                {monthThemes.length} thème{monthThemes.length > 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        <div className="p-3 min-h-[120px]">
                                            {monthThemes.length === 0 ? (
                                                <div className="text-center text-slate-400 py-5">
                                                    <IconBook className="w-6 h-6 mx-auto mb-1.5 opacity-50" aria-hidden="true" />
                                                    <p className="text-[11.5px]">Aucun thème défini</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {monthThemes.map((theme) => (
                                                        <ThemeCard
                                                            key={theme.id}
                                                            theme={theme}
                                                            typeInfo={themeTypeConfig(theme.type)}
                                                            onEdit={(t) => {
                                                                setSelectedTheme(t);
                                                                setOpened(true);
                                                            }}
                                                            onDelete={handleDeleteTheme}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal d'ajout / modification de thème */}
            <Modal
                opened={opened}
                onClose={() => {
                    setOpened(false);
                    setSelectedTheme(null);
                }}
                title={
                    <span
                        className="text-slate-800"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontSize: '15px',
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {selectedTheme ? 'Modifier le thème' : 'Nouveau thème mensuel'}
                    </span>
                }
                centered
                size="lg"
                overlayProps={{
                    backgroundOpacity: 0.55,
                    blur: 3,
                }}
            >
                <form onSubmit={form.onSubmit(handleSaveTheme)} className="space-y-3">
                    <TextInput
                        label="Intitulé du thème"
                        placeholder="ex. Prévention des chutes de hauteur en zone de concassage"
                        withAsterisk
                        size="sm"
                        {...form.getInputProps('title')}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Select
                            data={MONTHS_FR}
                            label="Mois"
                            placeholder="Choisir le mois"
                            withAsterisk
                            size="sm"
                            {...form.getInputProps('month')}
                        />
                        <Select
                            label="Catégorie d'activité"
                            data={THEME_CATEGORY_OPTIONS}
                            placeholder="Choisir la catégorie"
                            size="sm"
                            {...form.getInputProps('category')}
                        />
                    </div>
                    <Select
                        label="Type"
                        data={THEME_TYPE_OPTIONS}
                        placeholder="Choisir le type"
                        withAsterisk
                        size="sm"
                        {...form.getInputProps('type')}
                    />
                    <Textarea
                        label="Description"
                        withAsterisk
                        placeholder="Objectif du thème, messages clés à faire passer aux équipes"
                        minRows={3}
                        autosize
                        size="sm"
                        {...form.getInputProps('description')}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => {
                                setOpened(false);
                                setSelectedTheme(null);
                            }}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" color="teal" size="sm">
                            {selectedTheme ? 'Enregistrer les modifications' : 'Ajouter le thème'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
