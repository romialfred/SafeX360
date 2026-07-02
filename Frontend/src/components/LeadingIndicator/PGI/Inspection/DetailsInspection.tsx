import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPgiById } from "../../../../services/PgiService";
import ViewDetailsPgi from "../PGI Details/ViewDetailsPgi";

/**
 * Onglet « Détails de l'inspection » de la page d'exécution : charge le
 * dossier puis réutilise la fiche détaillée commune (ViewDetailsPgi).
 */
const DetailsInspection = () => {
    const { id } = useParams();
    const [inspection, setInspection] = useState<any>({});

    useEffect(() => {
        getPgiById(id)
            .then(setInspection)
            .catch((_err) => console.error(_err))
    }, []);

    return <ViewDetailsPgi inspection={inspection} />;
};

export default DetailsInspection;
