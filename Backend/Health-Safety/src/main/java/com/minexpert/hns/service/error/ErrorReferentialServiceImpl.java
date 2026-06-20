package com.minexpert.hns.service.error;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.minexpert.hns.entity.error.ErrorCriticalityMatrix;
import com.minexpert.hns.entity.error.ErrorEventType;
import com.minexpert.hns.entity.error.ErrorProbability;
import com.minexpert.hns.entity.error.ErrorSeverity;
import com.minexpert.hns.repository.error.ErrorCriticalityMatrixRepository;
import com.minexpert.hns.repository.error.ErrorEventTypeRepository;
import com.minexpert.hns.repository.error.ErrorProbabilityRepository;
import com.minexpert.hns.repository.error.ErrorSeverityRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ErrorReferentialServiceImpl implements ErrorReferentialService {

    private final ErrorEventTypeRepository eventTypeRepository;
    private final ErrorSeverityRepository severityRepository;
    private final ErrorProbabilityRepository probabilityRepository;
    private final ErrorCriticalityMatrixRepository matrixRepository;

    @Override
    public List<ErrorEventType> listEventTypes(Long companyId) {
        return eventTypeRepository.findVisibleForCompany(companyId);
    }

    @Override
    public List<ErrorSeverity> listSeverities() {
        return severityRepository.findAllByOrderByLevelAsc();
    }

    @Override
    public List<ErrorProbability> listProbabilities() {
        return probabilityRepository.findAllByOrderByLevelAsc();
    }

    @Override
    public List<ErrorCriticalityMatrix> listCriticalityMatrix() {
        List<ErrorCriticalityMatrix> result = new ArrayList<>();
        matrixRepository.findAll().forEach(result::add);
        return result;
    }
}
