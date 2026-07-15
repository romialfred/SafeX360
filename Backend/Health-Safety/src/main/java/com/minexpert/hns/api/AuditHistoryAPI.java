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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.audit.AuditHistoryDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.audit.AuditHistoryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/audit-history")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class AuditHistoryAPI {
    private final AuditHistoryService auditHistoryService;

    @PostMapping("/create")
    public ResponseEntity<Long> saveAuditHistory(@RequestParam(required = false) Long companyId,
            @RequestBody AuditHistoryDTO auditHistoryDTO) throws HSException {
        // Cloisonnement par mine : l'entrée d'historique hérite du companyId de la mine active.
        if (companyId != null) {
            auditHistoryDTO.setCompanyId(companyId);
        }
        return new ResponseEntity<>(auditHistoryService.saveAuditHistory(auditHistoryDTO), HttpStatus.CREATED);
    }

    @GetMapping("/getByAuditId/{auditId}")
    public ResponseEntity<?> getAuditHistoryByAuditId(@PathVariable Long auditId) throws HSException {
        return new ResponseEntity<>(auditHistoryService.getAuditHistoryByAuditId(auditId), HttpStatus.OK);

    }
}
