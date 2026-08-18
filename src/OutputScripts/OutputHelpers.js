// I know I am not being tested on how good this application looks but,
// It was very hard to debug and test without some UI :)
export function printScheduleTable(schedule) {
    console.error(`
╔════════════╦════════════╦══════════╦════════════╗
║ FINAL DATE ║ PUSHED FROM║ PRIORITY ║ EVENT ID   ║
╠════════════╬════════════╬══════════╬════════════╣`);

    for (const [date, ticket] of schedule) {
        const row =
            `║ ${date.padEnd(10)} ` +
            `║ ${ticket.targetDate.padEnd(10)} ` +
            `║ ${ticket.priority.padEnd(8)} ` +
            `║ ${ticket.ticketId.padEnd(10)} ║`;

        console.error(row);
    }

    console.error(
        `╚════════════╩════════════╩══════════╩════════════╝`
    );
}

function getTicketStatus(priority) {
    if (priority === "URGENT" || priority === "HIGH") {
        return "LOCKED";
    }

    return "ESTIMATED";
}

export function createOutput(schedule) {
    const scheduleArray = [];

    for (const [date, ticket] of schedule) {
        scheduleArray.push({
            date: date,
            ticketId: ticket.ticketId,
            priority: ticket.priority,
            status: getTicketStatus(ticket.priority)
        });
    }

    scheduleArray.sort((a, b) =>
        a.date.localeCompare(b.date)
    );

    return {
        schedule: scheduleArray
    };
}