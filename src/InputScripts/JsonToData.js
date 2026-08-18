import fs from "node:fs";

// Functions for getting data from JSON files and loading the events properly
// Function names are self-explanatory


export function getArgument(name) {
    const index = process.argv.indexOf(name);

    if (index === -1 || index + 1 >= process.argv.length) {
        throw new Error(`Missing required argument: ${name}`);
    }

    return process.argv[index + 1];
}
export function loadEvents(filePath) {
    const rawEvents = loadEventsRaw(filePath);
    const uniqueEvents = removeDuplicateEvents(rawEvents);
    const orderedEvents = sortEvents(uniqueEvents);
    return orderedEvents;
}


function loadEventsRaw(filePath) {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const events = JSON.parse(fileContents);
    return events;
}

function removeDuplicateEvents(events) {
    const seenEventIds = new Set();

    return events.filter(event => {
        if (seenEventIds.has(event.eventId)) {
            return false;
        }

        seenEventIds.add(event.eventId);
        return true;
    });
}

function sortEvents(events) {
    return [...events].sort((a, b) => {
        const timeA = Date.parse(a.occurredAt);
        const timeB = Date.parse(b.occurredAt);

        if (timeA !== timeB) {
            return timeA - timeB;
        }

        // Assumption 4: Tie Breaker
        if (a.eventId < b.eventId) return -1;
        if (a.eventId > b.eventId) return 1;
        return 0;
    });
}