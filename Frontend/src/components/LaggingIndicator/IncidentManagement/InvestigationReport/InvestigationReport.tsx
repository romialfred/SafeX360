import TextEditor from "../../../UtilityComp/TextEditor";
import { Title } from "@mantine/core";


const InvestigationReport = ({ form }: any) => {

    return (
        <div className="p-5 mt-3 border rounded-lg border-gray-300 shadow-md flex flex-col gap-5">
            <div className="">
                <TextEditor withAsterisk form={form} id="report" title="Investigation Report" className="h-![400px]" />
            </div>
            <div className="bg-blue-50 border border-blue-600 rounded-xl shadow-sm p-4">

                <Title order={4} className="text-blue-500">
                    Report Guidelines
                </Title>


                <ul className="p-5 list-disc list-inside text-sm text-blue-800 space-y-2">
                    <li>Include a clear summary of the incident</li>
                    <li>Detail the investigation process and methodology</li>
                    <li>Present findings in a logical sequence</li>
                    <li>Include root cause analysis and contributing factors</li>
                    <li>Provide specific recommendations for prevention</li>
                    <li> Attach supporting evidence and documentation</li>
                </ul>
            </div>
        </div>
    )
}

export default InvestigationReport