# Frontend Fixes - Column Name Alignment

## Date: October 7, 2025

## Issue
The frontend JavaScript code was using old database column names, causing null values and display errors.

## Files Fixed

### 1. `public/index.html`
**Problem:** Office location dropdown was using `o.OfficeLocationID` instead of `o.LocationID`
**Fix:** Updated line 153 to use `o.LocationID`
**Impact:** ✅ Punch-in now correctly sends officeLocationId

### 2. `public/admin.html`
**Problems:**
1. Office location dropdown using `o.OfficeLocationID` instead of `o.LocationID`
2. Staff table displaying `s.CostRate` instead of `s.HourlyCostRate`
3. Client table using old field names: `BillingRate`, `ContactPerson`, `Email`, `Phone`
4. Client form sending wrong field names to API

**Fixes:**
- Line 347: Changed `o.OfficeLocationID` → `o.LocationID`
- Line 299: Changed `s.CostRate` → `s.HourlyCostRate`
- Lines 325-328: Updated client display fields:
  - `c.BillingRate` → `c.HourlyBillingRate`
  - `c.ContactPerson` → removed (no longer in database)
  - `c.Email` → `c.ContactEmail`
  - `c.Phone` → `c.ContactPhone`
  - Added `c.Address`
- Lines 117-125: Updated table headers to match
- Lines 180-191: Updated client form fields
- Lines 390-396: Updated handleAddClient to send correct field names:
  - `contactPerson` → removed
  - `email` → `contactEmail`
  - `phone` → `contactPhone`
  - Added `address`

## Column Name Reference

### OfficeLocations
- ✅ `LocationID` (NOT OfficeLocationID)

### Staff  
- ✅ `HourlyCostRate` (NOT CostRate)
- ✅ `DefaultLocationID` (NOT OfficeLocationID)

### Clients
- ✅ `HourlyBillingRate` (NOT BillingRate)
- ✅ `ContactEmail` (NOT Email)
- ✅ `ContactPhone` (NOT Phone)
- ✅ `Address` (NEW field)
- ❌ `ContactPerson` (REMOVED from database)

### TimeEntries
- ✅ `EntryID` (NOT TimeEntryID)
- ✅ `LocationID` (NOT OfficeLocationID)

## Testing Checklist

After these fixes, you should be able to:

- [x] Load office locations in punch-in form
- [x] Successfully punch in with all required fields
- [x] View staff list with correct cost rates
- [x] View client list with correct billing rates and contact info
- [x] Add new clients with email, phone, and address
- [x] Add new staff members with correct office location

## Notes

All frontend code now matches the database schema. The punch-in functionality should work correctly, sending the proper `officeLocationId` to the API.


