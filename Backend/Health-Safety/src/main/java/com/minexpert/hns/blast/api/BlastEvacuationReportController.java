package com.minexpert.hns.blast.api;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

import com.minexpert.hns.blast.config.BlastRBACConfig;
import com.minexpert.hns.blast.dto.BlastEvacuationReportDTO;
import com.minexpert.hns.blast.dto.BlastEvacuationReportIncidentDTO;
import com.minexpert.hns.blast.dto.BlastEvacuationReportSignDTO;
import com.minexpert.hns.blast.service.BlastEvacuationReportService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints REST du rapport d'evacuation (P6).
 *
 * <p>RBAC :
 * <ul>
 *   <li>{@code GET .../by-blast/{blastId}} : {@link BlastRBACConfig#BLAST_VIEW}
 *       — consultation libre dans le perimetre des roles HSE / Operations.</li>
 *   <li>{@code POST .../sign/{reportId}} : {@link BlastRBACConfig#BLAST_REPORT}
 *       — signature reservee aux agents HSE habilites.</li>
 *   <li>{@code POST .../add-incident/{reportId}} : {@link BlastRBACConfig#BLAST_REPORT}
 *       — saisie d'incident reservee aux meme agents (cohorte BLAST_REPORT).</li>
 *   <li>{@code GET .../pdf/{reportId}} : {@link BlastRBACConfig#BLAST_VIEW}
 *       — export PDF visible par tout consultant du registre.</li>
 * </ul>
 */
@RestController
@RequestMapping("/hns/blast/evacuation-report")
@CrossOrigin
@RequiredArgsConstructor
public class BlastEvacuationReportController {

    private final BlastEvacuationReportService service;

    /**
     * Recupere le rapport d'evacuation associe a un tir. Retourne 404 si
     * aucun rapport n'a encore ete cree (cas tir non ALL_CLEAR).
     */
    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_VIEW + "')")
    @GetMapping("/by-blast/{blastId}")
    public ResponseEntity<BlastEvacuationReportDTO> getByBlast(@PathVariable Long blastId) {
        return service.getByBlastId(blastId)
                .map(dto -> new ResponseEntity<>(dto, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Recupere un rapport d'evacuation par son propre id.
     */
    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_VIEW + "')")
    @GetMapping("/{reportId}")
    public ResponseEntity<BlastEvacuationReportDTO> getById(@PathVariable Long reportId) {
        return service.getById(reportId)
                .map(dto -> new ResponseEntity<>(dto, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Liste les rapports d'une mine. Tri implicite : ALL_CLEAR le plus
     * recent en premier.
     */
    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_VIEW + "')")
    @GetMapping("/search")
    public ResponseEntity<List<BlastEvacuationReportDTO>> search(
            @RequestParam Long mineId) {
        return new ResponseEntity<>(service.search(mineId), HttpStatus.OK);
    }

    /**
     * Signe le rapport. Apres signature, {@code incidents}, {@code musteredCount}
     * et {@code missingCount} deviennent strictement append-only (defense
     * applicative + triggers BDD).
     */
    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_REPORT + "')")
    @PostMapping("/sign/{reportId}")
    public ResponseEntity<BlastEvacuationReportDTO> sign(@PathVariable Long reportId,
            @RequestBody(required = false) BlastEvacuationReportSignDTO body,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        String signature = body != null ? body.getSignatureDataBase64() : null;
        BlastEvacuationReportDTO dto = service.sign(reportId, userId, signature);
        return new ResponseEntity<>(dto, HttpStatus.OK);
    }

    /**
     * Ajoute un incident au rapport. Refuse si le rapport est deja signe
     * (HTTP 409 via la {@code IllegalStateException} levee par le service).
     */
    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_REPORT + "')")
    @PostMapping("/add-incident/{reportId}")
    public ResponseEntity<BlastEvacuationReportDTO> addIncident(@PathVariable Long reportId,
            @RequestBody BlastEvacuationReportIncidentDTO body,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        if (body == null || body.getDescription() == null || body.getDescription().isBlank()) {
            throw new IllegalArgumentException("description is required");
        }
        BlastEvacuationReportDTO dto = service.addIncident(reportId, body.getDescription(), userId);
        return new ResponseEntity<>(dto, HttpStatus.OK);
    }

    /**
     * Genere le PDF du rapport. Accepte un param optionnel {@code lang} : "fr"
     * (defaut) ou "en". Le PDF commence par les octets magiques {@code %PDF-}.
     */
    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_VIEW + "')")
    @GetMapping("/pdf/{reportId}")
    public ResponseEntity<byte[]> pdf(@PathVariable Long reportId,
            @RequestParam(value = "lang", required = false, defaultValue = "fr") String lang) {
        byte[] bytes = service.renderPdf(reportId, lang);
        String filename = String.format("evacuation-report-%d.pdf", reportId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("no-store");
        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }

    /**
     * Mapping {@code EntityNotFoundException} -&gt; HTTP 404 pour ce
     * controller (la convention globale du module renvoie 500 par defaut).
     */
    @org.springframework.web.bind.annotation.ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> handleNotFound(EntityNotFoundException ex) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    /**
     * Mapping {@code IllegalStateException} -&gt; HTTP 409 (Conflict) :
     * tentative de mutation d'un rapport deja signe par exemple.
     */
    @org.springframework.web.bind.annotation.ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> handleConflict(IllegalStateException ex) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.CONFLICT);
    }
}
