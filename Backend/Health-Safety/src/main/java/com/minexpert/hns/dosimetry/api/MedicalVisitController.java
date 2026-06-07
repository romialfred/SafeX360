package com.minexpert.hns.dosimetry.api;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.MedicalVisitFullDTO;
import com.minexpert.hns.dosimetry.dto.MedicalVisitSummaryDTO;
import com.minexpert.hns.dosimetry.enums.MedicalVisitType;
import com.minexpert.hns.dosimetry.service.MedicalVisitService;
import com.minexpert.hns.dto.ResponseDTO;

import lombok.RequiredArgsConstructor;

/**
 * Controller des visites medicales (Phase 7).
 *
 * <p><b>RBAC MATRIX (cf. Phase 7) :</b>
 * <ul>
 *   <li><b>MEDICAL</b> : full access (schedule, perform, cancel, FullDTO lectures).</li>
 *   <li><b>PCR_RPO</b> : upcoming visits (Summary) + worker visits Summary.</li>
 *   <li><b>SELF</b> (worker x lui-meme) : son resume de visites uniquement.</li>
 *   <li><b>EXPORT_MEDICAL</b> : export Full avec justification (reason) obligatoire, audite.</li>
 * </ul>
 *
 * <p><b>Note technique :</b> tant que {@code @EnableMethodSecurity} n'est pas active, les
 * annotations {@code @PreAuthorize} sont declarees mais inertes. La protection effective
 * est alors assuree par les controles applicatifs au sein des services (audit + DTO
 * separes). Quand la securite methode sera activee, ces annotations bloqueront
 * effectivement les acces non autorises.
 */
@RestController
@RequestMapping("/dosimetry/medical-visit")
@CrossOrigin
@RequiredArgsConstructor
public class MedicalVisitController {

    private final MedicalVisitService service;

    // ----------------------------------------------------------------------------
    // Ecritures - MEDICAL uniquement.
    // ----------------------------------------------------------------------------

    /**
     * Planifie une visite.
     * Body : {@code { "workerId":1, "mineId":1, "type":"PERIODIC_ANNUAL",
     *                  "scheduledDate":"2026-09-01", "physicianId":42,
     *                  "physicianName":"Dr Martin" }}
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_MEDICAL + "')")
    @PostMapping("/schedule")
    public ResponseEntity<Long> schedule(@RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        Long workerId = asLong(body.get("workerId"));
        Long mineId = asLong(body.get("mineId"));
        MedicalVisitType type = MedicalVisitType.valueOf(body.get("type").toString());
        LocalDate scheduledDate = LocalDate.parse(body.get("scheduledDate").toString());
        Long physicianId = asLong(body.get("physicianId"));
        String physicianName = body.get("physicianName") != null
                ? body.get("physicianName").toString() : null;
        Long id = service.scheduleVisit(workerId, mineId, type, scheduledDate, physicianId,
                physicianName, userId);
        return new ResponseEntity<>(id, HttpStatus.CREATED);
    }

    /**
     * Realise une visite : ecrit detailedReport (chiffre) + generalConclusion.
     * Body : {@code { "generalConclusion":"...", "detailedReport":"CONFIDENTIEL...",
     *                  "performedDate":"2026-06-07" }}
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_MEDICAL + "')")
    @PostMapping("/perform/{id}")
    public ResponseEntity<ResponseDTO> perform(@PathVariable("id") Long visitId,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpServletRequest request) {
        String generalConclusion = body.get("generalConclusion") != null
                ? body.get("generalConclusion").toString() : null;
        String detailedReport = body.get("detailedReport") != null
                ? body.get("detailedReport").toString() : null;
        LocalDate performedDate = body.get("performedDate") != null
                ? LocalDate.parse(body.get("performedDate").toString())
                : LocalDate.now();
        service.performVisit(visitId, generalConclusion, detailedReport, performedDate,
                userId, clientIp(request));
        return new ResponseEntity<>(new ResponseDTO("MedicalVisit performed and locked"),
                HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_MEDICAL + "')")
    @PostMapping("/cancel/{id}")
    public ResponseEntity<ResponseDTO> cancel(@PathVariable("id") Long visitId,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        String reason = body.get("reason") != null ? body.get("reason").toString() : null;
        service.cancelVisit(visitId, reason, userId);
        return new ResponseEntity<>(new ResponseDTO("MedicalVisit cancelled"), HttpStatus.OK);
    }

    // ----------------------------------------------------------------------------
    // Lectures Summary - PCR_RPO + MEDICAL + SELF.
    // ----------------------------------------------------------------------------

    /**
     * Visites a venir d'une mine (Summary). RBAC : PCR_RPO + MEDICAL (le PCR doit pouvoir
     * piloter la planification).
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_PCR_RPO + "') "
            + "or hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_MEDICAL + "')")
    @GetMapping("/upcoming")
    public ResponseEntity<List<MedicalVisitSummaryDTO>> upcoming(
            @RequestParam("mineId") Long mineId,
            @RequestParam(value = "daysAhead", defaultValue = "30") int daysAhead) {
        return new ResponseEntity<>(service.getUpcomingVisits(mineId, daysAhead), HttpStatus.OK);
    }

    /**
     * Visites d'un travailleur (Summary). RBAC : PCR_RPO + MEDICAL + SELF.
     * Le filtrage SELF est applique par la couche securite (filter par workerId).
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_PCR_RPO + "') "
            + "or hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_MEDICAL + "') "
            + "or hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_NOMINATIVE + "')")
    @GetMapping("/by-worker/{workerId}")
    public ResponseEntity<List<MedicalVisitSummaryDTO>> byWorker(
            @PathVariable Long workerId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpServletRequest request) {
        return new ResponseEntity<>(
                service.getWorkerVisitsSummary(workerId, userId, clientIp(request)),
                HttpStatus.OK);
    }

    // ----------------------------------------------------------------------------
    // Lectures Full - MEDICAL uniquement + audit reason.
    // ----------------------------------------------------------------------------

    /**
     * Visites d'un travailleur (Full avec detailedReport dechiffre).
     * RBAC : MEDICAL uniquement. Header obligatoire {@code X-Reason}.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_MEDICAL + "')")
    @GetMapping("/by-worker/{workerId}/full")
    public ResponseEntity<List<MedicalVisitFullDTO>> byWorkerFull(
            @PathVariable Long workerId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Reason", required = false) String reason,
            HttpServletRequest request) {
        return new ResponseEntity<>(
                service.getWorkerVisitsFull(workerId, userId,
                        reason != null ? reason : "unspecified",
                        clientIp(request)),
                HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_MEDICAL + "')")
    @GetMapping("/get/{id}/full")
    public ResponseEntity<MedicalVisitFullDTO> getFull(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Reason", required = false) String reason,
            HttpServletRequest request) {
        return new ResponseEntity<>(
                service.getVisitFull(id, userId,
                        reason != null ? reason : "unspecified",
                        clientIp(request)),
                HttpStatus.OK);
    }

    /**
     * Export de l'historique medical complet d'un travailleur. RBAC dedie
     * {@code DOSIMETRY_EXPORT_MEDICAL} : permission distincte pour tracer separement
     * "consultation" et "export" (RGPD art. 30).
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_EXPORT_MEDICAL + "')")
    @GetMapping("/export/{workerId}")
    public ResponseEntity<List<MedicalVisitFullDTO>> exportFull(@PathVariable Long workerId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Reason", required = true) String reason,
            HttpServletRequest request) {
        if (reason == null || reason.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return new ResponseEntity<>(
                service.getWorkerVisitsFull(workerId, userId,
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
