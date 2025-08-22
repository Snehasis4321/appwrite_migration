# 🚀 Appwrite Migration Tool

<div align="center">

**Migrate your Appwrite data to PostgreSQL, MySQL, or MongoDB before the September 1, 2025 deadline**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![ES Modules](https://img.shields.io/badge/ES-Modules-blue.svg)](https://nodejs.org/api/esm.html)

⚠️ **Critical Deadline: September 1, 2025**

- You can only keep 2 project in you appwrite free plan
- Migrate your data before it's deleted or removed!

</div>

## 📖 Overview

This tool provides a **complete migration solution** for moving your Appwrite data to traditional databases. Built with Node.js and ES modules, it handles users, collections, documents, and metadata with proper data type mapping and error handling.

### ✨ Key Features

- 🔄 **Multi-Database Support**: PostgreSQL, MySQL, MongoDB
- 📊 **Complete Data Migration**: Users, collections, documents, metadata
- 🏷️ **Readable Table Names**: No more cryptic collection IDs
- 🔍 **Smart Pagination**: Handles large datasets efficiently
- ⚡ **30-Second Timeouts**: Robust connection handling
- 🛡️ **Error Recovery**: Handles null values, reserved keywords, data type limits
- 🧪 **Connection Testing**: Test all databases before migration
- 📱 **Interactive CLI**: User-friendly command-line interface

## 🚀 Quick Start

### 1. Clone & Setup

```bash
git clone <repository-url>
cd appwrite_migration
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your credentials:

```env
# Appwrite Configuration (Required)
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_admin_api_key_here

# Choose your target database (use any one each time)
TARGET_DATABASE=postgres   # if you want postgres
TARGET_DATABASE=mysql      # if you want mysql
TARGET_DATABASE=mongodb    # if you want mongodb

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=appwrite_migration
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=your_password

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=appwrite_migration
MYSQL_USERNAME=root
MYSQL_PASSWORD=password

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/appwrite_migration
MONGODB_DATABASE=appwrite_migration
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Test Connections (Recommended)

```bash
pnpm test-connections
```

This tests all database connections and shows which ones are ready for migration.

### 5. Run Migration

Choose your preferred method:

#### Interactive CLI (Recommended)

```bash
pnpm start
```

#### Direct Migration

```bash
# PostgreSQL
node src/scripts/postgres.js

# MySQL
node src/scripts/mysql.js

# MongoDB
node src/scripts/mongodb.js
```

#### Using environment config

```bash
pnpm migrate
```

## 📊 What Gets Migrated

### ✅ Fully Supported

| Data Type       | PostgreSQL | MySQL | MongoDB | Notes                                |
| --------------- | ---------- | ----- | ------- | ------------------------------------ |
| **Users**       | ✅         | ✅    | ✅      | Complete user profiles, auth data    |
| **Collections** | ✅         | ✅    | ✅      | Schema, attributes, constraints      |
| **Documents**   | ✅         | ✅    | ✅      | All document data with relationships |
| **Metadata**    | ✅         | ✅    | ✅      | Collection mapping and timestamps    |

### ❌ Not Migrated

- **File Storage** - Use cloud storage (AWS S3, Cloudinary)
- **Functions** - Reimplement in your new stack
- **Real-time** - Set up with your database
- **API Keys** - Generate new ones for your system

## 🗄️ Database-Specific Features

### PostgreSQL

- **JSONB Support**: High-performance JSON queries
- **Full-Text Search**: Native search capabilities
- **Advanced Types**: Support for all PostgreSQL data types
- **Reliable**: Best for complex applications

### MySQL

- **JSON Type**: Native JSON support (MySQL 5.7+)
- **Wide Compatibility**: Works with most hosting providers
- **Auto-Conversion**: Large VARCHAR → TEXT automatically
- **Performance**: Optimized for web applications

### MongoDB

- **Document Native**: Closest to Appwrite's structure
- **Flexible Schema**: No rigid table structure
- **Nested Objects**: Preserves complex data relationships
- **Atlas Ready**: Works with MongoDB Atlas cloud

## 🔧 Advanced Configuration

### Custom Database Names

```env
# PostgreSQL/MySQL use database name from config
POSTGRES_DATABASE=my_custom_name

# MongoDB can override database name
MONGODB_DATABASE=my_custom_name
```

### Connection Timeouts

All databases use **30-second timeouts** for reliable connections to remote databases.

### Large Data Handling

- **Batch Size**: 100 documents per batch (configurable)
- **Memory Efficient**: Processes data in chunks
- **Progress Tracking**: Shows real-time migration progress

## 🛠️ Troubleshooting

### Connection Issues

| Error                          | Solution                                |
| ------------------------------ | --------------------------------------- |
| **Appwrite connection failed** | Check endpoint, project ID, and API key |
| **Database timeout**           | Verify host, port, credentials          |
| **Permission denied**          | Grant CREATE TABLE permissions          |
| **IP not whitelisted**         | Add IP to MongoDB Atlas (if using)      |

### Common Fixes

**PostgreSQL Permission Error:**

```sql
GRANT ALL PRIVILEGES ON DATABASE your_db TO your_user;
```

**MySQL Permission Error:**

```sql
GRANT ALL PRIVILEGES ON your_db.* TO 'your_user'@'%';
```

**MongoDB Atlas Connection:**

1. Go to Network Access in MongoDB Atlas
2. Add your current IP address
3. Or add `0.0.0.0/0` for testing (less secure)

### Data Validation

After migration, verify your data:

**PostgreSQL:**

```sql
-- Check users
SELECT COUNT(*) FROM appwrite_users;

-- List collections
\dt

-- Sample data
SELECT * FROM well_wishers_users LIMIT 5;
```

**MySQL:**

```sql
-- Check users
SELECT COUNT(*) FROM appwrite_users;

-- List tables
SHOW TABLES;

-- Sample data
SELECT * FROM well_wishers_users LIMIT 5;
```

**MongoDB:**

```javascript
// Check users
db.appwrite_users.countDocuments()

// List collections
show collections

// Sample data
db.well_wishers_users.find().limit(5)
```

## 📈 Migration Results

After successful migration, you'll see:

```
🎉 Migration completed successfully!

📊 Migration Summary:
   • Users migrated: 15 ✅
   • Collections migrated: 7 ✅
   • Documents migrated: 1,247 ✅
   • Target database: PostgreSQL ✅

Next steps:
1. Verify data in your database
2. Update your application code
3. Test thoroughly before going live
```

## 🚦 Post-Migration Steps

### 1. Verify Data Integrity

- Compare record counts between Appwrite and target database
- Spot-check critical data fields
- Test key application functionality

### 2. Update Application Code

- Replace Appwrite SDK calls with database client
- Update authentication logic
- Modify queries for your new database schema

### 3. Performance Optimization

- Add indexes for frequently queried fields
- Optimize database configuration
- Set up monitoring and backups

### 4. Security Review

- Update connection strings and credentials
- Review database user permissions
- Implement proper access controls

## 🤝 Contributing

Found a bug or want to add a feature? Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - feel free to use this tool for your own migrations.

## ⚠️ Disclaimer

This tool is provided as-is. Always **backup your data** and **test thoroughly** before using in production. The authors are not responsible for any data loss.

## 🆘 Support

Having issues? Here's how to get help:

1. **Check the troubleshooting section** above
2. **Run connection tests**: `pnpm test-connections`
3. **Review migration logs** for specific error messages
4. **Ensure prerequisites** are met for your target database
5. **Open an issue** if you find a bug

---

<div align="center">

**⏰ Remember: September 1, 2025 deadline - Don't wait!**

</div>
