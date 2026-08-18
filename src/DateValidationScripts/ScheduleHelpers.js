export function isWorkingDay(dateString, holidayDates) {
    const date = new Date(`${dateString}T00:00:00Z`);

    const dayOfWeek = date.getUTCDay();

    // Saturday or Sunday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return false;
    }

    // Holiday
    if (holidayDates.has(dateString)) {
        return false;
    }

    // Check if yesterday was a holiday
    const yesterday = new Date(date);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const yesterdayString = yesterday
        .toISOString()
        .slice(0, 10);

    if (holidayDates.has(yesterdayString)) {
        return false;
    }

    return true;
}


export function moveToNextWorkingDay(dateString, holidayDates) {
    let date = new Date(`${dateString}T00:00:00Z`);

    //TODO: loop here assumes that nothing bad will happen. Create Exit case to avoid Hang Ups
    // Related to Assumption 3
    while (true) {
        const currentDateString = date
            .toISOString()
            .slice(0, 10);

        if (isWorkingDay(currentDateString, holidayDates)) {
            return currentDateString;
        }

        date.setUTCDate(date.getUTCDate() + 1);
    }
}

export function calculateTargetDate(event) {
    const date = new Date(event.occurredAt);
    // Assumption 3
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    let targetYear = year;
    let targetMonth = month;

    if (event.scope.months) {
        const totalMonths = month + event.scope.months;

        targetYear += Math.floor(totalMonths / 12);
        targetMonth = totalMonths % 12;
    }

    if (event.scope.years) {
        targetYear += event.scope.years;
    }
    // Assumption 1 implemented here
    const lastDayOfMonth = new Date(
        Date.UTC(targetYear, targetMonth + 1, 0)
    ).getUTCDate();

    const targetDay = Math.min(day, lastDayOfMonth);

    return new Date(
        Date.UTC(targetYear, targetMonth, targetDay)
    )
        .toISOString()
        .slice(0, 10);
}
