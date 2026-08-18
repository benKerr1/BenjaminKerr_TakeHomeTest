import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

import { scheduleTicket, closeTicket } from './src/DateValidationScripts/TicketScheduler.js';

import { calculateTargetDate, isWorkingDay, moveToNextWorkingDay } from './src/DateValidationScripts/ScheduleHelpers.js';

import { spawnSync } from "node:child_process";
import { createOutput} from './src/OutputScripts/OutputHelpers.js';



function runScheduler(eventsPath, holidaysPath, timezone = "UTC") {
    const result = spawnSync(
        process.execPath,
        [
            "./src/index.js",
            "--events", eventsPath,
            "--holidays", holidaysPath
        ],
        {
            encoding: "utf8",
            env: {
                ...process.env,
                TZ: timezone
            }
        }
    );

    assert.equal(result.status, 0);

    return result.stdout.trim();
}

// TEST CASES - SCHEDULE COMPONENTS 
test("Adds Months to date", () => {
    const event = {
        occurredAt: "2025-03-10T12:00:00Z",
        scope: { months: 3 }
    };

    const result = calculateTargetDate(event);

    assert.equal(result, "2025-06-10");
});

// This tests are related to Assumption 1
test("Add ambiguous 1 Month scope returns end of month instead - January -> Febuary", () => {
    const event = {
        occurredAt: "2025-01-31T12:00:00Z",
        scope: { months: 1 }
    };

    const result = calculateTargetDate(event);

    assert.equal(result, "2025-02-28");
});

// This tests are related to Assumption 1
test("Add ambiguous 1 Month scope returns same number in next month - Febuary -> March", () => {
    const event = {
        occurredAt: "2025-02-26T12:00:00Z",
        scope: { months: 1 }
    };

    const result = calculateTargetDate(event);

    assert.equal(result, "2025-03-26");
});


test("Leap Year Edge Case", () => {
    const event = {
        occurredAt: "2024-02-29T12:00:00Z",
        scope: { years: 1 }
    };

    const result = calculateTargetDate(event);

    assert.equal(result, "2025-02-28");
});


test("Month Addition to Years", () => {
    const event = {
        occurredAt: "2025-11-30T12:00:00Z",
        scope: { months: 3 }
    };

    const result = calculateTargetDate(event);

    assert.equal(result, "2026-02-28");
});


// WORKING DAYS TESTS

const holidayDates = new Set([
    "2026-04-03", // Good Friday
    "2026-04-06"  // Easter Monday
]);

test("Week day is working day", () => {
    assert.equal(
        isWorkingDay("2026-04-08", holidayDates),
        true
    );
});

test("Saturday is not a working day", () => {
    assert.equal(
        isWorkingDay("2026-04-04", holidayDates),
        false
    );
});

test("Sunday is not a working day", () => {
    assert.equal(
        isWorkingDay("2026-04-05", holidayDates),
        false
    );
});

test("Holiday is not a working day", () => {
    assert.equal(
        isWorkingDay("2026-04-03", holidayDates),
        false
    );
});

test("The day AFTER a holiday is not a working day", () => {
    assert.equal(
        isWorkingDay("2026-04-07", holidayDates),
        false
    );
});

test("Proporly move through break days to find appropriate day", () => {
    const result = moveToNextWorkingDay(
        "2026-04-03",
        holidayDates
    );

    assert.equal(result, "2026-04-08");
});

// BASIC SCHEDULING TESTS
test("Ticket scheduled on empty day", () => {
    const schedule = new Map();
    const holidays = new Set();

    const ticket = {
        ticketId: "T-TEST-1",
        priority: "MEDIUM",
        targetDate: "2025-06-10"
    };

    const result = scheduleTicket(
        ticket,
        schedule,
        holidays
    );

    assert.equal(result, "2025-06-10");
    assert.equal(
        schedule.get("2025-06-10").ticketId,
        "T-TEST-1"
    );
});

test("Ticket with equal priority is moved to next avalable day", () => {
    const schedule = new Map();
    const holidays = new Set();

    const firstTicket = {
        ticketId: "T-TEST-1",
        priority: "MEDIUM",
        targetDate: "2025-06-10"
    };

    const secondTicket = {
        ticketId: "T-TEST-2",
        priority: "MEDIUM",
        targetDate: "2025-06-10"
    };

    scheduleTicket(firstTicket, schedule, holidays);
    scheduleTicket(secondTicket, schedule, holidays);

    assert.equal(
        schedule.get("2025-06-10").ticketId,
        "T-TEST-1"
    );

    assert.equal(
        schedule.get("2025-06-11").ticketId,
        "T-TEST-2"
    );
});

test("Ticket skips weekend when scheduling", () => {
    const schedule = new Map();
    const holidays = new Set();

    const ticket = {
        ticketId: "T-TEST-1",
        priority: "LOW",
        targetDate: "2025-06-14" // Saturday
    };

    const result = scheduleTicket(
        ticket,
        schedule,
        holidays
    );

    assert.equal(result, "2025-06-16");
});


// PRIORITY TESTS
test("Higher priority ticket evicts lower priority ticket", () => {
    const schedule = new Map();
    const holidays = new Set();

    const lowTicket = {
        ticketId: "T-LOW",
        priority: "LOW",
        targetDate: "2025-06-10"
    };

    const highTicket = {
        ticketId: "T-HIGH",
        priority: "HIGH",
        targetDate: "2025-06-10"
    };

    scheduleTicket(lowTicket, schedule, holidays);
    scheduleTicket(highTicket, schedule, holidays);

    assert.equal(
        schedule.get("2025-06-10").ticketId,
        "T-HIGH"
    );

    assert.equal(
        schedule.get("2025-06-11").ticketId,
        "T-LOW"
    );
});

test("Lower priority ticket does not evict higher priority ticket", () => {
    const schedule = new Map();
    const holidays = new Set();

    const highTicket = {
        ticketId: "T-HIGH",
        priority: "HIGH",
        targetDate: "2025-06-10"
    };

    const lowTicket = {
        ticketId: "T-LOW",
        priority: "LOW",
        targetDate: "2025-06-10"
    };

    scheduleTicket(highTicket, schedule, holidays);
    scheduleTicket(lowTicket, schedule, holidays);

    assert.equal(
        schedule.get("2025-06-10").ticketId,
        "T-HIGH"
    );

    assert.equal(
        schedule.get("2025-06-11").ticketId,
        "T-LOW"
    );
});

test("Equal priority does not evict", () => {
    const schedule = new Map();
    const holidays = new Set();

    const firstTicket = {
        ticketId: "T-1",
        priority: "MEDIUM",
        targetDate: "2025-06-10"
    };

    const secondTicket = {
        ticketId: "T-2",
        priority: "MEDIUM",
        targetDate: "2025-06-10"
    };

    scheduleTicket(firstTicket, schedule, holidays);
    scheduleTicket(secondTicket, schedule, holidays);

    assert.equal(
        schedule.get("2025-06-10").ticketId,
        "T-1"
    );

    assert.equal(
        schedule.get("2025-06-11").ticketId,
        "T-2"
    );
});

test("Eviction can cascade through multiple tickets", () => {
    const schedule = new Map();

    const holidays = new Set([
        "2027-05-03"
    ]);

    const highTicket = {
        ticketId: "T-HIGH",
        priority: "HIGH",
        targetDate: "2027-04-28"
    };

    const mediumTicket = {
        ticketId: "T-MEDIUM",
        priority: "MEDIUM",
        targetDate: "2027-04-29"
    };

    const lowTicket = {
        ticketId: "T-LOW",
        priority: "LOW",
        targetDate: "2027-04-30"
    };

    const urgentTicket = {
        ticketId: "T-URGENT",
        priority: "URGENT",
        targetDate: "2027-04-28"
    };

    scheduleTicket(highTicket, schedule, holidays);
    scheduleTicket(mediumTicket, schedule, holidays);
    scheduleTicket(lowTicket, schedule, holidays);

    scheduleTicket(urgentTicket, schedule, holidays);

    assert.equal(
        schedule.get("2027-04-28").ticketId,
        "T-URGENT"
    );

    assert.equal(
        schedule.get("2027-04-29").ticketId,
        "T-HIGH"
    );

    assert.equal(
        schedule.get("2027-04-30").ticketId,
        "T-MEDIUM"
    );

    assert.equal(
        schedule.get("2027-05-05").ticketId,
        "T-LOW"
    );
});

// Unique Test Cases

test("Duplicate events have no additional effect", () => {
    const originalEvents = JSON.parse(
        fs.readFileSync("./fixtures/events.json", "utf8")
    );

    const duplicateEvents = [
        ...originalEvents,
        originalEvents[0]
    ];

    fs.writeFileSync(
        "./fixtures/events-duplicate-test.json",
        JSON.stringify(duplicateEvents)
    );

    const normalOutput = runScheduler(
        "./fixtures/events.json",
        "./fixtures/holidays.json"
    );

    const duplicateOutput = runScheduler(
        "./fixtures/events-duplicate-test.json",
        "./fixtures/holidays.json"
    );

    assert.equal(duplicateOutput, normalOutput);

    fs.unlinkSync("./fixtures/events-duplicate-test.json");
});

test("Replaying a larger input produces the same final result", () => {
    const events = JSON.parse(
        fs.readFileSync("./fixtures/events.json", "utf8")
    );

    const prefix = events.slice(0, 8);

    fs.writeFileSync(
        "./fixtures/events-prefix-test.json",
        JSON.stringify(prefix)
    );

    // Run Once
    runScheduler(
        "./fixtures/events-prefix-test.json",
        "./fixtures/holidays.json"
    );

    // Run Again
    const replayOutput = runScheduler(
        "./fixtures/events.json",
        "./fixtures/holidays.json"
    );

    // Run Again
    const directOutput = runScheduler(
        "./fixtures/events.json",
        "./fixtures/holidays.json"
    );

    assert.equal(replayOutput, directOutput);

    fs.unlinkSync("./fixtures/events-prefix-test.json");
});

// Timezone Independence 
test("Output is the same if timezone changes", () => {
    const utcOutput = runScheduler(
        "./fixtures/events.json",
        "./fixtures/holidays.json",
        "UTC"
    );

    const torontoOutput = runScheduler(
        "./fixtures/events.json",
        "./fixtures/holidays.json",
        "America/Toronto"
    );

    const tokyoOutput = runScheduler(
        "./fixtures/events.json",
        "./fixtures/holidays.json",
        "Asia/Tokyo"
    );

    assert.equal(torontoOutput, utcOutput);
    assert.equal(tokyoOutput, utcOutput);
});

// These test cases are for checking output in and of itself. 
// If this was a final product I think the previous test would be more important since they are data related
test("Creates correct output for a single ticket", () => {
    const schedule = new Map();

    schedule.set("2025-06-10", {
        ticketId: "T-1001",
        priority: "HIGH",
        targetDate: "2025-06-10"
    });

    const result = createOutput(schedule);

    assert.deepEqual(result, {
        schedule: [
            {
                date: "2025-06-10",
                ticketId: "T-1001",
                priority: "HIGH",
                status: "LOCKED"
            }
        ]
    });
});

test("Output is sorted by date regardless of schedule order", () => {
    const schedule = new Map();

    schedule.set("2025-06-12", {
        ticketId: "T-LOW",
        priority: "LOW",
        targetDate: "2025-06-12"
    });

    schedule.set("2025-06-10", {
        ticketId: "T-HIGH",
        priority: "HIGH",
        targetDate: "2025-06-10"
    });

    schedule.set("2025-06-11", {
        ticketId: "T-MEDIUM",
        priority: "MEDIUM",
        targetDate: "2025-06-11"
    });

    const result = createOutput(schedule);

    assert.deepEqual(result, {
        schedule: [
            {
                date: "2025-06-10",
                ticketId: "T-HIGH",
                priority: "HIGH",
                status: "LOCKED"
            },
            {
                date: "2025-06-11",
                ticketId: "T-MEDIUM",
                priority: "MEDIUM",
                status: "ESTIMATED"
            },
            {
                date: "2025-06-12",
                ticketId: "T-LOW",
                priority: "LOW",
                status: "ESTIMATED"
            }
        ]
    });
});

test("Creates valid output when schedule is empty", () => {
    const schedule = new Map();

    const result = createOutput(schedule);// No Ticket!

    assert.deepEqual(result, {
        schedule: []
    });
});