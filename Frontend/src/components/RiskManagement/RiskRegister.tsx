import { Text, Breadcrumbs, Button } from '@mantine/core';
import RiskTable from './RiskRegister/RiskTable';
import { Link, useNavigate } from 'react-router-dom';
import { IconPlus } from '@tabler/icons-react';

const RiskRegister = () => {
    const navigate = useNavigate();
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'Uncontrolled': return 'red';
            case 'Partially Controlled': return 'orange';
            case 'Under Control': return 'green';
            default: return 'gray';
        }
    };
    return (
        <div className='flex flex-col gap-5'>
            <div className='flex justify-between items-center'>

                <div>
                    <div className="font-semibold text-2xl text-blue-500 w-fit">Risk Catalog & Tracking</div>
                    <Breadcrumbs mt="xs" >
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>

                        <Text variant="gradient">Risk Catalog & Tracking</Text>
                    </Breadcrumbs>
                </div>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => navigate('register-form')}
                >
                    New Risk
                </Button>
            </div>

            <p className=' italic '>Comprehensive risk analysis and monitoring system</p>






            <RiskTable


                getStatusColor={getStatusColor}
            />


        </div>
    );
};

export default RiskRegister;