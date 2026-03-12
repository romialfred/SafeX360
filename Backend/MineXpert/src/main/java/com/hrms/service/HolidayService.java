package com.hrms.service;

import java.util.List;

import com.hrms.dto.HolidayDTO;
import com.hrms.exception.HRMSException;

public interface HolidayService {
    public void addHoliday(HolidayDTO holidayDTO);

    public HolidayDTO getHoliday(Long id) throws HRMSException;

    public void updateHoliday(HolidayDTO holidayDTO);

    public List<HolidayDTO> getAllHolidays();

    public void deleteHoliday(Long id) throws HRMSException;

    public HolidayDTO getNextHoliday() throws HRMSException;

    public List<HolidayDTO> getNext4Holidays();
}
