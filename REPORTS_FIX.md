# Reports Fix Documentation

## Problem
The reports table was not working correctly because:
1. The backend was trying to call stored procedures that may not exist or have incorrect column names
2. There was a mismatch between database schema column names and what the routes expected
3. The stored procedures used incorrect field references

## Solution
**Replaced all stored procedure calls with direct SQL queries** that match the actual database schema used by the application.

---

## What Was Fixed

### Backend Changes (`routes/reports.js`)

All four report endpoints were updated to use direct SQL queries instead of stored procedures:

#### 1. **Staff Work Report** (`/api/reports/staff-work`)
- Shows work by staff member with clients, hours, costs, and revenue
- Can filter by specific staff member
- Fixed to use: `HourlyCostRate`, `HourlyBillingRate`, `LocationID`, `EntryID`

#### 2. **Client Billing Report** (`/api/reports/client-billing`)
- Detailed billing report showing each time entry with costs
- Can filter by specific client
- Shows date, staff, office, hours, costs, and profit per entry

#### 3. **Client Billing Summary** (`/api/reports/client-billing-summary`)
- Summary report grouping totals by client
- Shows total entries, hours, costs, billable amounts, and profit

#### 4. **Date Range Hours Report** (`/api/reports/date-range-hours`) ⭐
- **This is the simple report you requested!**
- Shows hours per employee per customer for any date range
- Clean and simple: Employee, Customer, Number of Entries, Total Hours

---

## How to Use the Reports

### Option 1: Using the Web Interface

1. **Log in as Admin**
2. Navigate to **Reports** page
3. Select **"Date Range Hours Report"** from dropdown
4. Choose your **Start Date** and **End Date**
5. Click **"📊 Generate Report"**
6. Export to CSV if needed using the **"📥 Export CSV"** button

### Option 2: Using the API Directly

```bash
# Date Range Hours Report (Employee & Customer)
GET /api/reports/date-range-hours?startDate=2024-01-01&endDate=2024-12-31
```

**Example Response:**
```json
[
  {
    "StaffID": 1,
    "StaffName": "John Doe",
    "ClientID": 5,
    "ClientName": "ABC Corporation",
    "Entries": 15,
    "TotalHours": 120.50
  },
  {
    "StaffID": 1,
    "StaffName": "John Doe",
    "ClientID": 8,
    "ClientName": "XYZ Company",
    "Entries": 8,
    "TotalHours": 64.25
  }
]
```

### Option 3: Running SQL Queries Directly

Use the SQL queries in `database/simple-reports-query.sql`:

```sql
-- Simple date range query
DECLARE @StartDate DATE = '2024-01-01';
DECLARE @EndDate DATE = '2024-12-31';

SELECT 
    s.StaffName AS Employee,
    c.ClientName AS Customer,
    COUNT(te.EntryID) AS NumberOfEntries,
    SUM(DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) AS TotalHours
FROM TimeEntries te
INNER JOIN Staff s ON te.StaffID = s.StaffID
INNER JOIN Clients c ON te.ClientID = c.ClientID
WHERE te.WorkDate BETWEEN @StartDate AND @EndDate
    AND te.TimeFinished IS NOT NULL
GROUP BY s.StaffName, c.ClientName
ORDER BY s.StaffName, c.ClientName;
```

---

## All Available Report Endpoints

### 1. Date Range Hours Report
**Endpoint:** `GET /api/reports/date-range-hours`

**Parameters:**
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)

**Returns:** Hours per employee per customer

### 2. Staff Work Report
**Endpoint:** `GET /api/reports/staff-work`

**Parameters:**
- `startDate` (required): Start date
- `endDate` (required): End date
- `staffId` (optional): Filter by specific staff member

**Returns:** Detailed breakdown with cost and revenue by staff and client

### 3. Client Billing Report
**Endpoint:** `GET /api/reports/client-billing`

**Parameters:**
- `startDate` (required): Start date
- `endDate` (required): End date
- `clientId` (optional): Filter by specific client

**Returns:** Detailed entry-by-entry billing information

### 4. Client Billing Summary
**Endpoint:** `GET /api/reports/client-summary`

**Parameters:**
- `startDate` (required): Start date
- `endDate` (required): End date

**Returns:** Summary totals grouped by client

---

## Quick Reference SQL Queries

The file `database/simple-reports-query.sql` includes 6 ready-to-use queries:

1. **Date Range Hours by Employee and Customer** - Main report you requested
2. **Summary by Employee Only** - Total hours per employee
3. **Summary by Customer Only** - Total hours per customer
4. **Detailed Report with Dates** - Day-by-day breakdown
5. **This Month's Hours** - Quick current month summary
6. **Currently Punched In** - Who's working right now

---

## Testing the Fix

### Test 1: Basic Date Range Report
1. Open Reports page
2. Select "Date Range Hours Report"
3. Set dates (e.g., first day of current month to today)
4. Click Generate Report
5. Should see table with Employee, Customer, Entries, and Total Hours

### Test 2: API Test
```bash
# Replace dates as needed
curl "http://localhost:3000/api/reports/date-range-hours?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Test 3: SQL Direct
1. Open SQL Server Management Studio
2. Open `database/simple-reports-query.sql`
3. Change the dates in the variables
4. Execute Query 1
5. Should see results

---

## Column Name Reference

The fix ensures these correct column names are used:

| Feature | Column Name |
|---------|-------------|
| Time Entry ID | `EntryID` |
| Staff Cost Rate | `HourlyCostRate` |
| Client Billing Rate | `HourlyBillingRate` |
| Office Location ID | `LocationID` |
| Default Location | `DefaultLocationID` |

---

## Notes

- All queries **exclude currently punched-in entries** (only show completed work)
- Hours are calculated as: `DATEDIFF(MINUTE, TimeStarted, TimeFinished) / 60.0`
- Reports are available **only to admin users**
- All reports support **CSV export** from the web interface
- Date ranges are **inclusive** (includes both start and end dates)

---

## Troubleshooting

### "Failed to generate report"
- Ensure you're logged in as admin
- Check that dates are in YYYY-MM-DD format
- Verify database connection is working

### "No data found"
- Ensure time entries exist for the selected date range
- Check that entries are completed (punched out)
- Verify staff and clients exist in the database

### "Column name not found" error
- This fix should resolve this issue
- If it persists, check your actual database schema vs. what's expected
- Run: `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TimeEntries'`

---

## Summary

✅ **Fixed:** All reports now use direct SQL queries  
✅ **Fixed:** Column names match actual database schema  
✅ **Added:** Simple date-range hours report (employee & customer)  
✅ **Added:** Standalone SQL query file for direct database access  
✅ **Tested:** All queries work with existing database structure  

The **Date Range Hours Report** is now fully functional and provides exactly what you need: a simple way to pull hours per employee and per customer for any date range!

