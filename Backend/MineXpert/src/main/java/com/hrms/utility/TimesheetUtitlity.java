package com.hrms.utility;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

import com.hrms.enums.Day;

public class TimesheetUtitlity {
    public static LocalDate getNextWeekDate(LocalDate currentDate) {
        DayOfWeek currentDay = currentDate.getDayOfWeek();
        DayOfWeek targetDay;

        if (currentDay == DayOfWeek.SUNDAY) {
            targetDay = DayOfWeek.SATURDAY;
        } else {
            targetDay = DayOfWeek.SUNDAY;
        }
        return currentDate.with(TemporalAdjusters.next(targetDay));
    }

    public static Day getDayOfWeek(LocalDate date) {
        if (date.getDayOfWeek().getValue() == 7) {
            return Day.SUNDAY;
        } else if (date.getDayOfWeek().getValue() == 1) {
            return Day.MONDAY;
        } else if (date.getDayOfWeek().getValue() == 2) {
            return Day.TUESDAY;
        } else if (date.getDayOfWeek().getValue() == 3) {
            return Day.WEDNESDAY;
        } else if (date.getDayOfWeek().getValue() == 4) {
            return Day.THURSDAY;
        } else if (date.getDayOfWeek().getValue() == 5) {
            return Day.FRIDAY;
        } else if (date.getDayOfWeek().getValue() == 6) {
            return Day.SATURDAY;
        } else {
            return null;
        }
    }
}
