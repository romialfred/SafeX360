package com.hrms.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.HolidayDTO;
import com.hrms.dto.ResponseDTO;
import com.hrms.entity.Holiday;
import com.hrms.exception.HRMSException;
import com.hrms.service.HolidayService;

import jakarta.validation.Valid;

@RestController
@CrossOrigin
@RequestMapping("/holiday")
@Validated
public class HolidayAPI {
    @Autowired
    private HolidayService holidayService;

    @PostMapping("/add")
    public ResponseEntity<ResponseDTO> addHoliday(@RequestBody @Valid HolidayDTO holidayDTO) throws HRMSException {
        holidayService.addHoliday(holidayDTO);
        return new ResponseEntity<>(new ResponseDTO("Holiday added Successfully."), HttpStatus.CREATED);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<HolidayDTO> getHoliday(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(holidayService.getHoliday(id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<HolidayDTO>> getAllHolidays() {
        return new ResponseEntity<>(holidayService.getAllHolidays(), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteHoliday(@PathVariable Long id) throws HRMSException {
        holidayService.deleteHoliday(id);
        return new ResponseEntity<>(new ResponseDTO("Holiday deleted Successfully."), HttpStatus.OK);
    }

    @GetMapping("/next")
    public ResponseEntity<HolidayDTO> getNextHoliday() throws HRMSException {
        HolidayDTO nextHoliday = holidayService.getNextHoliday();
        return new ResponseEntity<>(nextHoliday, HttpStatus.OK);
    }

    @GetMapping("/next4Holidays")
    public ResponseEntity<List<HolidayDTO>> getNext4Holidays() throws HRMSException {
        List<HolidayDTO> next4Holidays = holidayService.getNext4Holidays();
        return new ResponseEntity<>(next4Holidays, HttpStatus.OK);
    }
}
