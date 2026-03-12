package com.minexpert.hns.service.compliance;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.compliance.AssignReqResponse;
import com.minexpert.hns.dto.compliance.AssignRequirement;
import com.minexpert.hns.dto.compliance.AssignmentRequest;
import com.minexpert.hns.dto.compliance.AssignmentResponse;
import com.minexpert.hns.dto.compliance.PosRequirement;
import com.minexpert.hns.dto.compliance.ReqResponse;
import com.minexpert.hns.dto.request.PositionResponse;
import com.minexpert.hns.entity.compliance.PositionAssignment;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.compliance.PositionAssignmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PositionAssignmentServiceImpl implements PositionAssignmentService {

    private final PositionAssignmentRepository positionAssignmentRepository;

    private final HrmsClient hrmsClient;

    @Override
    public Long createPositionAssignment(AssignmentRequest request) throws HSException {
        Optional<PositionAssignment> opt = positionAssignmentRepository
                .findByPositionIdAndRequirement_Id(request.getPositionId(), request.getRequirementId());
        if (opt.isPresent()) {
            throw new HSException("POSITION_ASSIGNMENT_ALREADY_EXISTS");
        }
        return positionAssignmentRepository.save(request.toEntity()).getId();
    }

    @Override
    public void deletePositionAssignment(Long id) throws HSException {
        positionAssignmentRepository.deleteById(id);
    }

    @Override
    public List<AssignmentResponse> getAllPositionAssignments() throws HSException {
        List<PositionResponse> positions = hrmsClient.getAllPositionNames();
        return positions.parallelStream()
                .map(position -> {
                    Integer count = positionAssignmentRepository.countByPositionId(position.getId());
                    return new AssignmentResponse(position.getId(), position.getName(), count);
                }).toList();
    }

    @Override
    public void activatePositionAssignment(Long id) throws HSException {

        PositionAssignment assignment = positionAssignmentRepository.findById(id)
                .orElseThrow(() -> new HSException("POSITION_ASSIGNMENT_NOT_FOUND"));
        assignment.setStatus(Status.ACTIVE);
        positionAssignmentRepository.save(assignment);
    }

    @Override
    public void deactivatePositionAssignment(Long id) throws HSException {
        PositionAssignment assignment = positionAssignmentRepository.findById(id)
                .orElseThrow(() -> new HSException("POSITION_ASSIGNMENT_NOT_FOUND"));
        assignment.setStatus(Status.INACTIVE);
        positionAssignmentRepository.save(assignment);
    }

    @Override
    public AssignReqResponse getPositionAssignmentByPositionId(Long positionId) throws HSException {
        PositionResponse position = hrmsClient.getPositionById(positionId);
        List<AssignRequirement> assignments = positionAssignmentRepository
                .findByPositionId(positionId);
        return new AssignReqResponse(position.getName(), position.getId(), assignments);
    }

    @Override
    public List<PosRequirement> getRequirementIdsByPositionIds(List<Long> positions) throws HSException {
        List<PosRequirement> ids = new ArrayList<>();
        positions.parallelStream().forEach(positionId -> {
            List<Long> requirementIds = positionAssignmentRepository
                    .findRequirementIdsByPositionId(positionId);
            ids.add(new PosRequirement(positionId, requirementIds));
        });
        return ids;
    }

    @Override
    public List<ReqResponse> getRequiremenDetailsByPositionId(Long positionId) throws HSException {
        return positionAssignmentRepository.findRequirementDetailsByPositionId(positionId);
    }

}
