package com.minexpert.hns.dosimetry.api;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.DosimetryDistributionDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryGlobalStatusDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryKpiSnapshotDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryMineComparisonDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryTopExposedDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryTrendPointDTO;
import com.minexpert.hns.dosimetry.enums.KpiCategory;
import com.minexpert.hns.dosimetry.service.DosimetryAggregationService;

import lombok.RequiredArgsConstructor;

/**
 * Endpoints REST des KPI Dosimetrie (Phase 8).
 *
 * <p><b>RBAC :</b> toutes les ressources sont AGREGEES (pas de nominatif), donc protegees par
 * {@link DosimetryRBACConfig#DOSIMETRY_READ_AGGREGATE}. Les endpoints cross-tenant
 * ({@code multi-mine-comparison}, {@code global-status}) restent sous la meme permission car
 * les valeurs exposees sont une moyenne / un compte par mine, jamais nominatives.
 */
@RestController
@RequestMapping("/dosimetry/kpi")
@CrossOrigin
@RequiredArgsConstructor
public class KpiController {

    private final DosimetryAggregationService service;

    /**
     * GET /dosimetry/kpi/summary?mineId=X&date=Y
     * Renvoie tous les snapshots (1 par categorie) de la mine pour la date demandee. Si
     * {@code date} omis, retourne la derniere date disponible.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/summary")
    public ResponseEntity<List<DosimetryKpiSnapshotDTO>> summary(
            @RequestParam("mineId") Long mineId,
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate effective = date != null ? date : LocalDate.now();
        // on cherche tous les snapshots sur la date demandee ; si vide, on tente la derniere disponible
        List<DosimetryKpiSnapshotDTO> rows = service.getKpis(mineId, effective, effective, null);
        if (rows.isEmpty() && date == null) {
            // fallback - on regarde [-365j ; today] et on prend le dernier (par categorie)
            rows = service.getKpis(mineId, effective.minusDays(365), effective, null);
            if (!rows.isEmpty()) {
                LocalDate latest = rows.stream()
                        .map(DosimetryKpiSnapshotDTO::getSnapshotDate)
                        .max(LocalDate::compareTo)
                        .orElse(effective);
                rows = rows.stream()
                        .filter(r -> latest.equals(r.getSnapshotDate()))
                        .toList();
            }
        }
        return new ResponseEntity<>(rows, HttpStatus.OK);
    }

    /**
     * GET /dosimetry/kpi/trend?mineId=X&months=12&category=&metric=
     * Renvoie une serie temporelle mensuelle de la metrique demandee.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/trend")
    public ResponseEntity<List<DosimetryTrendPointDTO>> trend(
            @RequestParam("mineId") Long mineId,
            @RequestParam(value = "months", defaultValue = "12") int months,
            @RequestParam(value = "category", required = false) KpiCategory category,
            @RequestParam(value = "metric", required = false) String metric) {
        return new ResponseEntity<>(
                service.getTrend(mineId, months, category, metric), HttpStatus.OK);
    }

    /**
     * GET /dosimetry/kpi/distribution?mineId=X&year=Y&category=
     * Renvoie l'histogramme de la distribution des doses annuelles vs. la limite reglementaire.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/distribution")
    public ResponseEntity<DosimetryDistributionDTO> distribution(
            @RequestParam("mineId") Long mineId,
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "category", required = false) KpiCategory category) {
        int effectiveYear = year != null ? year : LocalDate.now().getYear();
        return new ResponseEntity<>(
                service.getDistribution(mineId, effectiveYear, category), HttpStatus.OK);
    }

    /**
     * GET /dosimetry/kpi/top-exposed?mineId=X&limit=10&year=Y
     * Top N des workers les plus exposes (id + cumul, pas de nominatif).
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/top-exposed")
    public ResponseEntity<List<DosimetryTopExposedDTO>> topExposed(
            @RequestParam("mineId") Long mineId,
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            @RequestParam(value = "year", required = false) Integer year) {
        int effectiveYear = year != null ? year : LocalDate.now().getYear();
        return new ResponseEntity<>(
                service.getTopExposedWorkers(mineId, limit, effectiveYear), HttpStatus.OK);
    }

    /**
     * GET /dosimetry/kpi/multi-mine-comparison?date=Y
     * Agregat KPI par mine pour une date donnee.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/multi-mine-comparison")
    public ResponseEntity<List<DosimetryMineComparisonDTO>> multiMineComparison(
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<DosimetryMineComparisonDTO> rows = service.getMultiMineComparison(date);
        return new ResponseEntity<>(rows != null ? rows : Collections.emptyList(), HttpStatus.OK);
    }

    /**
     * GET /dosimetry/kpi/global-status
     * Etat global plateforme.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/global-status")
    public ResponseEntity<DosimetryGlobalStatusDTO> globalStatus() {
        return new ResponseEntity<>(service.getGlobalStatus(), HttpStatus.OK);
    }
}
