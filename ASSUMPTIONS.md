Assumptions:
1- When adding a month to a day and the resulting day does not exsist due to the next month not having the required ammount of days. The value is clamped to the end of the month (January 31 -> Febuary 28)
2- Events can contain identical timestamps. When two events have the same time, eventID is used as a tie-breaker
3- All date calculations will use UTC rather than host PC timezone
4- A ticket is assumed to have at most one distinct ticket.created event while active. Duplicate instances of that event may occur, but they share the same eventID.  The new instance will be deleted, and only the first instance in the file will be kept. This should be fixed in a production version.
5- It is possible to have source data that triggers a chain of evictions.  For this exercise, assuming that the recursion chain will fit into memory.