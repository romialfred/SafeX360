package com.minexpert.hns.service.incident;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.minexpert.hns.entity.incident.CorrectiveAction;
import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.enums.ControlHierarchy;
import com.minexpert.hns.enums.IncidentStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.CorrectiveActionRepository;
import com.minexpert.hns.repository.incident.IncidentRepository;
import com.minexpert.hns.repository.incident.InvestigationRepository;
import com.minexpert.hns.service.audit.ChangeLogService;
import com.minexpert.hns.utility.AuthUtils;

/**
 * Garde de clôture E2.1 — hiérarchie des mesures (ISO 45001 §8.1.2).
 *
 * <p>Testée DANS LES DEUX SENS : elle doit refuser la clôture d'un incident dont
 * une action corrective ne classe rien, ET la laisser passer dès que toutes les
 * actions déclarent leur niveau. Une garde qu'on ne teste que dans le sens du
 * refus peut bloquer aussi l'ayant droit sans qu'on le voie.
 *
 * <p>On part d'un incident au statut REPORTED : la transition REPORTED → CLOSED
 * court-circuite les trois gardes antérieures (risque, enquête, HPI), isolant la
 * garde testée.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class IncidentClosureHierarchyGuardTest {

    private static final Long COMPANY = 7L;
    private static final Long INCIDENT = 42L;

    @Mock private IncidentRepository incidentRepository;
    @Mock private CorrectiveActionRepository correctiveActionRepository;
    @Mock private InvestigationRepository investigationRepository;
    @Mock private ChangeLogService changeLogService;

    @InjectMocks private IncidentServiceImpl service;

    private Incident reportedIncident() {
        Incident incident = new Incident();
        incident.setId(INCIDENT);
        incident.setCompanyId(COMPANY);
        incident.setStatus(IncidentStatus.REPORTED);
        incident.setHighPotential(false);
        return incident;
    }

    private CorrectiveAction action(ControlHierarchy hierarchy) {
        CorrectiveAction action = new CorrectiveAction();
        action.setControlHierarchy(hierarchy);
        return action;
    }

    private void commonStubs() {
        when(incidentRepository.findByIdWithCompanyContext(INCIDENT, COMPANY))
                .thenReturn(Optional.of(reportedIncident()));
        when(investigationRepository.findByIncidentIdWithCompanyContext(eq(INCIDENT), any()))
                .thenReturn(Optional.empty());
    }

    @Test
    void refusesClosureWhenACorrectiveActionHasNoHierarchyLevel() {
        commonStubs();
        when(correctiveActionRepository.findByIncidentId(null, INCIDENT))
                .thenReturn(List.of(action(ControlHierarchy.ELIMINATION), action(null)));

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(AuthUtils::currentActorId).thenReturn(null);
            auth.when(AuthUtils::hasAnyAuthority).thenReturn(false);

            assertThatThrownBy(() -> service.updateIncidentStatus(COMPANY, INCIDENT, IncidentStatus.CLOSED))
                    .isInstanceOf(HSException.class)
                    .hasMessage("CONTROL_HIERARCHY_REQUIRED");
        }
        // La clôture est refusée : rien n'est persisté.
        verify(incidentRepository, never()).save(any());
    }

    @Test
    void allowsClosureWhenEveryActionDeclaresItsHierarchyLevel() throws HSException {
        commonStubs();
        // EPI seul est un niveau DÉCLARÉ : la garde exige la classification, pas
        // l'absence d'EPI. L'ayant droit passe.
        when(correctiveActionRepository.findByIncidentId(null, INCIDENT))
                .thenReturn(List.of(action(ControlHierarchy.PPE)));

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(AuthUtils::currentActorId).thenReturn(null);
            auth.when(AuthUtils::hasAnyAuthority).thenReturn(false);

            service.updateIncidentStatus(COMPANY, INCIDENT, IncidentStatus.CLOSED);
        }
        verify(incidentRepository, times(1)).save(any(Incident.class));
    }

    @Test
    void allowsClosureWhenNoCorrectiveActionExists() throws HSException {
        commonStubs();
        // Incident mineur clos sans action corrective : liste vide ⇒ aucune exigence.
        when(correctiveActionRepository.findByIncidentId(null, INCIDENT)).thenReturn(List.of());

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(AuthUtils::currentActorId).thenReturn(null);
            auth.when(AuthUtils::hasAnyAuthority).thenReturn(false);

            service.updateIncidentStatus(COMPANY, INCIDENT, IncidentStatus.CLOSED);
        }
        verify(incidentRepository, times(1)).save(any(Incident.class));
        assertThat(true).isTrue();
    }
}
