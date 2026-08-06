package com.minexpert.hns.service.ppe;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dto.ppe.dotation.DotationDetailDTO;
import com.minexpert.hns.dto.ppe.dotation.DotationSummaryDTO;
import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeEmpRepository;
import com.minexpert.hns.repository.ppe.PpeRepository;

/**
 * Moteur de conformité « Suivi des dotations EPI » — règles métier centrales.
 *
 * Exigences = catégories obligatoires (Head durable, Eye durable, Hand consommable).
 * Vérifie : conforme, incomplet (manquant), critique (durable expiré), à renouveler
 * (durable < 30 j), et la règle CONSOMMABLE (durée de vie < 6 mois → jamais « expiré »).
 */
@ExtendWith(MockitoExtension.class)
class PpeDotationComplianceTest {

    @Mock
    private PpeRepository ppeRepository;
    @Mock
    private PpeEmpRepository empRepository;

    @InjectMocks
    private PpeDotationServiceImpl service;

    private final LocalDate today = LocalDate.now();

    private Ppe mandatory(String cat) {
        Ppe p = new Ppe();
        p.setCategory(cat);
        p.setMandatory(true);
        p.setStatus(PpeStatus.ACTIVE);
        return p;
    }

    // Ligne d'attribution : [empId, ppeId, name, category, brand, model, size,
    //                        lifespanMonths, price, issued, returned, date, status]
    private Object[] attrib(long empId, String cat, int lifeMonths, LocalDate date) {
        return new Object[] { empId, 1L, "EPI " + cat, cat, null, null, "L",
                lifeMonths, 1000.0, 1, 0, date, "ACTIVE" };
    }

    private Object[] roster(long id, String name) {
        return new Object[] { id, "EMP-" + id, name, "Mining", "Operator" };
    }

    private void stub(List<Object[]> attribs) {
        when(ppeRepository.findByStatusAndCompany(any(), any())).thenReturn(List.of(
                mandatory("Head protection"), mandatory("Eye protection"), mandatory("Hand protection")));
        when(empRepository.rosterByCompany(any())).thenReturn(List.of(
                roster(1, "E1 Conforme"), roster(2, "E2 Incomplet"), roster(3, "E3 Critique"),
                roster(4, "E4 Renouveler"), roster(5, "E5 Consommable")));
        when(empRepository.attributionsByCompany(any())).thenReturn(attribs);
    }

    @Test
    @DisplayName("répartition des statuts selon les règles de conformité")
    void summary_computesStatuses() throws HSException {
        stub(List.of(
                // E1 : les 3 catégories, durables récents, consommable récent → CONFORME
                attrib(1, "Head protection", 60, today.minusMonths(2)),
                attrib(1, "Eye protection", 24, today.minusMonths(2)),
                attrib(1, "Hand protection", 3, today.minusDays(10)),
                // E2 : Head + Hand, PAS d'Eye → A_COMPLETER
                attrib(2, "Head protection", 60, today.minusMonths(2)),
                attrib(2, "Hand protection", 3, today.minusDays(10)),
                // E3 : Eye durable EXPIRÉ (émis il y a 30 mois, vie 24) → CRITIQUE
                attrib(3, "Head protection", 60, today.minusMonths(2)),
                attrib(3, "Eye protection", 24, today.minusMonths(30)),
                attrib(3, "Hand protection", 3, today.minusDays(10)),
                // E4 : Eye durable expire dans ~10 j → A_RENOUVELER
                attrib(4, "Head protection", 60, today.minusMonths(2)),
                attrib(4, "Eye protection", 24, today.minusMonths(24).plusDays(10)),
                attrib(4, "Hand protection", 3, today.minusDays(10)),
                // E5 : durables OK ; Hand consommable émis il y a 6 mois (>durée de vie 3)
                //      mais CONSOMMABLE (< 6 mois) → non expirable → CONFORME
                attrib(5, "Head protection", 60, today.minusMonths(2)),
                attrib(5, "Eye protection", 24, today.minusMonths(2)),
                attrib(5, "Hand protection", 3, today.minusMonths(6))));

        DotationSummaryDTO s = service.getSummary(1L);
        assertThat(s.getTotalEmployees()).isEqualTo(5);
        assertThat(s.getCompliant()).isEqualTo(2);   // E1 + E5
        assertThat(s.getIncomplete()).isEqualTo(1);  // E2
        assertThat(s.getRenewalDue()).isEqualTo(1);  // E4
        assertThat(s.getCritical()).isEqualTo(1);    // E3
    }

    @Test
    @DisplayName("détail : l'exigence non satisfaite (Eye) remonte comme manquante")
    void detail_reportsMissing() throws HSException {
        stub(List.of(
                attrib(2, "Head protection", 60, today.minusMonths(2)),
                attrib(2, "Hand protection", 3, today.minusDays(10))));

        DotationDetailDTO d = service.getEmployeeDetail(1L, 2L);
        assertThat(d.getStatus()).isEqualTo("A_COMPLETER");
        assertThat(d.getRequiredCount()).isEqualTo(3);
        assertThat(d.getSatisfiedCount()).isEqualTo(2);
        assertThat(d.getMissing()).extracting(m -> m.getCategory()).containsExactly("Eye protection");
    }
}
