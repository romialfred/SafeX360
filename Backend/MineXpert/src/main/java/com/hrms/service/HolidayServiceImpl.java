package com.hrms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hrms.dto.HolidayDTO;
import com.hrms.entity.Holiday;
import com.hrms.exception.HRMSException;
import com.hrms.repository.HolidayRepository;

@Service
@Transactional
public class HolidayServiceImpl implements HolidayService {

    @Autowired
    private HolidayRepository holidayRepository;

    @Override
    public void addHoliday(HolidayDTO holidayDTO) {
        holidayRepository.save(holidayDTO.toEntity());
    }

    @Override
    public HolidayDTO getHoliday(Long id) throws HRMSException {
        return holidayRepository.findById(id).orElseThrow(() -> new HRMSException("HOLIDAY_NOT_FOUND")).toDTO();
    }

    @Override
    public void updateHoliday(HolidayDTO holidayDTO) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'updateHoliday'");
    }

    @Override
    public List<HolidayDTO> getAllHolidays() {
        return ((List<Holiday>) holidayRepository.findAll()).stream().map(holiday -> holiday.toDTO()).toList();

    }

    @Override
    public void deleteHoliday(Long id) throws HRMSException {
        holidayRepository.deleteById(id);
    }

    @Override
    public HolidayDTO getNextHoliday() throws HRMSException {
        return holidayRepository.findNextHoliday().orElseThrow(() -> new HRMSException("NO_NEXT_HOLIDAY")).toDTO();
    }

    @Override
    public List<HolidayDTO> getNext4Holidays() {
        return ((List<Holiday>) holidayRepository.findNext4Holidays()).stream().map(holiday -> holiday.toDTO())
                .toList();
    }

}
