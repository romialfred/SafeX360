package com.hrms.service.Timesheet;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.json.JSONArray;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.method.P;
import org.springframework.stereotype.Service;

import com.hrms.DataInterface.MemberEntries;
import com.hrms.DataInterface.MemberEntryDetails;
import com.hrms.DataInterface.TimesheetDetails;
import com.hrms.dto.Timesheet.Comment;
import com.hrms.dto.Timesheet.EntryComment;
import com.hrms.entity.Employee;
import com.hrms.entity.Timesheet.MemberEntry;
import com.hrms.entity.Timesheet.Team;
import com.hrms.entity.Timesheet.TeamMember;
import com.hrms.entity.Timesheet.Timesheet;
import com.hrms.enums.CommentType;
import com.hrms.enums.EntryStatus;
import com.hrms.enums.EntryType;
import com.hrms.enums.Rotations;
import com.hrms.enums.Shifts;
import com.hrms.exception.HRMSException;
import com.hrms.repository.HolidayRepository;
import com.hrms.repository.Timesheet.MemberEntryRepository;
import com.hrms.repository.Timesheet.TeamRepository;
import com.hrms.repository.Timesheet.TimesheetRepository;

@Service
public class MemberEntryServiceImpl implements MemberEntryService {

    @Autowired
    private MemberEntryRepository memberEntryRepository;
    @Autowired
    private TimesheetRepository timesheetRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private HolidayRepository holidayRepository;

    @Override
    public void createMemberEntry(Long timesheetId, Long memberId, Long empId, LocalDate date, boolean working,
            Integer hours, boolean isHoliday, Shifts shift)
            throws HRMSException {
        Optional<MemberEntry> optional = memberEntryRepository.findByTeamMember_IdAndDate(memberId, date);
        if (optional.isPresent()) {
            throw new HRMSException("MEMBER_ENTRY_ALREADY_EXISTS");
        }
        MemberEntry memberEntry = new MemberEntry();
        memberEntry.setTimesheet(new Timesheet(timesheetId));
        memberEntry.setTeamMember(new TeamMember(memberId));
        memberEntry.setEmployee(new Employee(empId));
        memberEntry.setDate(date);
        memberEntry.setStatus(EntryStatus.PENDING);
        if (working == true) {
            memberEntry.setType(EntryType.WORKING);
            if (isHoliday) {
                memberEntry
                        .setAttendance(String.format("{\"%s\":\"%s\"}", shift.equals(Shifts.DAY) ? "L" : "IN", hours));
            } else {
                memberEntry.setAttendance(String.format("{\"%s\":\"%s\"}", "J", hours));
            }

        } else if (hours != 0) {
            memberEntry.setType(EntryType.REST);
            memberEntry.setAttendance(String.format("{\"%s\":\"%s\"}", "BR", hours));
        }
        memberEntryRepository.save(memberEntry);
    }

    @Override
    public String getMemberEntryComments(Long id) throws HRMSException {
        String memberEntry = memberEntryRepository.findCommentsById(id).get();
        return memberEntry;
    }

    @Override
    public List<MemberEntryDetails> getMemberEntries(Long timesheetId) {
        return memberEntryRepository.getMemberEntries(timesheetId);
    }

    @Override
    public void updateMemberEntry(Long id, EntryComment entryComment) throws HRMSException {
        Optional<MemberEntry> optional = memberEntryRepository.findById(id);
        if (optional.isEmpty()) {
            throw new HRMSException("MEMBER_ENTRY_NOT_FOUND");
        }
        MemberEntry memberEntry = optional.get();
        memberEntry.setAttendance(entryComment.getAttendance());
        if (entryComment.getComment() != null) {
            List<Comment> comments = memberEntry.getComments() != null
                    ? Comment.jsonArrayToList(memberEntry.getComments())
                    : new ArrayList<>();
            Comment comment = entryComment.getComment();
            comment.setType(CommentType.GENERAL);
            comment.setTimestamp(LocalDateTime.now());
            comments.add(comment);

            memberEntry.setComments(new JSONArray(comments.stream().map(Comment::toJsonObject).toList()).toString(0));
        }
        memberEntry.setStatus(EntryStatus.PENDING);
        memberEntryRepository.save(memberEntry);
    }

    @Override
    public void updateMemberEntry(Long id, String attendance) throws HRMSException {
        Optional<MemberEntry> optional = memberEntryRepository.findById(id);
        if (optional.isEmpty()) {
            throw new HRMSException("MEMBER_ENTRY_NOT_FOUND");
        }
        MemberEntry memberEntry = optional.get();
        memberEntry.setAttendance(attendance);
        memberEntry.setStatus(EntryStatus.PENDING);
        memberEntryRepository.save(memberEntry);
    }

    @Override
    public String addComment(Long id, Comment comment) throws HRMSException {
        Optional<MemberEntry> optional = memberEntryRepository.findById(id);
        if (optional.isEmpty()) {
            throw new HRMSException("MEMBER_ENTRY_NOT_FOUND");
        }
        MemberEntry memberEntry = optional.get();
        List<Comment> comments = memberEntry.getComments() != null
                ? Comment.jsonArrayToList(memberEntry.getComments())
                : new ArrayList<>();
        comment.setTimestamp(LocalDateTime.now());
        comments.add(comment);
        if (comment.getType() == CommentType.REJECTED) {
            memberEntry.setStatus(EntryStatus.REJECTED);
        } else if (comment.getType() == CommentType.APPROVED) {
            memberEntry.setStatus(EntryStatus.APPROVED);
        }
        String commentString = new JSONArray(comments.stream().map(Comment::toJsonObject).toList()).toString(0);
        memberEntry.setComments(commentString);
        memberEntryRepository.save(memberEntry);
        return commentString;
    }

    @Override
    public Object getMinAndMaxTimesheetMonth(Long empId) {
        return memberEntryRepository.findMinAndMaxDateByEmployeeId(empId);
    }

    @Override
    public List<MemberEntryDetails> getMemberEntriesByMonth(Long empId, LocalDate date) {
        return memberEntryRepository.findEntriesByEmployeeAndMonth(empId, date);
    }

    @Override
    public void createEntryforAddedMember(Long teamId, Long memberId, Long empId, Shifts shift) throws HRMSException {
        memberEntryRepository.deleteByDateGreaterThanEqualAndEmployeeId(LocalDate.now(), empId);
        if (timesheetRepository.isTeamHavingTimesheets(teamId)) {
            Optional<TimesheetDetails> optional = timesheetRepository.getLatestTimesheet(teamId);
            if (optional.isPresent()) {
                TimesheetDetails timesheet = optional.get();

                Team team = teamRepository.findById(teamId).get();
                int[] days = getDays(team.getRemainingRestDays(), team.getRotation());
                LocalDate now = LocalDate.now();
                LocalDate endDate = timesheet.getEndDate();
                int work = days[0];
                int rest = days[1];
                while (!endDate.isBefore(now)) {
                    boolean isHoliday = holidayRepository.findHolidayByDate(endDate).isPresent();
                    if (rest > 0) {
                        createMemberEntry(timesheet.getId(), memberId, empId, endDate, false, team.getWorkingHours(),
                                isHoliday, shift);
                        rest--;
                    } else if (work > 0) {
                        createMemberEntry(timesheet.getId(), memberId, empId, endDate, true, team.getWorkingHours(),
                                isHoliday, shift);
                        work--;
                    }
                    endDate = endDate.minusDays(1);
                }
            }
        }

    }

    public int[] getDays(int rest, Rotations rotation) {
        if (rotation.equals(Rotations.FIVE_TWO)) {
            return new int[] { 5, 2 };
        } else if (rotation.equals(Rotations.FOURTEEN_SEVEN)) {
            if (rest == 0)
                return new int[] { 0, 7 };
            return new int[] { 7, 0 };
        } else {
            if (rest == 0 || rest == 7)
                return new int[] { 0, 7 };
            return new int[] { 7, 0 };
        }
    }

    @Override
    public Object[] getTimesheetDatesByEmployeeId(Long empId) {
        return memberEntryRepository.findTimesheetDatesByEmployeeId(empId);
    }

    @Override
    public List<MemberEntryDetails> getMemberEntriesByWeek(Long empId, LocalDate startDate, LocalDate endDate) {
        return memberEntryRepository.findEntriesByEmployeeAndDateRange(empId, startDate, endDate);
    }

    @Override
    public List<MemberEntries> getMemberEntriesByTimesheets(List<Long> timesheetIds) {
        List<MemberEntryDetails> entries = memberEntryRepository.getMemberEntries(timesheetIds);
        return entries.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getEmpId(), // group by empId
                        LinkedHashMap::new,
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                list -> {
                                    MemberEntryDetails first = list.get(0);
                                    List<String> attendanceList = list.stream()
                                            .map(MemberEntryDetails::getAttendance)
                                            .collect(Collectors.toList());
                                    return new MemberEntries(
                                            first.getEmpId(),
                                            first.getName(),
                                            first.getEmpNumber(), first.getTeamName(), first.getTeamId(),
                                            attendanceList);
                                })))
                .values()
                .stream()
                .collect(Collectors.toList());
    }

    @Override
    public List<MemberEntryDetails> getLast7DaysAttendance(Long empId) throws HRMSException {
        LocalDate now = LocalDate.now();
        LocalDate startDate = now.minusDays(6);
        List<MemberEntryDetails> entries = memberEntryRepository.findEntriesByEmployeeAndDateRange(empId, startDate,
                now);
        if (entries.isEmpty()) {
            throw new HRMSException("NO_ENTRIES_FOUND");
        }
        return entries;
    }

    @Override
    public void addCommentsToTimesheet(Long timesheetId, Comment comment) throws HRMSException {
        List<MemberEntryDetails> memberEntryIds = memberEntryRepository.getMemberEntryIds(timesheetId);
        memberEntryIds.parallelStream().forEach(entry -> {
            try {
                if (entry.getStatus() != EntryStatus.APPROVED) {
                    addComment(entry.getId(), comment);
                }
            } catch (HRMSException e) {
                e.printStackTrace();
            }
        });
    }

}
