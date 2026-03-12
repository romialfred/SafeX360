package com.hrms.api.Timesheet;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.DataInterface.MemberEntries;
import com.hrms.DataInterface.MemberEntryDetails;
import com.hrms.DataInterface.TimesheetDetails;
import com.hrms.dto.ResponseDTO;
import com.hrms.dto.Timesheet.Comment;
import com.hrms.dto.Timesheet.EntriesDTO;
import com.hrms.dto.Timesheet.EntryComment;
import com.hrms.exception.HRMSException;
import com.hrms.service.Timesheet.MemberEntryService;
import com.hrms.service.Timesheet.TimesheetService;

@RestController
@RequestMapping("/timesheet")
@CrossOrigin
@Validated
public class TimesheetAPI {

    @Autowired
    private TimesheetService timesheetService;

    @Autowired
    private MemberEntryService memberEntryService;

    @PostMapping("/generate/{id}")
    public ResponseEntity<ResponseDTO> generateTimesheet(@PathVariable Long id) throws HRMSException {
        timesheetService.generateTimesheet(id);
        return new ResponseEntity<>(new ResponseDTO("Timesheet generated successfully"), HttpStatus.CREATED);
    }

    @GetMapping("/latest/{teamId}")
    public ResponseEntity<TimesheetDetails> getLatestTimesheet(@PathVariable Long teamId) throws HRMSException {
        return new ResponseEntity<>(timesheetService.getLatestTimesheet(teamId), HttpStatus.OK);
    }

    @GetMapping("/getAllTeamId/{teamId}")
    public ResponseEntity<List<TimesheetDetails>> getAllTimesheetDetailsByTeamId(@PathVariable Long teamId)
            throws HRMSException {
        return new ResponseEntity<>(timesheetService.getAllTimesheetDetails(teamId), HttpStatus.OK);
    }

    @GetMapping("/getEntries/{id}")
    public ResponseEntity<List<MemberEntryDetails>> getTimesheetEntries(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(memberEntryService.getMemberEntries(id), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<TimesheetDetails> getTimesheetDetails(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(timesheetService.getTimesheet(id), HttpStatus.OK);
    }

    @GetMapping("/getComments/{id}")
    public ResponseEntity<String> getMemberEntryCommEntity(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(memberEntryService.getMemberEntryComments(id),
                HttpStatus.OK);
    }

    @PutMapping("/updateEntry/{id}")
    public ResponseEntity<ResponseDTO> updateMemberEntry(@PathVariable Long id, @RequestBody EntryComment entry)
            throws HRMSException {
        memberEntryService.updateMemberEntry(id, entry);
        return new ResponseEntity<>(new ResponseDTO("Member Entry updated successfully"), HttpStatus.OK);
    }

    @PutMapping("/updateEntries")
    public ResponseEntity<ResponseDTO> updateMemberEntry(@RequestBody EntriesDTO entriesDTO)
            throws HRMSException {
        entriesDTO.getMemberIds().parallelStream().forEach((x) -> {
            try {
                memberEntryService.updateMemberEntry(x, entriesDTO.getAttendance());
            } catch (HRMSException e) {
            }
        });
        return new ResponseEntity<>(new ResponseDTO("Member Entry updated successfully"), HttpStatus.OK);
    }

    @PutMapping("/addComments")
    public ResponseEntity<ResponseDTO> addComments(@RequestBody EntriesDTO entriesDTO)
            throws HRMSException {
        entriesDTO.getMemberIds().parallelStream().forEach((x) -> {
            try {
                memberEntryService.addComment(x, entriesDTO.getComment());
            } catch (HRMSException e) {
            }
        });
        return new ResponseEntity<>(new ResponseDTO("Comments added successfully"), HttpStatus.OK);
    }

    @PutMapping("/addCommentsToTimesheet/{id}")
    public ResponseEntity<ResponseDTO> addCommentsToTimesheet(@PathVariable Long id, @RequestBody Comment comment)
            throws HRMSException {
        memberEntryService.addCommentsToTimesheet(id, comment);
        return new ResponseEntity<>(new ResponseDTO("Comments added successfully"), HttpStatus.OK);
    }

    @PutMapping("/addComment/{id}")
    public ResponseEntity<String> addComment(@PathVariable Long id, @RequestBody Comment comment)
            throws HRMSException {

        return new ResponseEntity<>(memberEntryService.addComment(id, comment), HttpStatus.OK);
    }

    @GetMapping("/getMonths/{empId}")
    public ResponseEntity<Object> getMonths(@PathVariable Long empId) {
        return new ResponseEntity<>(memberEntryService.getMinAndMaxTimesheetMonth(empId), HttpStatus.OK);
    }

    @GetMapping("/getDates/{empId}")
    public ResponseEntity<Object[]> getDates(@PathVariable Long empId) {
        return new ResponseEntity<>(memberEntryService.getTimesheetDatesByEmployeeId(empId), HttpStatus.OK);
    }

    @GetMapping("/getEntriesByMonth/{empId}")
    public ResponseEntity<Object> getEntriesByMonth(@PathVariable Long empId, @RequestParam LocalDate date) {
        return new ResponseEntity<>(memberEntryService.getMemberEntriesByMonth(empId, date), HttpStatus.OK);
    }

    @GetMapping("/getEntriesByWeek/{empId}")
    public ResponseEntity<Object> getEntriesByWeek(@PathVariable Long empId, @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        return new ResponseEntity<>(memberEntryService.getMemberEntriesByWeek(empId, startDate, endDate),
                HttpStatus.OK);
    }

    @GetMapping("/getTimesheetByDeptAndMonth/{departmentId}")
    public ResponseEntity<List<TimesheetDetails>> getEntriesByDeptAndMonth(@PathVariable Long departmentId,
            @RequestParam LocalDate date) throws HRMSException {
        return new ResponseEntity<>(timesheetService.getTimesheetDetailsByDepartmentAndMonth(departmentId, date),
                HttpStatus.OK);
    }

    @GetMapping("/getTimesheetByCompanyAndMonth/{companyId}")
    public ResponseEntity<List<TimesheetDetails>> getEntriesByCompanyAndMonth(@PathVariable Long companyId,
            @RequestParam LocalDate date) throws HRMSException {
        return new ResponseEntity<>(timesheetService.getTimesheetDetailsByCompanyAndMonth(companyId, date),
                HttpStatus.OK);
    }

    @GetMapping("/getApprovedTimesheets")
    public ResponseEntity<List<TimesheetDetails>> getApprovedTimesheets() throws HRMSException {
        return new ResponseEntity<>(timesheetService.getApprovedTimesheets(),
                HttpStatus.OK);
    }

    @GetMapping("/getTimesheetsForApprover")
    public ResponseEntity<List<TimesheetDetails>> getTimesheetForApprover() throws HRMSException {
        return new ResponseEntity<>(timesheetService.getTimesheetsForApprover(),
                HttpStatus.OK);
    }

    @GetMapping("/getAllTimesheetsByDepartment/{departmentId}")
    public ResponseEntity<Object> getAllTimesheetsByDepartmemt(@PathVariable Long departmentId) {
        return new ResponseEntity<>(timesheetService.getAllTimesheetsByDepartment(departmentId), HttpStatus.OK);
    }

    @GetMapping("/getAllTimesheetsByCompany/{companyId}")
    public ResponseEntity<Object> getAllTimesheetsByCompany(@PathVariable Long companyId) {
        return new ResponseEntity<>(timesheetService.getAllTimesheetsByCompany(companyId), HttpStatus.OK);
    }

    @GetMapping({ "/getEntriesByTimesheets" })
    public ResponseEntity<List<MemberEntries>> getEntriesByTimesheets(@RequestParam List<Long> timesheetIds) {
        return new ResponseEntity<>(memberEntryService.getMemberEntriesByTimesheets(timesheetIds), HttpStatus.OK);
    }

    @GetMapping("/getLast7DaysAttendance/{empId}")
    public ResponseEntity<List<MemberEntryDetails>> getLast7DaysAttendance(@PathVariable Long empId)
            throws HRMSException {
        return new ResponseEntity<>(memberEntryService.getLast7DaysAttendance(empId), HttpStatus.OK);
    }
}
