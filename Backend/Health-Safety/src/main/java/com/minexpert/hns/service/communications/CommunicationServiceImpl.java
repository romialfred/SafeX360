package com.minexpert.hns.service.communications;

import com.minexpert.hns.dto.communications.CommTimeDTO;
import com.minexpert.hns.dto.communications.CommunicationDTO;
import com.minexpert.hns.dto.communications.CommunicationStatsDTO;
import com.minexpert.hns.entity.communications.CommStatus;
import com.minexpert.hns.entity.communications.CommTime;
import com.minexpert.hns.entity.communications.Communication;
import com.minexpert.hns.entity.communications.ScheduleType;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.communications.CommTimeRepository;
import com.minexpert.hns.repository.communications.CommunicationRepository;
import com.minexpert.hns.repository.communications.projection.CommunicationSummaryView;
import com.minexpert.hns.service.MediaService;
import com.minexpert.hns.utility.StringListConverter;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommunicationServiceImpl implements CommunicationService {
    private final CommunicationRepository communicationRepository;
    private final CommTimeRepository commTimeRepository;
    private final CommTimeInitService commTimeInitService;
    private final MediaService mediaService;

    @Override
    @Transactional
    public CommunicationDTO create(CommunicationDTO dto) throws HSException {
        Communication comm = dto.toEntity();
        if (dto.getAttachments() != null && !dto.getAttachments().isEmpty()) {
            comm.setAttachments(mediaService.saveAllMedia(dto.getAttachments()));
        }
        Communication saved = communicationRepository.save(comm);
        CommTimeDTO scheduleRequest = dto.getSchedule();
        boolean hasSchedule = scheduleRequest != null && scheduleRequest.hasSchedule();

        CommTime schedule = hasSchedule ? persistSchedule(scheduleRequest, saved) : null;
        CommTimeDTO immediateSchedule = null;
        if (!hasSchedule) {
            immediateSchedule = sendNow(saved.getId());
        }

        CommunicationDTO response = mapToDto(saved, schedule);
        if (immediateSchedule != null) {
            response.setSchedule(immediateSchedule);
        }
        return response;
    }

    @Override
    @Transactional
    public CommunicationDTO update(CommunicationDTO dto) throws HSException {
        Communication existing = communicationRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("COMM_NOT_FOUND"));

        Communication updated = dto.toEntity();

        updated.setId(existing.getId());
        updated.setCreatedAt(existing.getCreatedAt());
        updated.setExpiresAt(existing.getExpiresAt());
        if (dto.getAttachments() != null && !dto.getAttachments().isEmpty()) {
            updated.setAttachments(mediaService.saveAllMedia(dto.getAttachments()));
        }
        Communication saved = communicationRepository.save(updated);

        CommTime schedule = persistSchedule(dto.getSchedule(), saved);

        return mapToDto(saved, schedule);
    }

    @Override
    public CommunicationDTO getById(Long id) throws HSException {
        Communication comm = communicationRepository.findById(id)
                .orElseThrow(() -> new HSException("COMM_NOT_FOUND"));
        CommTime schedule = commTimeRepository.findByCommunicationId(comm.getId()).orElse(null);
        return mapToDto(comm, schedule);
    }

    @Override
    public List<CommunicationSummaryView> getAll() throws HSException {
        return communicationRepository.findAllSummaries();
    }

    @Override
    public List<CommunicationSummaryView> getRecentSummaries(int limit) throws HSException {
        int size = limit > 0 ? limit : 5;
        return communicationRepository.findSummaries(PageRequest.of(0, size));
    }

    @Override
    public List<CommunicationDTO> getByDepartmentId(Long departmentId) throws HSException {
        List<Communication> communications = communicationRepository.findByDepartmentId(departmentId);
        return mapToDtos(communications);
    }

    @Override
    public CommunicationStatsDTO getCounts() throws HSException {
        List<CommunicationStatsDTO.TypeCount> byType = communicationRepository.countByType()
                .stream()
                .map(view -> new CommunicationStatsDTO.TypeCount(view.getType(), view.getTotal()))
                .toList();

        List<CommunicationStatsDTO.CategoryCount> byCategory = communicationRepository.countByCategory()
                .stream()
                .map(view -> new CommunicationStatsDTO.CategoryCount(view.getCategory(), view.getTotal()))
                .toList();

        List<CommunicationStatsDTO.DepartmentCount> byDepartment = communicationRepository.countByDepartment()
                .stream()
                .map(view -> new CommunicationStatsDTO.DepartmentCount(view.getDepartmentId(), view.getTotal()))
                .toList();

        return new CommunicationStatsDTO(byType, byCategory, byDepartment);
    }

    @Override
    @Transactional
    public CommunicationDTO resumeSchedule(Long communicationId) throws HSException {
        CommTime commTime = commTimeRepository.findByCommunicationId(communicationId)
                .orElseThrow(() -> new HSException("COMM_SCHEDULE_NOT_FOUND"));

        CommTime reactivated = commTimeInitService.initializeAndActivate(commTime);
        return mapToDto(reactivated.getCommunication(), reactivated);
    }

    @Override
    @Transactional
    public CommunicationDTO pauseSchedule(Long communicationId) throws HSException {
        CommTime commTime = commTimeRepository.findByCommunicationId(communicationId)
                .orElseThrow(() -> new HSException("COMM_SCHEDULE_NOT_FOUND"));

        commTime.setStatus(CommStatus.PAUSED);
        commTime.setNextRunAt(null);
        CommTime saved = commTimeRepository.save(commTime);
        return mapToDto(saved.getCommunication(), saved);
    }

    @Override
    @Transactional
    public CommunicationDTO cancelSchedule(Long communicationId) throws HSException {
        CommTime commTime = commTimeRepository.findByCommunicationId(communicationId)
                .orElseThrow(() -> new HSException("COMM_SCHEDULE_NOT_FOUND"));

        commTime.setStatus(CommStatus.CANCELLED);
        commTime.setNextRunAt(null);
        CommTime saved = commTimeRepository.save(commTime);
        return mapToDto(saved.getCommunication(), saved);
    }

    @Override
    @Transactional
    public CommTimeDTO sendNow(Long communicationId) throws HSException {
        Communication communication = communicationRepository.findById(communicationId)
                .orElseThrow(() -> new HSException("COMM_NOT_FOUND"));

        Optional<CommTime> existing = commTimeRepository.findByCommunicationId(communicationId);

        CommTime saved;
        if (existing.isPresent()) {
            CommTime commTime = existing.get();
            commTime.setStatus(CommStatus.ACTIVE);
            commTime.setNextRunAt(Instant.now());
            saved = commTimeRepository.save(commTime);
        } else {
            CommTime commTime = new CommTime();
            commTime.setCommunication(communication);
            commTime.setScheduleType(ScheduleType.ONE_TIME);
            commTime.setOneTimeAt(LocalDateTime.now());
            saved = commTimeInitService.initializeAndActivate(commTime);
        }

        return CommTimeDTO.fromEntity(saved);
    }

    private CommTime persistSchedule(CommTimeDTO scheduleDto, Communication communication) {
        if (scheduleDto == null || !scheduleDto.hasSchedule()) {
            return null;
        }

        Optional<CommTime> existing = commTimeRepository.findByCommunicationId(communication.getId());
        CommTime commTime = existing.orElseGet(scheduleDto::toEntity);
        scheduleDto.applyTo(commTime);
        commTime.setCommunication(communication);

        return commTimeInitService.initializeAndActivate(commTime);
    }

    private List<CommunicationDTO> mapToDtos(List<Communication> communications) {
        if (communications.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> communicationIds = communications.stream()
                .map(Communication::getId)
                .toList();

        Map<Long, CommTime> schedules = commTimeRepository.findByCommunicationIdIn(communicationIds)
                .stream()
                .collect(Collectors.toMap(ct -> ct.getCommunication().getId(), Function.identity()));

        return communications.stream()
                .map(comm -> mapToDto(comm, schedules.get(comm.getId())))
                .toList();
    }

    private CommunicationDTO mapToDto(Communication communication, CommTime schedule) {
        CommunicationDTO dto = communication.toDTO();

        String attachmentIds = communication.getAttachments();
        if (StringUtils.hasText(attachmentIds)) {
            List<Long> ids = StringListConverter.convertToLongList(attachmentIds);
            if (ids != null && !ids.isEmpty()) {
                dto.setAttachments(mediaService.getAllMediaByArray(attachmentIds));
            }
        }

        dto.setSchedule(CommTimeDTO.fromEntity(schedule));
        return dto;
    }
}
