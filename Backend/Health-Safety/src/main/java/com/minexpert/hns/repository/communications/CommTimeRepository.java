package com.minexpert.hns.repository.communications;

import com.minexpert.hns.entity.communications.CommStatus;
import com.minexpert.hns.entity.communications.CommTime;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CommTimeRepository extends JpaRepository<CommTime, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT c FROM CommTime c
        WHERE c.status = :active
          AND c.nextRunAt IS NOT NULL
          AND c.nextRunAt <= :cutoff
        ORDER BY c.nextRunAt ASC
        """)
    List<CommTime> findDueForRun(@Param("active") CommStatus active,
                                 @Param("cutoff") Instant cutoff,
                                 Pageable pageable);

    Optional<CommTime> findByCommunicationId(Long communicationId);

    List<CommTime> findByCommunicationIdIn(Collection<Long> communicationIds);
}
