package com.minexpert.hns.blast.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.blast.entity.BlastNotificationJob;
import com.minexpert.hns.blast.enums.JobStatus;
import com.minexpert.hns.blast.enums.JobType;

@Repository
public interface BlastNotificationJobRepository extends JpaRepository<BlastNotificationJob, Long> {

    List<BlastNotificationJob> findByBlastId(Long blastId);

    List<BlastNotificationJob> findByBlastIdAndStatus(Long blastId, JobStatus status);

    /**
     * Toutes les taches programmees a executer avant {@code cutoff} (utilise par
     * le scheduler P3 pour piocher la prochaine vague de notifications a envoyer).
     */
    @Query("SELECT j FROM BlastNotificationJob j WHERE j.status = :status "
            + "AND j.scheduledAt <= :cutoff ORDER BY j.scheduledAt ASC")
    List<BlastNotificationJob> findDueJobs(@Param("status") JobStatus status,
            @Param("cutoff") LocalDateTime cutoff);

    List<BlastNotificationJob> findByBlastIdAndType(Long blastId, JobType type);

    long countByBlastIdAndStatus(Long blastId, JobStatus status);
}
