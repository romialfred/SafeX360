package com.minexpert.hns.api;

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
import org.springframework.web.bind.annotation.RequestParam;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.nonConformity.EventRequestDTO;
import com.minexpert.hns.dto.nonConformity.NcInfo;
import com.minexpert.hns.dto.nonConformity.NonConformityDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.nonConformity.EventAnalysisService;
import com.minexpert.hns.service.nonConformity.NonConformityService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/non-conformity")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class NonConformityAPI {
    private final NonConformityService nonConformityService;
    private final EventAnalysisService eventAnalysisService;

    @PostMapping("/create")
    public ResponseEntity<Long> createNonConformity(@RequestParam("companyId") Long companyId,
            @RequestBody EventRequestDTO request) throws HSException {
        request.setCompanyId(companyId);
        return new ResponseEntity<>(nonConformityService.addNonConformity(companyId, request),
                HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateNonConformity(@RequestParam("companyId") Long companyId,
            @RequestBody EventRequestDTO request) throws HSException {
        request.setCompanyId(companyId);
        nonConformityService.updateEvent(companyId, request);
        return new ResponseEntity<>(new ResponseDTO("Non-Conformity updated successfully"), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<NonConformityDTO> getNonConformity(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(nonConformityService.getNonConformityById(id), HttpStatus.OK);
    }

    @GetMapping("/getAnalysis/{id}")
    public ResponseEntity<?> getEventAnalysis(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(eventAnalysisService.getEventAnalysisByNonConformityId(id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<?> getAllNonConformities() throws HSException {
        return new ResponseEntity<>(nonConformityService.getAllNcInfo(), HttpStatus.OK);
    }

    @GetMapping("/getInfo/{id}")
    public ResponseEntity<NcInfo> getNcInfo(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(nonConformityService.getNcInfoById(id), HttpStatus.OK);
    }
}
