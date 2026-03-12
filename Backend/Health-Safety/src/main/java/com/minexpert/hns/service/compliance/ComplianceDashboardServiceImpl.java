package com.minexpert.hns.service.compliance;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.mail.EmailService;
import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardActionItemsResponse;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardBreakdownDTO;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardCompliantEmployeesResponse;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardDepartmentDTO;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardDepartmentSummaryResponse;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardEmployeeDTO;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardEmployeeRowDTO;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardItemDTO;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardLastReviewDTO;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardNextReviewDTO;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardOverallStatusResponse;
import com.minexpert.hns.dto.compliance.dashboard.ComplianceDashboardStatusDTO;
import com.minexpert.hns.dto.compliance.dashboard.RequirementAssignmentSummary;
import com.minexpert.hns.dto.request.DepartmentNames;
import com.minexpert.hns.dto.request.EmpEmailPosResponse;
import com.minexpert.hns.entity.compliance.ComplianceDocs;
import com.minexpert.hns.enums.DocStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.compliance.ComplianceDocsRepository;
import com.minexpert.hns.repository.compliance.PositionAssignmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ComplianceDashboardServiceImpl implements ComplianceDashboardService {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int UPCOMING_THRESHOLD_DAYS = 30;
    private static final String DEFAULT_COLOR_COMPLIANT = "#22c55e";
    private static final String DEFAULT_COLOR_UPCOMING = "#f97316";
    private static final String DEFAULT_COLOR_EXPIRED = "#ef4444";
    private static final String DEFAULT_COLOR_MISSING = "#6b7280";

    private final ComplianceDocsRepository complianceDocsRepository;
    private final PositionAssignmentRepository positionAssignmentRepository;
    private final HrmsClient hrmsClient;
    private final EmailService emailService;

    @Override
    public ComplianceDashboardActionItemsResponse getActionItems() throws HSException {
        List<AssignmentContext> contexts = loadAssignmentContexts();
        if (contexts.isEmpty()) {
            return emptyActionItemsResponse();
        }

        LocalDate referenceDate = LocalDate.now();
        Map<ComplianceClassification, List<ComplianceDashboardItemDTO>> groupedItems = new EnumMap<>(
                ComplianceClassification.class);
        for (ComplianceClassification status : ComplianceClassification.values()) {
            groupedItems.put(status, new ArrayList<>());
        }

        for (AssignmentContext context : contexts) {
            ComplianceClassification classification = classify(context.document(), referenceDate);
            if (!isActionItemStatus(classification)) {
                continue;
            }
            groupedItems.get(classification).add(toActionItem(context, classification, referenceDate));
        }

        List<ComplianceDashboardStatusDTO> statuses = new ArrayList<>();
        for (ComplianceClassification classification : ComplianceClassification.actionItemOrder()) {
            List<ComplianceDashboardItemDTO> items = groupedItems.get(classification);
            statuses.add(new ComplianceDashboardStatusDTO(classification.code(), classification.label(),
                    items.size(), List.copyOf(items)));
        }

        return new ComplianceDashboardActionItemsResponse(statuses, OffsetDateTime.now(ZoneOffset.UTC));
    }

    @Override
    public void sendActionItemAlert(Long employeeId, Long requirementId) throws HSException {
        LocalDate referenceDate = LocalDate.now();
        EmpEmailPosResponse employee = Optional.ofNullable(
                hrmsClient.getEmployeeWithEmailAndPositionById(employeeId))
                .orElseThrow(() -> new HSException("EMPLOYEE_NOT_FOUND"));

        if (employee.getEmail() == null || employee.getEmail().isBlank()) {
            throw new HSException("EMPLOYEE_EMAIL_NOT_AVAILABLE");
        }
        if (employee.getPositionId() == null) {
            throw new HSException("EMPLOYEE_POSITION_NOT_AVAILABLE");
        }

        RequirementAssignmentSummary assignment = positionAssignmentRepository
                .findActiveSummaryByPositionAndRequirement(employee.getPositionId(), requirementId)
                .orElseThrow(() -> new HSException("ASSIGNMENT_NOT_FOUND"));

        if (assignment.requirementId() == null) {
            throw new HSException("ASSIGNMENT_REQUIREMENT_NOT_FOUND");
        }

        ComplianceDocs latestDoc = findLatestDocument(employeeId, assignment.requirementId());
        ComplianceClassification classification = classify(latestDoc, referenceDate);
        if (!(classification == ComplianceClassification.EXPIRED
                || classification == ComplianceClassification.UPCOMING
                || classification == ComplianceClassification.MISSING)) {
            throw new HSException("ALERT_NOT_APPLICABLE_FOR_STATUS");
        }

        String statusDetail = buildStatusDetail(classification,
                latestDoc != null ? latestDoc.getExpiryDate() : null,
                referenceDate);
        String subject = "Compliance Alert: " + assignment.requirementTitle() + " - " + classification.label();
        String body = buildAlertEmailBody(employee, assignment, latestDoc, classification, statusDetail);

        emailService.sendHtml(employee.getEmail(), subject, body);
    }

    @Override
    public ComplianceDashboardDepartmentSummaryResponse getDepartmentSummary(LocalDate asOf) throws HSException {
        List<AssignmentContext> contexts = loadAssignmentContexts();
        if (contexts.isEmpty()) {
            return new ComplianceDashboardDepartmentSummaryResponse(asOf, List.of());
        }
        LocalDate referenceDate = asOf != null ? asOf : LocalDate.now();
        Map<String, DepartmentAccumulator> accumulatorByDepartment = new HashMap<>();

        for (AssignmentContext context : contexts) {
            ComplianceClassification classification = classify(context.document(), referenceDate);
            DepartmentAccumulator accumulator = accumulatorByDepartment
                    .computeIfAbsent(normaliseDepartment(context.employee().getDepartment()),
                            k -> new DepartmentAccumulator());
            accumulator.increment(mapToSummaryBucket(classification));
        }

        List<ComplianceDashboardDepartmentDTO> departments = accumulatorByDepartment.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> entry.getValue().toDepartmentDTO(entry.getKey()))
                .toList();

        return new ComplianceDashboardDepartmentSummaryResponse(referenceDate, departments);
    }

    @Override
    public ComplianceDashboardOverallStatusResponse getOverallStatus(Long departmentId) throws HSException {
        List<AssignmentContext> contexts = loadAssignmentContexts();
        if (contexts.isEmpty()) {
            return new ComplianceDashboardOverallStatusResponse(0, List.of());
        }
        Optional<String> departmentName = resolveDepartmentName(departmentId);

        LocalDate referenceDate = LocalDate.now();
        long compliant = 0;
        long upcoming = 0;
        long expired = 0;
        long missing = 0;

        for (AssignmentContext context : contexts) {
            if (departmentName.isPresent()
                    && !departmentName.get()
                            .equalsIgnoreCase(normaliseDepartment(context.employee().getDepartment()))) {
                continue;
            }
            ComplianceClassification classification = classify(context.document(), referenceDate);
            SummaryBucket bucket = mapToSummaryBucket(classification);
            switch (bucket) {
                case COMPLIANT -> compliant++;
                case UPCOMING -> upcoming++;
                case EXPIRED -> expired++;
                case MISSING -> missing++;
            }
        }

        long total = compliant + upcoming + expired + missing;
        List<ComplianceDashboardBreakdownDTO> breakdown = List.of(
                new ComplianceDashboardBreakdownDTO("Compliant", compliant, DEFAULT_COLOR_COMPLIANT),
                new ComplianceDashboardBreakdownDTO("Upcoming Expiry", upcoming, DEFAULT_COLOR_UPCOMING),
                new ComplianceDashboardBreakdownDTO("Expired", expired, DEFAULT_COLOR_EXPIRED),
                new ComplianceDashboardBreakdownDTO("Missing", missing, DEFAULT_COLOR_MISSING));

        return new ComplianceDashboardOverallStatusResponse(total, breakdown);
    }

    @Override
    public ComplianceDashboardCompliantEmployeesResponse getCompliantEmployees(Integer page, Integer pageSize,
            String departmentFilter, String employeeFilter) throws HSException {
        List<AssignmentContext> contexts = loadAssignmentContexts();
        if (contexts.isEmpty()) {
            return new ComplianceDashboardCompliantEmployeesResponse(resolvePage(page), resolvePageSize(pageSize), 0,
                    List.of());
        }

        LocalDate referenceDate = LocalDate.now();
        String normalisedDepartmentFilter = normaliseFilterValue(departmentFilter);
        String normalisedEmployeeFilter = normaliseFilterValue(employeeFilter);

        List<ComplianceDashboardEmployeeRowDTO> compliantRows = new ArrayList<>();
        for (AssignmentContext context : contexts) {
            ComplianceClassification classification = classify(context.document(), referenceDate);
            if (classification != ComplianceClassification.COMPLIANT) {
                continue;
            }
            if (!matchesFilter(context.employee(), normalisedDepartmentFilter, normalisedEmployeeFilter)) {
                continue;
            }
            compliantRows.add(toCompliantEmployeeRow(context, referenceDate));
        }

        compliantRows.sort((left, right) -> left.name().compareToIgnoreCase(right.name()));

        int resolvedPage = resolvePage(page);
        int resolvedPageSize = resolvePageSize(pageSize);
        long total = compliantRows.size();
        List<ComplianceDashboardEmployeeRowDTO> pageContent = paginate(compliantRows, resolvedPage, resolvedPageSize);

        return new ComplianceDashboardCompliantEmployeesResponse(resolvedPage, resolvedPageSize, total,
                List.copyOf(pageContent));
    }

    private boolean matchesFilter(EmpEmailPosResponse employee, String departmentFilter, String employeeFilter) {
        String departmentValue = normaliseDepartment(employee.getDepartment()).toLowerCase(Locale.ROOT);
        boolean departmentMatches = departmentFilter == null || departmentValue.contains(departmentFilter);
        boolean employeeMatches = employeeFilter == null
                || Optional.ofNullable(employee.getName()).map(String::toLowerCase).orElse("")
                        .contains(employeeFilter);
        return departmentMatches && employeeMatches;
    }

    private ComplianceDashboardEmployeeRowDTO toCompliantEmployeeRow(AssignmentContext context,
            LocalDate referenceDate) {
        ComplianceDocs doc = context.document();
        RequirementAssignmentSummary assignment = context.assignment();
        EmpEmailPosResponse employee = context.employee();

        LocalDate completedOn = extractDate(doc);
        LocalDate dueOn = doc != null ? doc.getExpiryDate() : null;
        long daysUntilDue = dueOn != null ? Math.max(0,
                ChronoUnit.DAYS.between(referenceDate, dueOn)) : 0;

        ComplianceDashboardLastReviewDTO lastReview = new ComplianceDashboardLastReviewDTO(
                completedOn, null);
        ComplianceDashboardNextReviewDTO nextReview = new ComplianceDashboardNextReviewDTO(
                dueOn, daysUntilDue);

        return new ComplianceDashboardEmployeeRowDTO(
                safeId(employee.getId()),
                Optional.ofNullable(employee.getName()).orElse(""),
                Optional.ofNullable(employee.getPosition()).orElse(""),
                normaliseDepartment(employee.getDepartment()),
                Optional.ofNullable(assignment.requirementTitle()).orElse(""),
                lastReview,
                nextReview);
    }

    private ComplianceDashboardItemDTO toActionItem(AssignmentContext context,
            ComplianceClassification classification,
            LocalDate referenceDate) {
        RequirementAssignmentSummary assignment = context.assignment();
        EmpEmailPosResponse employee = context.employee();
        ComplianceDocs doc = context.document();

        String compositeId = safeRequirementId(assignment.requirementId()) + "-" + safeId(employee.getId());
        String id = (doc != null && classification != ComplianceClassification.EXPIRED
                && classification != ComplianceClassification.UPCOMING)
                ? String.valueOf(doc.getId())
                : compositeId;
        ComplianceDashboardEmployeeDTO employeeDTO = new ComplianceDashboardEmployeeDTO(
                safeId(employee.getId()),
                Optional.ofNullable(employee.getName()).orElse(""),
                Optional.ofNullable(employee.getPosition()).orElse(""),
                normaliseDepartment(employee.getDepartment()));

        LocalDate expiryDate = doc != null ? doc.getExpiryDate() : null;
        String statusDetail = buildStatusDetail(classification, expiryDate, referenceDate);

        LocalDate expiredOn = classification == ComplianceClassification.EXPIRED ? expiryDate : null;
        LocalDate dueOn = (classification == ComplianceClassification.UPCOMING
                || classification == ComplianceClassification.PENDING) ? expiryDate : null;

        return new ComplianceDashboardItemDTO(
                id,
                Optional.ofNullable(assignment.requirementTitle()).orElse(""),
                employeeDTO,
                statusDetail,
                expiredOn,
                dueOn,
                Optional.ofNullable(assignment.requirementDescription()).orElse(""));
    }

    private String buildStatusDetail(ComplianceClassification classification, LocalDate expiryDate,
            LocalDate referenceDate) {
        return switch (classification) {
            case EXPIRED -> formatExpiredDetail(expiryDate, referenceDate);
            case UPCOMING -> formatUpcomingDetail(expiryDate, referenceDate);
            case MISSING -> "Document missing";
            case PENDING -> "Pending review";
            case COMPLIANT -> "Compliant";
        };
    }

    private String formatExpiredDetail(LocalDate expiryDate, LocalDate referenceDate) {
        if (expiryDate == null) {
            return "Expired";
        }
        long daysAgo = ChronoUnit.DAYS.between(expiryDate, referenceDate);
        if (daysAgo <= 0) {
            return "Expired";
        }
        if (daysAgo <= UPCOMING_THRESHOLD_DAYS) {
            return "Expired < 30 Days";
        }
        return "Expired " + daysAgo + " days ago";
    }

    private String formatUpcomingDetail(LocalDate expiryDate, LocalDate referenceDate) {
        if (expiryDate == null) {
            return "Expires soon";
        }
        long days = ChronoUnit.DAYS.between(referenceDate, expiryDate);
        if (days <= 0) {
            return "Expires today";
        }
        return "Expires in " + days + " days";
    }

    private boolean isActionItemStatus(ComplianceClassification classification) {
        return classification == ComplianceClassification.EXPIRED
                || classification == ComplianceClassification.UPCOMING
                || classification == ComplianceClassification.MISSING
                || classification == ComplianceClassification.PENDING;
    }

    private <T> List<T> paginate(List<T> items, int page, int pageSize) {
        if (items.isEmpty()) {
            return List.of();
        }
        int from = Math.min(page * pageSize, items.size());
        int to = Math.min(from + pageSize, items.size());
        if (from >= to) {
            return List.of();
        }
        return items.subList(from, to);
    }

    private ComplianceClassification classify(ComplianceDocs doc, LocalDate referenceDate) {
        if (doc == null) {
            return ComplianceClassification.MISSING;
        }
        DocStatus status = doc.getStatus();
        if (status == DocStatus.PENDING) {
            return ComplianceClassification.PENDING;
        }
        if (status == DocStatus.INVALID) {
            return ComplianceClassification.MISSING;
        }
        LocalDate expiry = doc.getExpiryDate();
        if (expiry == null) {
            return ComplianceClassification.COMPLIANT;
        }
        if (expiry.isBefore(referenceDate)) {
            return ComplianceClassification.EXPIRED;
        }
        long daysUntil = ChronoUnit.DAYS.between(referenceDate, expiry);
        if (daysUntil <= UPCOMING_THRESHOLD_DAYS) {
            return ComplianceClassification.UPCOMING;
        }
        return ComplianceClassification.COMPLIANT;
    }

    private SummaryBucket mapToSummaryBucket(ComplianceClassification classification) {
        return switch (classification) {
            case COMPLIANT -> SummaryBucket.COMPLIANT;
            case UPCOMING -> SummaryBucket.UPCOMING;
            case EXPIRED -> SummaryBucket.EXPIRED;
            case MISSING, PENDING -> SummaryBucket.MISSING;
        };
    }

    private List<AssignmentContext> loadAssignmentContexts() throws HSException {
        List<EmpEmailPosResponse> employees = Optional.ofNullable(hrmsClient.getAllEmployeesWithEmailAndPosition())
                .orElse(List.of());
        if (employees.isEmpty()) {
            return List.of();
        }

        Map<Long, EmpEmailPosResponse> employeesById = employees.stream()
                .filter(emp -> emp.getId() != null && emp.getPositionId() != null)
                .collect(Collectors.toMap(EmpEmailPosResponse::getId, emp -> emp, (left, right) -> left));

        if (employeesById.isEmpty()) {
            return List.of();
        }

        List<Long> positionIds = employeesById.values().stream()
                .map(EmpEmailPosResponse::getPositionId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (positionIds.isEmpty()) {
            return List.of();
        }

        List<RequirementAssignmentSummary> assignments = Optional
                .ofNullable(positionAssignmentRepository.findByPositionIdIn(positionIds))
                .orElse(List.of());
        if (assignments.isEmpty()) {
            return List.of();
        }

        Map<Long, List<RequirementAssignmentSummary>> assignmentsByPosition = assignments.stream()
                .collect(Collectors.groupingBy(RequirementAssignmentSummary::positionId));

        Set<Long> employeesWithAssignments = employeesById.values().stream()
                .filter(emp -> assignmentsByPosition.containsKey(emp.getPositionId()))
                .map(EmpEmailPosResponse::getId)
                .collect(Collectors.toSet());

        if (employeesWithAssignments.isEmpty()) {
            return List.of();
        }

        Set<Long> requirementIds = assignments.stream()
                .map(RequirementAssignmentSummary::requirementId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(HashSet::new));

        List<ComplianceDocs> documents;
        if (requirementIds.isEmpty()) {
            documents = List.of();
        } else {
            documents = Optional.ofNullable(complianceDocsRepository.findByEmployeeIdInAndRequirementIdIn(
                    new ArrayList<>(employeesWithAssignments), new ArrayList<>(requirementIds)))
                    .orElse(List.of());
        }

        Map<EmployeeRequirementKey, ComplianceDocs> latestDocumentByKey = selectLatestDocuments(documents);

        List<AssignmentContext> contexts = new ArrayList<>();
        for (EmpEmailPosResponse employee : employeesById.values()) {
            List<RequirementAssignmentSummary> employeeAssignments = assignmentsByPosition
                    .get(employee.getPositionId());
            if (employeeAssignments == null || employeeAssignments.isEmpty()) {
                continue;
            }
            for (RequirementAssignmentSummary assignment : employeeAssignments) {
                EmployeeRequirementKey key = new EmployeeRequirementKey(employee.getId(), assignment.requirementId());
                contexts.add(new AssignmentContext(employee, assignment, latestDocumentByKey.get(key)));
            }
        }

        return contexts;
    }

    private Map<EmployeeRequirementKey, ComplianceDocs> selectLatestDocuments(List<ComplianceDocs> documents) {
        if (documents == null || documents.isEmpty()) {
            return Map.of();
        }
        Map<EmployeeRequirementKey, ComplianceDocs> latestByKey = new HashMap<>();
        for (ComplianceDocs doc : documents) {
            if (doc.getEmployeeId() == null || doc.getRequirement() == null
                    || doc.getRequirement().getId() == null) {
                continue;
            }
            EmployeeRequirementKey key = new EmployeeRequirementKey(doc.getEmployeeId(),
                    doc.getRequirement().getId());
            ComplianceDocs existing = latestByKey.get(key);
            if (existing == null || isLater(doc, existing)) {
                latestByKey.put(key, doc);
            }
        }
        return latestByKey;
    }

    private ComplianceDocs findLatestDocument(Long employeeId, Long requirementId) {
        List<ComplianceDocs> documents = complianceDocsRepository.findByEmployeeIdAndRequirementId(employeeId,
                requirementId);
        return documents.stream()
                .filter(doc -> doc.getStatus() != null)
                .max(Comparator.comparing(this::referenceTime))
                .orElse(null);
    }

    private boolean isLater(ComplianceDocs candidate, ComplianceDocs baseline) {
        LocalDateTime candidateTime = referenceTime(candidate);
        LocalDateTime baselineTime = referenceTime(baseline);
        return candidateTime.isAfter(baselineTime);
    }

    private LocalDateTime referenceTime(ComplianceDocs doc) {
        return doc.getUpdatedAt() != null ? doc.getUpdatedAt() : doc.getCreatedAt();
    }

    private LocalDate extractDate(ComplianceDocs doc) {
        LocalDateTime timestamp = doc != null ? referenceTime(doc) : null;
        return timestamp != null ? timestamp.toLocalDate() : null;
    }

    private ComplianceDashboardActionItemsResponse emptyActionItemsResponse() {
        List<ComplianceDashboardStatusDTO> statuses = ComplianceClassification.actionItemOrder().stream()
                .map(classification -> new ComplianceDashboardStatusDTO(classification.code(), classification.label(), 0,
                        List.of()))
                .toList();
        return new ComplianceDashboardActionItemsResponse(statuses, OffsetDateTime.now(ZoneOffset.UTC));
    }

    private int resolvePage(Integer page) {
        return page != null && page >= 0 ? page : DEFAULT_PAGE;
    }

    private int resolvePageSize(Integer pageSize) {
        return pageSize != null && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
    }

    private String normaliseDepartment(String department) {
        return Optional.ofNullable(department).map(String::trim).filter(s -> !s.isEmpty()).orElse("Unknown");
    }

    private String safeId(Long id) {
        return id != null ? id.toString() : "";
    }

    private String safeRequirementId(Long id) {
        return id != null ? id.toString() : "unknown";
    }

    private Optional<String> resolveDepartmentName(Long departmentId) {
        if (departmentId == null) {
            return Optional.empty();
        }
        try {
            List<DepartmentNames> names = Optional
                    .ofNullable(hrmsClient.getDepartmentNames(List.of(departmentId)))
                    .orElse(List.of());
            return names.stream().findFirst().map(DepartmentNames::getName);
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private String normaliseFilterValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.toLowerCase(Locale.ROOT);
    }

    private String buildAlertEmailBody(EmpEmailPosResponse employee, RequirementAssignmentSummary assignment,
            ComplianceDocs doc, ComplianceClassification classification, String statusDetail) {
        String employeeName = Optional.ofNullable(employee.getName()).orElse("Team member");
        String requirementTitle = Optional.ofNullable(assignment.requirementTitle()).orElse("assigned requirement");
        String department = normaliseDepartment(employee.getDepartment());

        StringBuilder timeline = new StringBuilder();
        if (doc != null && doc.getExpiryDate() != null) {
            String label = classification == ComplianceClassification.EXPIRED ? "Expired on" : "Due on";
            timeline.append("<li><strong>").append(label).append(":</strong> ").append(doc.getExpiryDate()).append("</li>");
        }

        return """
                <html>
                <body style="font-family: Arial, sans-serif; color: #111827; background-color: #f9fafb; padding: 0; margin: 0;">
                  <div style="max-width: 640px; margin: 24px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08); overflow: hidden;">
                    <div style="padding: 24px 32px;">
                      <p style="margin: 0 0 16px 0;">Hello %s,</p>
                      <p style="margin: 0 0 16px 0;">This is a reminder for the compliance requirement <strong>%s</strong> assigned to your position in the <strong>%s</strong> department.</p>
                      <div style="margin: 24px 0; padding: 16px 20px; border-left: 4px solid #ef4444; background: #fef2f2; border-radius: 8px;">
                        <p style="margin: 0; font-weight: 600;">Status: %s</p>
                        <p style="margin: 8px 0 0 0; color: #b91c1c;">%s</p>
                      </div>
                      <ul style="padding: 0 0 0 20px; margin: 0 0 20px 0; color: #374151;">
                        %s
                      </ul>
                      <p style="margin: 0 0 16px 0;">Please review and update the required documentation as soon as possible to maintain compliance.</p>
                      <p style="margin: 0;">Thank you,<br/>Health &amp; Safety Compliance Team</p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(employeeName, requirementTitle, department, classification.label(), statusDetail,
                timeline.toString());
    }

    private enum SummaryBucket {
        COMPLIANT, UPCOMING, EXPIRED, MISSING
    }

    private enum ComplianceClassification {
        COMPLIANT("compliant", "Compliant"),
        UPCOMING("upcoming", "Upcoming Expiry"),
        EXPIRED("expired", "Expired"),
        MISSING("missing", "Missing"),
        PENDING("pending", "Pending Review");

        private final String code;
        private final String label;

        ComplianceClassification(String code, String label) {
            this.code = code;
            this.label = label;
        }

        public String code() {
            return code;
        }

        public String label() {
            return label;
        }

        public static List<ComplianceClassification> actionItemOrder() {
            return List.of(EXPIRED, UPCOMING, MISSING, PENDING);
        }
    }

    private record AssignmentContext(
            EmpEmailPosResponse employee,
            RequirementAssignmentSummary assignment,
            ComplianceDocs document) {
    }

    private record EmployeeRequirementKey(Long employeeId, Long requirementId) {
    }

    private static final class DepartmentAccumulator {
        private long compliant;
        private long upcoming;
        private long expired;
        private long missing;

        void increment(SummaryBucket bucket) {
            switch (bucket) {
                case COMPLIANT -> compliant++;
                case UPCOMING -> upcoming++;
                case EXPIRED -> expired++;
                case MISSING -> missing++;
                default -> throw new IllegalStateException("Unexpected bucket: " + bucket);
            }
        }

        ComplianceDashboardDepartmentDTO toDepartmentDTO(String departmentName) {
            return new ComplianceDashboardDepartmentDTO(departmentName, compliant, upcoming, expired, missing);
        }
    }
}
