import AIIncidentDeclaration from "../../../../components/LaggingIndicator/IncidentManagement/AIDeclaration/AIIncidentDeclaration";

/**
 * AIIncidentDeclarationPage — Page wrapper pour la déclaration assistée par IA.
 *
 * Route : /incidents/ai-declare
 */
const AIIncidentDeclarationPage = () => {
    return (
        <div className="p-5">
            <AIIncidentDeclaration />
        </div>
    );
};

export default AIIncidentDeclarationPage;
