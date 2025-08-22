# Appwrite Migration Guide

⚠️ **Migration Deadline: September 1, 2025**

This tool helps you migrate your Appwrite data to PostgreSQL, MySQL, or MongoDB before the project deletion deadline.

## Quick Start

### 1. Setup Environment

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` file with your credentials:

```env
# Appwrite Configuration (Required)
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_admin_api_key_here

# Choose your target database
TARGET_DATABASE=postgres

# Configure your target database credentials
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=appwrite_migration
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=your_password
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Migration

#### Interactive CLI
```bash
pnpm start
```

#### Direct Migration
```bash
# Migrate to PostgreSQL
node src/scripts/postgres.js

# Migrate to MySQL  
node src/scripts/mysql.js

# Migrate to MongoDB
node src/scripts/mongodb.js
```

#### Using the main migration script
```bash
pnpm migrate
```

## What Gets Migrated

### ✅ Users
- User profiles and authentication data
- Email/phone verification status
- User preferences and metadata
- Registration and update timestamps

### ✅ Database Schema
- All databases from your Appwrite project
- Collections with their attributes and constraints
- Proper data type mapping for each target database

### ✅ Document Data
- All documents from all collections
- Maintains relationships and data integrity
- Handles JSON fields appropriately

### ❌ Not Migrated (Yet)
- File storage (use separate cloud storage solution)
- Functions and serverless code
- Real-time subscriptions
- API keys and webhooks

## Database-Specific Notes

### PostgreSQL
- JSON data stored as JSONB for better performance
- Full-text search capabilities preserved
- Supports all PostgreSQL data types

### MySQL
- JSON data stored as JSON type (MySQL 5.7+)
- Compatible with MySQL 5.7 and 8.0+
- Proper charset handling for international data

### MongoDB
- Direct document mapping (most similar to Appwrite)
- Maintains flexible schema structure
- Preserves complex nested objects

## Troubleshooting

### Connection Issues
```bash
# Test database connections
node src/index.js
# Choose option 4 to test all connections
```

### Common Errors

**Error: Failed to connect to Appwrite**
- Check your `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, and `APPWRITE_API_KEY`
- Ensure your API key has admin permissions

**Error: Database connection failed**
- Verify your target database is running
- Check database credentials in `.env` file
- Ensure database exists or create it manually

**Error: Permission denied**
- Ensure your database user has CREATE TABLE permissions
- For PostgreSQL: `GRANT ALL PRIVILEGES ON DATABASE your_db TO your_user;`
- For MySQL: `GRANT ALL PRIVILEGES ON your_db.* TO 'your_user'@'%';`

## Migration Validation

After migration, verify your data:

### PostgreSQL
```sql
-- Check migrated users
SELECT COUNT(*) FROM appwrite_users;

-- Check migrated collections
\dt collection_*

-- Sample data from a collection
SELECT * FROM collection_your_collection_id LIMIT 5;
```

### MySQL
```sql
-- Check migrated users
SELECT COUNT(*) FROM appwrite_users;

-- Check migrated collections
SHOW TABLES LIKE 'collection_%';

-- Sample data from a collection
SELECT * FROM collection_your_collection_id LIMIT 5;
```

### MongoDB
```javascript
// Check migrated users
db.appwrite_users.countDocuments()

// Check migrated collections
show collections

// Sample data from a collection
db.collection_your_collection_id.find().limit(5)
```

## Next Steps After Migration

1. **Verify Data Integrity**
   - Compare record counts between Appwrite and target database
   - Spot-check critical data fields
   - Test application functionality with new database

2. **Update Application Code**
   - Replace Appwrite SDK calls with your new database client
   - Update authentication logic
   - Modify queries to work with your new database schema

3. **Performance Optimization**
   - Add necessary indexes for your queries
   - Optimize database configuration
   - Set up backup and monitoring

4. **Security Review**
   - Update connection strings and credentials
   - Review database user permissions
   - Implement proper security measures

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the migration logs for specific error messages
- Ensure all prerequisites are met for your target database

Remember: You have until **September 1, 2025** to complete your migration!