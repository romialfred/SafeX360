package com.minexpert.hns.dosimetry.api;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.FitnessAssessmentFullDTO;
import com.minexpert.hns.dosimetry.dto.FitnessAssessmentPublicDTO;
import com.minexpert.hns.dosimetry.enums.FitnessLevel;
import com.minexpert.hns.dosimetry.service.FitnessAssessmentService;
import com.minexpert.hns.dto.ResponseDTO;

import lombok.RequiredArgsConstructor;

/**
 * Controller des fiches d'aptitude (Phase 7).
 *
 * <p><b>RBAC MATRIX :</b>
 * <ul>
 *   <li><b>MEDICAL</b> : full access (create, sign, history Full).</li>
 *   <li><b>PCR_RPO + SELF</b> : current fitness (Public) + history (Public).</li>
 *   <li><b>EXPORT_MEDICAL</b> : export Full avec justification audit obligatoire.</li>
 * </ul>
 *
 * <p>Les annotations {@code @PreAuthorize} sont declarees ; protection effective au boot
 * via {@code @EnableMethodSecurity}.
 */
@RestController
@RequestMapping("/dosimetry/fitness-assessment")
@CrossOrigin
@RequiredArgsConstructor
public class FitnessAssessmentController {

    private final FitnessAssessmentService service;

    // ----------------------------------------------------------------------------
    // Ecritures - MEDICAL uniquement.
    // ----------------------------------------------------------------------------

    /**
     * Cree une fiche d'aptitude (non signee). Body :
     * <pre>{
     *   "workerId":1, "mineId":1, "medicalVisitId":42,
     *   "fitness":"FIT_WITH_RESTRICTIONS",
     *   "restrictions":"Eviter zone bouclee CONTROLLED, contre-indication intervention scelles",
     *   "publicSummary":"Eviter zone controlee pendant 6 mois",
     *   "assessmentDate":"2026-06-07", "validUntil":"2027-06-07",
     *   "reviewRequiredDate":"2026-12-07",
     *   "physicianId":99, "physicianName":"Dr Dupont"
     * }</pre>
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_MEDICAL + "')")
    @PostMapping("/create")
    public ResponseEntity<Long> create(@RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        Long workerId = asLong(body.get("workerId"));
        Long mineId = asLong(body.get("mineId"));
        Long medicalVisitId = asLong(body.get("medicalVisitId"));
        FitnessLevel fitness = FitnessLevel.valueOf(body.get("fitness").toString());
        String restrictions = body.get("restrictions") != null
                ? body.get("restrictions").toString() : null;
        String publicSummary = body.get("publicSummary") != null
                ? body.get("publicSummary").toString() : null;
        LocalDate assessmentDate = LocalDate.parse(body.get("assessmentDate").toString());
        LocalDate validUntil = body.get("validUntil") != null
                ? LocalDate.parse(body.get("validUntil").toString()) : null;
        LocalDate reviewRequiredDate = body.get("reviewRequiredDate") != null
                ? LocalDate.parse(body.get("reviewRequiredDate").toString()) : null;
        Long physicianId = asLong(body.get("physicianId"));
        String physicianName = body.get("physicianName") != null
                ? body.get("physicianName").toString() : null;
        Long id = service.createAssessment(workerId, mineId, medicalVisitId, fitness,
                restrictions, publicSummary, assessmentDate, validUntil, reviewRequiredDate,
                physicianId, physicianName, userId);
        return new ResponseEntity<>(id, HttpStatus.CREATED);
    }

    /**
     * Signe une fiche : APPEND-ONLY apres signature.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_MEDICAL + "')")
    @PostMapping("/sign/{id}")
    public ResponseEntity<ResponseDTO> sign(@PathVariable("id") Long assessmentId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpServletRequest request) {
        service.signAssessment(assessmentId, userId, clientIp(request));
        return new ResponseEntity<>(new ResponseDTO("FitnessAssessment signed and locked"),
                HttpStatus.OK);
    }

    // ----------------------------------------------------------------------------
    // Lectures PUBLIC - PCR_RPO + SELF + MEDICAL.
    // ----------------------------------------------------------------------------

    /**
     * Aptitude courante (PUBLIC : pas de details cliniques). RBAC PCR_RPO + SELF + MEDICAL.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_PCR_RPO + "') "
            + "or hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_MEDICAL + "') "
            + "or hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_NOMINATIVE + "')")
    @GetMapping("/current/{workerId}")
    public ResponseEntity<FitnessAssessmentPublicDTO> current(@PathVariable Long workerId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpServletRequest request) {
        Optional<FitnessAssessmentPublicDTO> dto = service.getCurrentFitnessPublic(workerId,
                userId, clientIp(request));
        return dto.map(d -> new ResponseEntity<>(d, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Historique PUBLIC.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_PCR_RPO + "') "
            + "or hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_MEDICAL + "') "
            + "or hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_NOMINATIVE + "')")
    @GetMapping("/history/{workerId}")
    public ResponseEntity<List<FitnessAssessmentPublicDTO>> history(@PathVariable Long workerId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpServletRequest request) {
        return new ResponseEntity<>(
                service.getAllAssessmentsPublic(workerId, userId, clientIp(request)),
                HttpStatus.OK);
    }

    // ----------------------------------------------------------------------------
    // Lectures FULL - MEDICAL uniquement + reason audit.
    // ----------------------------------------------------------------------------

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_MEDICAL + "')")
    @GetMapping("/current/{workerId}/full")
    public ResponseEntity<FitnessAssessmentFullDTO> currentFull(@PathVariable Long workerId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Reason", required = false) String reason,
            HttpServletRequest request) {
        Optional<FitnessAssessmentFullDTO> dto = service.getCurrentFitnessFull(workerId, userId,
                reason != null ? reason : "unspecified", clientIp(request));
        return dto.map(d -> new ResponseEntity<>(d, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_MEDICAL + "')")
    @GetMapping("/history/{workerId}/full")
    public ResponseEntity<List<FitnessAssessmentFullDTO>> historyFull(@PathVariable Long workerId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Reason", required = false) String reason,
            HttpServletRequest request) {
        return new ResponseEntity<>(
                service.getAllAssessmentsFull(workerId, userId,
                        reason != null ? reason : "unspecified", clientIp(request)),
                HttpStatus.OK);
    }

    /**
     * Export historique complet avec restrictions dechiffrees. Reason obligatoire.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_EXPORT_MEDICAL + "')")
    @GetMapping("/export/{workerId}")
    public ResponseEntity<List<FitnessAssessmentFullDTO>> exportHistory(
            @PathVariable Long workerId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Reason", required = true) String reason,
            HttpServletRequest request) {
        if (reason == null || reason.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return new ResponseEntity<>(
                service.getAllAssessmentsFull(workerId, userId,
                        "EXPORT_MEDICAL: " + reason, clientIp(request)),
                HttpStatus.OK);
    }

    // ----------------------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------------------

    private static String clientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            return (comma > 0 ? forwarded.substring(0, comma) : forwarded).trim();
        }
        return request.getRemoteAddr();
    }

    private static Long asLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).longValue();
        try {
            return Long.parseLong(v.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
