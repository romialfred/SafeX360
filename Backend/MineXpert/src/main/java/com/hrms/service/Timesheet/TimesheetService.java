package com.hrms.service.Timesheet;

import java.time.LocalDate;
import java.util.List;

import com.hrms.DataInterface.TimesheetDetails;
import com.hrms.enums.TimesheetStatus;
import com.hrms.exception.HRMSException;

public interface TimesheetService {
        public void generateTimesheet(Long id) throws HRMSException;

        public TimesheetDetails getLatestTimesheet(Long teamId) throws HRMSException;

        public List<TimesheetDetails> getAllTimesheetDetails(Long teamId) throws HRMSException;

        public TimesheetDetails getTimesheet(Long id) throws HRMSException;

        public void updateTimesheetStatus(Long id, TimesheetStatus status) throws HRMSException;

        public List<TimesheetDetails> getTimesheetDetailsByDepartmentAndMonth(Long departmentId, LocalDate date)
                        throws HRMSException;

        public List<TimesheetDetails> getTimesheetDetailsByCompanyAndMonth(Long companyId, LocalDate date)
                        throws HRMSException;

        public List<TimesheetDetails> getApprovedTimesheets();

        public List<TimesheetDetails> getTimesheetsForApprover() throws HRMSException;

        public Object getAllTimesheetsByDepartment(Long departmentId);

        public Object getAllTimesheetsByCompany(Long companyId);

        public void payTimesheets(List<Long> timesheetIds) throws HRMSException;
}
