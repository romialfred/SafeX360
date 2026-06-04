package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hrms.dto.RosterDTO;
import com.hrms.entity.Roster;
import com.hrms.exception.HRMSException;
import com.hrms.repository.RosterRepository;

@Service
@Transactional
public class RosterServiceImpl implements RosterService {

    @Autowired
    private RosterRepository rosterRepository;
    @Override
    public void addRoster(RosterDTO rosterDTO) throws HRMSException {
        if(rosterRepository.findByNameIgnoreCase(rosterDTO.getName()).isPresent())throw new HRMSException("ROSTER_ALREADY_EXISTS");
        rosterRepository.save(rosterDTO.toEntity());
    }
    @Override
    public void updateRoster(RosterDTO rosterDTO) throws HRMSException {
        rosterRepository.findById(rosterDTO.getId()).orElseThrow(()->new HRMSException("ROSTER_NOT_FOUND"));
        Optional<Roster> optional=rosterRepository.findByNameIgnoreCase(rosterDTO.getName());
        if(optional.isPresent() && !optional.get().getId().equals(rosterDTO.getId()))throw new  HRMSException("ROSTER_ALREADY_EXISTS");
       rosterRepository.save(rosterDTO.toEntity());
    }

    @Override
    public RosterDTO getRoster(Long id) throws HRMSException {
        return rosterRepository.findById(id).orElseThrow(()->new HRMSException("ROSTER_NOT_FOUND")).toDTO();
    }

    @Override
    public void deleteRoster(Long id) {
        rosterRepository.deleteById(id);
    }

    @Override
    public List<RosterDTO> getAllRosters() {
        return ((List<Roster>) rosterRepository.findAll()).stream().map((roster)->roster.toDTO()).toList();
    }
    
}
