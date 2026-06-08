package com.minexpert.hns.blast.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.blast.dto.BlastDashboardDTO;
import com.minexpert.hns.blast.dto.BlastDashboardDTO.DashboardKpis;
import com.minexpert.hns.blast.dto.BlastDashboardDTO.NextBlastSummary;
import com.minexpert.hns.blast.dto.BlastDashboardDTO.NotificationsState;
import com.minexpert.hns.blast.dto.BlastListItemDTO;
import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.entity.BlastPlan;
import com.minexpert.hns.blast.entity.BlastStatusEvent;
import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.enums.JobStatus;
import com.minexpert.hns.blast.repository.BlastNotificationJobRepository;
import com.minexpert.hns.blast.repository.BlastPlanRepository;
import com.minexpert.hns.blast.repository.BlastRepository;
import com.minexpert.hns.blast.repository.BlastStatusEventRepository;

import lombok.RequiredArgsConstructor;

/**
 * Implementation du service de tableau de bord (P7).
 *
 * <p>Strategie de calcul :
 * <ul>
 *   <li><b>Fenetre "aujourd'hui"</b> : [00:00, 23:59:59.999] du jour systeme.</li>
 *   <li><b>Fenetre "cette semaine"</b> : [now, now+7 jours].</li>
 *   <li><b>Fenetre "ce mois"</b> : du 1er du mois courant au 1er du mois suivant.</li>
 *   <li><b>Prochain tir CONFIRMED</b> : tir le plus proche au statut CONFIRMED
 *       ou IMMINENT, dans le futur ou en cours.</li>
 *   <li><b>Taux a l'heure</b> : tirs FIRED du mois dont le {@code scheduledAt}
 *       est dans la fenetre +/-15 min autour de la transition vers FIRED
 *       enregistree dans {@code blast_status_event}.</li>
 * </ul>
 *
 * <p>Tolerance aux donnees manquantes : si un agregat ne peut etre calcule
 * (ex. aucun BlastPlan rattache, aucune transition tracee), on retourne 0 /
 * liste vide / null — pas d'exception.
 */
@Service
@RequiredArgsConstructor
public class BlastDashboardServiceImpl implements BlastDashboardService {

    /** Tolerance "a l'heure" : +/-15 minutes autour de {@code scheduledAt}. */
    private static final long ON_TIME_TOLERANCE_MIN = 15L;

    /** Plafond du nombre de tirs hebdomadaires renvoyes dans la liste. */
    private static final int MAX_UPCOMING_WEEK = 10;

    /** Plafond des derniers tirs cloturés renvoyes. */
    private static final int MAX_LAST_FINISHED = 5;

    private final BlastRepository blastRepository;
    private final BlastPlanRepository blastPlanRepository;
    private final BlastNotificationJobRepository jobRepository;
    private final BlastStatusEventRepository statusEventRepository;

    @Override
    @Transactional(readOnly = true)
    public BlastDashboardDTO getSummary(Long mineId) {
        if (mineId == null) {
            throw new IllegalArgumentException("mineId is required");
        }
        final LocalDateTime now = LocalDateTime.now();
        final LocalDate today = now.toLocalDate();
        final LocalDateTime startOfToday = today.atStartOfDay();
        final LocalDateTime endOfToday = today.atTime(LocalTime.MAX);
        final LocalDateTime weekEnd = now.plusDays(7);
        final LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        final LocalDateTime endOfMonth = startOfMonth.plusMonths(1);

        // ────── 1. Tirs du jour ──────
        List<BlastListItemDTO> upcomingToday = blastRepository
                .findActiveBlastsToday(mineId, startOfToday, endOfToday)
                .stream()
                .sorted(Comparator.comparing(Blast::getScheduledAt))
                .map(this::toListItem)
                .toList();

        // ────── 2. Tirs sur les 7 prochains jours (CONFIRMED + IMMINENT + PLANNED) ──────
        List<Blast> upcomingWeekAll = blastRepository.findScheduledBetween(
                mineId, now, weekEnd,
                List.of(BlastStatus.PLANNED, BlastStatus.CONFIRMED, BlastStatus.IMMINENT));
        int upcomingWeekCount = upcomingWeekAll.size();
        List<BlastListItemDTO> upcomingWeek = upcomingWeekAll.stream()
                .limit(MAX_UPCOMING_WEEK)
                .map(this::toListItem)
                .toList();

        // ────── 3. Prochain tir CONFIRMED / IMMINENT ──────
        NextBlastSummary nextSummary = upcomingWeekAll.stream()
                .filter(b -> b.getStatus() == BlastStatus.CONFIRMED
                        || b.getStatus() == BlastStatus.IMMINENT)
                .findFirst()
                .map(b -> buildNextSummary(b, now))
                .orElse(null);

        // ────── 4. Repartition par statut sur le mois ──────
        Map<BlastStatus, Integer> breakdown = computeStatusBreakdown(mineId, startOfMonth, endOfMonth);

        // ────── 5. Etat des notifications du mois ──────
        NotificationsState notifications = NotificationsState.builder()
                .sent((int) jobRepository.countByMineAndStatusAndWindow(
                        mineId, JobStatus.SENT, startOfMonth, endOfMonth))
                .scheduled((int) jobRepository.countByMineAndStatusAndWindow(
                        mineId, JobStatus.SCHEDULED, startOfMonth, endOfMonth))
                .failed((int) jobRepository.countByMineAndStatusAndWindow(
                        mineId, JobStatus.FAILED, startOfMonth, endOfMonth))
                .build();

        // ────── 6. Derniers tirs cloturés (ALL_CLEAR / CANCELLED) ──────
        List<BlastListItemDTO> lastFinished = blastRepository
                .findByMineIdAndStatusIn(mineId,
                        List.of(BlastStatus.ALL_CLEAR, BlastStatus.CANCELLED, BlastStatus.FIRED))
                .stream()
                .sorted(Comparator.comparing(Blast::getScheduledAt).reversed())
                .limit(MAX_LAST_FINISHED)
                .map(this::toListItem)
                .toList();

        // ────── 7. KPI mois ──────
        DashboardKpis kpis = computeKpis(mineId, startOfMonth, endOfMonth, breakdown, upcomingToday.size());

        return BlastDashboardDTO.builder()
                .upcomingToday(upcomingToday)
                .upcomingThisWeek(upcomingWeek)
                .upcomingThisWeekCount(upcomingWeekCount)
                .nextConfirmedBlast(nextSummary)
                .statusBreakdown(breakdown)
                .notificationsState(notifications)
                .lastFinishedBlasts(lastFinished)
                .kpis(kpis)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Construit le NextBlastSummary pour un tir donne en calculant le delta
     * en secondes par rapport a {@code now}. Le delta peut etre negatif si le
     * tir est en cours.
     */
    private NextBlastSummary buildNextSummary(Blast b, LocalDateTime now) {
        long seconds = Duration.between(now, b.getScheduledAt()).getSeconds();
        String zone = Optional.ofNullable(b.getAlarmZoneScope())
                .filter(s -> !s.isBlank())
                .orElseGet(() -> Optional.ofNullable(b.getPit()).orElse(""));
        return NextBlastSummary.builder()
                .id(b.getId())
                .reference(b.getReference())
                .scheduledAt(b.getScheduledAt())
                .zone(zone)
                .secondsUntil(seconds)
                .status(b.getStatus())
                .build();
    }

    /**
     * Pre-remplit le breakdown avec 0 pour chaque statut puis compte les
     * tirs du mois courant via une seule passe.
     */
    private Map<BlastStatus, Integer> computeStatusBreakdown(Long mineId,
            LocalDateTime startOfMonth, LocalDateTime endOfMonth) {
        Map<BlastStatus, Integer> breakdown = new EnumMap<>(BlastStatus.class);
        for (BlastStatus s : BlastStatus.values()) {
            breakdown.put(s, 0);
        }
        // On prend tous les tirs avec scheduledAt dans la fenetre, indifferent du statut.
        List<Blast> all = blastRepository.findScheduledBetween(mineId, startOfMonth, endOfMonth,
                List.of(BlastStatus.values()));
        for (Blast b : all) {
            BlastStatus status = b.getStatus();
            breakdown.merge(status, 1, Integer::sum);
        }
        return breakdown;
    }

    /**
     * Construit les KPI du mois :
     *  - blastsThisMonth = somme du breakdown
     *  - totalExplosivesKg = somme de BlastPlan.explosiveQtyKg pour les tirs FIRED+ALL_CLEAR du mois
     *  - avgPowderFactor = moyenne BlastPlan.powderFactor pour les memes tirs
     *  - onTimeRate = % de tirs FIRED du mois realises dans +/-15 min de leur scheduledAt
     *  - misfireCount = breakdown.get(MISFIRE)
     *  - blastsToday = parametre (calcule en amont).
     */
    private DashboardKpis computeKpis(Long mineId, LocalDateTime startOfMonth,
            LocalDateTime endOfMonth, Map<BlastStatus, Integer> breakdown, int blastsToday) {
        int monthTotal = breakdown.values().stream().mapToInt(Integer::intValue).sum();
        int misfires = breakdown.getOrDefault(BlastStatus.MISFIRE, 0);

        // Tirs "realises" du mois (FIRED ou ALL_CLEAR)
        List<Blast> realised = blastRepository
                .findScheduledBetween(mineId, startOfMonth, endOfMonth,
                        List.of(BlastStatus.FIRED, BlastStatus.ALL_CLEAR));

        // Explosifs / charge specifique
        double totalKg = 0d;
        double pfSum = 0d;
        int pfCount = 0;
        for (Blast b : realised) {
            // Le plan est lazy : on le recupere via le repository pour eviter
            // toute lazy-load exception en dehors d'une vue.
            Optional<BlastPlan> planOpt = blastPlanRepository.findByBlastId(b.getId());
            if (planOpt.isPresent()) {
                BlastPlan plan = planOpt.get();
                Double qty = plan.getExplosiveQtyKg();
                if (qty != null && Double.isFinite(qty)) {
                    totalKg += qty;
                }
                Double pf = plan.getPowderFactor();
                if (pf != null && Double.isFinite(pf) && pf > 0d) {
                    pfSum += pf;
                    pfCount++;
                }
            }
        }
        double avgPowderFactor = pfCount > 0 ? round2(pfSum / pfCount) : 0d;

        // Taux a l'heure : on s'appuie sur le journal des transitions vers FIRED
        // dans la fenetre du mois. Chaque event est apparie a son blast pour
        // lire le scheduledAt et calculer le delta.
        double onTimeRate = computeOnTimeRate(startOfMonth, endOfMonth);

        return DashboardKpis.builder()
                .blastsThisMonth(monthTotal)
                .totalExplosivesKg(round2(totalKg))
                .avgPowderFactor(avgPowderFactor)
                .onTimeRate(onTimeRate)
                .misfireCount(misfires)
                .blastsToday(blastsToday)
                .build();
    }

    /**
     * Pour chaque transition vers FIRED dans la fenetre, on charge le tir
     * et on compare {@code at} a {@code scheduledAt}. Tolerance +/-15 min.
     * Si aucune transition : 0 %.
     */
    private double computeOnTimeRate(LocalDateTime from, LocalDateTime to) {
        List<BlastStatusEvent> firedEvents = statusEventRepository
                .findByToStatusAndAtBetween(BlastStatus.FIRED, from, to);
        if (firedEvents.isEmpty()) {
            return 0d;
        }
        int total = 0;
        int onTime = 0;
        // On dedoublonne par blastId : un tir peut avoir plusieurs evenements
        // FIRED si le journal en a recu (rare) — on garde le 1er.
        List<Long> seen = new ArrayList<>();
        for (BlastStatusEvent ev : firedEvents) {
            Long blastId = ev.getBlastId();
            if (seen.contains(blastId)) continue;
            seen.add(blastId);
            Optional<Blast> bOpt = blastRepository.findById(blastId);
            if (bOpt.isEmpty()) continue;
            Blast b = bOpt.get();
            if (b.getScheduledAt() == null) continue;
            total++;
            long deltaMin = Math.abs(ChronoUnit.MINUTES.between(b.getScheduledAt(), ev.getAt()));
            if (deltaMin <= ON_TIME_TOLERANCE_MIN) {
                onTime++;
            }
        }
        if (total == 0) return 0d;
        return round2((onTime * 100d) / total);
    }

    private static double round2(double v) {
        if (!Double.isFinite(v)) return 0d;
        return Math.round(v * 100d) / 100d;
    }

    private BlastListItemDTO toListItem(Blast b) {
        return BlastListItemDTO.builder()
                .id(b.getId())
                .reference(b.getReference())
                .scheduledAt(b.getScheduledAt())
                .timezone(b.getTimezone())
                .type(b.getType())
                .status(b.getStatus())
                .pit(b.getPit())
                .bench(b.getBench())
                .blasterId(b.getBlasterId())
                .hseLeadId(b.getHseLeadId())
                .mineId(b.getMineId())
                .build();
    }
}
