import dotenv from 'dotenv';
import UserMigration from '../migrations/userMigration.js';
import DatabaseMigration from '../migrations/databaseMigration.js';

dotenv.config();

async function migrateToPostgreSQL() {
    console.log('🐘 Starting PostgreSQL Migration');
    console.log('================================');

    try {
        console.log('🔄 Migrating users...');
        const userMigration = new UserMigration('postgres');
        await userMigration.migrate();

        console.log('🔄 Migrating databases and collections...');
        const databaseMigration = new DatabaseMigration('postgres');
        await databaseMigration.migrate();

        console.log('🎉 PostgreSQL migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Verify data in your PostgreSQL database');
        console.log('2. Update your application to connect to PostgreSQL');
        console.log('3. Test your application thoroughly');
        console.log('4. Schedule Appwrite project deletion after September 1, 2025');

    } catch (error) {
        console.error('❌ PostgreSQL migration failed:', error.message);
        process.exit(1);
    }
}

migrateToPostgreSQL();