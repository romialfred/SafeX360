package com.minexpert.hns.dosimetry.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

import com.minexpert.hns.dosimetry.dto.DoseRecordCreateResultDTO;
import com.minexpert.hns.dosimetry.dto.DoseRecordDTO;
import com.minexpert.hns.dosimetry.dto.DoseRecordSupersedeRequestDTO;
import com.minexpert.hns.dosimetry.service.DoseRecordQueryService;
import com.minexpert.hns.dosimetry.service.DoseRecordService;
import com.minexpert.hns.dosimetry.util.DosimetrySelfAccessGuard;
import com.minexpert.hns.dosimetry.util.XReasonValidator;
import com.minexpert.hns.dto.ResponseDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.RequestHeader;

/**
 * Controller des enregistrements de dose.
 *
 * <p>IMPORTANT - PATTERN APPEND-ONLY :
 * <ul>
 *   <li>create -&gt; nouveau record version=1 (refuse si un record ACTIF existe deja pour
 *       (worker, period), il faut passer par supersede dans ce cas).</li>
 *   <li>supersede -&gt; cree un NOUVEAU DoseRecord avec version+1 et fixe
 *       supersededRecordId sur l'ancien (seul UPDATE autorise par trigger V004).</li>
 * </ul>
 *
 * <p>Les endpoints enrichis (create, supersede, active-by-worker, history) renvoient des
 * DoseRecordCreateResultDTO ou des List&lt;DoseRecordDTO&gt; selon le besoin frontend, et
 * declenchent en cascade : recompute cumul + threshold engine + audit.
 *
 * <p>RBAC : annotations {@code @PreAuthorize} actives via {@code @EnableMethodSecurity}.
 */
@RestController
@RequestMapping("/dosimetry/dose-record")
@CrossOrigin
@RequiredArgsConstructor
public class DoseRecordController {

    private final DoseRecordService service;
    private final DoseRecordQueryService queryService;
    private final DosimetrySelfAccessGuard selfAccessGuard;
    private final XReasonValidator reasonValidator;

    // -----------------------------------------------------------------------------------------
    //   ECRITURE - PHASE 4
    // -----------------------------------------------------------------------------------------

    /**
     * Cree un nouveau DoseRecord. Renvoie un payload riche (recordId, version,
     * requiresDoubleValidation, alertsCreated). Refuse si un record actif pour la meme
     * (worker, period) existe deja - utiliser /supersede dans ce cas.
     */
    @PreAuthorize("hasAuthority('DOSIMETRY_WRITE')")
    @PostMapping("/create")
    public ResponseEntity<DoseRecordCreateResultDTO> create(
            @RequestParam("companyId") Long companyId,
            @Valid @RequestBody DoseRecordDTO dto) {
        return new ResponseEntity<>(service.createWithResult(companyId, dto), HttpStatus.CREATED);
    }

    /**
     * Cree une NOUVELLE version (supersede) d'un DoseRecord existant. Le body comporte
     * l'originalId, le motif et les nouvelles valeurs. Echoue si le record original est
     * deja superseded (chainage scelle).
     */
    @PreAuthorize("hasAuthority('DOSIMETRY_WRITE')")
    @PostMapping("/supersede")
    public ResponseEntity<DoseRecordCreateResultDTO> supersede(
            @RequestParam("companyId") Long companyId,
            @Valid @RequestBody DoseRecordSupersedeRequestDTO request) {
        return new ResponseEntity<>(service.supersedeWithResult(companyId, request), HttpStatus.OK);
    }

    // -----------------------------------------------------------------------------------------
    //   LEGACY (retro-compat avec frontend existant : retour Long)
    // -----------------------------------------------------------------------------------------

    /**
     * Append-only : delegue a service.supersede(...) qui cree un nouveau record version+1 et
     * marque l'ancien comme superseded. Retourne l'id du NOUVEL enregistrement.
     */
    @PreAuthorize("hasAuthority('DOSIMETRY_WRITE')")
    @PutMapping("/update")
    public ResponseEntity<Long> update(@RequestParam("companyId") Long companyId,
            @RequestBody DoseRecordDTO dto) {
        Long newId = service.supersede(companyId, dto);
        return new ResponseEntity<>(newId, HttpStatus.OK);
    }

    // -----------------------------------------------------------------------------------------
    //   LECTURE
    // -----------------------------------------------------------------------------------------

    @PreAuthorize("hasAuthority('DOSIMETRY_READ_NOMINATIVE')")
    @GetMapping("/getAll")
    public ResponseEntity<List<DoseRecordDTO>> getAll(@RequestParam("companyId") Long companyId) {
        return new ResponseEntity<>(service.getAll(companyId), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('DOSIMETRY_READ_NOMINATIVE')")
    @GetMapping("/get/{id}")
    public ResponseEntity<DoseRecordDTO> getById(@PathVariable Long id) {
        return new ResponseEntity<>(service.getById(id), HttpStatus.OK);
    }

    // Throws UnsupportedOperationException by design (AIEA GSR Part 3 §3.106 :
    // les enregistrements de dose ne peuvent etre supprimes — append-only).
    @PreAuthorize("hasAuthority('DOSIMETRY_ADMIN')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id) {
        service.delete(id);
        return new ResponseEntity<>(new ResponseDTO("DoseRecord deleted successfully"), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('DOSIMETRY_READ_NOMINATIVE')")
    @GetMapping("/getActiveByWorker/{workerId}")
    public ResponseEntity<List<DoseRecordDTO>> getActiveByWorker(@PathVariable Long workerId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        // Phase 10-A : SELF enforcement (cross-worker -> 403).
        selfAccessGuard.verifySelfAccess(workerId, userId);
        return new ResponseEntity<>(service.getActiveByWorkerId(workerId), HttpStatus.OK);
    }

    /** Nouveau (Phase 4) - alias canonique de getActiveByWorker, ordonne par period ASC. */
    @PreAuthorize("hasAuthority('DOSIMETRY_READ_NOMINATIVE')")
    @GetMapping("/active-by-worker/{workerId}")
    public ResponseEntity<List<DoseRecordDTO>> activeByWorker(@PathVariable Long workerId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        // Phase 10-A : SELF enforcement.
        selfAccessGuard.verifySelfAccess(workerId, userId);
        return new ResponseEntity<>(queryService.findActiveByWorker(workerId), HttpStatus.OK);
    }

    /**
     * Renvoie TOUTES les versions (actives + superseded) d'un (worker, period). Utilise par
     * la vue audit / historique pour materialiser la chaine append-only.
     *
     * <p>Phase 10-A : endpoint considere "Full" (chaine versions detaillee = donnee
     * nominative enrichie). X-Reason obligatoire (RGPD art. 30).
     */
    @PreAuthorize("hasAuthority('DOSIMETRY_READ_NOMINATIVE')")
    @GetMapping("/history-by-worker-period/{workerId}/{period}")
    public ResponseEntity<List<DoseRecordDTO>> historyByWorkerPeriod(
            @PathVariable Long workerId,
            @PathVariable String period,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Reason", required = true) String reason) {
        // Phase 10-A : SELF enforcement + X-Reason >= 10 chars (donnees detaillees historique).
        selfAccessGuard.verifySelfAccess(workerId, userId);
        reasonValidator.validate(reason, userId, "DOSE_RECORD_HISTORY_BY_WORKER");
        return new ResponseEntity<>(
                queryService.findHistoryByWorkerWithVersions(workerId, period), HttpStatus.OK);
    }

    /** Renvoie les DoseRecord actifs d'un worker pour une annee donnee (trend annuel). */
    @PreAuthorize("hasAuthority('DOSIMETRY_READ_NOMINATIVE')")
    @GetMapping("/by-worker-year/{workerId}/{year}")
    public ResponseEntity<List<DoseRecordDTO>> byWorkerYear(@PathVariable Long workerId,
            @PathVariable int year,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        // Phase 10-A : SELF enforcement.
        selfAccessGuard.verifySelfAccess(workerId, userId);
        return new ResponseEntity<>(queryService.findByWorkerYear(workerId, year), HttpStatus.OK);
    }
}
