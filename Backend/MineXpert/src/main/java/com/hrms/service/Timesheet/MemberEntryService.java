package com.hrms.service.Timesheet;

import java.time.LocalDate;
import java.util.List;

import com.hrms.DataInterface.MemberEntries;
import com.hrms.DataInterface.MemberEntryDetails;
import com.hrms.dto.Timesheet.Comment;
import com.hrms.dto.Timesheet.EntryComment;
import com.hrms.enums.Shifts;
import com.hrms.exception.HRMSException;

public interface MemberEntryService {
        public void createMemberEntry(Long timesheetId, Long memberId, Long empId, LocalDate date, boolean working,
                        Integer hours, boolean isHoliday, Shifts shift)
                        throws HRMSException;

        public String getMemberEntryComments(Long id) throws HRMSException;

        public void createEntryforAddedMember(Long teamId, Long memberId, Long empId, Shifts shift)
                        throws HRMSException;

        public List<MemberEntryDetails> getMemberEntries(Long timesheetId);

        public void updateMemberEntry(Long id, EntryComment entryComment) throws HRMSException;

        public void updateMemberEntry(Long id, String attendance) throws HRMSException;

        public String addComment(Long id, Comment comment) throws HRMSException;

        public void addCommentsToTimesheet(Long timesheetId, Comment comment) throws HRMSException;

        public Object getMinAndMaxTimesheetMonth(Long empId);

        public Object[] getTimesheetDatesByEmployeeId(Long empId);

        public List<MemberEntryDetails> getMemberEntriesByMonth(Long empId, LocalDate date);

        public List<MemberEntryDetails> getMemberEntriesByWeek(Long empId, LocalDate startDate, LocalDate endDate);

        public List<MemberEntries> getMemberEntriesByTimesheets(List<Long> timesheetIds);

        public List<MemberEntryDetails> getLast7DaysAttendance(Long empId)
                        throws HRMSException;
}
