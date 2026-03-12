package com.minexpert.hns.repository.nonConformity;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.dto.nonConformity.NcHistoryDTO;
import com.minexpert.hns.entity.nonConformity.NcHistory;

public interface NcHistoryRepository extends CrudRepository<NcHistory, Long> {
    @Query("SELECT new com.minexpert.hns.dto.nonConformity.NcHistoryDTO(" +
            "n.id, n.ownerId, n.date, n.status, n.comment, n.nonConformity.id, n.createdAt) " +
            "FROM NcHistory n WHERE n.nonConformity.id = ?1")
    List<NcHistoryDTO> findByNonConformityId(Long nonConformityId);
}
