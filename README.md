# Support Ticket Scheduler

A Node.js CLI application that reads a support ticket event log and company holiday calendar, then generates a deterministic review schedule.

## Running the Scheduler

From the project root, run:

```bash
node src/index.js --events ./fixtures/events.json --holidays ./fixtures/holidays.json
```

Example Output:

```json
{
  "schedule": [
    {
      "date": "2025-06-16",
      "ticketId": "T-2001",
      "priority": "HIGH",
      "status": "LOCKED"
    }
  ]
}
```

## Tests
Run with

```bash
npm test
```

The tests cover areas including:

* Target date calculations
* End-of-month and leap-year handling
* Working-day validation
* Holidays and days following holidays
* Basic ticket scheduling
* Ticket priority
* Ticket eviction and chained eviction
* Duplicate events
* Replay safety
* Timezone independence
* Final output formatting

## What I would do with more time / My expereince with the project

If I had more time I would really like to clean up a lot of the test cases. Splitting them up into test spesific scripts would be more effeciant to look at and group. Having just a file ominousesly labled "test" does not seem best practice.

Spending more time validating the incoming data was something that interested me a lot but did not have time to fully complete [Assumption 4]. 

Also the stretch goals about custom holiday I hoped to reach but did not. I think my code could be adapted to fit into a model like that but I would need a bit more time.

Overall the main code took me about 3 hours to complete. With documentation and double checking another hour or so. 

- Ben