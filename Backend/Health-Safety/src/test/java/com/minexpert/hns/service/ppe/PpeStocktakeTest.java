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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dto.ppe.PpeStocktakeDTO;
import com.minexpert.hns.dto.ppe.PpeStocktakeLineDTO;
import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeMovementType;
import com.minexpert.hns.entity.ppe.PpeStocktake;
import com.minexpert.hns.entity.ppe.PpeStocktakeLine;
import com.minexpert.hns.entity.ppe.PpeStocktakeStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeRepository;
import com.minexpert.hns.repository.ppe.PpeStocktakeLineRepository;
import com.minexpert.hns.repository.ppe.PpeStocktakeRepository;

/**
 * Incrément 5 — inventaire physique EPI.
 *
 * Verrouille : (1) le serveur FIGE lui-même le stock système (ne fait pas confiance au
 * client) ; (2) la validation réconcilie via le JOURNAL (mouvement ADJUSTMENT), écart
 * calculé contre le stock VIF, jamais de mutation directe ; (3) idempotence (seul un
 * brouillon se valide) ; (4) cloisonnement mine.
 */
@ExtendWith(MockitoExtension.class)
class PpeStocktakeTest {

    @Mock
    private PpeStocktakeRepository stocktakeRepository;
    @Mock
    private PpeStocktakeLineRepository lineRepository;
    @Mock
    private PpeRepository ppeRepository;
    @Mock
    private PpeService ppeService;

    @InjectMocks
    private PpeStocktakeServiceImpl service;

    private Ppe ppe(Long id, Integer stock, Long companyId) {
        Ppe p = new Ppe(id);
        p.setStock(stock);
        p.setCompanyId(companyId);
        return p;
    }

    private PpeStocktakeLineDTO lineDto(Long ppeId, Integer counted, Integer bogusSystem) {
        return PpeStocktakeLineDTO.builder()
                .ppeId(ppeId).countedQuantity(counted).systemQuantity(bogusSystem).build();
    }

    @Test
    @DisplayName("création : le serveur FIGE le stock système (ignore celui du client), statut DRAFT")
    void create_snapshotsSystemStockServerSide() throws HSException {
        PpeStocktakeDTO dto = PpeStocktakeDTO.builder()
                .reference("INV-A")
                .lines(List.of(lineDto(1L, 8, 999), lineDto(2L, 5, 999)))
                .build();
        when(stocktakeRepository.save(any(PpeStocktake.class))).thenAnswer(i -> {
            PpeStocktake s = i.getArgument(0);
            s.setId(50L);
            return s;
        });
        when(ppeRepository.findById(1L)).thenReturn(Optional.of(ppe(1L, 10, 1L)));
        when(ppeRepository.findById(2L)).thenReturn(Optional.of(ppe(2L, 5, 1L)));
        when(lineRepository.findByStocktakeId(50L)).thenReturn(List.of());

        service.create(dto, 1L, 7L);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<PpeStocktakeLine>> captor = ArgumentCaptor.forClass(List.class);
        verify(lineRepository).saveAll(captor.capture());
        List<PpeStocktakeLine> saved = captor.getValue();
        // systemQuantity vient du STOCK RÉEL (10, 5), pas du 999 envoyé par le client.
        assertThat(saved).extracting(PpeStocktakeLine::getSystemQuantity).containsExactly(10, 5);
        assertThat(saved).extracting(PpeStocktakeLine::getCountedQuantity).containsExactly(8, 5);
        // Écart calculé : -2 (manquant) et 0.
        assertThat(saved).extracting(PpeStocktakeLine::getDifference).containsExactly(-2, 0);

        ArgumentCaptor<PpeStocktake> headerCaptor = ArgumentCaptor.forClass(PpeStocktake.class);
        verify(stocktakeRepository).save(headerCaptor.capture());
        assertThat(headerCaptor.getValue().getStatus()).isEqualTo(PpeStocktakeStatus.DRAFT);
        assertThat(headerCaptor.getValue().getCompanyId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("création : refuse un EPI d'une autre mine")
    void create_rejectsForeignMinePpe() {
        PpeStocktakeDTO dto = PpeStocktakeDTO.builder().lines(List.of(lineDto(1L, 3, 0))).build();
        when(stocktakeRepository.save(any(PpeStocktake.class))).thenAnswer(i -> {
            PpeStocktake s = i.getArgument(0);
            s.setId(50L);
            return s;
        });
        when(ppeRepository.findById(1L)).thenReturn(Optional.of(ppe(1L, 10, 2L))); // mine 2 ≠ 1

        assertThatThrownBy(() -> service.create(dto, 1L, 7L))
                .isInstanceOf(HSException.class)
                .hasMessageContaining("PPE_NOT_FOUND");
    }

    @Test
    @DisplayName("validation : passe l'écart en ADJUSTMENT (contre le stock VIF), DRAFT→VALIDATED")
    void validate_reconcilesViaLedger() throws HSException {
        PpeStocktake take = PpeStocktake.builder()
                .id(50L).companyId(1L).status(PpeStocktakeStatus.DRAFT).build();
        when(stocktakeRepository.findById(50L)).thenReturn(Optional.of(take));
        when(stocktakeRepository.save(any(PpeStocktake.class))).thenAnswer(i -> i.getArgument(0));
        // Ligne 1 : compté 8 vs stock vif 10 → delta -2. Ligne 2 : compté 5 vs 5 → delta 0 (pas de mouvement).
        PpeStocktakeLine l1 = PpeStocktakeLine.builder().ppeId(1L).systemQuantity(10).countedQuantity(8).build();
        PpeStocktakeLine l2 = PpeStocktakeLine.builder().ppeId(2L).systemQuantity(5).countedQuantity(5).build();
        when(lineRepository.findByStocktakeId(50L)).thenReturn(List.of(l1, l2));
        when(ppeRepository.findById(1L)).thenReturn(Optional.of(ppe(1L, 10, 1L)));
        when(ppeRepository.findById(2L)).thenReturn(Optional.of(ppe(2L, 5, 1L)));

        service.validate(50L, 1L, 7L);

        verify(ppeService).applyStockMovement(eq(1L), eq(-2), eq(PpeMovementType.ADJUSTMENT), eq("INV-50"), eq(1L), eq(7L));
        // Aucun mouvement pour la ligne à écart nul.
        verify(ppeService, never()).applyStockMovement(eq(2L), anyInt(), any(), anyString(), anyLong(), any());
        assertThat(take.getStatus()).isEqualTo(PpeStocktakeStatus.VALIDATED);
        assertThat(take.getValidatedAt()).isNotNull();
    }

    @Test
    @DisplayName("validation IDEMPOTENTE : un inventaire déjà validé est refusé")
    void validate_rejectsNonDraft() throws HSException {
        PpeStocktake take = PpeStocktake.builder()
                .id(50L).companyId(1L).status(PpeStocktakeStatus.VALIDATED).build();
        when(stocktakeRepository.findById(50L)).thenReturn(Optional.of(take));

        assertThatThrownBy(() -> service.validate(50L, 1L, 7L))
                .isInstanceOf(HSException.class)
                .hasMessageContaining("STOCKTAKE_NOT_DRAFT");
        verify(ppeService, never()).applyStockMovement(anyLong(), anyInt(), any(), anyString(), any(), any());
    }

    @Test
    @DisplayName("annulation : DRAFT→CANCELLED, aucun mouvement de stock")
    void cancel_marksCancelledWithoutStockMove() throws HSException {
        PpeStocktake take = PpeStocktake.builder()
                .id(50L).companyId(1L).status(PpeStocktakeStatus.DRAFT).build();
        when(stocktakeRepository.findById(50L)).thenReturn(Optional.of(take));
        when(stocktakeRepository.save(any(PpeStocktake.class))).thenAnswer(i -> i.getArgument(0));
        when(lineRepository.findByStocktakeId(50L)).thenReturn(List.of());

        service.cancel(50L, 1L);

        assertThat(take.getStatus()).isEqualTo(PpeStocktakeStatus.CANCELLED);
        verify(ppeService, never()).applyStockMovement(anyLong(), anyInt(), any(), anyString(), any(), any());
    }
}
