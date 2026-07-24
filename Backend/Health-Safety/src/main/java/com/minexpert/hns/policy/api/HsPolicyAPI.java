package com.minexpert.hns.policy.api;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.policy.config.HsPolicyAuthorities;
import com.minexpert.hns.policy.dto.HsPolicyAcknowledgementDTO;
import com.minexpert.hns.policy.dto.HsPolicyDTO;
import com.minexpert.hns.policy.service.HsPolicyService;

import lombok.RequiredArgsConstructor;

/**
 * Module Politique SST (ISO 45001 §5.2 — engagement de la direction · §5.4 —
 * consultation des travailleurs). companyId = mine active (obligatoire : une
 * politique appartient à un site).
 *
 * <p>Gouvernance : la GESTION (brouillon, publication/signature, statistiques)
 * exige l'autorité {@link HsPolicyAuthorities#MANAGE} (management) ; la LECTURE de
 * la politique en vigueur et la PRISE DE CONNAISSANCE sont ouvertes à tout
 * utilisateur authentifié.
 */
@RestController
@RequestMapping("/hs-policy")
@CrossOrigin
@RequiredArgsConstructor
public class HsPolicyAPI {

    private final HsPolicyService service;

    // ── Lecture / consultation — tout utilisateur authentifié ────────────────

    @GetMapping("/published")
    public ResponseEntity<HsPolicyDTO> published(
            @RequestParam(value = "companyId", required = false) Long companyId) throws HSException {
        HsPolicyDTO dto = service.getPublished(companyId);
        // 204 (et non 404) quand aucune politique n'est publiée : l'absence est un
        // état normal, pas une erreur — l'IHM affiche « aucune politique en vigueur ».
        return dto == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(dto);
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<HsPolicyDTO> acknowledge(@PathVariable Long id,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestBody(required = false) Map<String, String> body) throws HSException {
        String name = body != null ? body.get("name") : null;
        return ResponseEntity.ok(service.acknowledge(companyId, id, name));
    }

    // ── Gestion — réservée au management ─────────────────────────────────────

    @PreAuthorize("hasAuthority('" + HsPolicyAuthorities.MANAGE + "')")
    @GetMapping("/list")
    public ResponseEntity<List<HsPolicyDTO>> list(
            @RequestParam(value = "companyId", required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(service.list(companyId));
    }

    @PreAuthorize("hasAuthority('" + HsPolicyAuthorities.MANAGE + "')")
    @GetMapping("/{id}")
    public ResponseEntity<HsPolicyDTO> getById(@PathVariable Long id,
            @RequestParam(value = "companyId", required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(service.getById(companyId, id));
    }

    @PreAuthorize("hasAuthority('" + HsPolicyAuthorities.MANAGE + "')")
    @PostMapping("/save")
    public ResponseEntity<HsPolicyDTO> save(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestBody HsPolicyDTO dto) throws HSException {
        return new ResponseEntity<>(service.saveDraft(companyId, dto), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + HsPolicyAuthorities.MANAGE + "')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id,
            @RequestParam(value = "companyId", required = false) Long companyId) throws HSException {
        service.deleteDraft(companyId, id);
        return ResponseEntity.ok(new ResponseDTO("Draft policy deleted."));
    }

    @PreAuthorize("hasAuthority('" + HsPolicyAuthorities.MANAGE + "')")
    @PostMapping("/{id}/publish")
    public ResponseEntity<HsPolicyDTO> publish(@PathVariable Long id,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestBody Map<String, String> body) throws HSException {
        return ResponseEntity.ok(service.publish(companyId, id,
                body.get("signatoryName"), body.get("signatoryTitle"), body.get("signatureImage")));
    }

    @PreAuthorize("hasAuthority('" + HsPolicyAuthorities.MANAGE + "')")
    @GetMapping("/{id}/acknowledgements")
    public ResponseEntity<List<HsPolicyAcknowledgementDTO>> acknowledgements(@PathVariable Long id,
            @RequestParam(value = "companyId", required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(service.acknowledgements(companyId, id));
    }

    @PreAuthorize("hasAuthority('" + HsPolicyAuthorities.MANAGE + "')")
    @GetMapping("/{id}/acknowledgement-stats")
    public ResponseEntity<Map<String, Object>> acknowledgementStats(@PathVariable Long id,
            @RequestParam(value = "companyId", required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(service.acknowledgementStats(companyId, id));
    }
}
