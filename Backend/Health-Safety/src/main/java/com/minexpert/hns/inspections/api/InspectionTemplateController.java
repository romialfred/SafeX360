package com.minexpert.hns.inspections.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.enums.InspectionTemplateType;
import com.minexpert.hns.inspections.config.InspectionRBACConfig;
import com.minexpert.hns.inspections.dto.InspectionTemplateDTO;
import com.minexpert.hns.inspections.dto.InspectionTemplateSummaryDTO;
import com.minexpert.hns.inspections.service.InspectionTemplateService;

import jakarta.validation.Valid;

/**
 * Controller REST pour la gestion des templates d'inspection.
 *
 * <p>La Gateway strip le prefix {@code /hns/}, le mapping reel cote HS est
 * donc {@code /inspection-template}.</p>
 */
@RestController
@CrossOrigin
@RequestMapping("/inspection-template")
public class InspectionTemplateController {

    @Autowired
    private InspectionTemplateService templateService;

    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_VIEW + "')")
    @GetMapping("/list")
    public ResponseEntity<List<InspectionTemplateSummaryDTO>> list(
            @RequestParam(value = "type", required = false) InspectionTemplateType type,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestParam(value = "includeInactive", required = false, defaultValue = "false")
            boolean includeInactive) {
        List<InspectionTemplateSummaryDTO> result = (type != null)
                ? templateService.listByType(type, companyId, includeInactive)
                : templateService.listAll(companyId, includeInactive);
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_VIEW + "')")
    @GetMapping("/{id}")
    public ResponseEntity<InspectionTemplateDTO> get(@PathVariable Long id,
            @RequestParam(value = "companyId", required = false) Long companyId) {
        return ResponseEntity.ok(templateService.getById(id, companyId));
    }

    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_TEMPLATE_MANAGE + "')")
    @PostMapping("/create")
    public ResponseEntity<Long> create(@Valid @RequestBody InspectionTemplateDTO dto,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        // Mine active injectée en query : le template devient propre à la mine.
        if (companyId != null) {
            dto.setCompanyId(companyId);
        }
        Long id = templateService.create(dto, userId);
        return new ResponseEntity<>(id, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_TEMPLATE_MANAGE + "')")
    @PutMapping("/{id}")
    public ResponseEntity<ResponseDTO> update(@PathVariable Long id,
            @Valid @RequestBody InspectionTemplateDTO dto,
            @RequestParam(value = "companyId", required = false) Long companyId) {
        if (companyId != null) {
            dto.setCompanyId(companyId);
        }
        templateService.update(id, dto, companyId);
        return ResponseEntity.ok(new ResponseDTO("Template mis a jour"));
    }

    /**
     * Soft delete : marque le template inactif (pas de suppression dure pour
     * preserver l'historique des inspections passees).
     */
    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_TEMPLATE_MANAGE + "')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseDTO> deactivate(@PathVariable Long id,
            @RequestParam(value = "companyId", required = false) Long companyId) {
        templateService.deactivate(id, companyId);
        return ResponseEntity.ok(new ResponseDTO("Template desactive"));
    }

    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_TEMPLATE_MANAGE + "')")
    @PostMapping("/{id}/activate")
    public ResponseEntity<ResponseDTO> activate(@PathVariable Long id,
            @RequestParam(value = "companyId", required = false) Long companyId) {
        templateService.activate(id, companyId);
        return ResponseEntity.ok(new ResponseDTO("Template reactive"));
    }
}
