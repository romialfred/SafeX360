package com.minexpert.hns.repository.incident;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.incident.IncidentDetail;

public interface IncidentDetailRepository extends CrudRepository<IncidentDetail, Long> {
        @Query("SELECT id FROM IncidentDetail id WHERE id.incident.id = :incidentId")
        List<IncidentDetail> findByIncidentId(@Param("incidentId") Long incidentId);

        // SUPPRIMÉ — countIncidentDetailsBySeverityLevel, countIncidentDetailsByCategory
        // et countByCategoryAndSeverityLevel.
        //
        // Ces trois GROUP BY n'avaient AUCUN filtre de mine : IncidentDetail ne porte
        // pas de companyId, et les requêtes ne joignaient pas `d.incident.companyId`.
        // Elles agrégeaient donc les incidents de TOUTES les entreprises et étaient
        // exposées en REST (IncidentDetailAPI) à tout appelant authentifié.
        //
        // Elles n'étaient que des doublons : IncidentTypeRepository/Service fournit les
        // mêmes comptages CORRECTEMENT cloisonnés par companyId, et c'est cette version
        // que le frontend consomme. Si un besoin d'agrégation réapparaît ici, joindre
        // explicitement `d.incident.companyId` et le filtrer — ne pas recopier ce
        // qui précédait.
}
