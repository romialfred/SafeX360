package com.hrms.service;

import java.util.List;

import com.hrms.dto.RosterDTO;
import com.hrms.exception.HRMSException;

public interface RosterService {
    public void addRoster(RosterDTO rosterDTO) throws HRMSException;
    public void updateRoster(RosterDTO rosterDTO) throws HRMSException;
    public RosterDTO getRoster(Long id) throws HRMSException;
    public void deleteRoster(Long id);
    public List<RosterDTO> getAllRosters();
}
