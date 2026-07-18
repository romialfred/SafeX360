import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/incident-detail";


const removeIncidentDetail = async (id: string | number) => {
    return axiosInstance.delete(`${url}/delete/${id}`)
        .then((response) => response.data);
}

// SUPPRIMÉ — getSeverityLevelCount / getCategoryCount / getCategorySeverityCount.
// Ces trois fonctions appelaient des endpoints d'agrégation qui n'avaient AUCUN
// filtre de mine (ils renvoyaient des comptages toutes entreprises confondues) ;
// les endpoints ont été retirés côté backend. Aucun écran ne les consommait.
// Les comptages CLOISONNÉS équivalents sont dans IncidentTypeService
// (countBySeverityLevel / countByCategory / countByCategoryAndSeverityLevel).

export { removeIncidentDetail };
