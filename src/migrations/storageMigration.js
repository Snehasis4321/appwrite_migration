import AppwriteClient from '../config/appwrite.js';
import DatabaseManager from '../config/database.js';
import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
            
            // Validate storage provider config
            if (!this.validateStorageConfig()) {
                if (this.storageProvider === 'cloudinary') {
                    throw new Error('Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
                } else {
                    throw new Error('AWS S3 configuration missing. Please set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_BUCKET_NAME');
                }
            }

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
        const { name, databaseId, collectionId, fileAttributes, tableName } = collectionConfig;
        
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
                        const newUrl = await this.processFileField(fileValue, attr);
                        if (newUrl && newUrl !== fileValue) {
                            updates[attr.field] = newUrl;
                            hasUpdates = true;
                            filesTransferred++;
                        }
                    }
                }

                // Update document in target database if there are changes
                if (hasUpdates) {
                    await this.updateDocumentUrls(tableName, document.id, updates);
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

            // Download file from Appwrite
            const fileBuffer = await this.downloadFromAppwrite(fileId, attributeConfig.bucketId);
            
            // Upload to storage provider
            const newUrl = await this.uploadToStorageProvider(fileBuffer, fileId, attributeConfig);
            
            // Cache the result
            this.migratedFiles.set(fileId, newUrl);
            
            return newUrl;
            
        } catch (error) {
            console.error(`      ❌ Failed to migrate file ${fileId}:`, error.message);
            this.failedFiles.push({ id: fileId, error: error.message });
            return null;
        }
    }

    async downloadFromAppwrite(fileId, bucketId) {
        try {
            // Get file download URL from Appwrite
            const downloadUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/download`;
            
            const response = await fetch(downloadUrl, {
                headers: {
                    'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID,
                    'X-Appwrite-Key': process.env.APPWRITE_API_KEY
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.statusText}`);
            }

            return await response.buffer();
        } catch (error) {
            throw new Error(`Download failed: ${error.message}`);
        }
    }

    async uploadToStorageProvider(fileBuffer, fileId, attributeConfig) {
        if (this.storageProvider === 'cloudinary') {
            return await this.uploadToCloudinary(fileBuffer, fileId, attributeConfig);
        } else if (this.storageProvider === 's3') {
            return await this.uploadToS3(fileBuffer, fileId, attributeConfig);
        }
        throw new Error(`Unsupported storage provider: ${this.storageProvider}`);
    }

    async uploadToCloudinary(fileBuffer, fileId, attributeConfig) {
        return new Promise((resolve, reject) => {
            const options = {
                public_id: `appwrite_migration/${fileId}`,
                folder: attributeConfig.cloudinaryFolder || 'appwrite_migration',
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

    async uploadToS3(fileBuffer, fileId, attributeConfig) {
        try {
            const key = `${attributeConfig.s3Folder || 'appwrite_migration'}/${fileId}`;
            
            const command = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
                Body: fileBuffer,
                ContentType: this.getContentType(fileId),
                ...attributeConfig.s3Options || {}
            });

            await this.s3Client.send(command);
            
            // Return the S3 URL
            const region = process.env.AWS_REGION;
            const bucket = process.env.AWS_BUCKET_NAME;
            return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
            
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
}

export default StorageMigration;