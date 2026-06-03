package com.hrms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.hrms.dto.HolidayDTO;
import com.hrms.entity.Holiday;
import com.hrms.exception.HRMSException;
import com.hrms.repository.HolidayRepository;

@Service
public class HolidayServiceImpl implements HolidayService {

    @Autowired
    private HolidayRepository holidayRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "holidaysAll", allEntries = true),
            @CacheEvict(cacheNames = "nextHoliday", allEntries = true),
            @CacheEvict(cacheNames = "next4Holidays", allEntries = true)
    })
    public void addHoliday(HolidayDTO holidayDTO) {
        holidayRepository.save(holidayDTO.toEntity());
    }

    @Override
    @Cacheable(cacheNames = "holidayById", key = "#id")
    public HolidayDTO getHoliday(Long id) throws HRMSException {
        return holidayRepository.findById(id).orElseThrow(() -> new HRMSException("HOLIDAY_NOT_FOUND")).toDTO();
    }

    @Override
    public void updateHoliday(HolidayDTO holidayDTO) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'updateHoliday'");
    }

    @Override
    @Cacheable(cacheNames = "holidaysAll")
    public List<HolidayDTO> getAllHolidays() {
        return ((List<Holiday>) holidayRepository.findAll()).stream().map(holiday -> holiday.toDTO()).toList();

    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "holidayById", key = "#id"),
            @CacheEvict(cacheNames = "holidaysAll", allEntries = true),
            @CacheEvict(cacheNames = "nextHoliday", allEntries = true),
            @CacheEvict(cacheNames = "next4Holidays", allEntries = true)
    })
    public void deleteHoliday(Long id) throws HRMSException {
        holidayRepository.deleteById(id);
    }

    @Override
    @Cacheable(cacheNames = "nextHoliday")
    public HolidayDTO getNextHoliday() throws HRMSException {
        return holidayRepository.findNextHoliday().orElseThrow(() -> new HRMSException("NO_NEXT_HOLIDAY")).toDTO();
    }

    @Override
    @Cacheable(cacheNames = "next4Holidays")
    public List<HolidayDTO> getNext4Holidays() {
        return ((List<Holiday>) holidayRepository.findNext4Holidays()).stream().map(holiday -> holiday.toDTO())
                .toList();
    }

}
