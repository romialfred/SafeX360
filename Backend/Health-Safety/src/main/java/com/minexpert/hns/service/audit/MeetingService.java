package com.minexpert.hns.service.audit;

import java.util.List;

import com.minexpert.hns.dto.audit.MeetingDTO;
import com.minexpert.hns.exception.HSException;

public interface MeetingService {
    public Long createMeeting(MeetingDTO meetingDTO) throws HSException;

    public List<Long> createMeetings(List<MeetingDTO> meetingDTOs, Long auditId) throws HSException;

    public MeetingDTO getMeetingById(Long id) throws HSException;

    public List<MeetingDTO> getMeetingsByAuditId(Long auditId) throws HSException;
}
