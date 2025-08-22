import dotenv from 'dotenv';
import UserMigration from '../migrations/userMigration.js';
import DatabaseMigration from '../migrations/databaseMigration.js';

dotenv.config();

async function migrateToMySQL() {
    console.log('🐬 Starting MySQL Migration');
    console.log('===========================');

    try {
        console.log('🔄 Migrating users...');
        const userMigration = new UserMigration('mysql');
        await userMigration.migrate();

        console.log('🔄 Migrating databases and collections...');
        const databaseMigration = new DatabaseMigration('mysql');
        await databaseMigration.migrate();

        console.log('🎉 MySQL migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Verify data in your MySQL database');
        console.log('2. Update your application to connect to MySQL');
        console.log('3. Test your application thoroughly');
        console.log('4. Schedule Appwrite project deletion after September 1, 2025');

    } catch (error) {
        console.error('❌ MySQL migration failed:', error.message);
        process.exit(1);
    }
}

migrateToMySQL();