package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.IncidentDetailDTO;
import com.minexpert.hns.exception.HSException;

public interface IncidentDetailService {
    public List<IncidentDetailDTO> getIncidentDetailsByIncidentId(Long incidentId) throws HSException;

    public void deleteIncidentDetail(Long id) throws HSException;

    // SUPPRIMÉ — countIncidentDetailsBySeverityLevel / countIncidentDetailsByCategory
    // / countByCategoryAndSeverityLevel. Ces agrégations n'avaient AUCUN filtre de
    // mine (IncidentDetail ne porte pas de companyId et les requêtes ne joignaient
    // pas incident.companyId), donc elles renvoyaient des comptages TOUTES MINES
    // confondues à n'importe quel appelant authentifié.
    // Les équivalents CLOISONNÉS existent dans IncidentTypeService (countBySeverityLevel,
    // countByCategory, countByCategoryAndSeverityLevel — tous paramétrés par companyId)
    // et ce sont eux que le frontend consomme. Utilisez ceux-là.
}
