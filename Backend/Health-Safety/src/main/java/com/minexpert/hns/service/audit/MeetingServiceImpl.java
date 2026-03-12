package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.audit.MeetingDTO;
import com.minexpert.hns.entity.audit.Meeting;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.MeetingRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MeetingServiceImpl implements MeetingService {
    private final MeetingRepository meetingRepository;

    @Override
    public Long createMeeting(MeetingDTO meetingDTO) throws HSException {
        meetingDTO.setCreatedAt(LocalDateTime.now());
        meetingDTO.setUpdatedAt(LocalDateTime.now());
        return meetingRepository.save(meetingDTO.toEntity()).getId();
    }

    @Override
    public List<Long> createMeetings(List<MeetingDTO> meetingDTOs, Long auditId) throws HSException {
        meetingDTOs.forEach(meetingDTO -> {
            meetingDTO.setCreatedAt(LocalDateTime.now());
            meetingDTO.setUpdatedAt(LocalDateTime.now());
            meetingDTO.setAuditId(auditId);
        });
        return ((List<Meeting>) meetingRepository.saveAll(meetingDTOs.stream().map(MeetingDTO::toEntity).toList()))
                .stream()
                .map(Meeting::getId)
                .toList();
    }

    @Override
    public MeetingDTO getMeetingById(Long id) throws HSException {
        return meetingRepository.findById(id).orElseThrow(() -> new HSException("MEETING_NOT_FOUND")).toDTO();
    }

    @Override
    public List<MeetingDTO> getMeetingsByAuditId(Long auditId) throws HSException {
        return ((List<Meeting>) meetingRepository.findByAudit_Id(auditId)).stream()
                .map(Meeting::toDTO)
                .toList();
    }

}
