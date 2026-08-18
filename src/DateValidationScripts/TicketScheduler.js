import { moveToNextWorkingDay } from "./ScheduleHelpers.js";
const PRIORITY = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    URGENT: 3
};

function isHigherPriority(ticketA, ticketB) {
    return PRIORITY[ticketA.priority] > PRIORITY[ticketB.priority];
}

export function findScheduledDate(ticket, startDate, schedule, holidayDates) {
    let currentDate = startDate;

    //TODO: Loop here will assume nothing bad will happen. To avoid hangups there should be a timeout.
    while (true) {
        currentDate = moveToNextWorkingDay(
            currentDate,
            holidayDates
        );

        const occupant = schedule.get(currentDate);

        if (!occupant) {
            return currentDate;
        }
        // Higher priority event bumps existing ticket at this date.  Evicted ticket handling deals with current occupant
        if (isHigherPriority(ticket, occupant)) {
            return currentDate;
        }
        // Assumption 2: Two events with same target date, the second event will get bumped
        const nextDate = new Date(`${currentDate}T00:00:00Z`);
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);

        currentDate = nextDate
            .toISOString()
            .slice(0, 10);
    }
}

export function scheduleTicket(ticket, schedule, holidayDates) {
    const scheduledDate = findScheduledDate(
        ticket,
        ticket.targetDate,
        schedule,
        holidayDates
    );

    const evictedTicket = schedule.get(scheduledDate);

    schedule.set(scheduledDate, ticket);
    // Recursion for evicted tickets but not a problem unless large chain of conflicts is present.  Assumption 5.
    if (evictedTicket) {
        scheduleTicket(
            evictedTicket,
            schedule,
            holidayDates
        );
    }

    return scheduledDate;
}


export function closeTicket(ticketId, schedule) {
    for (const [date, ticket] of schedule) {
        if (ticket.ticketId === ticketId) {
            schedule.delete(date);
            return;
        }
    }
}