package com.minexpert.hns.service.ppe;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeMovementType;
import com.minexpert.hns.entity.ppe.PpeStockMovement;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeRepository;
import com.minexpert.hns.repository.ppe.PpeStockMovementRepository;

/**
 * Ledger de stock EPI — cœur de l'incrément 1 (journal immuable + intégrité).
 *
 * Ces tests verrouillent les garanties qui corrigent le défaut de production
 * du 2026-08-05 (agrégat {@code Ppe.stock} qui dérivait, sorties non tracées) :
 *   • tout mouvement écrit une ligne de journal SIGNÉE + met à jour l'agrégat ;
 *   • le solde inscrit dans le mouvement = le nouvel agrégat (invariant) ;
 *   • un stock ne peut jamais passer sous zéro ;
 *   • une mine ne peut pas mouvementer le stock d'une autre ;
 *   • une donnée legacy {@code stock == null} ne provoque plus de NPE.
 */
@ExtendWith(MockitoExtension.class)
class PpeStockLedgerTest {

    @Mock
    private PpeRepository ppeRepository;
    @Mock
    private PpeStockMovementRepository movementRepository;

    @InjectMocks
    private PpeServiceImpl service;

    private Ppe ppe(Long id, Integer stock, Long companyId) {
        Ppe p = new Ppe(id);
        p.setStock(stock);
        p.setCompanyId(companyId);
        return p;
    }

    @Test
    @DisplayName("une entrée écrit un mouvement signé + met à jour l'agrégat, solde cohérent")
    void receipt_writesMovementAndUpdatesAggregate() throws HSException {
        when(ppeRepository.findById(1L)).thenReturn(Optional.of(ppe(1L, 10, 5L)));
        when(ppeRepository.save(any(Ppe.class))).thenAnswer(i -> i.getArgument(0));

        int balance = service.applyStockMovement(1L, 7, PpeMovementType.RECEIPT, "STOCK-1", 5L, null);

        assertThat(balance).isEqualTo(17);
        ArgumentCaptor<PpeStockMovement> mv = ArgumentCaptor.forClass(PpeStockMovement.class);
        verify(movementRepository).save(mv.capture());
        assertThat(mv.getValue().getQuantity()).isEqualTo(7);          // delta signé
        assertThat(mv.getValue().getBalanceAfter()).isEqualTo(17);     // INVARIANT : solde inscrit = agrégat
        assertThat(mv.getValue().getMovementType()).isEqualTo(PpeMovementType.RECEIPT);
        assertThat(mv.getValue().getReference()).isEqualTo("STOCK-1");
    }

    @Test
    @DisplayName("une sortie décrémente et inscrit un delta négatif")
    void issue_decrementsWithNegativeDelta() throws HSException {
        when(ppeRepository.findById(1L)).thenReturn(Optional.of(ppe(1L, 10, 5L)));
        when(ppeRepository.save(any(Ppe.class))).thenAnswer(i -> i.getArgument(0));

        int balance = service.applyStockMovement(1L, -3, PpeMovementType.ISSUE, "REQ-9", 5L, null);

        assertThat(balance).isEqualTo(7);
        ArgumentCaptor<PpeStockMovement> mv = ArgumentCaptor.forClass(PpeStockMovement.class);
        verify(movementRepository).save(mv.capture());
        assertThat(mv.getValue().getQuantity()).isEqualTo(-3);
        assertThat(mv.getValue().getBalanceAfter()).isEqualTo(7);
    }

    @Test
    @DisplayName("un stock ne peut jamais passer sous zéro — aucun mouvement écrit")
    void neverGoesNegative() {
        when(ppeRepository.findById(1L)).thenReturn(Optional.of(ppe(1L, 2, 5L)));

        assertThatThrownBy(() -> service.applyStockMovement(1L, -5, PpeMovementType.ISSUE, "REQ-9", 5L, null))
                .isInstanceOf(HSException.class)
                .hasMessage("INSUFFICIENT_STOCK");
        verify(movementRepository, never()).save(any());
    }

    @Test
    @DisplayName("une mine ne peut pas mouvementer le stock d'une autre")
    void rejectsCrossMine() {
        when(ppeRepository.findById(1L)).thenReturn(Optional.of(ppe(1L, 10, 6L))); // EPI mine 6

        assertThatThrownBy(() -> service.applyStockMovement(1L, 5, PpeMovementType.RECEIPT, "STOCK-1", 1L, null))
                .isInstanceOf(HSException.class)
                .hasMessage("PPE_NOT_FOUND"); // appelant mine 1
        verify(movementRepository, never()).save(any());
    }

    @Test
    @DisplayName("stock legacy null traité comme 0 (plus de NPE d'autoboxing)")
    void nullStockTreatedAsZero() throws HSException {
        when(ppeRepository.findById(1L)).thenReturn(Optional.of(ppe(1L, null, 5L)));
        when(ppeRepository.save(any(Ppe.class))).thenAnswer(i -> i.getArgument(0));

        int balance = service.applyStockMovement(1L, 4, PpeMovementType.RECEIPT, "STOCK-1", 5L, null);

        assertThat(balance).isEqualTo(4);
    }

    @Test
    @DisplayName("un delta nul est refusé (mouvement sans effet)")
    void rejectsZeroDelta() {
        assertThatThrownBy(() -> service.applyStockMovement(1L, 0, PpeMovementType.ADJUSTMENT, "MANUAL", null, null))
                .isInstanceOf(HSException.class)
                .hasMessage("INVALID_STOCK_QUANTITY");
    }
}
