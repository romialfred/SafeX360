import { Breadcrumbs, Button, Text } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import AnnualDataFile from './AnnualDataFile';
import { IconArrowRight } from '@tabler/icons-react';






export default function AnnualAuditPlan() {
    const navigate = useNavigate();
    return (
        <div className="p-5 flex flex-col gap-5">
            {/* Header */}

            <div className="flex items-center justify-between">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">Annual Audit Plan (AAP)</div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/hs-activities-planning" ><Text variant="gradient" className="hover:!underline cursor-pointer">HSE Planning</Text></Link>
                        <Text variant="gradient">Annual Audit Plan (AAP)</Text>
                    </Breadcrumbs>
                </div>
                <Button variant='outline' color='red' rightSection={<IconArrowRight />} onClick={() => navigate("/audit-management")}>Audit Managment</Button>
            </div>
            <p className=' italic'>
                Scheduled yearly roadmap outlining audits to ensure safety compliance and improvement.
            </p>
            <div className='   '>
                <AnnualDataFile />

            </div>



        </div>
    );
}