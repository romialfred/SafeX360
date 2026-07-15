package com.minexpert.hns.service.risks;

import com.minexpert.hns.dto.risks.*;
import com.minexpert.hns.entity.parameters.WorkProcess;
import com.minexpert.hns.entity.risks.Risk;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.risks.RiskRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class RiskServiceImpl implements RiskService {
        private final RiskRepository riskRepository;

        @Override
        @Caching(evict = {
                        // @CacheEvict(cacheNames = "riskById", allEntries = true),
                        @CacheEvict(cacheNames = "risksAll", allEntries = true),
                        @CacheEvict(cacheNames = "risksWithLevel", allEntries = true),
                        @CacheEvict(cacheNames = "riskSearch", allEntries = true),
                        @CacheEvict(cacheNames = "riskOverview", allEntries = true)
        })
        public RiskDTO create(RiskDTO dto) throws HSException {
                Risk risk = dto.toEntity();
                Risk saved = riskRepository.save(risk);
                return saved.toDTO();
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "riskById", allEntries = true),
                        @CacheEvict(cacheNames = "risksAll", allEntries = true),
                        @CacheEvict(cacheNames = "risksWithLevel", allEntries = true),
                        @CacheEvict(cacheNames = "riskSearch", allEntries = true),
                        @CacheEvict(cacheNames = "riskOverview", allEntries = true)
        })
        public RiskDTO update(RiskDTO dto, Long companyId) throws HSException {
                Risk existing = riskRepository.findById(dto.getId())
                                .orElseThrow(() -> new HSException("RISK_NOT_FOUND"));
                assertSameCompany(companyId, existing.getCompanyId());
                existing.setTitle(dto.getTitle());
                existing.setDescription(dto.getDescription());
                existing.setDepartmentId(dto.getDepartmentId());
                existing.setWorkProcess(new WorkProcess(dto.getWorkProcessId()));
                existing.setHazardSource(dto.getHazardSource());
                existing.setPotentialConsequences(dto.getPotentialConsequences());
                existing.setOwnerId(dto.getOwnerId());
                existing.setReviewDate(dto.getReviewDate());
                existing.setStatus(dto.getStatus());
                existing.setActivityType(dto.getActivityType());
                existing.setHazardCategory(dto.getHazardCategory());
                existing.setPersonsExposed(dto.getPersonsExposed());
                existing.setExposureCount(dto.getExposureCount());
                existing.setLegalRequirements(dto.getLegalRequirements());
                existing.setNextReviewDate(dto.getNextReviewDate());
                Risk updated = riskRepository.save(existing);
                return updated.toDTO();
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "riskById", allEntries = true),
                        @CacheEvict(cacheNames = "risksAll", allEntries = true),
                        @CacheEvict(cacheNames = "risksWithLevel", allEntries = true),
                        @CacheEvict(cacheNames = "riskSearch", allEntries = true),
                        @CacheEvict(cacheNames = "riskOverview", allEntries = true)
        })
        public RiskDTO updateStatus(Long id, String status, Long companyId) throws HSException {
                Risk risk = riskRepository.findById(id)
                                .orElseThrow(() -> new HSException("RISK_NOT_FOUND"));
                assertSameCompany(companyId, risk.getCompanyId());
                assertRiskStatus(status);
                risk.setStatus(status);
                riskRepository.save(risk);
                return risk.toDTO();
        }

        /**
         * Cloisonnement par mine : si un companyId est fourni (appel utilisateur),
         * l'entité doit lui appartenir. companyId null = appel système / toutes mines.
         */
        private void assertSameCompany(Long companyId, Long entityCompanyId) throws HSException {
                if (companyId != null && !companyId.equals(entityCompanyId)) {
                        throw new HSException("RISK_NOT_FOUND");
                }
        }

        private static final Set<String> VALID_RISK_STATUSES = Set.of(
                        "IDENTIFIED", "ASSESSED", "MITIGATED", "ACCEPTED", "CLOSED", "MONITORING");

        private void assertRiskStatus(String status) throws HSException {
                if (status == null || !VALID_RISK_STATUSES.contains(status.toUpperCase())) {
                        throw new HSException("INVALID_RISK_STATUS");
                }
        }

        @Override
        @Cacheable(cacheNames = "riskById", key = "{#id, #companyId}")
        public RiskDTO getById(Long id, Long companyId) throws HSException {
                Risk risk = riskRepository.findById(id)
                                .orElseThrow(() -> new HSException("RISK_NOT_FOUND"));
                assertSameCompany(companyId, risk.getCompanyId());
                return risk.toDTO();
        }

        @Override
        @Cacheable(cacheNames = "risksAll", key = "#companyId != null ? #companyId : 'ALL'")
        public List<RiskDTO> getAll(Long companyId) throws HSException {
                return riskRepository.findAllByCompany(companyId)
                                .stream()
                                .map(Risk::toDTO)
                                .toList();
        }

        @Override
        @Cacheable(cacheNames = "risksWithLevel", key = "#companyId != null ? #companyId : 'ALL'")
        public List<RiskDTO> getAllWithRiskLevel(Long companyId) throws HSException {
                return riskRepository.findByRiskLevelIsNotNullAndCompany(companyId)
                                .stream()
                                .map(Risk::toDTO)
                                .toList();
        }

        @Override
        @Cacheable(cacheNames = "riskSearch", key = "{#status, #departmentId, #ownerId, #from, #to, #q, #companyId}")
        public List<RiskDTO> search(String status, Long departmentId, Long ownerId, LocalDate from, LocalDate to,
                        String q, Long companyId)
                        throws HSException {
                LocalDateTime fromDt = from != null ? from.atStartOfDay() : null;
                LocalDateTime toDt = to != null ? to.plusDays(1).atStartOfDay() : null; // exclusive upper bound
                List<Risk> risks = riskRepository.findByFilters(
                                normalize(status), departmentId, ownerId, fromDt, toDt, normalize(q), companyId);
                return risks.stream().map(Risk::toDTO).toList();
        }

        @Override
        @Cacheable(cacheNames = "riskOverview", key = "{#status, #departmentId, #ownerId, #from, #to, #q, #companyId}")
        public RiskOverviewResponse getOverview(String status, Long departmentId, Long ownerId, LocalDate from,
                        LocalDate to, String q, Long companyId) throws HSException {
                List<RiskDTO> items = search(status, departmentId, ownerId, from, to, q, companyId);

                OverviewMetrics metrics = buildMetrics(items);
                RiskMatrixResponse matrix = buildMatrix(items);
                Distributions distributions = buildDistributions(items);
                List<TrendPoint> monthly = buildTrends(items);

                return new RiskOverviewResponse(metrics, matrix, distributions, monthly);
        }

        private OverviewMetrics buildMetrics(List<RiskDTO> items) {
                int total = items.size();
                int open = (int) items.stream().filter(r -> "OPEN".equalsIgnoreCase(s(r.getStatus()))).count();
                int inProgress = (int) items.stream().filter(r -> "IN_PROGRESS".equalsIgnoreCase(s(r.getStatus())))
                                .count();
                int closed = (int) items.stream().filter(r -> "CLOSED".equalsIgnoreCase(s(r.getStatus()))).count();
                LocalDate today = LocalDate.now();
                int overdue = (int) items.stream()
                                .filter(r -> r.getReviewDate() != null && r.getReviewDate().isBefore(today)
                                                && !"CLOSED".equalsIgnoreCase(s(r.getStatus())))
                                .count();
                return new OverviewMetrics(total, open, inProgress, closed, overdue);
        }

        private RiskMatrixResponse buildMatrix(List<RiskDTO> items) {
                int[][] counts = new int[5][5];
                for (RiskDTO r : items) {
                        String level = r.getRiskLevel();
                        if (level != null && level.matches("^[1-5][1-5]$")) {
                                int p = Character.getNumericValue(level.charAt(0));
                                int s = Character.getNumericValue(level.charAt(1));
                                counts[p - 1][s - 1] += 1;
                        }
                }
                List<String> probLabels = List.of("Rare", "Unlikely", "Possible", "Likely", "Almost Certain");
                List<String> sevLabels = List.of("Negligible", "Minor", "Moderate", "Major", "Catastrophic");
                return new RiskMatrixResponse(counts, probLabels, sevLabels);
        }

        private Distributions buildDistributions(List<RiskDTO> items) {
                Map<String, Long> byLevelKey = items.stream()
                                .map(RiskDTO::getRiskLevel)
                                .filter(k -> k != null && k.matches("^[1-5][1-5]$"))
                                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

                Map<String, Long> byStatus = items.stream()
                                .map(r -> s(r.getStatus()))
                                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

                Map<String, Long> byDeptMap = items.stream()
                                .map(r -> r.getDepartmentId() == null ? "null" : String.valueOf(r.getDepartmentId()))
                                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
                List<DistributionItem> byDepartment = byDeptMap.entrySet().stream()
                                .map(e -> new DistributionItem(e.getKey(), null, e.getValue()))
                                .sorted(Comparator.comparingLong(DistributionItem::getCount).reversed())
                                .toList();

                Map<String, Long> byHazMap = items.stream()
                                .map(r -> {
                                        String hs = s(r.getHazardSource());
                                        return hs.isEmpty() ? "UNKNOWN" : hs;
                                })
                                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
                List<DistributionItem> byHazard = byHazMap.entrySet().stream()
                                .map(e -> new DistributionItem(e.getKey(), e.getKey(), e.getValue()))
                                .sorted(Comparator.comparingLong(DistributionItem::getCount).reversed())
                                .toList();

                return new Distributions(byLevelKey, byStatus, byDepartment, byHazard);
        }

        private List<TrendPoint> buildTrends(List<RiskDTO> items) {
                DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");

                Map<String, Long> totalByMonth = items.stream()
                                .filter(r -> r.getCreatedAt() != null)
                                .collect(Collectors.groupingBy(r -> r.getCreatedAt().format(fmt),
                                                Collectors.counting()));

                Map<String, Long> closedByMonth = items.stream()
                                .filter(r -> r.getCreatedAt() != null)
                                .filter(r -> "CLOSED".equalsIgnoreCase(s(r.getStatus())))
                                .collect(Collectors.groupingBy(r -> r.getCreatedAt().format(fmt),
                                                Collectors.counting()));

                Map<String, Long> openByMonth = items.stream()
                                .filter(r -> r.getCreatedAt() != null)
                                .filter(r -> !"CLOSED".equalsIgnoreCase(s(r.getStatus())))
                                .collect(Collectors.groupingBy(r -> r.getCreatedAt().format(fmt),
                                                Collectors.counting()));

                // sort months ascending using YearMonth
                List<String> months = totalByMonth.keySet().stream()
                                .map(YearMonth::parse)
                                .sorted()
                                .map(YearMonth::toString)
                                .toList();

                List<TrendPoint> points = new ArrayList<>();
                for (String m : months) {
                        long total = totalByMonth.getOrDefault(m, 0L);
                        long open = openByMonth.getOrDefault(m, 0L);
                        long closed = closedByMonth.getOrDefault(m, 0L);
                        points.add(new TrendPoint(m, total, open, closed));
                }
                return points;
        }

        private static String s(String v) {
                return v == null ? "" : v;
        }

        private static String normalize(String v) {
                return v == null || v.isBlank() ? null : v;
        }
}
