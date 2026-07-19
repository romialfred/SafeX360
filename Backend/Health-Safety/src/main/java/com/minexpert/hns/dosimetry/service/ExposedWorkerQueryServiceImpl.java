package com.minexpert.hns.dosimetry.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.dto.DoseCumulativeDTO;
import com.minexpert.hns.dosimetry.dto.DoseRecordDTO;
import com.minexpert.hns.dosimetry.dto.DosimeterAssignmentDTO;
import com.minexpert.hns.dosimetry.dto.ExposedWorkerDetailDTO;
import com.minexpert.hns.dosimetry.dto.ExposedWorkerDetailDTO.ClassificationDTO;
import com.minexpert.hns.dosimetry.dto.ExposedWorkerDetailDTO.IdentityDTO;
import com.minexpert.hns.dosimetry.dto.ExposedWorkerListItemDTO;
import com.minexpert.hns.dosimetry.dto.ExposureAlertDTO;
import com.minexpert.hns.dosimetry.dto.ExposureProfileDTO;
import com.minexpert.hns.dosimetry.dto.MedicalSurveillanceDTO;
import com.minexpert.hns.dosimetry.dto.QualificationDTO;
import com.minexpert.hns.dosimetry.dto.SearchFiltersDTO;
import com.minexpert.hns.dosimetry.dto.ThresholdDTO;
import com.minexpert.hns.dosimetry.entity.DoseCumulative;
import com.minexpert.hns.dosimetry.entity.DoseRecord;
import com.minexpert.hns.dosimetry.entity.DosimeterAssignment;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.entity.ExposureAlert;
import com.minexpert.hns.dosimetry.entity.ExposureProfile;
import com.minexpert.hns.dosimetry.entity.MedicalSurveillance;
import com.minexpert.hns.dosimetry.entity.Qualification;
import com.minexpert.hns.dosimetry.entity.Threshold;
import com.minexpert.hns.dosimetry.enums.DoseCategory;
import com.minexpert.hns.dosimetry.enums.DoseSpecialStatus;
import com.minexpert.hns.dosimetry.enums.QualifStatus;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;
import com.minexpert.hns.dosimetry.repository.DoseCumulativeRepository;
import com.minexpert.hns.dosimetry.repository.DoseRecordRepository;
import com.minexpert.hns.dosimetry.repository.DosimeterAssignmentRepository;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.repository.ExposureAlertRepository;
import com.minexpert.hns.dosimetry.repository.ExposureProfileRepository;
import com.minexpert.hns.dosimetry.repository.MedicalSurveillanceRepository;
import com.minexpert.hns.dosimetry.repository.QualificationRepository;
import com.minexpert.hns.dosimetry.repository.ThresholdRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Implementation read-only du Registre des travailleurs exposes.
 *
 * <p>Cette classe rassemble en une vue cohesive les donnees servies au frontend Registre :
 * liste paginee avec cumuls + niveau d'exposition (vert/jaune/orange/rouge), et fiche 360
 * (identite RH + classification + doses + dosimetres + medical + qualifs + alertes + seuils).
 *
 * <p>L'enrichissement RH (matricule, nom, poste, departement) reste optionnel : si le module
 * RH n'est pas disponible (Phase 1, pas encore branche), les champs nominatifs restent null
 * sans bloquer le rendu. Le mapping cote frontend gere ce cas.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ExposedWorkerQueryServiceImpl implements ExposedWorkerQueryService {

    private final ExposedWorkerRepository workerRepository;
    private final DoseCumulativeRepository cumulativeRepository;
    private final DoseRecordRepository doseRecordRepository;
    private final ExposureProfileRepository exposureProfileRepository;
    private final DosimeterAssignmentRepository dosimeterAssignmentRepository;
    private final MedicalSurveillanceRepository medicalSurveillanceRepository;
    private final QualificationRepository qualificationRepository;
    private final ExposureAlertRepository exposureAlertRepository;
    private final ThresholdRepository thresholdRepository;
    private final DosimetryAuditLogRepository auditLogRepository;
    private RegulatoryLimitResolver regulatoryLimitResolver;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setRegulatoryLimitResolver(RegulatoryLimitResolver regulatoryLimitResolver) {
        this.regulatoryLimitResolver = regulatoryLimitResolver;
    }
    /**
     * Lookup RH (table {@code employee} de HRMS MineXpert dans la même DB Aiven). Nullable
     * pour rester compatible avec les tests unitaires qui instancient le service sans
     * datasource. Cf. {@link EmployeeLookupService}.
     */
    private final EmployeeLookupService employeeLookupService;

    /**
     * Cle de permission MEDECIN (chaine identique a celle declaree dans
     * {@code DosimetryRBACConfig.DOSIMETRY_MEDICAL}). On compare avec {@link String#contains}
     * sur la chaine CSV transmise dans le header X-Permissions par le gateway.
     */
    private static final String PERM_MEDICAL = "DOSIMETRY_MEDICAL";

    /** Reference framework de personne attendue par le moteur de seuils. */
    private static final String PERSON_CATEGORY_PREGNANCY = "PREGNANCY";
    private static final String PERSON_CATEGORY_APPRENTICE = "APPRENTICE";
    private static final String PERSON_CATEGORY_WORKER_A = "WORKER_A";
    private static final String PERSON_CATEGORY_WORKER_B = "WORKER_B";
    private static final String PERSON_CATEGORY_PUBLIC = "PUBLIC";

    /** Annee de reference pour les cumuls (par defaut l'annee courante). Configurable pour tests. */
    @Value("${safex.dosimetry.referenceYear:0}")
    private int configuredYear;

    @Override
    public List<ExposedWorkerListItemDTO> searchWorkers(SearchFiltersDTO filters) {
        if (filters == null || filters.getMineId() == null) {
            return Collections.emptyList();
        }

        int year = referenceYear();
        Long mineId = filters.getMineId();

        // 1. Projection compacte : worker + cumul de l'annee N
        List<Object[]> rows = workerRepository.findRegistryProjection(mineId, year);

        // 2. Cache des limites approuvées par catégorie (1 résolution par catégorie).
        Map<String, Double> hp10Limits = new HashMap<>();

        List<ExposedWorkerListItemDTO> items = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Long id = (Long) row[0];
            Long employeeId = (Long) row[1];
            DoseCategory category = (DoseCategory) row[2];
            DoseSpecialStatus specialStatus = (DoseSpecialStatus) row[3];
            Double annualHp10 = (Double) row[4];
            Double rolling5y = (Double) row[5];
            Double lifetime = (Double) row[6];

            String personCategory = resolvePersonCategory(category, specialStatus);
            Double limit = hp10Limits.computeIfAbsent(personCategory, pc -> {
                if (regulatoryLimitResolver != null) {
                    return regulatoryLimitResolver.resolve(mineId, pc, ThresholdGrandeur.HP10,
                            LocalDate.of(year, 12, 31)).orElse(null);
                }
                // Compatibilité limitée aux anciens tests unitaires sans contexte Spring.
                Threshold threshold = resolveHp10Threshold(mineId, pc);
                return threshold != null ? threshold.getRegulatoryLimit() : null;
            });
            String exposureLevel = calculateExposureLevel(annualHp10, limit);

            // 3. Dernier enregistrement actif connu (dose Hp(10) + periode)
            DoseRecord lastRecord = resolveLastActiveRecord(id);
            Double lastDose = lastRecord != null ? lastRecord.getHp10() : null;
            String lastPeriod = lastRecord != null ? lastRecord.getPeriod() : null;

            ExposedWorkerListItemDTO dto = ExposedWorkerListItemDTO.builder()
                    .id(id)
                    .employeeId(employeeId)
                    .category(category)
                    .specialStatus(specialStatus)
                    .lastDoseHp10(lastDose)
                    .lastPeriod(lastPeriod)
                    .annualHp10(annualHp10)
                    .rolling5yHp10(rolling5y)
                    .lifetimeHp10(lifetime)
                    .exposureLevel(exposureLevel)
                    .medicalStatus(resolveMedicalStatus(id))
                    .qualificationStatus(resolveQualificationStatus(id))
                    .build();

            items.add(dto);
        }

        // 4. Enrichissement RH batch : un seul SELECT ... WHERE employee_id IN (...) pour tous
        //    les workers. La résolution est best-effort (cf. EmployeeLookupService) : si la
        //    table employee n'est pas accessible, les champs nominatifs restent null sans
        //    bloquer la liste.
        if (employeeLookupService != null && !items.isEmpty()) {
            List<Long> employeeIds = items.stream()
                    .map(ExposedWorkerListItemDTO::getEmployeeId)
                    .collect(Collectors.toList());
            Map<Long, EmployeeLookupService.EmployeeInfo> employeeMap =
                    employeeLookupService.resolveBatch(employeeIds);
            for (ExposedWorkerListItemDTO dto : items) {
                EmployeeLookupService.EmployeeInfo info = employeeMap.get(dto.getEmployeeId());
                if (info != null) {
                    dto.setFullName(info.fullName());
                    dto.setMatricule(info.matricule());
                    dto.setPosition(info.position());
                    dto.setDepartment(info.department());
                }
            }
        }

        // 5. Filtrage applicatif (post-projection) sur category, specialStatus, exposureLevel, search
        return items.stream()
                .filter(it -> matches(it, filters))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ExposedWorkerDetailDTO getDetail(Long workerId, Long userId, String permissions) {
        ExposedWorker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new EntityNotFoundException("ExposedWorker not found: " + workerId));

        // Audit RGPD + AIEA GSR Part 3 §3.106 : trace systematique de l'acces nominatif
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action("VIEW_NOMINATIVE")
                .entityType("ExposedWorker")
                .entityId(workerId)
                .userId(userId != null ? userId : 0L)
                .userPermissions(permissions)
                .timestamp(LocalDateTime.now())
                .build());

        // Identite + classification (enrichissement RH best-effort via EmployeeLookupService)
        IdentityDTO.IdentityDTOBuilder identityBuilder = IdentityDTO.builder()
                .workerId(worker.getId())
                .employeeId(worker.getEmployeeId());
        if (employeeLookupService != null && worker.getEmployeeId() != null) {
            employeeLookupService.resolveOne(worker.getEmployeeId()).ifPresent(info -> {
                identityBuilder.fullName(info.fullName());
                identityBuilder.matricule(info.matricule());
                identityBuilder.position(info.position());
                identityBuilder.department(info.department());
            });
        }
        IdentityDTO identity = identityBuilder.build();

        ClassificationDTO classification = ClassificationDTO.builder()
                .category(worker.getCategory())
                .reason(worker.getClassificationReason())
                .date(worker.getClassificationDate())
                .rpoId(worker.getRpoId())
                .specialStatus(worker.getSpecialStatus())
                .specialStatusStartDate(worker.getSpecialStatusStartDate())
                .specialStatusEndDate(worker.getSpecialStatusEndDate())
                .build();

        // Profils d'exposition
        List<ExposureProfileDTO> profiles = exposureProfileRepository.findByWorkerId(workerId)
                .stream().map(this::toExposureProfileDTO).collect(Collectors.toList());

        // Historique des doses (DESC sur period)
        List<DoseRecordDTO> doseHistory = doseRecordRepository.findActiveByWorkerId(workerId)
                .stream()
                .sorted(Comparator.comparing(DoseRecord::getPeriod,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDoseRecordDTO)
                .collect(Collectors.toList());

        // Cumul annee courante (peut etre absent si jamais calcule)
        DoseCumulativeDTO cumulative = cumulativeRepository
                .findByWorkerIdAndYear(workerId, referenceYear())
                .map(this::toDoseCumulativeDTO)
                .orElse(null);

        // Dosimetres (historique complet, recent en premier)
        List<DosimeterAssignmentDTO> dosimeters = dosimeterAssignmentRepository.findByWorkerId(workerId)
                .stream()
                .sorted(Comparator.comparing(DosimeterAssignment::getPeriodStart,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDosimeterAssignmentDTO)
                .collect(Collectors.toList());

        // Surveillance medicale : derniere visite. clinicalDetails purges si pas MEDECIN
        MedicalSurveillanceDTO medical = medicalSurveillanceRepository
                .findByWorkerIdOrderByExamDateDesc(workerId).stream()
                .findFirst()
                .map(ms -> toMedicalSurveillanceDTO(ms, hasMedicalPermission(permissions)))
                .orElse(null);

        // Qualifications
        List<QualificationDTO> qualifications = qualificationRepository.findByWorkerId(workerId)
                .stream().map(this::toQualificationDTO).collect(Collectors.toList());

        // Alertes
        List<ExposureAlertDTO> alerts = exposureAlertRepository.findByWorkerId(workerId).stream()
                .map(this::toExposureAlertDTO)
                .collect(Collectors.toList());

        // Seuils applicables (toutes grandeurs) a la categorie de personne de ce worker
        String personCategory = resolvePersonCategory(worker.getCategory(), worker.getSpecialStatus());
        List<ThresholdDTO> thresholds = new ArrayList<>();
        for (ThresholdGrandeur g : ThresholdGrandeur.values()) {
            resolveThreshold(worker.getMineId(), g, personCategory)
                    .map(this::toThresholdDTO)
                    .ifPresent(thresholds::add);
        }

        return ExposedWorkerDetailDTO.builder()
                .identity(identity)
                .classification(classification)
                .exposureProfile(profiles)
                .doseHistory(doseHistory)
                .cumulative(cumulative)
                .dosimeters(dosimeters)
                .medical(medical)
                .qualifications(qualifications)
                .alerts(alerts)
                .thresholds(thresholds)
                .build();
    }

    /**
     * Calcule le niveau d'exposition (GREEN/YELLOW/ORANGE/RED) selon le ratio annualHp10 /
     * regulatoryLimit. Retourne null si l'une des entrees n'est pas exploitable.
     */
    @Override
    public String calculateExposureLevel(Double annualHp10, Double regulatoryLimit) {
        if (annualHp10 == null || regulatoryLimit == null || regulatoryLimit <= 0.0) {
            return null;
        }
        double ratio = annualHp10 / regulatoryLimit;
        if (ratio >= 1.0) return "RED";
        if (ratio >= 0.75) return "ORANGE";
        if (ratio >= 0.50) return "YELLOW";
        return "GREEN";
    }

    @Override
    @Transactional
    public String exportCsv(Long mineId) {
        if (mineId == null) {
            return "";
        }

        SearchFiltersDTO filters = new SearchFiltersDTO();
        filters.setMineId(mineId);
        List<ExposedWorkerListItemDTO> items = searchWorkers(filters);

        // Audit export (obligatoire RGPD : extraction massive de donnees nominatives)
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action("EXPORT")
                .entityType("ExposedWorker")
                .entityId(mineId)
                .userId(0L)
                .timestamp(LocalDateTime.now())
                .details("format=csv;mineId=" + mineId + ";count=" + items.size())
                .build());

        StringBuilder sb = new StringBuilder(1024);
        sb.append("employeeId;matricule;fullName;position;department;category;specialStatus;"
                + "lastDoseHp10;annualHp10;rolling5yHp10;lifetimeHp10;exposureLevel\n");
        for (ExposedWorkerListItemDTO it : items) {
            sb.append(safe(it.getEmployeeId())).append(';')
                    .append(safe(it.getMatricule())).append(';')
                    .append(safe(it.getFullName())).append(';')
                    .append(safe(it.getPosition())).append(';')
                    .append(safe(it.getDepartment())).append(';')
                    .append(safe(it.getCategory())).append(';')
                    .append(safe(it.getSpecialStatus())).append(';')
                    .append(safe(it.getLastDoseHp10())).append(';')
                    .append(safe(it.getAnnualHp10())).append(';')
                    .append(safe(it.getRolling5yHp10())).append(';')
                    .append(safe(it.getLifetimeHp10())).append(';')
                    .append(safe(it.getExposureLevel())).append('\n');
        }
        return sb.toString();
    }

    // ============================================================
    // Helpers internes
    // ============================================================

    private int referenceYear() {
        return configuredYear > 0 ? configuredYear : LocalDate.now().getYear();
    }

    /**
     * Resolve le seuil Hp(10) actif pour une categorie de personne. Cherche d'abord un seuil
     * specifique a la mine, puis tombe sur le seuil global par defaut.
     */
    private Threshold resolveHp10Threshold(Long mineId, String personCategory) {
        return resolveThreshold(mineId, ThresholdGrandeur.HP10, personCategory).orElse(null);
    }

    private Optional<Threshold> resolveThreshold(Long mineId, ThresholdGrandeur grandeur,
            String personCategory) {
        Optional<Threshold> opt = thresholdRepository
                .findByMineIdAndGrandeurAndPersonCategoryAndActiveTrue(mineId, grandeur, personCategory);
        if (opt.isPresent()) return opt;
        return thresholdRepository.findGlobalDefault(grandeur, personCategory);
    }

    /**
     * Resolve la chaine "personCategory" attendue par les seuils, a partir de la categorie A/B
     * et du statut special (les statuts speciaux ont priorite).
     */
    private String resolvePersonCategory(DoseCategory category, DoseSpecialStatus specialStatus) {
        if (specialStatus == DoseSpecialStatus.PREGNANCY) return PERSON_CATEGORY_PREGNANCY;
        if (specialStatus == DoseSpecialStatus.APPRENTICE) return PERSON_CATEGORY_APPRENTICE;
        if (category == DoseCategory.A) return PERSON_CATEGORY_WORKER_A;
        if (category == DoseCategory.B) return PERSON_CATEGORY_WORKER_B;
        return PERSON_CATEGORY_PUBLIC;
    }

    /**
     * Dernier enregistrement actif connu (record actif a la period la plus recente), ou null si
     * le worker n'en a aucun. Resolu une seule fois par worker : le DTO expose a la fois la dose
     * ({@code lastDoseHp10}) et la periode correspondante ({@code lastPeriod}).
     */
    private DoseRecord resolveLastActiveRecord(Long workerId) {
        return doseRecordRepository.findActiveByWorkerId(workerId).stream()
                .sorted(Comparator.comparing(DoseRecord::getPeriod,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .findFirst()
                .orElse(null);
    }

    /** Resume du statut medical : derniere fitness connue, sinon "UNKNOWN". */
    private String resolveMedicalStatus(Long workerId) {
        return medicalSurveillanceRepository.findByWorkerIdOrderByExamDateDesc(workerId).stream()
                .findFirst()
                .map(MedicalSurveillance::getFitness)
                .orElse("UNKNOWN");
    }

    /**
     * Resume du statut qualif : EXPIRED si au moins une qualification est expiree, REVOKED si
     * au moins une est revoquee, EXPIRING si au moins une expire dans les 60 jours, VALID
     * sinon. NONE si le worker n'a aucune qualif renseignee.
     */
    private String resolveQualificationStatus(Long workerId) {
        List<Qualification> quals = qualificationRepository.findByWorkerId(workerId);
        if (quals.isEmpty()) return "NONE";
        if (quals.stream().anyMatch(q -> q.getStatus() == QualifStatus.EXPIRED)) return "EXPIRED";
        if (quals.stream().anyMatch(q -> q.getStatus() == QualifStatus.REVOKED)) return "REVOKED";
        LocalDate horizon = LocalDate.now().plusDays(60);
        boolean expiringSoon = quals.stream()
                .filter(q -> q.getStatus() == QualifStatus.VALID && q.getValidTo() != null)
                .anyMatch(q -> q.getValidTo().isBefore(horizon));
        if (expiringSoon) return "EXPIRING";
        return "VALID";
    }

    /**
     * Filtre applicatif post-projection : matricule/nom (search), exposureLevel calcule,
     * category, specialStatus, departmentId, postId.
     *
     * <p>departmentId / postId : Phase 2 — l'enrichissement RH n'est pas encore branche
     * (EmployeeRepository vit dans le module MineXpert, separe de Health-Safety). On filtre
     * donc en memoire via {@link #resolveEmployeeDepartmentId} / {@link #resolveEmployeePostId}
     * qui retournent null tant que l'integration cross-module n'existe pas.
     *
     * <p>Strategie de filtrage :
     *  - Si la resolution renvoie null (RH indisponible) → on EXCLUT le worker du resultat
     *    pour respecter l'intention du filtre utilisateur (mieux vaut un resultat vide qu'un
     *    resultat fausse "tous les workers passent"). Le commentaire TODO ci-dessous explicite
     *    le cablage attendu.
     *  - Si la resolution renvoie une valeur → comparaison stricte avec le filtre.
     *
     * <p>TODO Phase 2 Backend-RH-Integration : injecter une interface EmployeeLookupPort
     * (port hexagonal) implementee par un adapter qui appelle le module MineXpert via
     * REST/gRPC ou via une vue Postgres partagee (schema cross-module). Implementation
     * recommandee : EmployeeLookupPort.findById(employeeId) → Optional&lt;{departmentId, postId}&gt;.
     */
    private boolean matches(ExposedWorkerListItemDTO it, SearchFiltersDTO f) {
        if (f.getCategory() != null && it.getCategory() != f.getCategory()) return false;
        if (f.getSpecialStatus() != null && it.getSpecialStatus() != f.getSpecialStatus()) return false;
        if (f.getExposureLevel() != null
                && !f.getExposureLevel().equalsIgnoreCase(it.getExposureLevel())) {
            return false;
        }
        if (f.getSearch() != null && !f.getSearch().isBlank()) {
            String needle = f.getSearch().toLowerCase(Locale.ROOT);
            String matricule = it.getMatricule() != null ? it.getMatricule().toLowerCase(Locale.ROOT) : "";
            String name = it.getFullName() != null ? it.getFullName().toLowerCase(Locale.ROOT) : "";
            String employeeId = it.getEmployeeId() != null ? it.getEmployeeId().toString() : "";
            if (!matricule.contains(needle) && !name.contains(needle) && !employeeId.contains(needle)) {
                return false;
            }
        }
        if (f.getDepartmentId() != null) {
            Long resolved = resolveEmployeeDepartmentId(it.getEmployeeId());
            if (resolved == null || !resolved.equals(f.getDepartmentId())) {
                return false;
            }
        }
        if (f.getPostId() != null) {
            Long resolved = resolveEmployeePostId(it.getEmployeeId());
            if (resolved == null || !resolved.equals(f.getPostId())) {
                return false;
            }
        }
        return true;
    }

    /**
     * Resolution du departmentId RH d'un employeeId. Stub Phase 2 : retourne null tant que
     * l'integration cross-module avec MineXpert (EmployeeRepository) n'est pas cablee via
     * un EmployeeLookupPort hexagonal. Le filtre departmentId reste donc no-op en effet
     * (cf. {@link #matches} : si la resolution est null, le worker est exclu — comportement
     * correct car on ne peut pas confirmer qu'il appartient au departement demande).
     *
     * <p>TODO : injecter EmployeeLookupPort et retourner port.findById(employeeId)
     *           .map(EmployeeView::getDepartmentId).orElse(null).
     */
    private Long resolveEmployeeDepartmentId(Long employeeId) {
        // Phase 2 : enrichissement RH non branche → null (filtre departmentId effectivement no-op)
        return null;
    }

    /**
     * Resolution du postId RH d'un employeeId. Meme strategie que
     * {@link #resolveEmployeeDepartmentId} — retourne null tant que l'EmployeeLookupPort
     * n'est pas cable.
     */
    private Long resolveEmployeePostId(Long employeeId) {
        // Phase 2 : enrichissement RH non branche → null (filtre postId effectivement no-op)
        return null;
    }

    private boolean hasMedicalPermission(String permissions) {
        return permissions != null && permissions.contains(PERM_MEDICAL);
    }

    private static String safe(Object v) {
        if (v == null) return "";
        String s = v.toString();
        if (s.indexOf(';') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) {
            return '"' + s.replace("\"", "\"\"") + '"';
        }
        return s;
    }

    // ============================================================
    // Mappers entite -> DTO (duplique localement pour eviter le couplage
    // a chaque service CRUD du module)
    // ============================================================

    private ExposureProfileDTO toExposureProfileDTO(ExposureProfile e) {
        return new ExposureProfileDTO(e.getId(),
                e.getWorker() != null ? e.getWorker().getId() : null,
                e.getExposureType(), e.getZoneId(), e.getPostId(), e.getFrequency(),
                e.getConditions(), e.getCreatedAt(), e.getUpdatedAt(),
                e.getCreatedBy(), e.getUpdatedBy());
    }

    private DoseRecordDTO toDoseRecordDTO(DoseRecord e) {
        // workerName / matricule renseignés au niveau du DTO Detail (un seul worker -> on connait
        // déjà son identité via identity bloc). On n'inonde pas chaque doseRecord avec.
        return new DoseRecordDTO(e.getId(),
                e.getWorker() != null ? e.getWorker().getId() : null,
                e.getPeriod(), e.getHp10(), e.getHp007(), e.getHp3(), e.getSource(),
                e.isBelowDetection(), e.getAttachmentUrls(), e.getNotes(),
                e.getRecordedBy(), e.getRecordedAt(), e.getVersion(), e.getSupersededRecordId(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getCreatedBy(), e.getUpdatedBy(),
                null, null);
    }

    private DoseCumulativeDTO toDoseCumulativeDTO(DoseCumulative e) {
        return new DoseCumulativeDTO(e.getId(), e.getWorkerId(), e.getYear(),
                e.getAnnualHp10(), e.getAnnualHp007(), e.getAnnualHp3(),
                e.getRolling5yHp10(), e.getLifetimeHp10(), e.getUpdatedAt());
    }

    private DosimeterAssignmentDTO toDosimeterAssignmentDTO(DosimeterAssignment e) {
        return new DosimeterAssignmentDTO(e.getId(),
                e.getDosimeter() != null ? e.getDosimeter().getId() : null,
                e.getWorker() != null ? e.getWorker().getId() : null,
                e.getPeriodStart(), e.getPeriodEnd(),
                e.isHandoverAck(), e.getHandoverAckAt(),
                e.isReturnAck(), e.getReturnAckAt(),
                e.getDeviceCondition(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getCreatedBy(), e.getUpdatedBy());
    }

    /**
     * Mappe une MedicalSurveillance vers son DTO. Si {@code includeClinicalDetails} est false,
     * le champ confidentiel restrictedClinicalDetails est purge a null avant retour.
     */
    private MedicalSurveillanceDTO toMedicalSurveillanceDTO(MedicalSurveillance e,
            boolean includeClinicalDetails) {
        return new MedicalSurveillanceDTO(e.getId(),
                e.getWorker() != null ? e.getWorker().getId() : null,
                e.getType(), e.getFitness(), e.getExamDate(), e.getNextDueDate(),
                includeClinicalDetails ? e.getRestrictedClinicalDetails() : null,
                e.getDoctorId(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getCreatedBy(), e.getUpdatedBy());
    }

    private QualificationDTO toQualificationDTO(Qualification e) {
        return new QualificationDTO(e.getId(),
                e.getWorker() != null ? e.getWorker().getId() : null,
                e.getTrainingType(), e.getValidFrom(), e.getValidTo(),
                e.getCertificateUrl(), e.getStatus(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getCreatedBy(), e.getUpdatedBy());
    }

    private ExposureAlertDTO toExposureAlertDTO(ExposureAlert e) {
        return new ExposureAlertDTO(e.getId(), e.getWorkerId(), e.getZoneId(),
                e.getLevel(), e.getGrandeur(), e.getValue(), e.getThresholdId(),
                e.getTriggeredAt(), e.getAcknowledgedAt(), e.getAcknowledgedBy(),
                e.getStatus(), e.getCreatedAt(), e.getUpdatedAt(),
                e.getCreatedBy(), e.getUpdatedBy());
    }

    private ThresholdDTO toThresholdDTO(Threshold e) {
        return new ThresholdDTO(e.getId(), e.getMineId(), e.getGrandeur(),
                e.getPersonCategory(), e.getDoseConstraint(), e.getInvestigationLevel(),
                e.getActionLevel(), e.getClassificationThreshold(), e.getRegulatoryLimit(),
                e.getWarnPercentages(),
                e.getUnit(), e.getReferenceFramework(), e.isActive(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getCreatedBy(), e.getUpdatedBy());
    }
}
