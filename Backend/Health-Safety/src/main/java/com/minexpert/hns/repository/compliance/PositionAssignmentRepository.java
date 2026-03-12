package com.minexpert.hns.repository.compliance;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.dto.compliance.AssignRequirement;
import com.minexpert.hns.dto.compliance.ReqResponse;
import com.minexpert.hns.dto.compliance.dashboard.RequirementAssignmentSummary;
import com.minexpert.hns.entity.compliance.PositionAssignment;

public interface PositionAssignmentRepository extends CrudRepository<PositionAssignment, Long> {
    Optional<PositionAssignment> findByPositionIdAndRequirement_Id(Long positionId, Long requirementId);

    Integer countByPositionId(Long positionId);

    @Query("Select a.id as id, a.requirement.title as title, a.requirement.description as description, a.requirement.category as category, a.requirement.renewalFrequency as renewalFrequency, a.requirement.docType as docType,  a.status as status from PositionAssignment a where a.positionId = :positionId")
    List<AssignRequirement> findByPositionId(Long positionId);

    @Query("SELECT a.requirement.id FROM PositionAssignment a WHERE a.positionId = :positionId")
    List<Long> findRequirementIdsByPositionId(Long positionId);

    @Query("SELECT new com.minexpert.hns.dto.compliance.ReqResponse(a.id, a.requirement.title, a.requirement.category, null, null, null,null) FROM PositionAssignment a WHERE a.positionId = :positionId")
    List<ReqResponse> findRequirementDetailsByPositionId(Long positionId);

    @Query("""
            SELECT new com.minexpert.hns.dto.compliance.dashboard.RequirementAssignmentSummary(
                a.id,
                a.positionId,
                a.requirement.id,
                a.requirement.title,
                a.requirement.description,
                a.requirement.category,
                a.requirement.renewalFrequency,
                a.requirement.docType,
                a.status
            )
            FROM PositionAssignment a
            WHERE a.positionId IN :positionIds AND a.status = com.minexpert.hns.enums.Status.ACTIVE
            """)
    List<RequirementAssignmentSummary> findByPositionIdIn(List<Long> positionIds);

    @Query("""
            SELECT new com.minexpert.hns.dto.compliance.dashboard.RequirementAssignmentSummary(
                a.id,
                a.positionId,
                a.requirement.id,
                a.requirement.title,
                a.requirement.description,
                a.requirement.category,
                a.requirement.renewalFrequency,
                a.requirement.docType,
                a.status
            )
            FROM PositionAssignment a
            WHERE a.positionId = :positionId
                AND a.requirement.id = :requirementId
                AND a.status = com.minexpert.hns.enums.Status.ACTIVE
            """)
    Optional<RequirementAssignmentSummary> findActiveSummaryByPositionAndRequirement(Long positionId,
            Long requirementId);

}
