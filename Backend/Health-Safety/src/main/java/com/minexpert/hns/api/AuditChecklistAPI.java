package com.minexpert.hns.api;

import java.util.Arrays;
import java.util.List;

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

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.audit.AuditChecklistItemDTO;
import com.minexpert.hns.dto.audit.AuditChecklistTemplateDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.audit.AuditChecklistService;

import lombok.RequiredArgsConstructor;

/**
 * LOT 52 — Checklists d'audit par référentiel ISO (45001 / 14001 / 9001).
 *
 * <p>La checklist guide l'exécution de l'audit : questions types par clause,
 * résultat CONFORME / NON_CONFORME / NON_APPLICABLE / A_EVALUER, preuve et
 * commentaire par question, lien possible vers un constat.</p>
 */
@RestController
@RequestMapping("/audit-checklist")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class AuditChecklistAPI {

    private final AuditChecklistService auditChecklistService;

    /** Questions types actives, filtrées par référentiel si fourni. */
    @GetMapping("/templates")
    public ResponseEntity<List<AuditChecklistTemplateDTO>> getTemplates(
            @RequestParam(required = false) String referential) throws HSException {
        return new ResponseEntity<>(auditChecklistService.getTemplates(referential), HttpStatus.OK);
    }

    /**
     * Initialise la checklist d'un audit pour les référentiels demandés
     * (CSV : ISO_45001,ISO_14001,ISO_9001). Idempotent par référentiel.
     */
    @PostMapping("/{auditId}/init")
    public ResponseEntity<ResponseDTO> initChecklist(@PathVariable Long auditId,
            @RequestParam String referentials) throws HSException {
        int created = auditChecklistService.initChecklist(auditId,
                Arrays.asList(referentials.split(",")));
        return new ResponseEntity<>(new ResponseDTO(created + " questions ajoutées à la checklist"),
                HttpStatus.CREATED);
    }

    @GetMapping("/{auditId}")
    public ResponseEntity<List<AuditChecklistItemDTO>> getChecklist(@PathVariable Long auditId) throws HSException {
        return new ResponseEntity<>(auditChecklistService.getChecklist(auditId), HttpStatus.OK);
    }

    @PutMapping("/item/{itemId}")
    public ResponseEntity<ResponseDTO> updateItem(@PathVariable Long itemId,
            @RequestBody AuditChecklistItemDTO itemDTO) throws HSException {
        auditChecklistService.updateItem(itemId, itemDTO);
        return new ResponseEntity<>(new ResponseDTO("Question de checklist mise à jour"), HttpStatus.OK);
    }
}
