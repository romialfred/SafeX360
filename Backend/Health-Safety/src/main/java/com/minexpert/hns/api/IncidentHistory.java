package com.minexpert.hns.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.IncidentHistoryDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.incident.IncidentHistoryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/incident-history")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class IncidentHistory {
    private final IncidentHistoryService incidentHistoryService;

    @PostMapping("/create")
    public ResponseEntity<Long> saveIncidentHistory(@RequestBody IncidentHistoryDTO incidentHistoryDTO)
            throws HSException {
        return new ResponseEntity<>(incidentHistoryService.saveIncidentHistory(incidentHistoryDTO), HttpStatus.CREATED);
    }

    @GetMapping("/getByIncidentId/{incidentId}")
    public ResponseEntity<?> getIncidentHistoryByIncidentId(@PathVariable Long incidentId) throws HSException {
        return new ResponseEntity<>(incidentHistoryService.getIncidentHistoryByIncidentId(incidentId), HttpStatus.OK);
    }
}
