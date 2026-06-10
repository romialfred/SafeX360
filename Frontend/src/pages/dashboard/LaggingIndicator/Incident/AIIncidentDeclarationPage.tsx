import AIIncidentDeclaration from "../../../../components/LaggingIndicator/IncidentManagement/AIDeclaration/AIIncidentDeclaration";

/**
 * AIIncidentDeclarationPage — Page wrapper pour la déclaration assistée par IA.
 *
 * Route : /incidents/ai-declare
 */
const AIIncidentDeclarationPage = () => {
    return (
        // Pas de padding ici : AIIncidentDeclaration applique déjà .safex-page
        <div>
            <AIIncidentDeclaration />
        </div>
    );
};

export default AIIncidentDeclarationPage;
