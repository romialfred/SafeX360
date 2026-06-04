import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import ValidationData from "./ValidationData"
const DocumentValidation = () => {
    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-2xl font-semibold text-slate-900">Document Validation</div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Document Validation</Text>
                    </Breadcrumbs>
                </div>
            </div>
            <p className=' italic my-3'>
                Systematic review and approval of compliance documents to ensure accuracy and regulatory adherence
            </p>
            <div className='mt-5   '>
                <ValidationData />
            </div>
        </div>
    )
}

export default DocumentValidation