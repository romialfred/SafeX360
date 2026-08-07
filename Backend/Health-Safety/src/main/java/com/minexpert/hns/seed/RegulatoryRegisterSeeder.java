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
import com.minexpert.hns.entity.compliance.MandatoryInspection;
import com.minexpert.hns.entity.compliance.RegulatoryObligation;
import com.minexpert.hns.entity.compliance.WorkAuthorization;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.repository.compliance.ExploitationLicenseRepository;
import com.minexpert.hns.repository.compliance.MandatoryInspectionRepository;
import com.minexpert.hns.repository.compliance.RegulatoryObligationRepository;
import com.minexpert.hns.repository.compliance.WorkAuthorizationRepository;

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
    private final WorkAuthorizationRepository authorizationRepository;
    private final MandatoryInspectionRepository inspectionRepository;
    private final RegulatoryObligationRepository obligationRepository;

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
            log.warn("[RegulatoryRegisterSeeder] Seed licences interrompu (non bloquant) : {}", ex.getMessage());
        }
        try {
            seedWorkAuthorizations();
        } catch (Exception ex) {
            log.warn("[RegulatoryRegisterSeeder] Seed autorisations interrompu (non bloquant) : {}", ex.getMessage());
        }
        try {
            seedInspections();
        } catch (Exception ex) {
            log.warn("[RegulatoryRegisterSeeder] Seed inspections interrompu (non bloquant) : {}", ex.getMessage());
        }
        try {
            seedObligations();
        } catch (Exception ex) {
            log.warn("[RegulatoryRegisterSeeder] Seed obligations interrompu (non bloquant) : {}", ex.getMessage());
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

    // ─── Autorisations de travaux ───────────────────────────────────────────

    private void seedWorkAuthorizations() {
        if (authorizationRepository.count() > 0) {
            log.info("[RegulatoryRegisterSeeder] Autorisations deja presentes — seed ignore.");
            return;
        }
        LocalDate today = LocalDate.now();
        List<WorkAuthorization> toSave = new ArrayList<>();

        // Mine 1 — Burkina GOLD SA
        toSave.add(authorization(MINE_BURKINA_GOLD, "DYNAMITAGE", "PT-DYN-2026-054",
                "Tir de mines — gradin 1080, fosse principale", "Fosse principale — gradin 1080", "ELEVE",
                today.minusDays(2), today.minusDays(2), today.plusDays(5),
                "Perimetre de securite 500 m, sirene, comptage des detonateurs, boutefeu habilite present.",
                "Autorisation delivree au titre du plan de tir hebdomadaire."));
        toSave.add(authorization(MINE_BURKINA_GOLD, "TRAVAIL_EN_HAUTEUR", "PT-HAU-2026-071",
                "Maintenance convoyeur — passerelle 12 m", "Usine de traitement — convoyeur CV-04", "MODERE",
                today, today, today.plusDays(3),
                "Harnais + ligne de vie obligatoires, nacelle inspectee, zone balisee au sol.",
                "Travaux de maintenance planifiee."));
        toSave.add(authorization(MINE_BURKINA_GOLD, "TRAVAIL_A_CHAUD", "PT-CHA-2026-088",
                "Soudure sur cuve de cyanuration", "Zone CIL — cuve n°3", "ELEVE",
                today.plusDays(4), today.plusDays(4), today.plusDays(5),
                "Permis feu, extincteurs a poste, surveillance incendie 2 h apres travaux, atmosphere controlee.",
                "Autorisation planifiee — a demarrer dans 4 jours."));
        toSave.add(authorization(MINE_BURKINA_GOLD, "EXCAVATION", "PT-EXC-2026-039",
                "Terrassement tranchee reseau electrique", "Aire industrielle nord", "MODERE",
                today.minusDays(20), today.minusDays(20), today.minusDays(6),
                "DICT effectuee, blindage des parois, detection reseaux enterres.",
                "Travaux clotures — conservation pour tracabilite."));

        // Mine 6 — SANAMA YIRI
        toSave.add(authorization(MINE_SANAMA_YIRI, "FORAGE", "PT-FOR-2026-012",
                "Foration reconnaissance — zone extension nord", "Extension nord", "MODERE",
                today.minusDays(1), today.minusDays(1), today.plusDays(9),
                "Controle poussieres, EPI respiratoires, balisage foreuse.",
                "Campagne de foration en cours."));
        toSave.add(authorization(MINE_SANAMA_YIRI, "ESPACE_CONFINE", "PT-CON-2026-006",
                "Inspection interne reservoir process", "Reservoir R-02", "CRITIQUE",
                today.minusDays(9), today.minusDays(9), today.minusDays(2),
                "Mesure d'atmosphere (O2, H2S), surveillant a l'entree, moyens d'extraction, ventilation forcee.",
                "Intervention close."));

        authorizationRepository.saveAll(toSave);
        log.info("[RegulatoryRegisterSeeder] {} autorisations de travaux seedees (mines 1 & 6).", toSave.size());
    }

    private WorkAuthorization authorization(Long companyId, String type, String reference, String title,
            String zone, String riskLevel, LocalDate issue, LocalDate from, LocalDate to,
            String precautions, String notes) {
        WorkAuthorization a = new WorkAuthorization();
        a.setCompanyId(companyId);
        a.setAuthorizationType(type);
        a.setReference(reference);
        a.setTitle(title);
        a.setZone(zone);
        a.setRiskLevel(riskLevel);
        a.setIssueDate(issue);
        a.setValidFrom(from);
        a.setValidTo(to);
        a.setPrecautions(precautions);
        a.setNotes(notes);
        a.setStatus(Status.ACTIVE);
        a.setCreatedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());
        return a;
    }

    // ─── Inspections reglementaires d'equipements ────────────────────────────

    private void seedInspections() {
        if (inspectionRepository.count() > 0) {
            log.info("[RegulatoryRegisterSeeder] Inspections deja presentes — seed ignore.");
            return;
        }
        LocalDate today = LocalDate.now();
        List<MandatoryInspection> toSave = new ArrayList<>();

        // Mine 1 — Burkina GOLD SA
        toSave.add(inspection(MINE_BURKINA_GOLD, "CUVE_SOUS_PRESSION", "CIL-CUVE-03",
                "Cuve de cyanuration n°3 — requalification decennale", "REQUALIFICATION",
                "APAVE", 120, today.minusMonths(6), today.plusMonths(114), "CONFORME", "APV-2026-1187"));
        toSave.add(inspection(MINE_BURKINA_GOLD, "APPAREIL_LEVAGE", "MAINT-PONT-01",
                "Pont roulant atelier maintenance — VGP", "VGP",
                "Bureau Veritas", 12, today.minusMonths(11), today.plusMonths(1), "CONFORME_AVEC_RESERVES", "BV-2025-4471"));
        toSave.add(inspection(MINE_BURKINA_GOLD, "RESERVOIR_HYDROCARBURE", "DEPOT-GO-01",
                "Reservoir gasoil 50 m3 — controle d'etancheite", "CONTROLE_REGLEMENTAIRE",
                "SOCOTEC", 24, today.minusMonths(25), today.minusMonths(1), "NON_CONFORME", "SOC-2024-0912"));
        toSave.add(inspection(MINE_BURKINA_GOLD, "INSTALLATION_ELECTRIQUE", "HT-POSTE-01",
                "Poste HT/BT principal — verification periodique", "VERIFICATION_PERIODIQUE",
                "APAVE", 12, today.minusMonths(5), today.plusMonths(7), "CONFORME", "APV-2026-0233"));
        toSave.add(inspection(MINE_BURKINA_GOLD, "COMPRESSEUR", "USINE-COMP-02",
                "Compresseur d'air process — epreuve", "EPREUVE",
                "Bureau Veritas", 60, today.minusMonths(58), today.plusMonths(2), "CONFORME", "BV-2021-7788"));

        // Mine 6 — SANAMA YIRI
        toSave.add(inspection(MINE_SANAMA_YIRI, "APPAREIL_LEVAGE", "ATEL-PALAN-01",
                "Palan atelier — VGP", "VGP",
                "APAVE", 12, today.minusMonths(13), today.minusMonths(1), "CONFORME", "APV-2025-3390"));
        toSave.add(inspection(MINE_SANAMA_YIRI, "CUVE_SOUS_PRESSION", "PROC-CUVE-01",
                "Cuve process sous pression — controle periodique", "CONTROLE_REGLEMENTAIRE",
                "SOCOTEC", 48, today.minusMonths(2), today.plusMonths(46), "CONFORME", "SOC-2026-0455"));
        toSave.add(inspection(MINE_SANAMA_YIRI, "EXTINCTEUR", "SITE-EXT-PARC",
                "Parc d'extincteurs du site — verification annuelle", "VERIFICATION_PERIODIQUE",
                "Prestataire agree local", 12, today.minusMonths(10), today.plusMonths(2), "CONFORME", "EXT-2025-0781"));

        inspectionRepository.saveAll(toSave);
        log.info("[RegulatoryRegisterSeeder] {} inspections reglementaires seedees (mines 1 & 6).", toSave.size());
    }

    private MandatoryInspection inspection(Long companyId, String equipmentType, String equipmentRef,
            String title, String inspectionType, String body, Integer freqMonths, LocalDate last,
            LocalDate next, String result, String certificate) {
        MandatoryInspection i = new MandatoryInspection();
        i.setCompanyId(companyId);
        i.setEquipmentType(equipmentType);
        i.setEquipmentRef(equipmentRef);
        i.setTitle(title);
        i.setInspectionType(inspectionType);
        i.setInspectionBody(body);
        i.setFrequencyMonths(freqMonths);
        i.setLastInspectionDate(last);
        i.setNextInspectionDate(next);
        i.setResult(result);
        i.setCertificateNumber(certificate);
        i.setStatus(Status.ACTIVE);
        i.setCreatedAt(LocalDateTime.now());
        i.setUpdatedAt(LocalDateTime.now());
        return i;
    }

    // ─── Obligations reglementaires & code minier ────────────────────────────

    private void seedObligations() {
        if (obligationRepository.count() > 0) {
            log.info("[RegulatoryRegisterSeeder] Obligations deja presentes — seed ignore.");
            return;
        }
        LocalDate today = LocalDate.now();
        List<RegulatoryObligation> toSave = new ArrayList<>();

        // Mine 1 — Burkina GOLD SA
        toSave.add(obligation(MINE_BURKINA_GOLD, "CODE_MINIER", "Loi 036-2015/CNT", "art. 145-146",
                "Constitution et alimentation du fonds de rehabilitation et de fermeture de la mine",
                "ENVIRONNEMENT", "Ministere des Mines et des Carrieres", "CONFORME",
                today.minusYears(6), today.minusMonths(3), today.plusMonths(9), null));
        toSave.add(obligation(MINE_BURKINA_GOLD, "CODE_MINIER", "Loi 036-2015/CNT", "art. 101",
                "Emploi et formation prioritaire de la main-d'oeuvre nationale (contenu local)",
                "SOCIAL", "Ministere des Mines et des Carrieres", "PARTIEL",
                today.minusYears(6), today.minusMonths(6), today.minusMonths(1),
                "Renforcer le plan de formation des cadres nationaux et documenter les taux d'emploi local."));
        toSave.add(obligation(MINE_BURKINA_GOLD, "CODE_ENVIRONNEMENT", "Loi 006-2013/AN", "art. 25",
                "Realisation et mise a jour de l'etude d'impact environnemental et social (EIES)",
                "ENVIRONNEMENT", "ANEVE", "CONFORME",
                today.minusYears(3), today.minusMonths(2), today.plusMonths(10), null));
        toSave.add(obligation(MINE_BURKINA_GOLD, "DECRET", "Decret 2017-0023", "art. 8",
                "Reglementation de la detention, du transport et de l'emploi des explosifs",
                "EXPLOSIFS", "Direction Generale des Mines", "CONFORME",
                today.minusYears(4), today.minusMonths(1), today.plusMonths(11), null));
        toSave.add(obligation(MINE_BURKINA_GOLD, "CONVENTION", "Convention OIT C176", "—",
                "Securite et sante dans les mines : evaluation des risques et droit de retrait",
                "SECURITE", "Ministere du Travail", "CONFORME",
                today.minusYears(5), today.minusMonths(4), today.plusMonths(8), null));
        toSave.add(obligation(MINE_BURKINA_GOLD, "ARRETE", "Arrete conjoint 2019-0145", "art. 3",
                "Declaration et suivi des rejets et de la qualite des eaux (parametres cyanure, metaux)",
                "ENVIRONNEMENT", "Ministere de l'Environnement", "NON_CONFORME",
                today.minusYears(2), today.minusMonths(8), today.minusMonths(2),
                "Mettre en conformite le point de rejet R2 et transmettre les analyses trimestrielles manquantes."));

        // Mine 6 — SANAMA YIRI
        toSave.add(obligation(MINE_SANAMA_YIRI, "CODE_MINIER", "Loi 036-2015/CNT", "art. 61-62",
                "Respect des conditions du permis d'exploitation de petite mine",
                "FONCIER", "Ministere des Mines et des Carrieres", "CONFORME",
                today.minusYears(4), today.minusMonths(2), today.plusMonths(10), null));
        toSave.add(obligation(MINE_SANAMA_YIRI, "CODE_TRAVAIL", "Loi 028-2008/AN", "art. 236",
                "Mise en place du comite de securite et sante au travail (CSST)",
                "TRAVAIL", "Ministere du Travail", "PARTIEL",
                today.minusYears(3), today.minusMonths(5), today.plusMonths(1),
                "Formaliser les proces-verbaux de reunion du CSST et la representation des travailleurs."));
        toSave.add(obligation(MINE_SANAMA_YIRI, "CODE_ENVIRONNEMENT", "Loi 006-2013/AN", "art. 30",
                "Notice d'impact environnemental et plan de gestion",
                "ENVIRONNEMENT", "ANEVE", "A_EVALUER",
                today.minusMonths(10), null, today.plusMonths(3), null));

        obligationRepository.saveAll(toSave);
        log.info("[RegulatoryRegisterSeeder] {} obligations reglementaires seedees (mines 1 & 6).", toSave.size());
    }

    private RegulatoryObligation obligation(Long companyId, String category, String reference, String article,
            String title, String domain, String authority, String complianceStatus, LocalDate applicableSince,
            LocalDate lastReview, LocalDate nextReview, String actionRequired) {
        RegulatoryObligation o = new RegulatoryObligation();
        o.setCompanyId(companyId);
        o.setCategory(category);
        o.setReference(reference);
        o.setArticle(article);
        o.setTitle(title);
        o.setDomain(domain);
        o.setAuthority(authority);
        o.setComplianceStatus(complianceStatus);
        o.setApplicableSince(applicableSince);
        o.setLastReviewDate(lastReview);
        o.setNextReviewDate(nextReview);
        o.setActionRequired(actionRequired);
        o.setStatus(Status.ACTIVE);
        o.setCreatedAt(LocalDateTime.now());
        o.setUpdatedAt(LocalDateTime.now());
        return o;
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
