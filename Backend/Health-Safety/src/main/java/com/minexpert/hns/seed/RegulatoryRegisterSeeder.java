package com.minexpert.hns.seed;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.minexpert.hns.entity.compliance.ExploitationLicense;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.repository.compliance.ExploitationLicenseRepository;

import lombok.RequiredArgsConstructor;

/**
 * REGISTRES REGLEMENTAIRES PAR MINE — donnees de demonstration (Burkina Faso).
 *
 * <p>Idempotent : chaque registre n'est seede que si sa table est vide. Les
 * donnees s'appuient sur le cadre reel (Loi 036-2015/CNT — Code minier du Burkina
 * Faso, ANEVE pour l'environnement, reglementation des explosifs) pour les deux
 * mines de demonstration : 1 (Burkina GOLD SA) et 6 (SANAMA YIRI).
 *
 * <p>Ne bloque jamais le demarrage : toute erreur est journalisee sans propager.
 */
@Component
@Order(50)
@RequiredArgsConstructor
public class RegulatoryRegisterSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(RegulatoryRegisterSeeder.class);

    private static final long MINE_BURKINA_GOLD = 1L;
    private static final long MINE_SANAMA_YIRI = 6L;

    private final ExploitationLicenseRepository licenseRepository;

    @Override
    public void run(ApplicationArguments args) {
        Thread worker = new Thread(this::seedSafely, "regulatory-register-seeder");
        worker.setDaemon(true);
        worker.start();
    }

    private void seedSafely() {
        try {
            seedLicenses();
        } catch (Exception ex) {
            log.warn("[RegulatoryRegisterSeeder] Seed interrompu (non bloquant) : {}", ex.getMessage());
        }
    }

    // ─── Licences & permis d'exploitation ───────────────────────────────────

    private void seedLicenses() {
        if (licenseRepository.count() > 0) {
            log.info("[RegulatoryRegisterSeeder] Licences deja presentes — seed licences ignore.");
            return;
        }
        LocalDate today = LocalDate.now();
        List<ExploitationLicense> toSave = new ArrayList<>();

        // Mine 1 — Burkina GOLD SA
        toSave.add(license(MINE_BURKINA_GOLD, "PERMIS_EXPLOITATION",
                "AE-2019-0142/MMC", "Permis d'exploitation industrielle de grande mine d'or",
                "Ministere des Mines et des Carrieres", "Burkina GOLD SA",
                today.minusYears(6), today.minusYears(6), today.plusYears(3), today.plusYears(3).minusMonths(6),
                12500.0, "Commune de Houndé, Province du Tuy — perimetre 125 km²", 45_000_000.0,
                "Titre delivre au titre de la Loi 036-2015/CNT (Code minier du Burkina Faso), art. 46."));

        toSave.add(license(MINE_BURKINA_GOLD, "PERMIS_ENVIRONNEMENTAL",
                "ANEVE-2022-0311", "Certificat de conformite environnementale (PGES)",
                "Agence Nationale des Evaluations Environnementales (ANEVE)", "Burkina GOLD SA",
                today.minusYears(2), today.minusYears(2), today.plusMonths(2), today.plusMonths(1),
                null, "Site minier de Houndé", null,
                "Renouvellement du PGES a preparer — audit environnemental annuel requis."));

        toSave.add(license(MINE_BURKINA_GOLD, "AUTORISATION_EXPLOSIFS",
                "DGMGC-EXP-2024-089", "Autorisation de detention et d'emploi d'explosifs",
                "Direction Generale des Mines, de la Geologie et des Carrieres", "Burkina GOLD SA",
                today.minusMonths(8), today.minusMonths(8), today.plusMonths(4), today.plusMonths(3),
                null, "Depot d'explosifs — zone securisee du site", null,
                "Depot conforme, gardiennage 24/7. Controle pyrotechnique semestriel."));

        toSave.add(license(MINE_BURKINA_GOLD, "AUTORISATION_EAU",
                "MEA-2021-0567", "Autorisation de prelevement d'eau (forages industriels)",
                "Ministere de l'Eau et de l'Assainissement", "Burkina GOLD SA",
                today.minusYears(3), today.minusYears(3), today.minusMonths(1), today.minusMonths(3),
                null, "Champ de captage — 6 forages", 3_200_000.0,
                "EXPIRE : dossier de renouvellement a deposer en urgence aupres du MEA."));

        // Mine 6 — SANAMA YIRI
        toSave.add(license(MINE_SANAMA_YIRI, "PERMIS_EXPLOITATION",
                "AE-2020-0088/MMC", "Permis d'exploitation de petite mine d'or",
                "Ministere des Mines et des Carrieres", "SANAMA YIRI SARL",
                today.minusYears(4), today.minusYears(4), today.plusYears(1), today.plusMonths(9),
                480.0, "Region du Centre-Nord — perimetre 4,8 km²", 8_000_000.0,
                "Petite mine au titre de la Loi 036-2015/CNT, art. 61."));

        toSave.add(license(MINE_SANAMA_YIRI, "PERMIS_RECHERCHE",
                "PR-2023-0421/MMC", "Permis de recherche (extension du gisement)",
                "Ministere des Mines et des Carrieres", "SANAMA YIRI SARL",
                today.minusYears(1), today.minusYears(1), today.plusYears(2), today.plusYears(2).minusMonths(4),
                2500.0, "Zone d'extension nord — 25 km²", 1_500_000.0,
                "Travaux de recherche geologique en cours."));

        toSave.add(license(MINE_SANAMA_YIRI, "PERMIS_ENVIRONNEMENTAL",
                "ANEVE-2024-0198", "Notice d'impact environnemental approuvee",
                "Agence Nationale des Evaluations Environnementales (ANEVE)", "SANAMA YIRI SARL",
                today.minusMonths(10), today.minusMonths(10), today.plusMonths(1), today.minusDays(5),
                null, "Site de SANAMA YIRI", null,
                "A RENOUVELER : echeance de depot depassee de quelques jours."));

        licenseRepository.saveAll(toSave);
        log.info("[RegulatoryRegisterSeeder] {} licences seedees (mines 1 & 6).", toSave.size());
    }

    private ExploitationLicense license(Long companyId, String type, String reference, String title,
            String authority, String holder, LocalDate issue, LocalDate effective, LocalDate expiry,
            LocalDate renewalDeadline, Double areaHa, String perimeter, Double fee, String notes) {
        ExploitationLicense l = new ExploitationLicense();
        l.setCompanyId(companyId);
        l.setLicenseType(type);
        l.setReference(reference);
        l.setTitle(title);
        l.setIssuingAuthority(authority);
        l.setHolder(holder);
        l.setIssueDate(issue);
        l.setEffectiveDate(effective);
        l.setExpiryDate(expiry);
        l.setRenewalDeadline(renewalDeadline);
        l.setAreaHectares(areaHa);
        l.setPerimeter(perimeter);
        l.setFeeAmount(fee);
        l.setStatus(Status.ACTIVE);
        l.setNotes(notes);
        l.setCreatedAt(LocalDateTime.now());
        l.setUpdatedAt(LocalDateTime.now());
        return l;
    }
}
