# 🚀 Appwrite Migration Tool

<div align="center">

**Migrate your Appwrite data to PostgreSQL, MySQL, or MongoDB with complete storage migration before the September 1, 2025 deadline**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![ES Modules](https://img.shields.io/badge/ES-Modules-blue.svg)](https://nodejs.org/api/esm.html)

⚠️ **Critical Deadline: September 1, 2025**

- You can only keep 2 project in you appwrite free plan
- Migrate your data before it's deleted or removed!

## 🗄️ Supported Databases & Storage

<div align="center">

### Databases
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

### Storage Providers
![AWS S3](https://img.shields.io/badge/AWS%20S3-FF9900?style=for-the-badge&logo=amazon-s3&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

</div>

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

# Storage Migration Provider (choose one)
STORAGE_PROVIDER=cloudinary  # recommended for images/videos
# STORAGE_PROVIDER=s3        # flexible file storage

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

Must do this checking before starting migration.

```bash
pnpm test-connections
```

This tests all database connections **and storage providers** to show which ones are ready for migration.

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

### 6. Migrate Storage (Complete File Migration)

Transform your Appwrite file storage to modern cloud providers with automatic database URL updates:

```bash
# Automated storage migration (recommended)
node src/scripts/storage.js

# Or using npm script
pnpm migrate-storage
```

#### 🚀 Automated Storage Migration Features

- **🔍 Smart Detection**: Automatically detects file attributes in your collections
- **📁 Organized Upload**: Creates structured folders (profile-pics, documents, etc.)
- **🔄 Database Updates**: Automatically replaces file IDs with cloud URLs
- **🛡️ Error Handling**: Robust handling of missing files and network issues
- **📊 Progress Tracking**: Real-time migration progress and statistics

#### Migration Process:

1. **Auto-Detection**: Scans collections for file-related fields (`profile_pic`, `image`, `avatar`, etc.)
2. **File Download**: Downloads files from Appwrite storage using admin API
3. **Cloud Upload**: Uploads to your chosen provider with organized folder structure
4. **Database Update**: Replaces Appwrite file IDs with cloud URLs in your database
5. **Verification**: Provides migration summary and success statistics

## 📊 What Gets Migrated

### ✅ Fully Supported

| Data Type       | PostgreSQL | MySQL | MongoDB | Notes                                |
| --------------- | ---------- | ----- | ------- | ------------------------------------ |
| **Users**       | ✅         | ✅    | ✅      | Complete user profiles, auth data    |
| **Collections** | ✅         | ✅    | ✅      | Schema, attributes, constraints      |
| **Documents**   | ✅         | ✅    | ✅      | All document data with relationships |
| **Relationships** | ✅         | ✅    | ✅      | Auto-detected and migrated as JSON/TEXT |
| **Metadata**    | ✅         | ✅    | ✅      | Collection mapping and timestamps    |

### ✅ Storage Migration (Complete Solution!)

| Storage Type  | Support | Auto-Detection | Database Updates | Notes                                    |
| ------------- | ------- | -------------- | ---------------- | ---------------------------------------- |
| **Images**    | ✅      | ✅            | ✅               | JPG, PNG, GIF, WebP with URL updates    |
| **Documents** | ✅      | ✅            | ✅               | PDF, DOCX, TXT, etc. with metadata      |
| **Videos**    | ✅      | ✅            | ✅               | MP4, MOV, AVI migrated with processing   |
| **Audio**     | ✅      | ✅            | ✅               | MP3, WAV, other formats supported       |
| **Any Files** | ✅      | ✅            | ✅               | All file types with proper MIME handling |

**Key Features:**
- **Automatic URL Updates**: Database fields automatically updated with new cloud URLs
- **Organized Structure**: Files organized in logical folders (profile-pics, documents, etc.)
- **Metadata Preservation**: Original filenames and MIME types preserved
- **Resume Capability**: Can resume interrupted migrations
- **Error Recovery**: Handles missing files and network issues gracefully

### 🔗 Relationship Handling

The migration tool **automatically detects and migrates Appwrite relationships**:

- **Auto-Detection**: Scans documents to find relationship fields (collection IDs as keys)
- **SQL Databases**: Relationships stored as TEXT/JSON for compatibility
- **MongoDB**: Relationships preserved in native format (arrays, objects)
- **Data Preservation**: All relationship data migrated without loss

**Example**: A relationship like `"661bf8e58d36ea134982": ["user1", "user2"]` becomes:
- **PostgreSQL/MySQL**: `{"661bf8e58d36ea134982": "[\"user1\", \"user2\"]"}` (JSON string)
- **MongoDB**: `{"661bf8e58d36ea134982": ["user1", "user2"]}` (native array)

### ❌ Not Migrated

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

### Storage Migration Configuration

Choose your preferred cloud storage provider:

#### Option 1: AWS S3 (Recommended - Most Flexible)

```env
# AWS S3 Configuration
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_BUCKET_NAME=your_bucket_name
STORAGE_FOLDER_PREFIX=my_app_files  # Optional: custom folder prefix
```

**S3 Advantages:**
- ✅ **Cost Effective**: Pay only for what you use
- ✅ **Direct Access**: Files accessible via direct URLs
- ✅ **CDN Integration**: Works with CloudFront for faster delivery
- ✅ **Any File Type**: No restrictions on file formats or sizes

#### Option 2: Cloudinary (Great for Media)

```env
# Cloudinary Configuration
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STORAGE_FOLDER_PREFIX=my_app  # Optional: custom folder prefix
```

**Cloudinary Advantages:**
- ✅ **Image Processing**: Automatic optimization and transformations
- ✅ **Video Handling**: Advanced video processing capabilities
- ✅ **Built-in CDN**: Global content delivery included
- ✅ **Mobile Optimization**: Automatic format selection (WebP, AVIF)

#### 🚀 Automated Storage Migration Process

1. **Configuration Detection**: 
   ```bash
   node src/scripts/storage.js
   ```

2. **Auto-Discovery**: 
   - Scans all collections for file-related attributes
   - Detects `profile_pic`, `image`, `avatar`, `attachment`, etc.
   - Identifies file ID patterns and Appwrite URLs

3. **Smart Migration**:
   - Downloads files using Appwrite admin API
   - Preserves original filenames and metadata
   - Uploads to your chosen provider with organized structure
   - Updates database records with new cloud URLs

4. **Database Updates**:
   ```
   Before: profile_pic = "662cab7052d114fd0f65"
   After:  profile_pic = "https://your-bucket.s3.us-east-1.amazonaws.com/profile-pics/avatar.jpg"
   ```

#### Migration Results Example

```
🎉 Storage migration completed successfully!

📊 Summary:
   • Files transferred: 156
   • Documents updated: 156  
   • Failed files: 0
   • Storage provider: AWS S3
   • Total size: 245.7 MB

File Organization:
   📁 profile-pics/     → 45 files
   📁 documents/        → 78 files  
   📁 chat-attachments/ → 33 files

✅ All database records updated with cloud URLs
```

#### Supported File Field Types

| Type                  | Description                                                         | Example                          |
| --------------------- | ------------------------------------------------------------------- | -------------------------------- |
| **Single File ID**    | `"507f1f77bcf86cd799439011"`                                        | Profile pictures, documents      |
| **Array of File IDs** | `["id1", "id2", "id3"]`                                             | Image galleries, attachments     |
| **Appwrite URLs**     | `https://cloud.appwrite.io/v1/storage/buckets/bucket/files/id/view` | Full URLs to extract and migrate |

#### Example Configuration

```json
{
  "collections": [
    {
      "name": "user_profiles",
      "tableName": "user_profiles",
      "bucketId": "user_uploads",
      "cloudinaryFolder": "users", // For Cloudinary
      "s3Folder": "users", // For AWS S3
      "fileAttributes": [
        {
          "field": "avatar",
          "type": "single"
        },
        {
          "field": "gallery",
          "type": "array",
          "returnType": "json"
        }
      ]
    }
  ]
}
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

### Storage Migration Troubleshooting

#### AWS S3 Setup & Issues

**Initial S3 Setup:**

1. **Create S3 Bucket**:
   ```bash
   # Create bucket in your preferred region
   aws s3 mb s3://your-bucket-name --region us-east-1
   ```

2. **Create IAM User with S3 Permissions**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject", 
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       }
     ]
   }
   ```

3. **Configure Bucket for Public Access** (if needed):
   ```bash
   # Allow public read access to files
   aws s3api put-bucket-policy --bucket your-bucket-name --policy '{
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::your-bucket-name/*"
     }]
   }'
   ```

**Common S3 Issues:**

| Error | Solution |
|-------|----------|
| `Access Denied` | Check IAM permissions and bucket policy |
| `Bucket not found` | Verify bucket name and region in `.env` |
| `Invalid credentials` | Regenerate AWS access keys |
| `Files not accessible` | Set bucket to public read or configure CloudFront |

#### Cloudinary Setup & Issues

**Cloudinary Setup:**
1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get credentials from Dashboard → Settings → Security
3. Add to `.env` file

**Common Cloudinary Issues:**

| Error | Solution |
|-------|----------|
| `Invalid cloud name` | Check cloud name in Cloudinary dashboard |
| `API key invalid` | Regenerate API key/secret in Cloudinary |
| `Upload failed` | Check file size limits and format restrictions |
| `Transformation errors` | Verify Cloudinary plan supports transformations |

#### Storage Migration Issues

**File Download Failures:**
```bash
# Check Appwrite API access
curl -H "X-Appwrite-Key: YOUR_API_KEY" \
     "YOUR_ENDPOINT/storage/buckets/BUCKET_ID/files"
```

**Database Update Failures:**
- Verify database connection is working
- Check that table and column names match your schema
- Ensure adequate database permissions

**Large File Issues:**
- Increase Node.js memory: `node --max-old-space-size=4096 src/scripts/storage.js`
- Use batch processing for large datasets
- Monitor network timeouts for slow connections

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

## 🆘 Support & Help

Having issues with migration or storage? Here's your support roadmap:

### 📋 Before Getting Help

1. **Test Connections**: `pnpm test-connections`
2. **Check Configuration**: Verify all credentials in `.env`
3. **Review Logs**: Look for specific error messages in console output
4. **Verify Prerequisites**: Ensure target database is accessible

### 🔧 Common Solutions

| Issue Type | Quick Fix | Details |
|------------|-----------|---------|
| **Database Connection** | Check credentials & network | See database troubleshooting above |
| **Storage Upload Fails** | Verify S3/Cloudinary setup | Check storage troubleshooting section |
| **Migration Stuck** | Check Appwrite API limits | Verify API key permissions |
| **File URLs Wrong** | Database update failed | Ensure proper database permissions |

### 🚀 Storage Migration Specific Help

**Quick Storage Migration Test:**
```bash
# Test S3 connection
aws s3 ls s3://your-bucket-name

# Test Cloudinary connection  
curl -u "your_api_key:your_api_secret" \
     "https://api.cloudinary.com/v1_1/your_cloud_name/resources/image"

# Run storage migration
node src/scripts/storage.js
```

**Migration Logs Location:**
- Console output shows real-time progress
- Check for `❌ Failed files:` messages
- Database connection status shown during migration

### 📞 Getting Further Help

1. **GitHub Issues**: Report bugs and request features
2. **Documentation**: This README covers 99% of use cases
3. **Error Messages**: Include full error output when asking for help

---

<div align="center">

## ⏰ Critical Reminder

**September 1, 2025 Deadline - Migrate Today!**

🗄️ **Complete Migration**: Database + Storage  
🔄 **Automated Process**: Run & verify  
✅ **Future-Proof**: Modern cloud infrastructure

</div>
