import { Client, Databases, Users, Account, Storage, Query } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

class AppwriteClient {
    constructor() {
        this.client = new Client();
        this.client
            .setEndpoint(process.env.APPWRITE_ENDPOINT)
            .setProject(process.env.APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        this.databases = new Databases(this.client);
        this.users = new Users(this.client);
        this.account = new Account(this.client);
        this.storage = new Storage(this.client);
    }

    async testConnection() {
        try {
            const databases = await this.databases.list();
            console.log('✅ Connected to Appwrite project successfully');
            console.log(`📊 Found ${databases.databases.length} databases`);
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to Appwrite:', error.message);
            return false;
        }
    }

    async getAllDatabases() {
        try {
            const databases = await this.databases.list();
            return databases.databases;
        } catch (error) {
            console.error('Error fetching databases:', error);
            throw error;
        }
    }

    async getCollections(databaseId) {
        try {
            const collections = await this.databases.listCollections(databaseId);
            return collections.collections;
        } catch (error) {
            console.error(`Error fetching collections for database ${databaseId}:`, error);
            throw error;
        }
    }

    async getAttributes(databaseId, collectionId) {
        try {
            const attributes = await this.databases.listAttributes(databaseId, collectionId);
            return attributes.attributes;
        } catch (error) {
            console.error(`Error fetching attributes for collection ${collectionId}:`, error);
            throw error;
        }
    }

    async getDocumentCount(databaseId, collectionId) {
        try {
            // Get first document to check total count
            const response = await this.databases.listDocuments(
                databaseId,
                collectionId,
                [],  // queries
                1,   // limit
                0    // offset
            );
            return response.total;
        } catch (error) {
            console.error(`Error fetching document count for collection ${collectionId}:`, error);
            throw error;
        }
    }

    async getDocuments(databaseId, collectionId, limit = 100, offset = 0) {
        try {
            // Use Query helper for proper pagination
            const queries = [
                Query.limit(limit),
                Query.offset(offset)
            ];
            
            const documents = await this.databases.listDocuments(
                databaseId,
                collectionId,
                queries
            );
            
            return documents;
        } catch (error) {
            console.error(`Error fetching documents from collection ${collectionId}:`, error);
            throw error;
        }
    }

    async getAllUsers(limit = 100, offset = 0) {
        try {
            const users = await this.users.list(undefined, limit, offset);
            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }
}

export default AppwriteClient;