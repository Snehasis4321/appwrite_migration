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

            await this.targetDb.createCollectionTable(collection.$id, attributes);

            await this.migrateDocuments(databaseId, collection.$id, collection.name);
        } catch (error) {
            console.error(`Error migrating collection ${collection.name}:`, error);
            throw error;
        }
    }

    async migrateDocuments(databaseId, collectionId, collectionName) {
        try {
            let offset = 0;
            const limit = 100;
            let totalMigrated = 0;

            while (true) {
                const documentsResponse = await this.appwrite.getDocuments(databaseId, collectionId, limit, offset);
                const documents = documentsResponse.documents;

                if (documents.length === 0) {
                    break;
                }

                console.log(`        📦 Processing ${documents.length} documents (offset: ${offset})`);

                for (const document of documents) {
                    const transformedDoc = this.transformDocument(document);
                    await this.targetDb.insertDocument(collectionId, transformedDoc);
                    totalMigrated++;
                }

                offset += limit;

                if (documents.length < limit) {
                    break;
                }
            }

            console.log(`        ✅ Migrated ${totalMigrated} documents from collection ${collectionName}`);
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
                if (typeof value === 'object' && value !== null) {
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