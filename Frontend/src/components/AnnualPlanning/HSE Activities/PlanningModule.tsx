import { useEffect, useState } from 'react';
import { IconCalendar, IconChartBar, IconDownload } from '@tabler/icons-react';
import Dashboard from './Dashboard';
import AnnualPlanningGrid from './AnnualPlanningGrid';
import { Breadcrumbs, Button, Text, Select } from '@mantine/core';
import { Link } from 'react-router-dom';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { mapIdToName } from '../../../utility/OtherUtilities';
import { getActivitiesByYear } from '../../../services/HSEActivityService';


export default function PlanningModule() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [planningStats, setPlanningStats] = useState({ igp: 0, rss: 0, tdm: 0 });
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [_allEmployees, setAllEmployees] = useState<string[]>([]);
    const [emps, setEmps] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<any>({});
    const [activities, setActivities] = useState<any[]>([]);
    const categories = [
        { id: 'all', label: 'All Activities', color: 'bg-slate-500' },
        { id: 'IGP', label: 'IGP (General Inspection)', color: 'bg-blue-500' },
        { id: 'HSE', label: 'RSS (Health Safety Meeting)', color: 'bg-green-500' },
        { id: 'TDM', label: 'TDM (Leadership Walk)', color: 'bg-purple-500' },
    ];

    const departments = [
        { value: 'all', label: 'All Departments' },
        { value: 'Production', label: 'Production' },
        { value: 'Maintenance', label: 'Maintenance' },
        { value: 'Quality', label: 'Quality' },
        { value: 'HSE', label: 'HSE' },
        { value: 'Management', label: 'Management' }
    ];

    useEffect(() => {

        getEmployeesWithDepartment()
            .then((res) => {
                const mappedEmployees = res.map((emp: any) => ({
                    label: emp.name,
                    value: String(emp.id), // ensure value is string if form field is string
                }));
                setEmps(mappedEmployees);
                setEmpMap(mapIdToName(res));

            })
            .catch((_err) => { });
    }, [])
    useEffect(() => {
        if (!currentYear) return;
        getActivitiesByYear(currentYear).
            then((res) => {
                console.log(res);
                setActivities(res);
            }).catch(() => { })
    }, [currentYear]);




    return (
        <div className="  p-5 flex flex-col gap-5">
            {/* Header */}
            <div className="bg-white  flex flex-col ">

                <div className="flex justify-between items-center">
                    <div>
                        <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">HSE Planning</div>
                        <Breadcrumbs mt="xs">
                            <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>

                            <Text variant="gradient">HSE Planning</Text>
                        </Breadcrumbs>
                    </div>
                </div>
                <p className=' italic my-3'>
                    Organizing and scheduling safety meetings, trainings, and awareness events to enhance workplace safety culture
                </p>

                <div className='flex justify-between items-center p-3  rounded-lg shadow-sm'>

                    <div className="flex items-center  space-x-1">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard'
                                ? 'bg-primary text-white'
                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                                }`}
                        >
                            <IconChartBar className="w-4 h-4 mr-2" />
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('planning')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${activeTab === 'planning'
                                ? 'bg-primary text-white'
                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                                }`}
                        >
                            <IconCalendar className="w-4 h-4 mr-2" />
                            Planning
                        </button>
                    </div>

                    <div className="flex items-center space-x-3">

                        <Select
                            value={String(currentYear)}
                            onChange={(val) => val && setCurrentYear(parseInt(val))}
                            data={[-1, 0, 1].map(offset => {
                                const year = new Date().getFullYear() + offset;
                                return { value: String(year), label: String(year) };
                            })}
                            className="w-28"
                            size="sm"
                            label={undefined}
                            placeholder="Year"
                        />

                        <Select
                            value={selectedMonth}
                            onChange={(val) => val && setSelectedMonth(val)}
                            data={[
                                { value: 'all', label: 'All Months' },
                                { value: '1', label: 'January' },
                                { value: '2', label: 'February' },
                                { value: '3', label: 'March' },
                                { value: '4', label: 'April' },
                                { value: '5', label: 'May' },
                                { value: '6', label: 'June' },
                                { value: '7', label: 'July' },
                                { value: '8', label: 'August' },
                                { value: '9', label: 'September' },
                                { value: '10', label: 'October' },
                                { value: '11', label: 'November' },
                                { value: '12', label: 'December' },
                            ]}
                            className="w-36"
                            size="sm"
                            label={undefined}
                            placeholder="Month"
                        />

                        <Select
                            value={selectedDepartment}
                            onChange={(val) => val && setSelectedDepartment(val)}
                            data={departments}
                            className="w-40"
                            size="sm"
                            label={undefined}
                            placeholder="Department"
                        />

                        <Select
                            value={selectedEmployee}
                            onChange={(val) => val && setSelectedEmployee(val)}
                            data={[
                                { value: 'all', label: 'All Employees' },
                                ...emps
                            ]}
                            className="w-44"
                            size="sm"
                            label={undefined}
                            placeholder="Employee"
                            searchable
                        />

                        <Button leftSection={<IconDownload />}>


                            Export
                        </Button>
                    </div>
                </div>



            </div>

            <div className="">
                {activeTab === 'dashboard' ? (
                    <Dashboard
                        selectedMonth="Full Year"
                        selectedDepartment={selectedDepartment}
                        activities={activities}
                    />
                ) : (
                    <div className="space-y-2">
                        {/* Category tabs styled like severity tabs */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-300  p-3">
                            <div className="flex space-x-1">
                                {categories.map(category => {
                                    let count = 0;
                                    if (category.id === 'all') {
                                        count = activities.length;
                                    } else {
                                        count = activities.filter(a => a.category === category.id).length;
                                    }
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => setSelectedCategory(category.id)}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${selectedCategory === category.id
                                                ? 'bg-yellow-100 text-yellow-800 shadow-md border border-yellow-200'
                                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
                                                }`}
                                        >
                                            {category.id === 'all' ? 'All Activities' :
                                                category.id === 'IGP' ? 'IGP (General Inspection)' :
                                                    category.id === 'HSE' ? 'RSS (Health Safety Meeting)' :
                                                        'TDM (Leadership Walk)'}
                                            <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-200 text-xs font-semibold text-slate-700 align-middle">{count}</span>
                                        </button>
                                    );
                                })}
                            </div>


                        </div>


                        {/* Annual Planning Grid */}
                        <AnnualPlanningGrid
                            year={currentYear}
                            selectedMonth={selectedMonth}
                            selectedCategory={selectedCategory}
                            selectedDepartment={selectedDepartment}
                            selectedEmployee={selectedEmployee}
                            onStatsUpdate={setPlanningStats}
                            onEmployeesUpdate={setAllEmployees}
                            planningStats={planningStats}
                            emps={emps}
                            empMap={empMap}
                            allActivities={activities}
                            setAllActivities={setActivities}

                        />
                    </div>
                )}
            </div>
        </div>
    );
}