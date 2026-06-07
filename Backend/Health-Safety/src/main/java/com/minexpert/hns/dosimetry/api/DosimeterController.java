package com.minexpert.hns.dosimetry.api;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.DosimeterAssignDTO;
import com.minexpert.hns.dosimetry.dto.DosimeterDTO;
import com.minexpert.hns.dosimetry.dto.DosimeterDetailDTO;
import com.minexpert.hns.dosimetry.dto.DosimeterListItemDTO;
import com.minexpert.hns.dosimetry.dto.SearchDosimeterFiltersDTO;
import com.minexpert.hns.dosimetry.entity.Dosimeter;
import com.minexpert.hns.dosimetry.repository.DosimeterRepository;
import com.minexpert.hns.dosimetry.service.DosimeterQueryService;
import com.minexpert.hns.dosimetry.service.DosimeterService;
import com.minexpert.hns.dosimetry.service.DosimetryAuditService;
import com.minexpert.hns.dto.ResponseDTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@RestController
@RequestMapping("/dosimetry/dosimeter")
@CrossOrigin
@RequiredArgsConstructor
public class DosimeterController {

    private final DosimeterService service;
    private final DosimeterQueryService queryService;
    private final DosimeterRepository dosimeterRepository;
    private final DosimetryAuditService auditService;

    @PostMapping("/create")
    public ResponseEntity<Long> create(@RequestParam("companyId") Long companyId,
            @Valid @RequestBody DosimeterDTO dto) {
        return new ResponseEntity<>(service.create(companyId, dto), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> update(@RequestParam("companyId") Long companyId,
            @Valid @RequestBody DosimeterDTO dto) {
        service.update(companyId, dto);
        return new ResponseEntity<>(new ResponseDTO("Dosimeter updated successfully"), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<DosimeterDTO>> getAll(@RequestParam("companyId") Long companyId) {
        return new ResponseEntity<>(service.getAll(companyId), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<DosimeterDTO> getById(@PathVariable Long id) {
        return new ResponseEntity<>(service.getById(id), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id) {
        service.delete(id);
        return new ResponseEntity<>(new ResponseDTO("Dosimeter deleted successfully"), HttpStatus.OK);
    }

    // ============================================================
    // PHASE 3 : endpoints du parc (search / detail / assign / return / calibration alerts)
    // ============================================================

    /**
     * Recherche multi-criteres sur le parc de dosimetres. Voir
     * {@link SearchDosimeterFiltersDTO} pour les filtres supportes.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @PostMapping("/search")
    public ResponseEntity<List<DosimeterListItemDTO>> search(
            @Valid @RequestBody SearchDosimeterFiltersDTO filters) {
        return new ResponseEntity<>(queryService.searchDosimeters(filters), HttpStatus.OK);
    }

    /**
     * Lookup d'un dosimetre par son QR code dans le perimetre d'une mine. Cas d'usage : scan
     * terrain (operateur radioprotection) ou recherche rapide depuis la console parc. Un meme
     * QR code peut techniquement etre reutilise dans deux mines distinctes ; on requiert donc
     * explicitement mineId pour respecter l'isolation multi-tenant.
     *
     * <p>Retourne 200 avec le DTO si trouve, 404 sinon. Trace systematiquement un audit log
     * (action=SEARCH_QR) pour suivre les acces par scan, meme en cas de miss (tracabilite
     * forensique : detecter un balayage de QR inconnus).
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/find-by-qr")
    public ResponseEntity<DosimeterDTO> findByQr(@RequestParam("qrCode") String qrCode,
            @RequestParam("mineId") Long mineId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        Optional<Dosimeter> found = dosimeterRepository.findByQrCodeAndMineId(qrCode, mineId);
        auditService.log("SEARCH_QR", "Dosimeter", found.map(Dosimeter::getId).orElse(null),
                userId, DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE,
                "qrCode=" + qrCode + ";mineId=" + mineId
                        + ";found=" + found.isPresent());
        return found.map(d -> ResponseEntity.ok(toDosimeterDTO(d)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Fiche 360 d'un dosimetre : entite + assignment actif + historique + placeholder etalonnage.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/detail/{id}")
    public ResponseEntity<DosimeterDetailDTO> detail(@PathVariable("id") Long id) {
        return new ResponseEntity<>(queryService.getDosimeterDetail(id), HttpStatus.OK);
    }

    /**
     * Affecte un dosimetre AVAILABLE a un travailleur (handover). Le dosimetre bascule en
     * statut ASSIGNED, et un DosimetryAuditLog (action=CREATE) est ecrit.
     *
     * <p><b>Note d'architecture (P0.2) :</b> bien que le frontend appelle l'URL
     * {@code /hns/dosimetry/dosimeter-assignment/assign}, les endpoints {@code /assign} et
     * {@code /return} sont volontairement hostes sur {@link DosimeterController} car ils sont
     * la source d'autorite : ils mutent l'etat du dosimetre (status, currentWorker) en plus
     * de creer/cloturer une affectation. La requete frontend doit donc viser
     * {@code /hns/dosimetry/dosimeter/assign}.
     *
     * <p>L'identifiant de l'acteur est lu depuis l'en-tete {@code X-User-Id} (defaut 0 si
     * absent : compatibilite tests/dev sans gateway). Il est passe au service pour renseigner
     * {@code createdBy}/{@code updatedBy}.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_WRITE + "')")
    @PostMapping("/assign")
    public ResponseEntity<Long> assign(@Valid @RequestBody DosimeterAssignDTO dto,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        Long assignmentId = queryService.assignToWorker(dto.getDosimeterId(), dto.getWorkerId(),
                dto.getPeriodStart(), dto.getPeriodEnd(), dto.getHandoverNote(), userId);
        return new ResponseEntity<>(assignmentId, HttpStatus.CREATED);
    }

    /**
     * Acquitte la restitution d'un dosimetre (return). Le dosimetre passe en IN_READING
     * (lecture en cours par le laboratoire) et un DosimetryAuditLog (action=UPDATE) est ecrit.
     *
     * <p><b>Stockage de l'etat constate :</b> on stocke {@code deviceCondition} brut dans
     * {@link com.minexpert.hns.dosimetry.entity.DosimeterAssignment#deviceCondition}. Si le
     * front fournit aussi {@code deviceConditionNote} (commentaire libre), on les concatene au
     * format {@code "deviceCondition - note"} avant de transmettre au service. La separation
     * en deux champs reste exclusivement cote API ; cote BDD on conserve un unique champ texte
     * pour ne pas migrer le schema.
     *
     * <p>X-User-Id : meme convention que {@link #assign} (defaut 0 si absent).
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_WRITE + "')")
    @PostMapping("/return")
    public ResponseEntity<ResponseDTO> returnDosimeter(@Valid @RequestBody DosimeterReturnDTO dto,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        String deviceCondition = mergeDeviceCondition(dto.getDeviceCondition(),
                dto.getDeviceConditionNote());
        queryService.returnFromWorker(dto.getAssignmentId(), deviceCondition, userId);
        return new ResponseEntity<>(new ResponseDTO("Dosimeter returned successfully"),
                HttpStatus.OK);
    }

    /**
     * Concatene l'etat constate du dosimetre et la note libre optionnelle au format
     * {@code "<condition> - <note>"}. Si {@code note} est null/blank, renvoie {@code condition}
     * tel quel. Si {@code condition} est null/blank mais {@code note} est present, renvoie la
     * note seule (ne pas perdre l'info).
     */
    private String mergeDeviceCondition(String condition, String note) {
        boolean hasCondition = condition != null && !condition.isBlank();
        boolean hasNote = note != null && !note.isBlank();
        if (hasCondition && hasNote) {
            return condition + " - " + note;
        }
        if (hasCondition) {
            return condition;
        }
        if (hasNote) {
            return note;
        }
        return null;
    }

    /**
     * Liste des dosimetres dont l'echeance d'etalonnage est dans les 30 jours (ou depassee).
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/calibration-alerts")
    public ResponseEntity<List<DosimeterListItemDTO>> calibrationAlerts(
            @RequestParam("mineId") Long mineId) {
        return new ResponseEntity<>(queryService.calibrationAlerts(mineId), HttpStatus.OK);
    }

    /**
     * Payload de l'endpoint /return. Garde le DTO local au controller car le case d'usage
     * est petit et ne justifie pas un fichier dedie.
     *
     * <ul>
     *   <li>{@code assignmentId} : id de l'affectation a cloturer (obligatoire).</li>
     *   <li>{@code deviceCondition} : etat constate (ex. "OK", "Endommage", "Manquant").</li>
     *   <li>{@code deviceConditionNote} : commentaire libre optionnel ; sera concatene a
     *       {@code deviceCondition} via {@link DosimeterController#mergeDeviceCondition}.</li>
     * </ul>
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DosimeterReturnDTO {
        @NotNull
        private Long assignmentId;
        private String deviceCondition;
        /** Commentaire libre optionnel ajoute apres deviceCondition (format "cond - note"). */
        private String deviceConditionNote;
    }

    /**
     * Mappe l'entite Dosimeter vers son DTO. Local au controller pour eviter une dependance
     * supplementaire vers DosimeterService dans le cas d'usage find-by-qr (read direct du
     * repository).
     */
    private DosimeterDTO toDosimeterDTO(Dosimeter d) {
        LocalDateTime createdAt = d.getCreatedAt();
        LocalDateTime updatedAt = d.getUpdatedAt();
        return new DosimeterDTO(d.getId(), d.getSerial(), d.getType(), d.getQrCode(),
                d.getStatus(), d.getCalibrationDueDate(), d.getMineId(),
                createdAt, updatedAt, d.getCreatedBy(), d.getUpdatedBy());
    }
}
