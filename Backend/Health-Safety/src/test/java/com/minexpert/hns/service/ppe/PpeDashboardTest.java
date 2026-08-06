package com.minexpert.hns.service.ppe;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dto.ppe.PpeDashboardDTO;
import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeMovementType;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeRepository;
import com.minexpert.hns.repository.ppe.PpeStockMovementRepository;

/**
 * Incrément 6 — tableau de bord décisionnel EPI.
 *
 * Verrouille : valorisation du stock (Σ stock × prix), ventilation par catégorie triée
 * par valeur, flux valorisés par type (réception/distribution/retour/ajustement), top
 * consommation, écart net d'inventaire — le tout dérivé du JOURNAL, sans donnée fabriquée.
 */
@ExtendWith(MockitoExtension.class)
class PpeDashboardTest {

    @Mock
    private PpeRepository ppeRepository;
    @Mock
    private PpeStockMovementRepository movementRepository;

    @InjectMocks
    private PpeDashboardServiceImpl service;

    private Ppe ppe(Long id, String cat, Integer stock, Double price, Integer minStock) {
        Ppe p = new Ppe();
        p.setId(id);
        p.setCategory(cat);
        p.setStock(stock);
        p.setReferencePrice(price);
        p.setMinStock(minStock);
        p.setCurrency("XOF");
        p.setName("EPI-" + id);
        return p;
    }

    @Test
    @DisplayName("valorisation + flux + top consommation dérivés du journal")
    void dashboard_computesValuationAndFlows() throws HSException {
        when(ppeRepository.findAllByCompany(1L)).thenReturn(List.of(
                ppe(1L, "Tête", 10, 5.0, 3),   // valeur 50
                ppe(2L, "Mains", 2, 2.0, 5),   // valeur 4, stock bas (2<=5)
                ppe(3L, "Tête", 0, 8.0, 4)));  // rupture, valeur 0

        when(movementRepository.sumByPpeForType(eq(PpeMovementType.RECEIPT), any(), any(), any()))
                .thenReturn(List.<Object[]>of(new Object[] { 1L, 20L }));
        when(movementRepository.sumByPpeForType(eq(PpeMovementType.ISSUE), any(), any(), any()))
                .thenReturn(List.<Object[]>of(new Object[] { 1L, -8L }, new Object[] { 2L, -3L }));
        when(movementRepository.sumByPpeForType(eq(PpeMovementType.RETURN), any(), any(), any()))
                .thenReturn(List.<Object[]>of(new Object[] { 1L, 2L }));
        when(movementRepository.sumByPpeForType(eq(PpeMovementType.ADJUSTMENT), any(), any(), any()))
                .thenReturn(List.<Object[]>of(new Object[] { 1L, -2L }));

        PpeDashboardDTO dto = service.getDashboard(1L, null, null);

        // Valorisation globale : 50 + 4 + 0.
        assertThat(dto.getStockValueTotal()).isEqualTo(54.0);
        assertThat(dto.getTotalReferences()).isEqualTo(3);
        assertThat(dto.getTotalUnitsInStock()).isEqualTo(12L);
        assertThat(dto.getLowStockCount()).isEqualTo(1);
        assertThat(dto.getOutOfStockCount()).isEqualTo(1);
        assertThat(dto.getCurrency()).isEqualTo("XOF");

        // Catégories triées par valeur décroissante : Tête (50) avant Mains (4).
        assertThat(dto.getValueByCategory()).extracting(c -> c.getCategory()).containsExactly("Tête", "Mains");
        assertThat(dto.getValueByCategory().get(0).getValue()).isEqualTo(50.0);
        assertThat(dto.getValueByCategory().get(0).getUnits()).isEqualTo(10L);

        // Flux valorisés : ISSUE = 11 unités, valeur 8×5 + 3×2 = 46.
        PpeDashboardDTO.MovementStat issue = dto.getMovements().stream()
                .filter(m -> m.getType().equals("ISSUE")).findFirst().orElseThrow();
        assertThat(issue.getQuantity()).isEqualTo(11L);
        assertThat(issue.getValue()).isEqualTo(46.0);

        // Top consommation : EPI 1 (8) avant EPI 2 (3).
        assertThat(dto.getTopConsumed()).extracting(c -> c.getPpeId()).containsExactly(1L, 2L);
        assertThat(dto.getTopConsumed().get(0).getQuantity()).isEqualTo(8L);
        assertThat(dto.getTopConsumed().get(0).getValue()).isEqualTo(40.0);

        // Écart net d'inventaire = -2.
        assertThat(dto.getInventoryAdjustmentUnits()).isEqualTo(-2L);
    }

    @Test
    @DisplayName("parc vide : renvoie une synthèse à zéro sans erreur")
    void dashboard_emptyPark() throws HSException {
        when(ppeRepository.findAllByCompany(9L)).thenReturn(List.of());
        when(movementRepository.sumByPpeForType(any(), any(), any(), any())).thenReturn(List.of());

        PpeDashboardDTO dto = service.getDashboard(9L, null, null);

        assertThat(dto.getStockValueTotal()).isEqualTo(0.0);
        assertThat(dto.getTotalReferences()).isZero();
        assertThat(dto.getTopConsumed()).isEmpty();
        assertThat(dto.getValueByCategory()).isEmpty();
    }
}
