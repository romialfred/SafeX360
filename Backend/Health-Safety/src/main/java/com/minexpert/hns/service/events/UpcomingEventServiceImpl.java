package com.minexpert.hns.service.events;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.events.UpcomingEventDTO;
import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.entity.activities.HsActivity;
import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.entity.nonConformity.NonConformity;
import com.minexpert.hns.enums.ActivityType;
import com.minexpert.hns.enums.EventStatus;
import com.minexpert.hns.enums.EventType;
import com.minexpert.hns.repository.activities.HsActivityRepository;
import com.minexpert.hns.repository.audit.AuditRepository;
import com.minexpert.hns.repository.inspections.GeneralInspectionRepository;
import com.minexpert.hns.repository.nonConformity.NonConformityRepository;

@Service
public class UpcomingEventServiceImpl implements UpcomingEventService {

    private static final List<EventStatus> EXCLUDED_NON_CONFORMITY_STATUSES =
            List.of(EventStatus.CLOSED, EventStatus.CANCELLED);

    private final GeneralInspectionRepository generalInspectionRepository;
    private final NonConformityRepository nonConformityRepository;
    private final AuditRepository auditRepository;
    private final HsActivityRepository hsActivityRepository;

    public UpcomingEventServiceImpl(GeneralInspectionRepository generalInspectionRepository,
            NonConformityRepository nonConformityRepository,
            AuditRepository auditRepository,
            HsActivityRepository hsActivityRepository) {
        this.generalInspectionRepository = generalInspectionRepository;
        this.nonConformityRepository = nonConformityRepository;
        this.auditRepository = auditRepository;
        this.hsActivityRepository = hsActivityRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UpcomingEventDTO> getUpcomingEvents() {
        LocalDate today = LocalDate.now();
        List<UpcomingEventDTO> events = new ArrayList<>();

        generalInspectionRepository.findFirstByPlannedDateGreaterThanEqualOrderByPlannedDateAsc(today)
                .map(this::mapInspection)
                .ifPresent(events::add);

        Arrays.stream(EventType.values())
                .forEach(type -> nonConformityRepository
                        .findFirstByTypeAndDateGreaterThanEqualAndStatusNotInOrderByDateAsc(type, today,
                                EXCLUDED_NON_CONFORMITY_STATUSES)
                        .map(nonConformity -> mapNonConformity(nonConformity, type))
                        .ifPresent(events::add));

        auditRepository.findFirstByStartDateGreaterThanEqualOrderByStartDateAsc(today)
                .or(() -> auditRepository.findFirstByEndDateGreaterThanEqualOrderByEndDateAsc(today))
                .map(this::mapAudit)
                .ifPresent(events::add);

        addHsActivity(ActivityType.HSM, "HS_MEETING", today, events);
        addHsActivity(ActivityType.ST, "STEERING TOUR", today, events);

        return events;
    }

    private void addHsActivity(ActivityType activityType, String label, LocalDate today, List<UpcomingEventDTO> events) {
        hsActivityRepository.findFirstByTypeAndPlannedDateGreaterThanEqualOrderByPlannedDateAsc(activityType, today)
                .map(activity -> mapHsActivity(activity, label))
                .ifPresent(events::add);
    }

    private UpcomingEventDTO mapInspection(GeneralInspection inspection) {
        String location = inspection.getSite() != null ? inspection.getSite().getName() : null;
        return new UpcomingEventDTO(inspection.getId(),
                inspection.getActivity() != null ? inspection.getActivity().getTitle() : null,
                "INSPECTION",
                inspection.getPlannedDate(),
                location,
                inspection.getDescription());
    }

    private UpcomingEventDTO mapNonConformity(NonConformity nonConformity, EventType type) {
        String location = nonConformity.getLocation() != null ? nonConformity.getLocation().getName() : null;
        String label = type.name().replace('_', ' ');
        return new UpcomingEventDTO(nonConformity.getId(),
                nonConformity.getTitle(),
                label,
                nonConformity.getDate(),
                location,
                nonConformity.getDescription());
    }

    private UpcomingEventDTO mapAudit(Audit audit) {
        LocalDate scheduledDate = audit.getStartDate() != null ? audit.getStartDate() : audit.getEndDate();
        return new UpcomingEventDTO(audit.getId(), audit.getTitle(), "AUDIT", scheduledDate, null, audit.getDescription());
    }

    private UpcomingEventDTO mapHsActivity(HsActivity activity, String label) {
        String location = activity.getLocation() != null ? activity.getLocation().getName() : null;
        return new UpcomingEventDTO(activity.getId(),
                activity.getActivity() != null ? activity.getActivity().getTitle() : null,
                label,
                activity.getPlannedDate(),
                location,
                activity.getObjectives());
    }
}
