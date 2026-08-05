package com.minexpert.hns.service.ppe;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dto.ppe.PpeEmpDTO;
import com.minexpert.hns.dto.ppe.PpeRequestDTO;
import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeEmp;
import com.minexpert.hns.entity.ppe.PpeMovementType;
import com.minexpert.hns.entity.ppe.PpeRequest;
import com.minexpert.hns.entity.ppe.PpeRequestStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeEmpRepository;
import com.minexpert.hns.repository.ppe.PpeRequestRepository;

/**
 * Incrément 2 — matrice de demande multi-employés/multi-EPI avec quantités par ligne.
 *
 * Ces tests verrouillent le besoin fonctionnel n°1 de l'audit : chaque bénéficiaire
 * peut recevoir une combinaison d'EPI et de quantités DIFFÉRENTES, et l'approbation
 * sort du stock la quantité EXACTE demandée par EPI (somme des lignes), plus le
 * décrément forfaitaire « nombre d'employés » de l'ancien modèle.
 */
@ExtendWith(MockitoExtension.class)
class PpeRequestLinesTest {

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

    private PpeEmpDTO line(Long empId, Long ppeId, Integer qty) {
        PpeEmpDTO l = new PpeEmpDTO();
        l.setEmpId(empId);
        l.setPpeId(ppeId);
        l.setQuantityRequested(qty);
        return l;
    }

    private PpeEmp lineEntity(Long empId, Long ppeId, Integer qtyRequested) {
        PpeEmp e = new PpeEmp();
        e.setEmpId(empId);
        e.setPpe(new Ppe(ppeId));
        e.setQuantityRequested(qtyRequested);
        return e;
    }

    @Test
    @DisplayName("création : chaque ligne conserve SA quantité (pas de liste uniforme)")
    void create_persistsPerLineQuantities() throws HSException {
        PpeRequestDTO dto = new PpeRequestDTO();
        dto.setCompanyId(1L);
        // Employé 10 : 2 gants (ppe 1) + 3 lunettes (ppe 2) ; Employé 20 : 1 casque (ppe 3).
        dto.setLines(List.of(line(10L, 1L, 2), line(10L, 2L, 3), line(20L, 3L, 1)));
        when(requestRepository.save(any(PpeRequest.class))).thenAnswer(i -> {
            PpeRequest r = i.getArgument(0);
            r.setId(99L);
            return r;
        });
        when(ppeEmpRepository.findByPpeRequestId(99L)).thenReturn(List.of());

        service.create(dto);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<PpeEmpDTO>> captor = ArgumentCaptor.forClass(List.class);
        verify(ppeEmpService).createMultiple(captor.capture());
        List<PpeEmpDTO> saved = captor.getValue();
        assertThat(saved).hasSize(3);
        assertThat(saved).extracting(PpeEmpDTO::getQuantityRequested).containsExactly(2, 3, 1);
        assertThat(saved).allMatch(l -> l.getPpeRequestId().equals(99L) && l.getCompanyId().equals(1L));
        // Les listes plates sont synchronisées (dédupliquées) pour les anciens lecteurs.
        assertThat(dto.getEmpIds()).containsExactly(10L, 20L);
        assertThat(dto.getPpeIds()).containsExactly(1L, 2L, 3L);
    }

    @Test
    @DisplayName("approbation : la sortie de stock = SOMME des quantités par EPI")
    void approve_issuesSummedQuantityPerPpe() throws HSException {
        PpeRequest req = new PpeRequest();
        req.setId(99L);
        req.setCompanyId(1L);
        req.setStatus(PpeRequestStatus.PENDING);
        when(requestRepository.findById(99L)).thenReturn(java.util.Optional.of(req));
        when(requestRepository.save(any(PpeRequest.class))).thenAnswer(i -> i.getArgument(0));
        // ppe 1 : 2 (emp 10) + 1 (emp 20) = 3 ; ppe 2 : 3 (emp 10).
        when(ppeEmpRepository.findByPpeRequestId(99L)).thenReturn(List.of(
                lineEntity(10L, 1L, 2), lineEntity(20L, 1L, 1), lineEntity(10L, 2L, 3)));

        service.approveRequest(99L, "ok", 1L);

        // Un mouvement ISSUE par EPI, quantité = somme des lignes, cloisonné mine 1.
        verify(ppeService).applyStockMovement(eq(1L), eq(-3), eq(PpeMovementType.ISSUE), eq("REQ-99"), eq(1L), isNull());
        verify(ppeService).applyStockMovement(eq(2L), eq(-3), eq(PpeMovementType.ISSUE), eq("REQ-99"), eq(1L), isNull());
        assertThat(req.getStatus()).isEqualTo(PpeRequestStatus.APPROVED);
    }

    @Test
    @DisplayName("compatibilité : une demande legacy (empIds+ppeIds) reste acceptée")
    void create_legacyFlatListsStillWork() throws HSException {
        PpeRequestDTO dto = new PpeRequestDTO();
        dto.setCompanyId(1L);
        dto.setEmpIds(List.of(10L, 20L));
        dto.setPpeIds(List.of(1L));
        when(requestRepository.save(any(PpeRequest.class))).thenAnswer(i -> {
            PpeRequest r = i.getArgument(0);
            r.setId(99L);
            return r;
        });
        when(ppeEmpRepository.findByPpeRequestId(anyLong())).thenReturn(List.of());

        service.create(dto);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<PpeEmpDTO>> captor = ArgumentCaptor.forClass(List.class);
        verify(ppeEmpService).createMultiple(captor.capture());
        // Produit cartésien 2×1 = 2 lignes, chacune quantité 1.
        assertThat(captor.getValue()).hasSize(2);
        assertThat(captor.getValue()).allMatch(l -> l.getQuantityRequested() == 1);
    }
}
