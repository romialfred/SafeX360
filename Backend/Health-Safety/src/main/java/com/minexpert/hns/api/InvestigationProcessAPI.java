package com.minexpert.hns.api;

import java.util.List;

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

import com.minexpert.hns.dto.InvestigationProcessDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.incident.InvestigationProcessService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/investigation-process")
@CrossOrigin
@Validated

@RequiredArgsConstructor
public class InvestigationProcessAPI {
    private final InvestigationProcessService investigationProcessService;

    @PostMapping("/create")
    public ResponseEntity<Long> addInvestigationProcess(@RequestBody InvestigationProcessDTO investigationProcessDTO)
            throws HSException {
        return new ResponseEntity<>(investigationProcessService.addInvestigationProcess(investigationProcessDTO),
                HttpStatus.CREATED);
    }

    @GetMapping("/getByInvestigationId/{investigationId}")
    public ResponseEntity<List<InvestigationProcessDTO>> getInvestigationProcessesByInvestigationId(
            @PathVariable Long investigationId) throws HSException {
        return new ResponseEntity<>(
                investigationProcessService.getInvestigationProcessesByInvestigationId(investigationId), HttpStatus.OK);
    }
}
