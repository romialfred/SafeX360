import { useEffect, useState } from 'react';
import ThemeCard from './ThemeCard';
import {
    IconPlus,
    IconBook,
    IconUsers,
    IconRoute,
    IconShield,
    IconLeaf,
    IconHeart,
    IconAlertTriangle,
    IconFlag,
} from '@tabler/icons-react';
import { Button, Modal, Select, Textarea, TextInput } from '@mantine/core';
import PageHeader from '../../UtilityComp/PageHeader';
import { IconBookmark } from '@tabler/icons-react';
import { themeData } from '../../../Data/DummyData';
import { useForm } from '@mantine/form';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { createTheme, getThemesByYear, updateTheme } from '../../../services/HSEThemeService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';


const types = [
    { id: 'securite', label: 'Security', color: 'bg-red-500', icon: IconShield },
    { id: 'environnement', label: 'Environment', color: 'bg-green-600', icon: IconLeaf },
    { id: 'sante-securite', label: 'Health Safety', color: 'bg-blue-500', icon: IconHeart },
    { id: 'sensibilisation', label: 'Awareness', color: 'bg-orange-500', icon: IconAlertTriangle },
    { id: 'programme-national', label: 'National Program', color: 'bg-purple-600', icon: IconFlag }
];

const categories = [
    { id: 'health-safety-meeting', label: 'RSS', color: 'bg-green-500', icon: IconUsers },
    { id: 'management-tour', label: 'TDM', color: 'bg-purple-500', icon: IconRoute }
];

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const typeOptions = [
    { label: "Security", value: "securite" },
    { label: "Environment", value: "environnement" },
    { label: "Health Safety", value: "sante-securite" },
    { label: "Awareness", value: "sensibilisation" },
    { label: "National Program", value: "programme-national" },
];
const categoryOptions = [
    { label: "Health & Safety Meeting", value: "RSS" },
    { label: "Leadership Walk", value: "TDM" },
];
export default function ThemeManagement() {
    const [themes, setThemes] = useState<any[]>(themeData);
    const dispatch = useDispatch();
    const [opened, setOpened] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<any | null>(null);


    useEffect(() => {
        dispatch(showOverlay());
        getThemesByYear(new Date().getFullYear()).then((data) => {
            const currentYear = new Date().getFullYear();
            // Map API data to expected format for UI, but keep original category/month for display
            const mapped = data.map((item: any) => {
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
                // Keep original category for display, but add internalCategory for grouping
                let internalCategory = item.category;
                if (internalCategory === 'TDM') internalCategory = 'management-tour';
                if (internalCategory === 'RSS') internalCategory = 'health-safety-meeting';
                return {
                    ...item,
                    month: monthStr, // keep original string for display
                    _monthIdx: monthIdx, // for grouping
                    _internalCategory: internalCategory, // for grouping
                };
            });
            setThemes(mapped);
            console.log(mapped);
        }).catch(() => { }).finally(() => {
            dispatch(hideOverlay());
        })
    }, []);

    const form = useForm({
        initialValues: {
            title: "",
            description: '',
            category: undefined,
            type: '',
            month: undefined as any,

        },
        validate: {
            title: (value) => (value ? null : "Title is required"),
            description: (value) => (value ? null : "Description is required"),
            // category: (value) => (value ? null : "Category is required"),
            type: (value) => (value ? null : "Type is required"),
            month: (value) => (value ? null : "Month is required")
        },

    });

    const handleSaveTheme = async (values: any) => {
        dispatch(showOverlay());

        const currentYear = new Date().getFullYear();
        const payload = {
            title: values.title,
            description: values.description,
            category: values.category,
            type: values.type,
            month: `${currentYear}-${String(months.indexOf(values.month) + 1).padStart(2, '0')}-01`
        };

        // Helper to map API theme to UI format
        const mapTheme = (item: any) => {
            let monthIdx = 0;
            let monthStr = '';
            const year = new Date().getFullYear();
            if (item.month) {
                if (typeof item.month === 'string' && item.month.includes('-')) {
                    monthIdx = parseInt(item.month.split('-')[1], 10) - 1;
                    monthStr = item.month;
                } else if (typeof item.month === 'number') {
                    monthIdx = item.month - 1;
                    monthStr = `${year}-${String(item.month).padStart(2, '0')}-01`;
                }
            }
            let internalCategory = item.category;
            if (internalCategory === 'TDM') internalCategory = 'management-tour';
            if (internalCategory === 'RSS') internalCategory = 'health-safety-meeting';
            return {
                ...item,
                month: monthStr,
                _monthIdx: monthIdx,
                _internalCategory: internalCategory,
            };
        };

        try {
            if (selectedActivity && selectedActivity.id) {
                const updatedTheme = await updateTheme({ ...payload, id: selectedActivity.id });
                const mappedTheme = mapTheme({ ...updatedTheme, id: selectedActivity.id });
                setThemes(themes =>
                    themes.map(theme =>
                        theme.id == selectedActivity.id ? mappedTheme : theme
                    )
                );
                successNotification('Theme updated successfully');
            } else {
                const newTheme = await createTheme(payload);
                const mappedTheme = mapTheme(newTheme);
                setThemes(themes => [...themes, mappedTheme]);
                successNotification('Theme added successfully');
            }

            form.reset();
            setOpened(false);
            setSelectedActivity(null);

        } catch (err: any) {
            errorNotification(err.response?.data?.errorMessage || 'Something went wrong');
        } finally {
            dispatch(hideOverlay());
        }
    };


    useEffect(() => {
        if (selectedActivity) {
            // Convert month string (e.g., '2025-02-01') to month name for Select
            let monthName = '';
            if (selectedActivity.month && typeof selectedActivity.month === 'string' && selectedActivity.month.includes('-')) {
                const monthIdx = parseInt(selectedActivity.month.split('-')[1], 10) - 1;
                if (monthIdx >= 0 && monthIdx < months.length) {
                    monthName = months[monthIdx];
                }
            }
            form.setValues({
                title: selectedActivity.title || '',
                description: selectedActivity.description || '',
                category: selectedActivity.category || '',
                type: selectedActivity.type || '',
                month: monthName || '',
            });
        } else {
            form.reset();
        }
    }, [selectedActivity]);



    const handleDeleteTheme = (id: string) => {
        if (confirm('Are you sure you want to delete this theme?')) {
            setThemes(themes.filter(theme => theme.id !== id));
        }
    };

    // Use internal category for grouping, but show original category in card
    const getCategoryInfo = (categoryId: string) => {
        // Accept both internal and API category
        if (categoryId === 'TDM') return categories.find(cat => cat.label === 'TDM') || categories[1];
        if (categoryId === 'RSS') return categories.find(cat => cat.label === 'RSS') || categories[0];
        return categories.find(cat => cat.id === categoryId) || categories[0];
    };

    const getTypeInfo = (typeId: string) => {
        return types.find(type => type.id === typeId) || types[0];
    };

    // Group by month index, but keep original month string for display
    const getThemesByMonth = (monthIndex: number) => {
        return themes.filter(theme => theme._monthIdx === monthIndex);
    };

    // const getTotalParticipants = () => {
    //     return themes.reduce((total, theme) => total + (theme.participants || 0), 0);
    // };

    // const getTotalThemes = () => {
    //     return themes.length;
    // };

    return (
        <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Planification annuelle', to: '/hs-activities-planning' },
                    { label: 'Thèmes mensuels' },
                ]}
                icon={<IconBookmark size={22} stroke={2} />}
                iconColor="amber"
                title="Thèmes mensuels"
                subtitle="Organisation et standardisation des sujets de causeries pour s'aligner avec les objectifs sécurité"
                actions={
                    <Button color="amber" size="sm" leftSection={<IconPlus size={15} />} onClick={() => setOpened(true)}>
                        Nouveau thème
                    </Button>
                }
            />
            <div className='border p-4 rounded-lg border-gray-300 shadow-sm flex flex-col gap-6'>

                <div className="flex flex-col gap-5">
                    {/* Types Overview - En haut */}
                    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-300">
                        {/* <h3 className="text-lg text-slate-800 mb-4">Distribution by Type</h3> */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {types.map((type) => {
                                const typeThemes = themes.filter(theme => theme.type === type.id);
                                const TypeIcon = type.icon;
                                return (
                                    <div key={type.id} className="text-center">
                                        <div className={`w-12 h-12 ${type.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                                            <TypeIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="text-lg text-slate-800">{typeThemes.length}</div>
                                        <div className="text-xs text-slate-600">{type.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 ">
                        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
                            <h3 className="text-lg text-slate-800 mb-4">Passed Themes</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-2xl text-teal-600">{getTotalThemes()}</div>
                                    <div className="text-sm text-slate-600">Total Themes</div>
                                </div>
                                <div>
                                    <div className="text-2xl text-blue-600">{getTotalParticipants()}</div>
                                    <div className="text-sm text-slate-600">Total Participants</div>
                                </div>
                            </div>
                        </div>

                        {categories.map((category) => {
                            const categoryThemes = themes.filter(theme => theme.category === category.id);
                            const categoryParticipants = categoryThemes.reduce((total, theme) => total + (theme.participants || 0), 0);
                            const CategoryIcon = category.icon;
                            return (
                                <div key={category.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
                                    <div className="flex items-center mb-4">
                                        <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center mr-3`}>
                                            <CategoryIcon className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-slate-800">{category.label}</h3>
                                            <p className="text-sm text-slate-600">{categoryThemes.length} thème(s) défini(s)</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-2xl text-slate-800">{categoryThemes.length}</div>
                                            <div className="text-sm text-slate-600">Thèmes</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl text-blue-600">{categoryParticipants}</div>
                                            <div className="text-sm text-slate-600">Participants</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div> */}

                    <div className="bg-white rounded-lg shadow-md border border-gray-300">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-lg text-slate-800">Themes by Month</h3>
                            <p className="text-sm text-slate-600 mt-1">
                                Theme management for health safety meetings and management tours
                            </p>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                                {months.map((month, index) => {
                                    const monthThemes = getThemesByMonth(index);
                                    // const monthParticipants = monthThemes.reduce((total, theme) => total + (theme.participants || 0), 0);
                                    return (
                                        <div key={month} className="border border-slate-200 rounded-lg">
                                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                                <h4 className="text-slate-800">{month}</h4>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                                        {monthThemes.length} theme(s)
                                                    </span>
                                                    {/* <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                                        {monthParticipants} participants
                                                    </span> */}
                                                </div>
                                            </div>

                                            <div className="p-4 min-h-[200px]">
                                                {monthThemes.length === 0 ? (
                                                    <div className="text-center text-slate-400 py-8">
                                                        <IconBook className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm">No theme defined</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {monthThemes.map(theme => (
                                                            <ThemeCard
                                                                key={theme.id}
                                                                theme={{
                                                                    ...theme,
                                                                    // Show original category and month string in card
                                                                    category: theme.category,
                                                                    month: theme.month,
                                                                }}
                                                                categoryInfo={getCategoryInfo(theme.category)}
                                                                typeInfo={getTypeInfo(theme.type)}
                                                                onEdit={(theme) => {
                                                                    setSelectedActivity(theme);
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
                        </div>
                    </div>
                </div>
            </div>
            {/* Modal d'ajout/modification de thème */}
            <Modal
                opened={opened}
                onClose={() => {
                    setOpened(false);
                    setSelectedActivity(null); // ✅ Reset edit mode
                }}
                title={<h1 className="text-lg text-blue-500">
                    {selectedActivity ? 'Edit Theme' : 'New Theme'}
                </h1>
                }
                centered
                size="xl"
                overlayProps={{
                    backgroundOpacity: 0.55,
                    blur: 3,
                }}>
                <div className="">
                    <div className="">

                        <form onSubmit={form.onSubmit(handleSaveTheme)} className="space-y-4">     <div>

                            <TextInput
                                label="Theme"
                                type="text"
                                {...form.getInputProps("title")}
                                placeholder="Theme title"
                                withAsterisk
                            />
                        </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>

                                    <Select
                                        data={months}
                                        label="Month"
                                        placeholder='Select Month'
                                        withAsterisk
                                        {...form.getInputProps("month")}
                                    />
                                </div>

                                <div>

                                    <Select
                                        label="Category"
                                        data={categoryOptions}
                                        placeholder='Select Category'

                                        {...form.getInputProps("category")}
                                    />


                                </div>
                            </div>

                            <div>

                                <Select
                                    label="Type"
                                    data={typeOptions}
                                    placeholder='Select Type'
                                    withAsterisk
                                    {...form.getInputProps("type")}
                                >

                                </Select>
                            </div>



                            <div>

                                <Textarea
                                    label="Description"
                                    withAsterisk
                                    placeholder="Detailed theme description"
                                    {...form.getInputProps("description")}

                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">

                                <Button
                                    type="submit"

                                >
                                    {selectedActivity ? 'Update' : 'Add'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div >
            </Modal >
        </div >
    );
}