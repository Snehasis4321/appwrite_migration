import AppwriteClient from '../config/appwrite.js';
import DatabaseManager from '../config/database.js';
import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import fetch from 'node-fetch';
import path from 'path';

class StorageMigration {
    constructor(targetDbType, storageProvider = 'cloudinary') {
        this.appwrite = new AppwriteClient();
        this.targetDb = new DatabaseManager(targetDbType);
        this.migratedFiles = new Map(); // Track migrated files to avoid duplicates
        this.failedFiles = [];
        this.storageProvider = storageProvider;
        
        if (storageProvider === 'cloudinary') {
            // Configure Cloudinary
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            });
        } else if (storageProvider === 's3') {
            // Configure AWS S3
            this.s3Client = new S3Client({
                region: process.env.AWS_REGION,
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                }
            });
        }
    }

    async migrateStorage(storageConfig) {
        try {
            console.log('🗂️ Starting storage migration...');
            
            // Validate and test storage provider config
            if (!this.validateStorageConfig()) {
                if (this.storageProvider === 'cloudinary') {
                    throw new Error('Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
                } else {
                    throw new Error('AWS S3 configuration missing. Please set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_BUCKET_NAME');
                }
            }

            // Test storage connection before proceeding
            console.log(`🔍 Testing ${this.storageProvider} connection...`);
            await this.testStorageConnection();
            console.log(`✅ ${this.storageProvider} connection successful`);

            await this.targetDb.connect();

            let totalMigrated = 0;
            let totalUpdated = 0;

            // Process each collection that has file attributes
            for (const collectionConfig of storageConfig.collections) {
                console.log(`\n📁 Processing collection: ${collectionConfig.name}`);
                
                const result = await this.migrateCollectionFiles(collectionConfig);
                totalMigrated += result.filesTransferred;
                totalUpdated += result.documentsUpdated;
            }

            console.log(`\n✅ Storage migration completed!`);
            console.log(`📊 Summary:`);
            console.log(`   • Files transferred: ${totalMigrated}`);
            console.log(`   • Documents updated: ${totalUpdated}`);
            console.log(`   • Failed files: ${this.failedFiles.length}`);

            if (this.failedFiles.length > 0) {
                console.log(`\n⚠️  Failed files:`);
                this.failedFiles.forEach(file => console.log(`   - ${file.id}: ${file.error}`));
            }

        } catch (error) {
            console.error('❌ Storage migration failed:', error);
            throw error;
        } finally {
            await this.targetDb.disconnect();
        }
    }

    async migrateCollectionFiles(collectionConfig) {
        const { name, databaseId, collectionId, fileAttributes, tableName, bucketId } = collectionConfig;
        
        let filesTransferred = 0;
        let documentsUpdated = 0;
        let offset = 0;
        const limit = 50; // Smaller batch for file processing

        while (true) {
            const documentsResponse = await this.appwrite.getDocuments(databaseId, collectionId, limit, offset);
            const documents = documentsResponse.documents;

            if (documents.length === 0) break;

            console.log(`    📦 Processing ${documents.length} documents (offset: ${offset})`);

            for (const document of documents) {
                const updates = {};
                let hasUpdates = false;

                // Process each file attribute
                for (const attr of fileAttributes) {
                    const fileValue = document[attr.field];
                    
                    if (fileValue) {
                        // Add bucket ID to attribute config for file processing
                        const attrWithBucket = { ...attr, bucketId: bucketId };
                        const newUrl = await this.processFileField(fileValue, attrWithBucket);
                        if (newUrl && newUrl !== fileValue) {
                            updates[attr.field] = newUrl;
                            hasUpdates = true;
                            filesTransferred++;
                        }
                    }
                }

                // Update document in target database if there are changes
                if (hasUpdates) {
                    const docId = document.$id || document.id;
                    await this.updateDocumentUrls(tableName, docId, updates);
                    documentsUpdated++;
                }
            }

            offset += limit;
            if (documents.length < limit) break;
        }

        console.log(`    ✅ Collection ${name}: ${filesTransferred} files transferred, ${documentsUpdated} documents updated`);
        return { filesTransferred, documentsUpdated };
    }

    async processFileField(fileValue, attributeConfig) {
        try {
            if (attributeConfig.type === 'single') {
                return await this.migrateFile(fileValue, attributeConfig);
            } else if (attributeConfig.type === 'array') {
                const fileIds = Array.isArray(fileValue) ? fileValue : JSON.parse(fileValue);
                const newUrls = [];
                
                for (const fileId of fileIds) {
                    const newUrl = await this.migrateFile(fileId, attributeConfig);
                    if (newUrl) newUrls.push(newUrl);
                }
                
                return attributeConfig.returnType === 'json' ? JSON.stringify(newUrls) : newUrls;
            } else if (attributeConfig.type === 'url_extract') {
                // Extract file ID from Appwrite URL and migrate
                const fileId = this.extractFileIdFromUrl(fileValue);
                if (fileId) {
                    return await this.migrateFile(fileId, attributeConfig);
                }
            }
            
            return fileValue; // Return original if no processing needed
        } catch (error) {
            console.error(`Error processing file field:`, error);
            return fileValue;
        }
    }

    async migrateFile(fileId, attributeConfig) {
        // Check if already migrated
        if (this.migratedFiles.has(fileId)) {
            return this.migratedFiles.get(fileId);
        }

        try {
            console.log(`      📄 Migrating file: ${fileId}`);

            // Get file metadata first to get original filename and extension
            const fileMetadata = await this.getFileMetadata(fileId, attributeConfig.bucketId);
            console.log(`        📋 File info: ${fileMetadata.name} (${fileMetadata.mimeType})`);

            // Download file from Appwrite
            const fileBuffer = await this.downloadFromAppwrite(fileId, attributeConfig.bucketId);
            
            // Upload to storage provider with proper filename
            const newUrl = await this.uploadToStorageProvider(fileBuffer, fileId, attributeConfig, fileMetadata);
            
            // Cache the result
            this.migratedFiles.set(fileId, newUrl);
            
            return newUrl;
            
        } catch (error) {
            console.error(`      ❌ Failed to migrate file ${fileId}:`, error.message);
            this.failedFiles.push({ id: fileId, error: error.message });
            return null;
        }
    }

    async getFileMetadata(fileId, bucketId) {
        try {
            // Use Appwrite SDK to get file metadata
            const file = await this.appwrite.storage.getFile(bucketId, fileId);
            return {
                name: file.name,
                mimeType: file.mimeType,
                size: file.sizeOriginal
            };
        } catch (error) {
            console.warn(`        ⚠️  Could not get file metadata for ${fileId}, using fallback`);
            // Fallback: try to determine from file content or use generic name
            return {
                name: `${fileId}.bin`, // Generic fallback
                mimeType: 'application/octet-stream',
                size: 0
            };
        }
    }

    async downloadFromAppwrite(fileId, bucketId) {
        try {
            // Use view endpoint with project and mode parameters for admin access
            const downloadUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${process.env.APPWRITE_PROJECT_ID}&mode=admin`;
            
            console.log(`        📥 Downloading from: ${downloadUrl}`);
            
            const response = await fetch(downloadUrl, {
                headers: {
                    'X-Appwrite-Key': process.env.APPWRITE_API_KEY
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
            }

            return await response.buffer();
        } catch (error) {
            throw new Error(`Download failed: ${error.message}`);
        }
    }

    async uploadToStorageProvider(fileBuffer, fileId, attributeConfig, fileMetadata) {
        if (this.storageProvider === 'cloudinary') {
            return await this.uploadToCloudinary(fileBuffer, fileId, attributeConfig, fileMetadata);
        } else if (this.storageProvider === 's3') {
            return await this.uploadToS3(fileBuffer, fileId, attributeConfig, fileMetadata);
        }
        throw new Error(`Unsupported storage provider: ${this.storageProvider}`);
    }

    async uploadToCloudinary(fileBuffer, fileId, attributeConfig, fileMetadata) {
        return new Promise((resolve, reject) => {
            // Use original filename without extension as public_id, let Cloudinary handle the format
            const baseFilename = fileMetadata.name.replace(/\.[^/.]+$/, "") || fileId;
            const folderPrefix = process.env.STORAGE_FOLDER_PREFIX || 'appwrite_migration';
            
            const options = {
                public_id: `${folderPrefix}/${baseFilename}`,
                folder: attributeConfig.cloudinaryFolder || folderPrefix,
                resource_type: 'auto', // Handles images, videos, and other files
                ...attributeConfig.cloudinaryOptions || {}
            };

            cloudinary.uploader.upload_stream(options, (error, result) => {
                if (error) {
                    reject(new Error(`Cloudinary upload failed: ${error.message}`));
                } else {
                    resolve(result.secure_url);
                }
            }).end(fileBuffer);
        });
    }

    async uploadToS3(fileBuffer, fileId, attributeConfig, fileMetadata) {
        try {
            // Use original filename with proper extension
            const filename = fileMetadata.name || `${fileId}.bin`;
            const folderPrefix = process.env.STORAGE_FOLDER_PREFIX || 'appwrite_migration';
            const key = `${attributeConfig.s3Folder || folderPrefix}/${filename}`;
            
            const command = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
                Body: fileBuffer,
                ContentType: fileMetadata.mimeType || this.getContentType(filename),
                ...attributeConfig.s3Options || {}
            });

            await this.s3Client.send(command);
            
            // Return the S3 URL
            const region = process.env.AWS_REGION;
            const bucket = process.env.AWS_BUCKET_NAME;
            // Only encode special characters in the filename, not the entire path
            const encodedKey = key.split('/').map(segment => encodeURIComponent(segment)).join('/');
            return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
            
        } catch (error) {
            throw new Error(`S3 upload failed: ${error.message}`);
        }
    }

    async updateDocumentUrls(tableName, documentId, updates) {
        if (this.targetDb.type === 'mongodb') {
            const db = this.targetDb.connection.db(process.env.MONGODB_DATABASE || 'appwrite_migration');
            await db.collection(tableName).updateOne(
                { id: documentId },
                { $set: updates }
            );
        } else {
            // SQL databases
            const fields = Object.keys(updates).map(key => 
                this.targetDb.type === 'postgres' ? `"${key}" = $${Object.keys(updates).indexOf(key) + 2}` : `\`${key}\` = ?`
            ).join(', ');
            
            const values = Object.values(updates);
            values.unshift(documentId); // Add document ID at the beginning
            
            const sql = `UPDATE ${tableName} SET ${fields} WHERE ${this.targetDb.type === 'postgres' ? '"id" = $1' : '`id` = ?'}`;
            
            if (this.targetDb.type === 'postgres') {
                await this.targetDb.connection.query(sql, values);
            } else {
                await this.targetDb.connection.execute(sql, values);
            }
        }
    }

    extractFileIdFromUrl(url) {
        // Extract Appwrite file ID from URLs like:
        // https://cloud.appwrite.io/v1/storage/buckets/[bucket]/files/[fileId]/view
        const match = url.match(/\/files\/([^\/]+)\/(?:view|download)/);
        return match ? match[1] : null;
    }

    validateStorageConfig() {
        if (this.storageProvider === 'cloudinary') {
            return process.env.CLOUDINARY_CLOUD_NAME && 
                   process.env.CLOUDINARY_API_KEY && 
                   process.env.CLOUDINARY_API_SECRET;
        } else if (this.storageProvider === 's3') {
            return process.env.AWS_REGION && 
                   process.env.AWS_ACCESS_KEY_ID && 
                   process.env.AWS_SECRET_ACCESS_KEY && 
                   process.env.AWS_BUCKET_NAME;
        }
        return false;
    }

    getContentType(fileName) {
        const ext = path.extname(fileName).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.avi': 'video/x-msvideo',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    async testStorageConnection() {
        if (this.storageProvider === 'cloudinary') {
            return await this.testCloudinaryConnection();
        } else if (this.storageProvider === 's3') {
            return await this.testS3Connection();
        }
        throw new Error(`Unsupported storage provider: ${this.storageProvider}`);
    }

    async testCloudinaryConnection() {
        return new Promise((resolve, reject) => {
            cloudinary.api.ping((error, result) => {
                if (error) {
                    reject(new Error(`Cloudinary API error: ${error.message}`));
                } else {
                    resolve(result);
                }
            });
        });
    }

    async testS3Connection() {
        try {
            const command = new HeadBucketCommand({
                Bucket: process.env.AWS_BUCKET_NAME
            });

            await this.s3Client.send(command);
        } catch (error) {
            throw new Error(`S3 connection failed: ${error.message}`);
        }
    }
}

export default StorageMigration;