package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dosimetry.entity.Dosimeter;
import com.minexpert.hns.dosimetry.entity.DosimeterAssignment;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.enums.DosimeterStatus;
import com.minexpert.hns.dosimetry.enums.DosimeterType;
import com.minexpert.hns.dosimetry.repository.DosimeterAssignmentRepository;
import com.minexpert.hns.dosimetry.repository.DosimeterRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;

import jakarta.persistence.EntityNotFoundException;

/**
 * Tests unitaires du flux d'affectation dans {@link DosimeterQueryServiceImpl}.
 *
 * <p>Verifie :
 * <ul>
 *   <li>Cas nominal : dosimetre AVAILABLE, aucune affectation active -&gt; cree
 *       l'assignment, bascule le dosimetre en ASSIGNED, audite l'action CREATE.</li>
 *   <li>Cas AlreadyAssigned : une affectation active existe -&gt; IllegalStateException.</li>
 *   <li>Cas UnknownDosimeter : id introuvable -&gt; EntityNotFoundException.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class DosimeterQueryServiceTest {

    @Mock private DosimeterRepository dosimeterRepository;
    @Mock private DosimeterAssignmentRepository assignmentRepository;
    @Mock private ExposedWorkerRepository workerRepository;
    @Mock private DosimetryAuditService auditService;

    @InjectMocks private DosimeterQueryServiceImpl service;

    private Dosimeter availableDosimeter;
    private ExposedWorker worker;

    @BeforeEach
    void setUp() {
        availableDosimeter = Dosimeter.builder()
                .id(100L)
                .serial("SN-100")
                .type(DosimeterType.TLD)
                .qrCode("QR-100")
                .status(DosimeterStatus.AVAILABLE)
                .mineId(1L)
                .build();

        worker = ExposedWorker.builder()
                .id(50L)
                .employeeId(900L)
                .mineId(1L)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("assignToWorker nominal : dosimetre AVAILABLE + pas d'affectation active -> CREATED")
    void assignToWorker_nominal() {
        when(dosimeterRepository.findById(100L)).thenReturn(Optional.of(availableDosimeter));
        when(assignmentRepository.findFirstByDosimeterIdAndReturnAckFalseOrderByPeriodStartDesc(100L))
                .thenReturn(Optional.empty());
        when(workerRepository.findById(50L)).thenReturn(Optional.of(worker));
        when(assignmentRepository.save(any(DosimeterAssignment.class)))
                .thenAnswer(inv -> {
                    DosimeterAssignment a = inv.getArgument(0);
                    a.setId(777L);
                    return a;
                });

        Long result = service.assignToWorker(100L, 50L,
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 8, 31),
                "Etat OK, courroie neuve", 42L);

        assertThat(result).isEqualTo(777L);

        // L'assignment est cree avec handoverAck=true et returnAck=false
        ArgumentCaptor<DosimeterAssignment> assignmentCaptor =
                ArgumentCaptor.forClass(DosimeterAssignment.class);
        verify(assignmentRepository, times(1)).save(assignmentCaptor.capture());
        DosimeterAssignment captured = assignmentCaptor.getValue();
        assertThat(captured.isHandoverAck()).isTrue();
        assertThat(captured.getHandoverAckAt()).isNotNull();
        assertThat(captured.isReturnAck()).isFalse();
        assertThat(captured.getDosimeter()).isSameAs(availableDosimeter);
        assertThat(captured.getWorker()).isSameAs(worker);
        assertThat(captured.getPeriodStart()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(captured.getPeriodEnd()).isEqualTo(LocalDate.of(2026, 8, 31));
        assertThat(captured.getDeviceCondition()).isEqualTo("Etat OK, courroie neuve");
        assertThat(captured.getCreatedBy()).isEqualTo(42L);

        // Le dosimetre passe en ASSIGNED
        ArgumentCaptor<Dosimeter> dosimeterCaptor = ArgumentCaptor.forClass(Dosimeter.class);
        verify(dosimeterRepository, times(1)).save(dosimeterCaptor.capture());
        assertThat(dosimeterCaptor.getValue().getStatus()).isEqualTo(DosimeterStatus.ASSIGNED);

        // L'audit log CREATE / DosimeterAssignment est ecrit
        verify(auditService, times(1)).log(eq("CREATE"), eq("DosimeterAssignment"),
                eq(777L), eq(42L), any(), anyString());
    }

    @Test
    @DisplayName("assignToWorker AlreadyAssigned : affectation active existante -> IllegalStateException")
    void assignToWorker_alreadyAssigned() {
        when(dosimeterRepository.findById(100L)).thenReturn(Optional.of(availableDosimeter));
        DosimeterAssignment existing = DosimeterAssignment.builder()
                .id(500L).dosimeter(availableDosimeter).worker(worker)
                .periodStart(LocalDate.now().minusMonths(1))
                .handoverAck(true).returnAck(false)
                .build();
        when(assignmentRepository.findFirstByDosimeterIdAndReturnAckFalseOrderByPeriodStartDesc(100L))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.assignToWorker(100L, 50L,
                LocalDate.now(), null, null, 42L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already has an active assignment");

        // Aucun save d'assignment ne doit etre fait
        verify(assignmentRepository, never()).save(any(DosimeterAssignment.class));
        verify(dosimeterRepository, never()).save(any(Dosimeter.class));
        verify(auditService, never()).log(anyString(), anyString(), anyLong(), anyLong(),
                any(), anyString());
    }

    @Test
    @DisplayName("assignToWorker UnknownDosimeter : id introuvable -> EntityNotFoundException")
    void assignToWorker_unknownDosimeter() {
        when(dosimeterRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assignToWorker(999L, 50L,
                LocalDate.now(), null, null, 42L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Dosimeter not found");

        verify(assignmentRepository, never())
                .findFirstByDosimeterIdAndReturnAckFalseOrderByPeriodStartDesc(anyLong());
        verify(assignmentRepository, never()).save(any(DosimeterAssignment.class));
    }

    @Test
    @DisplayName("assignToWorker : dosimetre non-AVAILABLE (ex. DAMAGED) -> IllegalStateException")
    void assignToWorker_notAvailable() {
        availableDosimeter.setStatus(DosimeterStatus.DAMAGED);
        when(dosimeterRepository.findById(100L)).thenReturn(Optional.of(availableDosimeter));

        assertThatThrownBy(() -> service.assignToWorker(100L, 50L,
                LocalDate.now(), null, null, 42L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not AVAILABLE");

        verify(assignmentRepository, never()).save(any(DosimeterAssignment.class));
    }
}
