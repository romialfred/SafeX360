import React, { useEffect, useState } from 'react';
import {
    IconPlus,
    IconCalendar,
    IconUsers,
    IconRoute,
    IconShield,
} from '@tabler/icons-react';
import ActivityCard from './ActivityCard';
import { Button, Group, Modal, Select, SelectProps, Text, TextInput } from '@mantine/core';
import { DateTimePicker, MonthPickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { createActivity, updateActivity } from '../../../services/HSEActivityService';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import { useDispatch } from 'react-redux';






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
    allActivities: any[]; // Optional prop to pass all activities
    setAllActivities: (activities: any[]) => void; // Function to update all activities

}

export default function AnnualPlanningGrid({ year, selectedMonth, selectedCategory, selectedDepartment, selectedEmployee, onStatsUpdate, onEmployeesUpdate, planningStats: _planningStats, emps, empMap, allActivities, setAllActivities }: AnnualPlanningGridProps) {


    const [opened, setOpened] = useState(false);


    const dispatch = useDispatch();
    const [selectedActivity, setSelectedActivity] = useState<any | null>(null);


    useEffect(() => {
        // getActivitiesByYear(new Date().getFullYear()).
        //     then((res) => {
        //         console.log(res);
        //         setActivities(res);
        //     }).catch(() => { })

    }, [])
    const filteredActivities = allActivities.filter(activity => {
        // Month filter
        const matchesMonth = selectedMonth === 'all' || (activity.month && (activity.month.endsWith(`-${String(selectedMonth).padStart(2, '0')}-01`) || activity.month === selectedMonth));
        // Department filter
        const matchesDepartment = selectedDepartment === 'all' || activity.department === selectedDepartment;
        // Employee filter
        const matchesEmployee = selectedEmployee === 'all' || String(activity.responsibleId) === selectedEmployee || activity.responsibleId === selectedEmployee;
        // Category filter (strict equality, match string)
        const matchesCategory = selectedCategory === 'all' || (activity.category && activity.category.toString() === selectedCategory);
        return matchesMonth && matchesDepartment && matchesEmployee && matchesCategory;
        // return matchesCategory;
    });
    const themesReunions = [
        'Safety training',
        'Incident analysis',
        'Safety orientation',
        'Risk prevention',
        'Protection equipment',
        'Emergency procedures',
        'Continuous improvement',
        'Lessons learned',
    ];

    const themesTournees = [
        'Field visit',
        'Safety audit',
        'Process control',
        'General inspection',
        'Risk assessment',
        'Action follow-up',
        'Behavioral observation',
        'Safety dialogue',
    ];

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
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
            case 'TDM': return 'bg-purple-500/10 text-purple-700 border-purple-200';
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
            case 'HSE': return 'Meeting Managers';
            case 'TDM': return 'TDM';
            default: return 'IGP';
        }
    };


    // Only filter by month for each column, all other filters are already applied in parent
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
            title: (value) => (value ? null : "Title is required"),
            responsibleId: (value) => (value ? null : "Resposible is required"),
            category: (value) => (value ? null : "Category is required"),
            // dateTime: (value) => (value ? null : "Date and Time is required"),
            month: (value) => (value ? null : "Month is required")
        },
    });


    useEffect(() => {
        if (selectedActivity) {
            console.log(selectedActivity)
            // Parse month string (YYYY-MM-01) to Date
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



    const handleSaveActivity = async (values: any) => {
        dispatch(showOverlay());

        // Month as YYYY-MM-01 string
        let monthStr = '';
        if (values.month instanceof Date && !isNaN(values.month as any)) {
            const y = values.month.getFullYear();
            const m = String(values.month.getMonth() + 1).padStart(2, '0');
            monthStr = `${y}-${m}-01`;
        }

        const payload = {
            title: values.title,
            responsibleId: values.responsibleId,
            category: values.category,
            dateTime: values.dateTime,
            month: monthStr,
            theme: values.theme || null,
        };

        try {
            let newActivities;
            if (selectedActivity && selectedActivity.id) {
                await updateActivity({ ...payload, id: selectedActivity.id });
                newActivities = allActivities.map(act => act.id === selectedActivity.id ? { ...act, ...payload, id: selectedActivity.id } : act);
                successNotification('Activity updated successfully');
            } else {
                const created = await createActivity(payload);
                // If API returns the created object, use it; else, fallback to payload
                const newActivity = created && created.id ? created : { ...payload, id: Date.now().toString() };
                newActivities = [...allActivities, newActivity];
                successNotification('Activity added successfully');
            }

            setAllActivities(newActivities);

            // Update employees list
            const uniqueEmployees = Array.from(new Set(newActivities.map(activity => activity.responsible))).sort();
            if (onEmployeesUpdate) {
                onEmployeesUpdate(uniqueEmployees);
            }

            // Update stats
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
            errorNotification(err.response?.data?.errorMessage || 'Something went wrong');
        } finally {
            dispatch(hideOverlay());
        }
    };

    const renderSelectOption: SelectProps['renderOption'] = ({ option }: any) => (<Group wrap='nowrap'>
        < div >
            <Text size="sm" className="flex gap-2">{option.label}  </Text>
            <Text size="xs" color="dimmed">
                {empMap[option.value]?.department}
            </Text>
        </div >
    </Group >
    );

    const handleDeleteActivity = (id: string) => {
        setAllActivities(allActivities.filter(activity => activity.id !== id));
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
        <div className="bg-white rounded-lg shadow-md border border-gray-300">
            <div className="p-4">
                {/* Title with Summary Tiles on same line */}
                <div className="flex flex-col gap-8 mb-4">
                    <div className='flex justify-between items-center'>
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">Annual Planning {year}</h3>
                            <p className="text-sm text-slate-600">Overview of HSE activities by month</p>
                        </div>

                        <div>
                            <Button
                                leftSection={<IconPlus />}
                                onClick={() => handleAddActivity()}
                                className="p-1 hover:bg-teal-100 rounded text-teal-600 transition-colors"

                            >

                                Add New Activity
                            </Button>
                        </div>
                    </div>
                    {/* <div` className='  p-3 rounded-xl shadow-sm bg-blue-50 border border-blue-200'>
                        <div className="grid grid-cols-3 gap-6 ">
                            <div className="bg-green-50 rounded-lg flex flex-col items-center  p-3  shadow-sm">
                                <div className="text-xs text-slate-600 ">Total IGP</div>
                                <div className="text-xl font-bold text-green-700">{planningStats.igp}</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3  text-center shadow-sm">
                                <div className="text-xs text-slate-600 mb-1">Total RSS</div>
                                <div className="text-xl font-bold text-purple-700">{planningStats.rss}</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3  text-center shadow-sm">
                                <div className="text-xs text-slate-600 mb-1">Total TDM</div>
                                <div className="text-xl font-bold text-green-700">{planningStats.tdm}</div>
                            </div>
                        </div>

                    </div>` */}

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {months.map((month: any, index: any) => {
                        // If a specific month is selected, only show that month
                        if (selectedMonth !== 'all' && parseInt(selectedMonth) !== index + 1) {
                            return null;
                        }

                        const monthActivities = getFilteredActivities(index);
                        return (
                            <div key={month} className="border border-slate-200 rounded-lg">
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                    <h4 className="font-semibold text-slate-800">{month}</h4>

                                </div>

                                <div className="p-4 min-h-[300px]">
                                    {monthActivities.length === 0 ? (
                                        <div className="text-center text-slate-400 py-8">
                                            <IconCalendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No planned activities</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
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
                                                        setOpened(true); // Open modal for edit
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

            {/* Modal d'ajout d'activité */}
            <Modal
                opened={opened}
                onClose={() => {
                    setOpened(false);
                    setSelectedActivity(null); // ✅ Reset edit mode
                }}
                title={
                    <h1 className="text-lg font-medium text-blue-500">
                        {selectedActivity ? 'Edit Activity' : `New Activity`}
                    </h1>
                }
                centered
                size="lg"
                overlayProps={{
                    backgroundOpacity: 0.55,
                    blur: 3,
                }}>
                <div className="">
                    <div className="">

                        <form onSubmit={form.onSubmit(handleSaveActivity)} className="!grid !grid-cols-2 gap-5">
                            <div className='col-span-2'>

                                <TextInput
                                    size="sm"
                                    label="Tilte"
                                    {...form.getInputProps("title")}


                                    withAsterisk
                                    placeholder="Activity title"

                                />
                            </div>
                            <MonthPickerInput label="Pick Month" withAsterisk placeholder='Select Month' {...form.getInputProps("month")} />



                            <DateTimePicker
                                size="sm"
                                label="Date and Time"

                                placeholder="Enter Date and Time"
                                {...form.getInputProps("dateTime")}
                            />
                            <Select
                                data={emps}
                                size="sm"
                                label="Responsible"
                                placeholder='Select Responsible'
                                withAsterisk
                                renderOption={renderSelectOption}
                                {...form.getInputProps("responsibleId")}
                            />




                            <Select
                                data={[
                                    { label: "IGP (General Inspection)", value: "IGP" },
                                    { label: "Meeting Managers", value: "HSE" },
                                    { label: "TDM (Leadership Walk)", value: "TDM" },
                                ]}
                                label="Category"
                                placeholder='Select Category'
                                withAsterisk
                                size="sm"
                                {...form.getInputProps("category")}
                            />



                            {(form.values.category === 'rss' || form.values.category === 'tdm') && (
                                <div>

                                    <Select
                                        label="Theme"
                                        placeholder="Select a theme"
                                        size="sm"
                                        data={(form.values.category === 'rss' ? themesReunions : themesTournees).map(t => ({ label: t, value: t }))}
                                        {...form.getInputProps('theme')}
                                    />
                                </div>
                            )}

                            <div className="flex col-span-2 items-center justify-center">

                                <Button type="submit">
                                    {selectedActivity ? 'Update' : 'Add'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
