import { Breadcrumbs, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import RiskIdentification from './RiskIdentification';





const ChemicalRiskForms = () => {


    return (
        <div className="flex flex-col gap-5 p-5">
            <div className="flex justify-between items-center  ">
                <div>
                    {/* LOT 40 P1: text-blue-500 → text-slate-900 pour cohérence avec la charte SafeX 360 */}
                    <div className="text-2xl font-semibold text-slate-900 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Chemical Risk Identification</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/chemical-register" ><Text variant="gradient" className="hover:!underline cursor-pointer">Chemical Register</Text></Link>
                        <Text variant="gradient">Chemical Risk Identification</Text>
                    </Breadcrumbs>
                </div>

            </div>
            <p className="text-gray-600 italic">ISO 45001 compliant chemical risk identification and assessment</p>
            <div className=' rounded-xl  flex flex-col gap-5'>

                {/* Form Navigation */}
                <div className="border border-gray-300 shadow-sm rounded-xl p-4">

                    <RiskIdentification />





                </div>
            </div>

        </div>
    );
};

export default ChemicalRiskForms;