import dotenv from 'dotenv';
import AppwriteClient from './config/appwrite.js';
import UserMigration from './migrations/userMigration.js';
import DatabaseMigration from './migrations/databaseMigration.js';

dotenv.config();

class MigrationManager {
    constructor() {
        this.targetDatabase = process.env.TARGET_DATABASE || 'postgres';
        this.appwrite = new AppwriteClient();
    }

    async run() {
        console.log('🚀 Starting Appwrite Migration Process');
        console.log(`📊 Target Database: ${this.targetDatabase.toUpperCase()}`);
        console.log('⏰ Migration deadline: September 1, 2025\n');

        try {
            const connected = await this.appwrite.testConnection();
            if (!connected) {
                throw new Error('Failed to connect to Appwrite');
            }

            const migrationSteps = [
                { name: 'Users', migrator: UserMigration },
                { name: 'Database & Collections', migrator: DatabaseMigration }
            ];

            for (const step of migrationSteps) {
                console.log(`\n${'='.repeat(50)}`);
                console.log(`🔄 Starting ${step.name} Migration`);
                console.log(`${'='.repeat(50)}`);

                const migrator = new step.migrator(this.targetDatabase);
                await migrator.migrate();

                console.log(`✅ ${step.name} migration completed successfully!\n`);
            }

            console.log('🎉 All migrations completed successfully!');
            console.log('📋 Migration Summary:');
            console.log(`   • Users migrated ✅`);
            console.log(`   • Database schema migrated ✅`);
            console.log(`   • Document data migrated ✅`);
            console.log(`   • Target database: ${this.targetDatabase.toUpperCase()} ✅`);

        } catch (error) {
            console.error('❌ Migration failed:', error.message);
            process.exit(1);
        }
    }
}

const manager = new MigrationManager();
manager.run();