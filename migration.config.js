export default {
    // Appwrite Configuration
    appwrite: {
        endpoint: process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
        projectId: process.env.APPWRITE_PROJECT_ID,
        apiKey: process.env.APPWRITE_API_KEY
    },

    // Migration Settings
    migration: {
        batchSize: 100,
        maxRetries: 3,
        retryDelay: 1000,
        skipErrors: false,
        logLevel: 'info'
    },

    // Database Configurations
    databases: {
        postgres: {
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            database: process.env.POSTGRES_DATABASE || 'appwrite_migration',
            username: process.env.POSTGRES_USERNAME || 'postgres',
            password: process.env.POSTGRES_PASSWORD
        },
        mysql: {
            host: process.env.MYSQL_HOST || 'localhost',
            port: process.env.MYSQL_PORT || 3306,
            database: process.env.MYSQL_DATABASE || 'appwrite_migration',
            username: process.env.MYSQL_USERNAME || 'root',
            password: process.env.MYSQL_PASSWORD
        },
        mongodb: {
            uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/appwrite_migration'
        }
    },

    // Migration Options
    options: {
        migrateUsers: true,
        migrateDatabase: true,
        migrateStorage: false, // Not implemented yet
        createBackup: true,
        validateData: true
    }
};