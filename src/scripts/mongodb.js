import dotenv from 'dotenv';
import UserMigration from '../migrations/userMigration.js';
import DatabaseMigration from '../migrations/databaseMigration.js';

dotenv.config();

async function migrateToMongoDB() {
    console.log('🍃 Starting MongoDB Migration');
    console.log('=============================');

    try {
        console.log('🔄 Migrating users...');
        const userMigration = new UserMigration('mongodb');
        await userMigration.migrate();

        console.log('🔄 Migrating databases and collections...');
        const databaseMigration = new DatabaseMigration('mongodb');
        await databaseMigration.migrate();

        console.log('🎉 MongoDB migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Verify data in your MongoDB database');
        console.log('2. Update your application to connect to MongoDB');
        console.log('3. Test your application thoroughly');
        console.log('4. Schedule Appwrite project deletion after September 1, 2025');

    } catch (error) {
        console.error('❌ MongoDB migration failed:', error.message);
        process.exit(1);
    }
}

migrateToMongoDB();