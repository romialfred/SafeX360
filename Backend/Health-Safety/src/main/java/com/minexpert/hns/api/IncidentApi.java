package com.minexpert.hns.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.IncidentDTO;
import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.response.DepartmentIncidentStats;
import com.minexpert.hns.dto.response.IncidentResponse;
import com.minexpert.hns.dto.response.YearlyClosureData;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.incident.IncidentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/incidents")
@CrossOrigin
@Validated
public class IncidentApi {

    @Autowired
    private IncidentService incidentService;

    // @Valid est indispensable ICI : le @Validated de classe ne couvre que les
    // parametres de methode (@RequestParam/@PathVariable), jamais le corps de la
    // requete. Sans lui, les contraintes de IncidentDTO n'etaient JAMAIS evaluees —
    // un titre vide ou de plus de 255 caracteres partait jusqu'a la base.
    // Volontairement PAS de @Valid sur /update : ce endpoint recoit des incidents
    // existants, et un rejet 400 y ferait perdre la saisie en cours. A traiter
    // separement.
    @PostMapping("/report")
    public ResponseEntity<ResponseDTO> reportIncident(@RequestParam("companyId") Long companyId,
            @Valid @RequestBody IncidentDTO incidentDTO) throws HSException {
        incidentService.reportIncident(companyId, incidentDTO);
        return new ResponseEntity<>(new ResponseDTO("Incident reported successfully."), HttpStatus.OK);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateIncident(@RequestParam("companyId") Long companyId,
            @RequestBody IncidentDTO incidentDTO) throws HSException {
        incidentService.updateIncident(companyId, incidentDTO);
        return new ResponseEntity<>(new ResponseDTO("Incident updated successfully."), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<IncidentResponse>> getAllIncidents(
            @RequestParam(name = "companyId", required = false) Long companyId)
            throws HSException {
        System.out.println("Received request to get all incidents for companyId: " + companyId);
        return new ResponseEntity<>(incidentService.getAllIncidents(companyId), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<IncidentDTO> getIncidentById(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long id)
            throws HSException {
        return new ResponseEntity<>(incidentService.getIncidentById(companyId, id), HttpStatus.OK);
    }

    @GetMapping("/getDetails/{id}")
    public ResponseEntity<IncidentResponse> getIncidentResponseById(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(incidentService.getIncidentResponseById(companyId, id), HttpStatus.OK);
    }

    @GetMapping("/yearly-closure/{year}")
    public ResponseEntity<List<YearlyClosureData>> getYearlyClosureData(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable int year) {
        return new ResponseEntity<>(incidentService.getYearlyClosureData(companyId, year), HttpStatus.OK);
    }

    /**
     * Returns 30-day incident metrics for the requested department, including
     * recent incident reports, completed investigations, and corrective actions
     * that remain pending or in progress within the same window.
     *
     * @param departmentId department identifier to filter the metrics
     * @return aggregated counts for the last 30 days
     */
    @GetMapping("/department/stats/{departmentId}")
    public ResponseEntity<DepartmentIncidentStats> getDepartmentIncidentStats(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long departmentId) {
        return ResponseEntity.ok(incidentService.getDepartmentIncidentStats(companyId, departmentId));
    }

}
