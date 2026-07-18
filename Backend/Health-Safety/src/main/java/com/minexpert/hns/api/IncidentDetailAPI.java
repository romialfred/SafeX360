package com.minexpert.hns.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.response.CategorySeverityCount;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.incident.IncidentDetailService;

@RestController
@RequestMapping("/incident-detail")
@CrossOrigin
@Validated
public class IncidentDetailAPI {

    @Autowired
    private IncidentDetailService incidentDetailService;

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteIncidentDetailById(@PathVariable Long id) throws HSException {
        incidentDetailService.deleteIncidentDetail(id);
        return new ResponseEntity<>(new ResponseDTO("Incident Detail deleted successfully"), HttpStatus.OK);
    }

    // SUPPRIMÉ — trois endpoints d'agrégation (/severity-level-count,
    // /category-count, /category-severity-count) qui n'avaient AUCUN filtre de
    // mine : IncidentDetail ne porte pas de companyId, et les requêtes ne
    // joignaient pas incident.companyId. Tout utilisateur authentifié lisait
    // donc des agrégats TOUTES MINES CONFONDUES (fuite inter-entreprises).
    //
    // Ils étaient de simples DOUBLONS : IncidentTypeAPI expose déjà les mêmes
    // comptages CORRECTEMENT cloisonnés (/countBySeverityLevel, /countByCategory,
    // /countByCategoryAndSeverityLevel, tous avec companyId) — et c'est cette
    // version-là que le frontend consomme. Aucun consommateur ne pointait ici.
    //
    // On SUPPRIME plutôt qu'on ne cloisonne : un endpoint dupliqué est une
    // surface d'attaque qui re-diverge tôt ou tard. Utilisez IncidentTypeAPI.
}
