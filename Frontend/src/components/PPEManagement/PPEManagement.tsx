import { useState } from 'react';
import PPEManagementDashboard from './PPEManagementDashboard';
import PPEEmployeeDetails from './PPEEmployeeDetails';

const PPEManagement = () => {
    const [view, _setView] = useState<'dashboard' | 'create' | 'stock' | 'employee' | 'requests'>('dashboard');
    // const [selectedEmployeeId, +setSelectedEmployeeId] = useState<string | null>(null);

    // const showDashboard = () => setView('dashboard');
    // const showCreateForm = () => setView('create');
    // const showStockForm = () => setView('stock');
    // const showRequests = () => setView('requests');
    // const showEmployeeDetails = (id: string) => { setSelectedEmployeeId(id); setView('employee'); };

    return (
        <div className='flex flex-col gap-4'>

            {view === 'dashboard' && (
                <PPEManagementDashboard


                />
            )}


            {view === 'employee' && (
                <PPEEmployeeDetails />
            )}

        </div>
    );
};

export default PPEManagement;
