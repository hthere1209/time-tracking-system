-- Migration Script for TimeTrackingDB: Update Staff Table to use Role instead of OfficeLocation

USE TimeTrackingDB;
GO

PRINT 'Starting migration for TimeTrackingDB...';
GO

-- Step 1: Check if StaffRole column already exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Staff') AND name = 'StaffRole')
BEGIN
    PRINT 'Adding StaffRole column...';
    
    -- Add the new StaffRole column
    ALTER TABLE Staff
    ADD StaffRole NVARCHAR(100) NULL;
    
    -- Set default values for existing staff members based on their location
    UPDATE Staff
    SET StaffRole = CASE 
        WHEN DefaultLocationID = 1 THEN 'Developer'
        WHEN DefaultLocationID = 2 THEN 'Project Manager'
        WHEN DefaultLocationID = 3 THEN 'Consultant'
        ELSE 'Staff Member'
    END
    WHERE StaffRole IS NULL;
    
    -- Make the column NOT NULL after setting values
    ALTER TABLE Staff
    ALTER COLUMN StaffRole NVARCHAR(100) NOT NULL;
    
    PRINT 'StaffRole column added successfully!';
END
ELSE
BEGIN
    PRINT 'StaffRole column already exists.';
END
GO

-- Step 2: Drop the foreign key constraint to OfficeLocations (if it exists)
DECLARE @ConstraintName NVARCHAR(200);
SELECT @ConstraintName = name 
FROM sys.foreign_keys 
WHERE parent_object_id = OBJECT_ID('Staff') 
AND referenced_object_id = OBJECT_ID('OfficeLocations');

IF @ConstraintName IS NOT NULL
BEGIN
    PRINT 'Dropping foreign key constraint: ' + @ConstraintName;
    EXEC('ALTER TABLE Staff DROP CONSTRAINT ' + @ConstraintName);
    PRINT 'Foreign key constraint dropped successfully!';
END
ELSE
BEGIN
    PRINT 'No foreign key constraint found.';
END
GO

-- Step 3: Drop the DefaultLocationID column (if it exists)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Staff') AND name = 'DefaultLocationID')
BEGIN
    PRINT 'Dropping DefaultLocationID column...';
    ALTER TABLE Staff DROP COLUMN DefaultLocationID;
    PRINT 'DefaultLocationID column dropped successfully!';
END
ELSE
BEGIN
    PRINT 'DefaultLocationID column does not exist.';
END
GO

PRINT '';
PRINT '=========================================';
PRINT 'Migration completed successfully!';
PRINT '=========================================';
PRINT 'Staff table now uses StaffRole instead of DefaultLocationID.';
PRINT '';
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Staff' ORDER BY ORDINAL_POSITION;
GO

