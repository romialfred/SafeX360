package com.minexpert.hns.service.ppe;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeEmp;
import com.minexpert.hns.entity.ppe.PpeEmpStatus;
import com.minexpert.hns.entity.ppe.PpeMovementType;
import com.minexpert.hns.entity.ppe.PpeRequest;
import com.minexpert.hns.entity.ppe.PpeRequestStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeEmpRepository;
import com.minexpert.hns.repository.ppe.PpeRequestRepository;

/**
 * Incrément 4 — distribution / dotations / retours.
 *
 * Verrouille la SÉPARATION approuvé ↔ distribué : l'approbation est une décision
 * (aucun mouvement de stock), la DISTRIBUTION est le mouvement physique qui sort le
 * stock, et le RETOUR le remet (ou réforme). La formule de sortie « approuvé −
 * déjà distribué » doit être idempotente et rétro-compatible avec les demandes
 * de production déjà APPROVED sous l'incrément 2 (stock déjà sorti).
 */
@ExtendWith(MockitoExtension.class)
class PpeDistributionTest {

    @Mock
    private PpeRequestRepository requestRepository;
    @Mock
    private PpeEmpService ppeEmpService;
    @Mock
    private PpeEmpRepository ppeEmpRepository;
    @Mock
    private PpeService ppeService;

    @InjectMocks
    private PpeRequestServiceImpl service;

    private PpeEmp line(Long empId, Long ppeId, Integer approved, Integer issued, Integer returned) {
        PpeEmp e = new PpeEmp();
        e.setEmpId(empId);
        e.setPpe(new Ppe(ppeId));
        e.setQuantityApproved(approved);
        e.setQuantityIssued(issued);
        e.setQuantityReturned(returned);
        e.setStatus(PpeEmpStatus.ACTIVE);
        return e;
    }

    private PpeRequest request(PpeRequestStatus status) {
        PpeRequest req = new PpeRequest();
        req.setId(99L);
        req.setCompanyId(1L);
        req.setStatus(status);
        return req;
    }

    @Test
    @DisplayName("distribution : sort du stock = SOMME(approuvé − déjà distribué) par EPI, et passe DELIVERED")
    void deliver_issuesApprovedNotYetIssued() throws HSException {
        PpeRequest req = request(PpeRequestStatus.APPROVED);
        when(requestRepository.findById(99L)).thenReturn(Optional.of(req));
        when(requestRepository.save(any(PpeRequest.class))).thenAnswer(i -> i.getArgument(0));
        // Nouvelles demandes (incrément 4) : approuvé fixé, rien de distribué.
        // ppe 1 : 2 (emp 10) + 1 (emp 20) = 3 ; ppe 2 : 3 (emp 10).
        List<PpeEmp> lines = List.of(
                line(10L, 1L, 2, 0, 0), line(20L, 1L, 1, 0, 0), line(10L, 2L, 3, 0, 0));
        when(ppeEmpRepository.findByPpeRequestId(99L)).thenReturn(lines);

        service.deliverRequest(99L, "go", 1L);

        verify(ppeService).applyStockMovement(eq(1L), eq(-3), eq(PpeMovementType.ISSUE), eq("REQ-99"), eq(1L), isNull());
        verify(ppeService).applyStockMovement(eq(2L), eq(-3), eq(PpeMovementType.ISSUE), eq("REQ-99"), eq(1L), isNull());
        assertThat(lines).extracting(PpeEmp::getQuantityIssued).containsExactly(2, 1, 3);
        assertThat(req.getStatus()).isEqualTo(PpeRequestStatus.DELIVERED);
    }

    @Test
    @DisplayName("distribution IDEMPOTENTE : demande prod déjà distribuée (approuvé == distribué) ⇒ AUCUN décrément")
    void deliver_isIdempotentForLegacyAlreadyIssued() throws HSException {
        PpeRequest req = request(PpeRequestStatus.APPROVED);
        when(requestRepository.findById(99L)).thenReturn(Optional.of(req));
        when(requestRepository.save(any(PpeRequest.class))).thenAnswer(i -> i.getArgument(0));
        // Sous l'incrément 2, l'approbation posait approuvé == distribué (stock DÉJÀ sorti).
        List<PpeEmp> lines = List.of(line(10L, 1L, 2, 2, 0), line(10L, 2L, 3, 3, 0));
        when(ppeEmpRepository.findByPpeRequestId(99L)).thenReturn(lines);

        service.deliverRequest(99L, null, 1L);

        // approuvé − distribué = 0 partout : pas de double décrément.
        verify(ppeService, never()).applyStockMovement(anyLong(), anyInt(), any(PpeMovementType.class), anyString(), any(), any());
        assertThat(req.getStatus()).isEqualTo(PpeRequestStatus.DELIVERED);
    }

    @Test
    @DisplayName("distribution : une demande non APPROVED est refusée")
    void deliver_rejectsNonApproved() {
        PpeRequest req = request(PpeRequestStatus.PENDING);
        when(requestRepository.findById(99L)).thenReturn(Optional.of(req));

        assertThatThrownBy(() -> service.deliverRequest(99L, null, 1L))
                .isInstanceOf(HSException.class)
                .hasMessageContaining("REQUEST_NOT_APPROVED");
    }

    @Test
    @DisplayName("retour avec remise en stock : REMET par EPI (mouvement RETURN, delta +), et passe RETURNED")
    void return_restocksIntoInventory() throws HSException {
        PpeRequest req = request(PpeRequestStatus.DELIVERED);
        when(requestRepository.findById(99L)).thenReturn(Optional.of(req));
        when(requestRepository.save(any(PpeRequest.class))).thenAnswer(i -> i.getArgument(0));
        List<PpeEmp> lines = List.of(line(10L, 1L, 2, 2, 0), line(20L, 1L, 1, 1, 0), line(10L, 2L, 3, 3, 0));
        when(ppeEmpRepository.findByPpeRequestId(99L)).thenReturn(lines);

        service.returnRequest(99L, "fin de mission", true, 1L);

        verify(ppeService).applyStockMovement(eq(1L), eq(3), eq(PpeMovementType.RETURN), eq("RET-99"), eq(1L), isNull());
        verify(ppeService).applyStockMovement(eq(2L), eq(3), eq(PpeMovementType.RETURN), eq("RET-99"), eq(1L), isNull());
        assertThat(lines).extracting(PpeEmp::getQuantityReturned).containsExactly(2, 1, 3);
        assertThat(req.getStatus()).isEqualTo(PpeRequestStatus.RETURNED);
    }

    @Test
    @DisplayName("retour en réforme (restock=false) : AUCUN mouvement de stock, mais rendu tracé et RETURNED")
    void return_scrapDoesNotRestock() throws HSException {
        PpeRequest req = request(PpeRequestStatus.DELIVERED);
        when(requestRepository.findById(99L)).thenReturn(Optional.of(req));
        when(requestRepository.save(any(PpeRequest.class))).thenAnswer(i -> i.getArgument(0));
        List<PpeEmp> lines = List.of(line(10L, 1L, 2, 2, 0));
        when(ppeEmpRepository.findByPpeRequestId(99L)).thenReturn(lines);

        service.returnRequest(99L, "endommagé", false, 1L);

        verify(ppeService, never()).applyStockMovement(anyLong(), anyInt(), any(PpeMovementType.class), anyString(), any(), any());
        assertThat(lines).extracting(PpeEmp::getQuantityReturned).containsExactly(2);
        assertThat(req.getStatus()).isEqualTo(PpeRequestStatus.RETURNED);
    }

    @Test
    @DisplayName("retour : une demande non DELIVERED est refusée")
    void return_rejectsNonDelivered() {
        PpeRequest req = request(PpeRequestStatus.APPROVED);
        when(requestRepository.findById(99L)).thenReturn(Optional.of(req));

        assertThatThrownBy(() -> service.returnRequest(99L, null, true, 1L))
                .isInstanceOf(HSException.class)
                .hasMessageContaining("REQUEST_NOT_DELIVERED");
    }
}
