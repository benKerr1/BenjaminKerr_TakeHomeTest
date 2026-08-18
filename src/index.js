import fs from "node:fs";
import { getArgument, loadEvents } from './InputScripts/JsonToData.js';
import { scheduleTicket, closeTicket } from './DateValidationScripts/TicketScheduler.js';

import { calculateTargetDate } from './DateValidationScripts/ScheduleHelpers.js';

import { printScheduleTable, createOutput } from './OutputScripts/OutputHelpers.js';


function processEvents(events, holidayDates) {
    const schedule = new Map();

    for (const event of events) {
        if (event.type === "ticket.created") {

            const targetDate = calculateTargetDate(event);

            const ticket = {
                ticketId: event.ticketId,
                priority: event.priority,
                targetDate: targetDate
            };

            scheduleTicket(
                ticket,
                schedule,
                holidayDates
            );
        }

        if (event.type === "ticket.closed") {
            closeTicket(
                event.ticketId,
                schedule
            );
        }
    }


    return schedule;
}

const eventsPath = getArgument("--events");
const holidaysPath = getArgument("--holidays");

const events = loadEvents(eventsPath);
const holidaysFile = fs.readFileSync(holidaysPath, "utf8");
const holidays = JSON.parse(holidaysFile);
const holidayDates = new Set(
    holidays.map(holiday => holiday.date)
);

// Schedule Gets Created Here
const schedule = processEvents(events, holidayDates);

printScheduleTable(schedule); // Print to for debug
const output = createOutput(schedule); // Get Output format based on Item 6 from pdf

//Reqired
console.log(
    JSON.stringify(output, null, 2)
);