USE TimeTrackDB;
GO

-- Check if LastLoginDate column exists, if not add it
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'LastLoginDate'
)
BEGIN
    ALTER TABLE Users
    ADD LastLoginDate DATETIME NULL;
    
    PRINT 'LastLoginDate column added successfully!';
END
ELSE
BEGIN
    PRINT 'LastLoginDate column already exists.';
END
GO

