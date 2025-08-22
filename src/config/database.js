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
                    });
                    await this.connection.query('SELECT NOW()');
                    console.log('✅ Connected to PostgreSQL');
                    break;

                case 'mysql':
                    this.connection = await mysql.createConnection({
                        host: process.env.MYSQL_HOST,
                        port: process.env.MYSQL_PORT,
                        database: process.env.MYSQL_DATABASE,
                        user: process.env.MYSQL_USERNAME,
                        password: process.env.MYSQL_PASSWORD,
                    });
                    await this.connection.execute('SELECT 1');
                    console.log('✅ Connected to MySQL');
                    break;

                case 'mongodb':
                    this.connection = new MongoClient(process.env.MONGODB_URI);
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
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255),
                    email VARCHAR(255) UNIQUE,
                    phone VARCHAR(50),
                    email_verification BOOLEAN DEFAULT FALSE,
                    phone_verification BOOLEAN DEFAULT FALSE,
                    status BOOLEAN DEFAULT TRUE,
                    registration TIMESTAMP,
                    password_update TIMESTAMP,
                    prefs JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `,
            mysql: `
                CREATE TABLE IF NOT EXISTS appwrite_users (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255),
                    email VARCHAR(255) UNIQUE,
                    phone VARCHAR(50),
                    email_verification BOOLEAN DEFAULT FALSE,
                    phone_verification BOOLEAN DEFAULT FALSE,
                    status BOOLEAN DEFAULT TRUE,
                    registration TIMESTAMP,
                    password_update TIMESTAMP,
                    prefs JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                );
            `,
            mongodb: null
        };

        if (this.type === 'mongodb') {
            const db = this.connection.db();
            await db.createCollection('appwrite_users');
            await db.collection('appwrite_users').createIndex({ email: 1 }, { unique: true });
        } else {
            await this.executeSQL(sql[this.type]);
        }
    }

    async createCollectionTable(collectionName, attributes) {
        if (this.type === 'mongodb') {
            const db = this.connection.db();
            await db.createCollection(`collection_${collectionName}`);
            return;
        }

        let columns = ['id VARCHAR(255) PRIMARY KEY', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'];
        
        if (this.type === 'mysql') {
            columns.push('updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
        }

        for (const attr of attributes) {
            const columnDef = this.getColumnDefinition(attr);
            if (columnDef) {
                columns.push(columnDef);
            }
        }

        const sql = `CREATE TABLE IF NOT EXISTS collection_${collectionName} (${columns.join(', ')});`;
        await this.executeSQL(sql);
    }

    getColumnDefinition(attribute) {
        const { key, type, size, required } = attribute;
        let definition = '';

        switch (type) {
            case 'string':
                definition = `${key} VARCHAR(${size || 255})`;
                break;
            case 'integer':
                definition = `${key} ${this.type === 'postgres' ? 'INTEGER' : 'INT'}`;
                break;
            case 'double':
                definition = `${key} ${this.type === 'postgres' ? 'DOUBLE PRECISION' : 'DOUBLE'}`;
                break;
            case 'boolean':
                definition = `${key} BOOLEAN`;
                break;
            case 'datetime':
                definition = `${key} TIMESTAMP`;
                break;
            case 'email':
                definition = `${key} VARCHAR(255)`;
                break;
            case 'url':
                definition = `${key} TEXT`;
                break;
            default:
                definition = `${key} TEXT`;
        }

        if (required) {
            definition += ' NOT NULL';
        }

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
            const db = this.connection.db();
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

    async insertDocument(collectionName, document) {
        if (this.type === 'mongodb') {
            const db = this.connection.db();
            await db.collection(`collection_${collectionName}`).insertOne(document);
            return;
        }

        const fields = Object.keys(document).join(', ');
        const placeholders = this.type === 'postgres' 
            ? Object.keys(document).map((_, i) => `$${i + 1}`).join(', ')
            : Object.keys(document).map(() => '?').join(', ');
        
        const sql = `INSERT INTO collection_${collectionName} (${fields}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING;`;
        const values = Object.values(document);

        if (this.type === 'postgres') {
            await this.connection.query(sql.replace('ON CONFLICT (id) DO NOTHING', 'ON CONFLICT (id) DO NOTHING'), values);
        } else if (this.type === 'mysql') {
            await this.connection.execute(sql.replace('ON CONFLICT (id) DO NOTHING', 'ON DUPLICATE KEY UPDATE id=id'), values);
        }
    }
}

export default DatabaseManager;