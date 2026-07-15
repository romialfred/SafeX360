package com.minexpert.hns.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.audit.AuditProgramDTO;
import com.minexpert.hns.dto.audit.AuditProgramKpisDTO;
import com.minexpert.hns.dto.audit.RiskSuggestionDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.audit.AuditProgramService;

import lombok.RequiredArgsConstructor;

/**
 * LOT 52 — Programme d'audit annuel (ISO 19011:2018 §5).
 *
 * <p>Endpoints (via gateway /hns/audit-program) : CRUD du programme,
 * approbation par la direction, priorisation fondée sur les risques
 * (§5.4.2) et indicateurs de surveillance du programme (§5.6).</p>
 */
@RestController
@RequestMapping("/audit-program")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class AuditProgramAPI {

    private final AuditProgramService auditProgramService;

    @PostMapping("/create")
    public ResponseEntity<Long> createProgram(
            @RequestParam(required = false) Long companyId,
            @RequestBody AuditProgramDTO programDTO) throws HSException {
        // Le companyId de la mine active est injecté en query par l'intercepteur
        // Axios ; on le persiste ici, sinon le programme est créé avec
        // companyId=null et devient INVISIBLE dans la liste (filtrée par mine).
        if (companyId != null) {
            programDTO.setCompanyId(companyId);
        }
        return new ResponseEntity<>(auditProgramService.createProgram(programDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateProgram(@RequestBody AuditProgramDTO programDTO) throws HSException {
        auditProgramService.updateProgram(programDTO);
        return new ResponseEntity<>(new ResponseDTO("Programme d'audit mis à jour"), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<AuditProgramDTO> getProgram(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(auditProgramService.getProgram(id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<AuditProgramDTO>> getAllPrograms(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(auditProgramService.getAllPrograms(companyId), HttpStatus.OK);
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<ResponseDTO> approveProgram(@PathVariable Long id,
            @RequestParam(required = false) Long approvedBy) throws HSException {
        auditProgramService.approveProgram(id, approvedBy);
        return new ResponseEntity<>(new ResponseDTO("Programme d'audit approuvé"), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteProgram(@PathVariable Long id) throws HSException {
        auditProgramService.deleteProgram(id);
        return new ResponseEntity<>(new ResponseDTO("Programme d'audit supprimé"), HttpStatus.OK);
    }

    /** Priorisation des domaines d'audit fondée sur les risques (ISO §5.4.2). */
    @GetMapping("/{id}/risk-suggestions")
    public ResponseEntity<List<RiskSuggestionDTO>> getRiskSuggestions(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(auditProgramService.getRiskSuggestions(id), HttpStatus.OK);
    }

    /** Indicateurs de surveillance du programme (ISO §5.6). */
    @GetMapping("/{id}/kpis")
    public ResponseEntity<AuditProgramKpisDTO> getProgramKpis(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(auditProgramService.getProgramKpis(id), HttpStatus.OK);
    }
}
