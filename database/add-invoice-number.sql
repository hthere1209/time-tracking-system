-- Add InvoiceNumber field to TimeEntries table
USE TimeTrackDB;

-- Add the InvoiceNumber column
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'TimeEntries') 
    AND name = 'InvoiceNumber'
)
BEGIN
    ALTER TABLE TimeEntries ADD InvoiceNumber NVARCHAR(50) NULL;
    PRINT 'InvoiceNumber column added successfully.';
END
ELSE
BEGIN
    PRINT 'InvoiceNumber column already exists.';
END

-- Add index for faster searches
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_TimeEntries_InvoiceNumber' 
    AND object_id = OBJECT_ID(N'TimeEntries')
)
BEGIN
    CREATE INDEX IX_TimeEntries_InvoiceNumber 
    ON TimeEntries(InvoiceNumber)
    WHERE InvoiceNumber IS NOT NULL;
    PRINT 'Index created successfully.';
END

PRINT 'Migration completed!';
