import TextEditor from "../../../UtilityComp/TextEditor";
import { Title } from "@mantine/core";
import { useTranslation } from "react-i18next";


const InvestigationReport = ({ form }: any) => {
    const { t } = useTranslation('incidents');

    return (
        <div className="p-5 mt-3 border rounded-lg border-gray-300 shadow-md flex flex-col gap-5">
            <div className="">
                <TextEditor withAsterisk form={form} id="report" title={t('investigation.reportStep.editorTitle')} className="h-![400px]" />
            </div>
            <div className="bg-blue-50 border border-blue-600 rounded-xl shadow-sm p-4">

                <Title order={4} className="text-blue-500">
                    {t('investigation.reportStep.guidelinesTitle')}
                </Title>


                <ul className="p-5 list-disc list-inside text-sm text-blue-800 space-y-2">
                    <li>{t('investigation.reportStep.guideline1')}</li>
                    <li>{t('investigation.reportStep.guideline2')}</li>
                    <li>{t('investigation.reportStep.guideline3')}</li>
                    <li>{t('investigation.reportStep.guideline4')}</li>
                    <li>{t('investigation.reportStep.guideline5')}</li>
                    <li>{t('investigation.reportStep.guideline6')}</li>
                </ul>
            </div>
        </div>
    )
}

export default InvestigationReport