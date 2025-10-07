USE TimeTrackDB;
GO

-- Create Users table for authentication
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) UNIQUE NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin' or 'user'
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    LastLoginDate DATETIME NULL
);
GO

-- Create index on username for faster lookups
CREATE INDEX IX_Users_Username ON Users(Username);
CREATE INDEX IX_Users_Email ON Users(Email);
GO

PRINT 'Users table created successfully!';
PRINT '';
PRINT 'The default admin user will be automatically created when you start the server.';
PRINT 'Username: admin';
PRINT 'Password: admin123';
PRINT '';
PRINT 'IMPORTANT: Please change the default admin password after first login!';
GO

