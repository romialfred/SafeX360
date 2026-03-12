package com.minexpert.hns.service.nonConformity;

import java.util.List;

import com.minexpert.hns.dto.nonConformity.EventRequestDTO;
import com.minexpert.hns.dto.nonConformity.NcInfo;
import com.minexpert.hns.dto.nonConformity.NonConformityDTO;
import com.minexpert.hns.exception.HSException;

import com.minexpert.hns.enums.EventStatus;

public interface NonConformityService {

    public Long addNonConformity(EventRequestDTO request) throws HSException;

    public Long createNonConformity(NonConformityDTO nonConformityDTO) throws HSException;

    public NonConformityDTO getNonConformityById(Long id) throws HSException;

    void updateNonConformityStatus(Long nonConformityId, EventStatus status) throws HSException;

    public List<NcInfo> getAllNcInfo() throws HSException;

    public NcInfo getNcInfoById(Long id) throws HSException;

    public void updateNonConformity(NonConformityDTO nonConformityDTO) throws HSException;

    public void updateEvent(EventRequestDTO request) throws HSException;

}
