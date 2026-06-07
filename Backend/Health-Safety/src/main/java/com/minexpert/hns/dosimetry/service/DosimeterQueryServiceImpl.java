package com.minexpert.hns.dosimetry.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.dto.DosimeterAssignmentDTO;
import com.minexpert.hns.dosimetry.dto.DosimeterDTO;
import com.minexpert.hns.dosimetry.dto.DosimeterDetailDTO;
import com.minexpert.hns.dosimetry.dto.DosimeterListItemDTO;
import com.minexpert.hns.dosimetry.dto.SearchDosimeterFiltersDTO;
import com.minexpert.hns.dosimetry.entity.Dosimeter;
import com.minexpert.hns.dosimetry.entity.DosimeterAssignment;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.enums.DosimeterStatus;
import com.minexpert.hns.dosimetry.repository.DosimeterAssignmentRepository;
import com.minexpert.hns.dosimetry.repository.DosimeterRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Implementation des requetes metier sur le parc de dosimetres.
 *
 * <p>La couche query est read-only par defaut (@Transactional(readOnly=true)) ; les operations
 * d'affectation/restitution overrident en @Transactional pour les ecritures + audit log.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DosimeterQueryServiceImpl implements DosimeterQueryService {

    private static final int CALIBRATION_ALERT_WINDOW_DAYS = 30;

    private final DosimeterRepository dosimeterRepository;
    private final DosimeterAssignmentRepository assignmentRepository;
    private final ExposedWorkerRepository workerRepository;
    private final DosimetryAuditService auditService;
    /**
     * Enrichissement RH (nom du porteur courant) : best-effort, peut être null en tests
     * unitaires sans DataSource. Cf. {@link EmployeeLookupService}.
     */
    private final EmployeeLookupService employeeLookupService;

    @Override
    public List<DosimeterListItemDTO> searchDosimeters(SearchDosimeterFiltersDTO filters) {
        if (filters == null || filters.getMineId() == null) {
            return Collections.emptyList();
        }
        Long mineId = filters.getMineId();

        // 1. Base list : filtre statuts si fourni, sinon tout le parc de la mine.
        List<Dosimeter> base;
        if (filters.getStatus() != null && !filters.getStatus().isEmpty()) {
            base = dosimeterRepository.findByMineIdAndStatusInOrderBySerialAsc(mineId,
                    filters.getStatus());
        } else {
            base = dosimeterRepository.findByMineId(mineId).stream()
                    .sorted(Comparator.comparing(Dosimeter::getSerial,
                            Comparator.nullsLast(String::compareTo)))
                    .collect(Collectors.toList());
        }

        LocalDate today = LocalDate.now();
        Integer windowDays = filters.getCalibrationDueWithinDays();
        LocalDate calibrationCutoff = windowDays != null ? today.plusDays(windowDays) : null;

        List<DosimeterListItemDTO> items = new ArrayList<>(base.size());
        for (Dosimeter d : base) {
            // 2. Filtres post-projection en memoire.
            if (filters.getType() != null && d.getType() != filters.getType()) {
                continue;
            }
            if (calibrationCutoff != null
                    && (d.getCalibrationDueDate() == null
                            || !d.getCalibrationDueDate().isBefore(calibrationCutoff))) {
                continue;
            }
            if (filters.getSearch() != null && !filters.getSearch().isBlank()) {
                String needle = filters.getSearch().toLowerCase(Locale.ROOT);
                String serial = d.getSerial() != null ? d.getSerial().toLowerCase(Locale.ROOT) : "";
                String qr = d.getQrCode() != null ? d.getQrCode().toLowerCase(Locale.ROOT) : "";
                if (!serial.contains(needle) && !qr.contains(needle)) {
                    continue;
                }
            }

            items.add(toListItem(d, today));
        }
        return items;
    }

    @Override
    public DosimeterDetailDTO getDosimeterDetail(Long id) {
        Dosimeter d = dosimeterRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dosimeter not found: " + id));

        DosimeterAssignmentDTO current = assignmentRepository
                .findFirstByDosimeterIdAndReturnAckFalseOrderByPeriodStartDesc(id)
                .map(this::toAssignmentDTO)
                .orElse(null);

        List<DosimeterAssignmentDTO> history = assignmentRepository.findByDosimeterId(id).stream()
                .sorted(Comparator.comparing(DosimeterAssignment::getPeriodStart,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toAssignmentDTO)
                .collect(Collectors.toList());

        return DosimeterDetailDTO.builder()
                .dosimeter(toDosimeterDTO(d))
                .currentAssignment(current)
                .history(history)
                .calibrationHistory(Collections.emptyList())
                .build();
    }

    @Override
    @Transactional
    public Long assignToWorker(Long dosimeterId, Long workerId, LocalDate periodStart,
            LocalDate periodEnd, String handoverNote, Long actorId) {
        if (dosimeterId == null || workerId == null || periodStart == null) {
            throw new IllegalArgumentException(
                    "dosimeterId, workerId and periodStart are required");
        }

        Dosimeter dosimeter = dosimeterRepository.findById(dosimeterId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Dosimeter not found: " + dosimeterId));
        if (dosimeter.getStatus() != DosimeterStatus.AVAILABLE) {
            throw new IllegalStateException("Dosimeter " + dosimeterId
                    + " is not AVAILABLE (current status: " + dosimeter.getStatus() + ")");
        }

        Optional<DosimeterAssignment> existingActive = assignmentRepository
                .findFirstByDosimeterIdAndReturnAckFalseOrderByPeriodStartDesc(dosimeterId);
        if (existingActive.isPresent()) {
            throw new IllegalStateException("Dosimeter " + dosimeterId
                    + " already has an active assignment (id=" + existingActive.get().getId() + ")");
        }

        ExposedWorker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ExposedWorker not found: " + workerId));

        LocalDateTime now = LocalDateTime.now();
        DosimeterAssignment assignment = DosimeterAssignment.builder()
                .dosimeter(dosimeter)
                .worker(worker)
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .handoverAck(true)
                .handoverAckAt(now)
                .returnAck(false)
                .deviceCondition(handoverNote)
                .createdAt(now)
                .updatedAt(now)
                .createdBy(actorId)
                .updatedBy(actorId)
                .build();
        DosimeterAssignment saved = assignmentRepository.save(assignment);

        dosimeter.setStatus(DosimeterStatus.ASSIGNED);
        dosimeter.setUpdatedAt(now);
        dosimeter.setUpdatedBy(actorId);
        dosimeterRepository.save(dosimeter);

        auditService.log("CREATE", "DosimeterAssignment", saved.getId(), actorId, null,
                "dosimeterId=" + dosimeterId + ";workerId=" + workerId
                        + ";periodStart=" + periodStart
                        + (periodEnd != null ? ";periodEnd=" + periodEnd : ""));

        return saved.getId();
    }

    @Override
    @Transactional
    public void returnFromWorker(Long assignmentId, String deviceCondition, Long actorId) {
        if (assignmentId == null) {
            throw new IllegalArgumentException("assignmentId is required");
        }
        DosimeterAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "DosimeterAssignment not found: " + assignmentId));
        if (assignment.isReturnAck()) {
            throw new IllegalStateException(
                    "DosimeterAssignment " + assignmentId + " has already been returned");
        }

        LocalDateTime now = LocalDateTime.now();
        assignment.setReturnAck(true);
        assignment.setReturnAckAt(now);
        if (deviceCondition != null) {
            assignment.setDeviceCondition(deviceCondition);
        }
        assignment.setUpdatedAt(now);
        assignment.setUpdatedBy(actorId);
        assignmentRepository.save(assignment);

        Dosimeter dosimeter = assignment.getDosimeter();
        if (dosimeter != null) {
            dosimeter.setStatus(DosimeterStatus.IN_READING);
            dosimeter.setUpdatedAt(now);
            dosimeter.setUpdatedBy(actorId);
            dosimeterRepository.save(dosimeter);
        }

        auditService.log("UPDATE", "DosimeterAssignment", assignmentId, actorId, null,
                "action=RETURN_ACK"
                        + (deviceCondition != null ? ";deviceCondition=" + deviceCondition : ""));
    }

    @Override
    public List<DosimeterListItemDTO> calibrationAlerts(Long mineId) {
        if (mineId == null) {
            return Collections.emptyList();
        }
        LocalDate today = LocalDate.now();
        LocalDate cutoff = today.plusDays(CALIBRATION_ALERT_WINDOW_DAYS);
        return dosimeterRepository
                .findByCalibrationDueDateBeforeAndStatusNot(cutoff, DosimeterStatus.RETIRED)
                .stream()
                .filter(d -> mineId.equals(d.getMineId()))
                .sorted(Comparator.comparing(Dosimeter::getCalibrationDueDate,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(d -> toListItem(d, today))
                .collect(Collectors.toList());
    }

    // ============================================================
    // Helpers internes
    // ============================================================

    /**
     * Construit un DosimeterListItemDTO en resolvant l'assignment actif (porteur courant) et le
     * nombre de jours jusqu'a la prochaine echeance d'etalonnage.
     */
    private DosimeterListItemDTO toListItem(Dosimeter d, LocalDate today) {
        Long currentWorkerId = null;
        String currentWorkerName = null;
        Optional<DosimeterAssignment> active = assignmentRepository
                .findFirstByDosimeterIdAndReturnAckFalseOrderByPeriodStartDesc(d.getId());
        if (active.isPresent() && active.get().getWorker() != null) {
            ExposedWorker worker = active.get().getWorker();
            currentWorkerId = worker.getId();
            // Enrichissement RH via EmployeeLookupService (table employee partagée dans la
            // même DB Aiven). Fallback EMP-<id> si le lookup échoue (table indisponible,
            // employé supprimé, ou test unitaire sans datasource).
            String resolvedName = null;
            if (employeeLookupService != null && worker.getEmployeeId() != null) {
                resolvedName = employeeLookupService.resolveOne(worker.getEmployeeId())
                        .map(EmployeeLookupService.EmployeeInfo::fullName)
                        .orElse(null);
            }
            if (resolvedName != null) {
                currentWorkerName = resolvedName;
            } else if (worker.getEmployeeId() != null) {
                currentWorkerName = "EMP-" + worker.getEmployeeId();
            }
        }

        Integer daysToCal = null;
        if (d.getCalibrationDueDate() != null) {
            daysToCal = (int) ChronoUnit.DAYS.between(today, d.getCalibrationDueDate());
        }

        return DosimeterListItemDTO.builder()
                .id(d.getId())
                .serial(d.getSerial())
                .type(d.getType())
                .qrCode(d.getQrCode())
                .status(d.getStatus())
                .currentWorkerId(currentWorkerId)
                .currentWorkerName(currentWorkerName)
                .calibrationDueDate(d.getCalibrationDueDate())
                .daysToCalibration(daysToCal)
                .build();
    }

    private DosimeterDTO toDosimeterDTO(Dosimeter d) {
        return new DosimeterDTO(d.getId(), d.getSerial(), d.getType(), d.getQrCode(),
                d.getStatus(), d.getCalibrationDueDate(), d.getMineId(),
                d.getCreatedAt(), d.getUpdatedAt(), d.getCreatedBy(), d.getUpdatedBy());
    }

    private DosimeterAssignmentDTO toAssignmentDTO(DosimeterAssignment a) {
        return new DosimeterAssignmentDTO(a.getId(),
                a.getDosimeter() != null ? a.getDosimeter().getId() : null,
                a.getWorker() != null ? a.getWorker().getId() : null,
                a.getPeriodStart(), a.getPeriodEnd(),
                a.isHandoverAck(), a.getHandoverAckAt(),
                a.isReturnAck(), a.getReturnAckAt(),
                a.getDeviceCondition(),
                a.getCreatedAt(), a.getUpdatedAt(), a.getCreatedBy(), a.getUpdatedBy());
    }
}
