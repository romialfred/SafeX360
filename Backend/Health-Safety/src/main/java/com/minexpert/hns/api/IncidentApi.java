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
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.IncidentDTO;
import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.response.DepartmentIncidentStats;
import com.minexpert.hns.dto.response.IncidentResponse;
import com.minexpert.hns.dto.response.YearlyClosureData;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.incident.IncidentService;

@RestController
@RequestMapping("/incidents")
@CrossOrigin
@Validated
public class IncidentApi {

    @Autowired
    private IncidentService incidentService;

    @PostMapping("/report")
    public ResponseEntity<ResponseDTO> reportIncident(@RequestBody IncidentDTO incidentDTO) throws HSException {
        incidentService.reportIncident(incidentDTO);
        return new ResponseEntity<>(new ResponseDTO("Incident reported successfully."), HttpStatus.OK);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateIncident(@RequestBody IncidentDTO incidentDTO) throws HSException {
        incidentService.updateIncident(incidentDTO);
        return new ResponseEntity<>(new ResponseDTO("Incident updated successfully."), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<IncidentResponse>> getAllIncidents() throws HSException {
        return new ResponseEntity<>(incidentService.getAllIncidents(), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<IncidentDTO> getIncidentById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(incidentService.getIncidentById(id), HttpStatus.OK);
    }

    @GetMapping("/getDetails/{id}")
    public ResponseEntity<IncidentResponse> getIncidentResponseById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(incidentService.getIncidentResponseById(id), HttpStatus.OK);
    }

    @GetMapping("/yearly-closure/{year}")
    public ResponseEntity<List<YearlyClosureData>> getYearlyClosureData(@PathVariable int year) {
        return new ResponseEntity<>(incidentService.getYearlyClosureData(year), HttpStatus.OK);
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
    public ResponseEntity<DepartmentIncidentStats> getDepartmentIncidentStats(@PathVariable Long departmentId) {
        return ResponseEntity.ok(incidentService.getDepartmentIncidentStats(departmentId));
    }

    /**
     * Fix Phase 2.a — endpoint global pour utilisateurs sans département (ex: admin).
     * Évite l'erreur "Failed to convert 'null' to Long" sur l'endpoint paramétré.
     */
    @GetMapping("/department/stats")
    public ResponseEntity<DepartmentIncidentStats> getGlobalIncidentStats() {
        return ResponseEntity.ok(incidentService.getDepartmentIncidentStats(null));
    }

}
