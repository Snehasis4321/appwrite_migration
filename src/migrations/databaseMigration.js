import AppwriteClient from '../config/appwrite.js';
import DatabaseManager from '../config/database.js';

class DatabaseMigration {
    constructor(targetDbType) {
        this.appwrite = new AppwriteClient();
        this.targetDb = new DatabaseManager(targetDbType);
    }

    async migrate() {
        try {
            console.log('🚀 Starting database migration...');
            
            await this.targetDb.connect();
            await this.targetDb.createCollectionMetadataTable();

            const databases = await this.appwrite.getAllDatabases();
            console.log(`📊 Found ${databases.length} databases to migrate`);

            for (const database of databases) {
                console.log(`\n📁 Processing database: ${database.name} (${database.$id})`);
                await this.migrateDatabase(database);
            }

            console.log('✅ Database migration completed!');
        } catch (error) {
            console.error('❌ Database migration failed:', error);
            throw error;
        } finally {
            await this.targetDb.disconnect();
        }
    }

    async migrateDatabase(database) {
        try {
            const collections = await this.appwrite.getCollections(database.$id);
            console.log(`  📋 Found ${collections.length} collections in database ${database.name}`);

            for (const collection of collections) {
                console.log(`    📝 Processing collection: ${collection.name} (${collection.$id})`);
                await this.migrateCollection(database.$id, collection);
            }
        } catch (error) {
            console.error(`Error migrating database ${database.name}:`, error);
            throw error;
        }
    }

    async migrateCollection(databaseId, collection) {
        try {
            const attributes = await this.appwrite.getAttributes(databaseId, collection.$id);
            console.log(`      🏷️  Found ${attributes.length} attributes in collection ${collection.name}`);

            const tableName = await this.targetDb.createCollectionTable(collection.$id, attributes, collection.name);
            
            // Store collection metadata for reference
            await this.targetDb.insertCollectionMetadata(collection.$id, tableName, collection.name, databaseId);

            await this.migrateDocuments(databaseId, collection.$id, collection.name, tableName);
        } catch (error) {
            console.error(`Error migrating collection ${collection.name}:`, error);
            throw error;
        }
    }

    async migrateDocuments(databaseId, collectionId, collectionName, tableName) {
        try {
            // First, get the total count of documents
            const totalCount = await this.appwrite.getDocumentCount(databaseId, collectionId);
            console.log(`        📊 Total documents in collection: ${totalCount}`);

            if (totalCount === 0) {
                console.log(`        ℹ️  No documents to migrate from collection ${collectionName}`);
                return;
            }

            let offset = 0;
            const limit = 100;
            let totalMigrated = 0;
            const totalBatches = Math.ceil(totalCount / limit);

            while (offset < totalCount) {
                const currentBatch = Math.floor(offset / limit) + 1;
                console.log(`        📦 Processing batch ${currentBatch}/${totalBatches} (offset: ${offset})`);

                const documentsResponse = await this.appwrite.getDocuments(databaseId, collectionId, limit, offset);
                const documents = documentsResponse.documents;

                console.log(`        📝 Retrieved ${documents.length} documents in this batch`);

                if (documents.length === 0) {
                    console.log(`        ⚠️  No documents returned at offset ${offset}, stopping migration`);
                    break;
                }

                for (const document of documents) {
                    const transformedDoc = this.transformDocument(document);
                    await this.targetDb.insertDocument(tableName, transformedDoc);
                    totalMigrated++;
                }

                offset += limit;

                // Safety check: if we got fewer documents than expected and we're not at the end
                if (documents.length < limit && offset < totalCount) {
                    console.log(`        ⚠️  Got ${documents.length} documents but expected ${Math.min(limit, totalCount - (offset - limit))}`);
                }
            }

            console.log(`        ✅ Migrated ${totalMigrated}/${totalCount} documents from collection ${collectionName} -> table ${tableName}`);
            
            if (totalMigrated !== totalCount) {
                console.log(`        ⚠️  WARNING: Expected ${totalCount} documents but migrated ${totalMigrated}`);
            }
        } catch (error) {
            console.error(`Error migrating documents from collection ${collectionName}:`, error);
            throw error;
        }
    }

    transformDocument(document) {
        const transformed = {
            id: document.$id,
            created_at: document.$createdAt ? new Date(document.$createdAt) : new Date(),
            updated_at: document.$updatedAt ? new Date(document.$updatedAt) : new Date()
        };

        for (const [key, value] of Object.entries(document)) {
            if (!key.startsWith('$') && key !== 'id') {
                if (value === null || value === undefined) {
                    transformed[key] = null;
                } else if (typeof value === 'object') {
                    transformed[key] = JSON.stringify(value);
                } else {
                    transformed[key] = value;
                }
            }
        }

        return transformed;
    }
}

export default DatabaseMigration;