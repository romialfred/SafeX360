package com.minexpert.hns.service.compliance;

import java.util.List;

import com.minexpert.hns.dto.compliance.AssignReqResponse;
import com.minexpert.hns.dto.compliance.AssignmentRequest;
import com.minexpert.hns.dto.compliance.AssignmentResponse;
import com.minexpert.hns.dto.compliance.PosRequirement;
import com.minexpert.hns.dto.compliance.ReqResponse;
import com.minexpert.hns.exception.HSException;

public interface PositionAssignmentService {

    public Long createPositionAssignment(AssignmentRequest request) throws HSException;

    public void deletePositionAssignment(Long id) throws HSException;

    public List<AssignmentResponse> getAllPositionAssignments() throws HSException;

    public void activatePositionAssignment(Long id) throws HSException;

    public void deactivatePositionAssignment(Long id) throws HSException;

    public AssignReqResponse getPositionAssignmentByPositionId(Long positionId) throws HSException;

    public List<PosRequirement> getRequirementIdsByPositionIds(List<Long> positions) throws HSException;

    public List<ReqResponse> getRequiremenDetailsByPositionId(Long positionId) throws HSException;
}
