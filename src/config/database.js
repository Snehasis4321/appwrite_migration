import pg from 'pg';
import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

class DatabaseManager {
    constructor(type) {
        this.type = type;
        this.connection = null;
    }

    async connect() {
        try {
            switch (this.type) {
                case 'postgres':
                    this.connection = new Pool({
                        host: process.env.POSTGRES_HOST,
                        port: process.env.POSTGRES_PORT,
                        database: process.env.POSTGRES_DATABASE,
                        user: process.env.POSTGRES_USERNAME,
                        password: process.env.POSTGRES_PASSWORD,
                        connectionTimeoutMillis: 30000, // 30 seconds
                        idleTimeoutMillis: 30000,
                        query_timeout: 30000
                    });
                    await this.connection.query('SELECT NOW()');
                    console.log('✅ Connected to PostgreSQL');
                    break;

                case 'mysql':
                    this.connection = await mysql.createConnection({
                        host: process.env.MYSQL_HOST,
                        port: parseInt(process.env.MYSQL_PORT),
                        database: process.env.MYSQL_DATABASE,
                        user: process.env.MYSQL_USERNAME,
                        password: process.env.MYSQL_PASSWORD,
                        connectTimeout: 30000, // 30 seconds - valid option
                        ssl: {
                            rejectUnauthorized: false
                        }
                    });
                    await this.connection.execute('SELECT 1');
                    console.log('✅ Connected to MySQL');
                    break;

                case 'mongodb':
                    this.connection = new MongoClient(process.env.MONGODB_URI, {
                        serverSelectionTimeoutMS: 30000, // 30 seconds
                        connectTimeoutMS: 30000,
                        socketTimeoutMS: 30000,
                        retryWrites: true,
                        w: 'majority'
                    });
                    await this.connection.connect();
                    await this.connection.db().admin().ping();
                    console.log('✅ Connected to MongoDB');
                    break;

                default:
                    throw new Error(`Unsupported database type: ${this.type}`);
            }
        } catch (error) {
            console.error(`❌ Failed to connect to ${this.type}:`, error.message);
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.connection) {
                if (this.type === 'postgres') {
                    await this.connection.end();
                } else if (this.type === 'mysql') {
                    await this.connection.end();
                } else if (this.type === 'mongodb') {
                    await this.connection.close();
                }
                console.log(`✅ Disconnected from ${this.type}`);
            }
        } catch (error) {
            console.error(`Error disconnecting from ${this.type}:`, error.message);
        }
    }

    async createUsersTable() {
        const sql = {
            postgres: `
                CREATE TABLE IF NOT EXISTS appwrite_users (
                    "id" VARCHAR(255) PRIMARY KEY,
                    "name" VARCHAR(255),
                    "email" VARCHAR(255) UNIQUE,
                    "phone" VARCHAR(50),
                    "email_verification" BOOLEAN DEFAULT FALSE,
                    "phone_verification" BOOLEAN DEFAULT FALSE,
                    "status" BOOLEAN DEFAULT TRUE,
                    "registration" TIMESTAMP,
                    "password_update" TIMESTAMP,
                    "prefs" JSONB,
                    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `,
            mysql: `
                CREATE TABLE IF NOT EXISTS appwrite_users (
                    \`id\` VARCHAR(255) PRIMARY KEY,
                    \`name\` VARCHAR(255),
                    \`email\` VARCHAR(255) UNIQUE,
                    \`phone\` VARCHAR(50),
                    \`email_verification\` BOOLEAN DEFAULT FALSE,
                    \`phone_verification\` BOOLEAN DEFAULT FALSE,
                    \`status\` BOOLEAN DEFAULT TRUE,
                    \`registration\` TIMESTAMP,
                    \`password_update\` TIMESTAMP,
                    \`prefs\` JSON,
                    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                );
            `,
            mongodb: null
        };

        if (this.type === 'mongodb') {
            const db = this.connection.db(process.env.MONGODB_DATABASE || 'appwrite_migration');
            await db.createCollection('appwrite_users');
            await db.collection('appwrite_users').createIndex({ email: 1 }, { unique: true });
        } else {
            await this.executeSQL(sql[this.type]);
        }
    }

    async createCollectionMetadataTable() {
        const sql = {
            postgres: `
                CREATE TABLE IF NOT EXISTS collection_metadata (
                    "appwrite_id" VARCHAR(255) PRIMARY KEY,
                    "table_name" VARCHAR(255) NOT NULL,
                    "display_name" VARCHAR(255) NOT NULL,
                    "database_id" VARCHAR(255) NOT NULL,
                    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `,
            mysql: `
                CREATE TABLE IF NOT EXISTS collection_metadata (
                    \`appwrite_id\` VARCHAR(255) PRIMARY KEY,
                    \`table_name\` VARCHAR(255) NOT NULL,
                    \`display_name\` VARCHAR(255) NOT NULL,
                    \`database_id\` VARCHAR(255) NOT NULL,
                    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `,
            mongodb: null
        };

        if (this.type === 'mongodb') {
            const db = this.connection.db(process.env.MONGODB_DATABASE || 'appwrite_migration');
            await db.createCollection('collection_metadata');
        } else {
            await this.executeSQL(sql[this.type]);
        }
    }

    async insertCollectionMetadata(appwriteId, tableName, displayName, databaseId) {
        if (this.type === 'mongodb') {
            const db = this.connection.db(process.env.MONGODB_DATABASE || 'appwrite_migration');
            await db.collection('collection_metadata').insertOne({
                appwrite_id: appwriteId,
                table_name: tableName,
                display_name: displayName,
                database_id: databaseId,
                created_at: new Date()
            });
            return;
        }

        const fields = this.type === 'postgres' 
            ? '"appwrite_id", "table_name", "display_name", "database_id"'
            : '`appwrite_id`, `table_name`, `display_name`, `database_id`';

        const placeholders = this.type === 'postgres' ? '$1, $2, $3, $4' : '?, ?, ?, ?';
        const sql = `INSERT INTO collection_metadata (${fields}) VALUES (${placeholders}) ON CONFLICT (appwrite_id) DO NOTHING;`;
        const values = [appwriteId, tableName, displayName, databaseId];

        if (this.type === 'postgres') {
            await this.connection.query(sql.replace('ON CONFLICT (appwrite_id) DO NOTHING', 'ON CONFLICT ("appwrite_id") DO NOTHING'), values);
        } else if (this.type === 'mysql') {
            await this.connection.execute(sql.replace('ON CONFLICT (appwrite_id) DO NOTHING', 'ON DUPLICATE KEY UPDATE appwrite_id=appwrite_id'), values);
        }
    }

    async createCollectionTable(collectionName, attributes, collectionDisplayName = null) {
        // Use display name if provided, otherwise use the collection ID
        const tableName = collectionDisplayName ? 
            this.sanitizeTableName(collectionDisplayName) : 
            `collection_${collectionName}`;

        if (this.type === 'mongodb') {
            const db = this.connection.db(process.env.MONGODB_DATABASE || 'appwrite_migration');
            await db.createCollection(tableName);
            return tableName;
        }

        let columns = ['"id" VARCHAR(255) PRIMARY KEY', '"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP', '"updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP'];
        
        if (this.type === 'mysql') {
            columns = ['`id` VARCHAR(255) PRIMARY KEY', '`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP', '`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'];
        }

        for (const attr of attributes) {
            const columnDef = this.getColumnDefinition(attr);
            if (columnDef) {
                columns.push(columnDef);
            }
        }

        const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(', ')});`;
        await this.executeSQL(sql);
        return tableName;
    }

    sanitizeTableName(name) {
        // Convert to snake_case and remove special characters
        return name
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 63); // PostgreSQL table name limit
    }

    getColumnDefinition(attribute) {
        const { key, type, size, required } = attribute;
        
        // Escape column names that might be reserved keywords
        const escapedKey = this.type === 'postgres' ? `"${key}"` : `\`${key}\``;
        let definition = '';

        switch (type) {
            case 'string':
                // Handle MySQL VARCHAR size limitations
                if (this.type === 'mysql' && size && size > 16383) {
                    definition = `${escapedKey} TEXT`;
                } else {
                    definition = `${escapedKey} VARCHAR(${size || 255})`;
                }
                break;
            case 'integer':
                definition = `${escapedKey} ${this.type === 'postgres' ? 'INTEGER' : 'INT'}`;
                break;
            case 'double':
                definition = `${escapedKey} ${this.type === 'postgres' ? 'DOUBLE PRECISION' : 'DOUBLE'}`;
                break;
            case 'boolean':
                definition = `${escapedKey} BOOLEAN`;
                break;
            case 'datetime':
                definition = `${escapedKey} TIMESTAMP`;
                break;
            case 'email':
                definition = `${escapedKey} VARCHAR(255)`;
                break;
            case 'url':
                definition = `${escapedKey} TEXT`;
                break;
            case 'relationship':
                // Relationships are stored as TEXT to handle both single values and arrays
                definition = `${escapedKey} TEXT`;
                break;
            default:
                definition = `${escapedKey} TEXT`;
        }

        // Don't add NOT NULL constraint to avoid migration issues with existing null data
        // The required constraint can be added later if needed
        
        return definition;
    }

    async executeSQL(sql) {
        if (this.type === 'postgres') {
            await this.connection.query(sql);
        } else if (this.type === 'mysql') {
            await this.connection.execute(sql);
        }
    }

    async insertUser(user) {
        if (this.type === 'mongodb') {
            const db = this.connection.db(process.env.MONGODB_DATABASE || 'appwrite_migration');
            await db.collection('appwrite_users').insertOne(user);
            return;
        }

        const fields = Object.keys(user).join(', ');
        const placeholders = this.type === 'postgres' 
            ? Object.keys(user).map((_, i) => `$${i + 1}`).join(', ')
            : Object.keys(user).map(() => '?').join(', ');
        
        const sql = `INSERT INTO appwrite_users (${fields}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING;`;
        const values = Object.values(user);

        if (this.type === 'postgres') {
            await this.connection.query(sql.replace('ON CONFLICT (id) DO NOTHING', 'ON CONFLICT (id) DO NOTHING'), values);
        } else if (this.type === 'mysql') {
            await this.connection.execute(sql.replace('ON CONFLICT (id) DO NOTHING', 'ON DUPLICATE KEY UPDATE id=id'), values);
        }
    }

    async insertDocument(tableName, document) {
        if (this.type === 'mongodb') {
            const db = this.connection.db(process.env.MONGODB_DATABASE || 'appwrite_migration');
            await db.collection(tableName).insertOne(document);
            return;
        }

        // Escape field names for PostgreSQL and MySQL
        const fields = Object.keys(document).map(key => 
            this.type === 'postgres' ? `"${key}"` : `\`${key}\``
        ).join(', ');
        
        const placeholders = this.type === 'postgres' 
            ? Object.keys(document).map((_, i) => `$${i + 1}`).join(', ')
            : Object.keys(document).map(() => '?').join(', ');
        
        const sql = `INSERT INTO ${tableName} (${fields}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING;`;
        const values = Object.values(document);

        if (this.type === 'postgres') {
            await this.connection.query(sql.replace('ON CONFLICT (id) DO NOTHING', 'ON CONFLICT ("id") DO NOTHING'), values);
        } else if (this.type === 'mysql') {
            await this.connection.execute(sql.replace('ON CONFLICT (id) DO NOTHING', 'ON DUPLICATE KEY UPDATE id=id'), values);
        }
    }
}

export default DatabaseManager;