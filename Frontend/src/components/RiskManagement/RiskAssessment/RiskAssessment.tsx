import { Text, Breadcrumbs } from '@mantine/core';
import { Link } from 'react-router-dom';
import RiskDataTable from './RiskTable';

const RiskAssessment = () => {
    // const navigate = useNavigate();
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
                    <div className="font-semibold text-2xl text-blue-500 w-fit">Risk Assessment</div>
                    <Breadcrumbs mt="xs" >
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>

                        <Text variant="gradient">Risk Assessment</Text>
                    </Breadcrumbs>
                </div>
                {/* <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => navigate('register-form')}
                >
                    New Risk
                </Button> */}
            </div>

            <p className=' italic '>Risk assessment and management process</p>






            <RiskDataTable


                getStatusColor={getStatusColor}
            />


        </div>
    );
};

export default RiskAssessment;