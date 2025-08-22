import dotenv from 'dotenv';
import readline from 'readline';
import AppwriteClient from './config/appwrite.js';
import DatabaseManager from './config/database.js';

dotenv.config();

class MigrationCLI {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async start() {
        console.log('🚀 Appwrite Migration Tool');
        console.log('==========================');
        console.log('⚠️  Migration Deadline: September 1, 2025');
        console.log('📋 This tool will help you migrate your Appwrite data to PostgreSQL, MySQL, or MongoDB\n');

        try {
            const appwrite = new AppwriteClient();
            const connected = await appwrite.testConnection();
            
            if (!connected) {
                console.log('❌ Please check your Appwrite configuration in .env file');
                this.rl.close();
                return;
            }

            await this.showMenu();
        } catch (error) {
            console.error('❌ Error:', error.message);
            this.rl.close();
        }
    }

    async showMenu() {
        console.log('\nSelect target database:');
        console.log('1. PostgreSQL');
        console.log('2. MySQL');
        console.log('3. MongoDB');
        console.log('4. Test database connections');
        console.log('5. Exit');

        this.rl.question('\nEnter your choice (1-5): ', async (choice) => {
            switch (choice) {
                case '1':
                    await this.migrateToDatabase('postgres');
                    break;
                case '2':
                    await this.migrateToDatabase('mysql');
                    break;
                case '3':
                    await this.migrateToDatabase('mongodb');
                    break;
                case '4':
                    await this.testConnections();
                    break;
                case '5':
                    console.log('👋 Goodbye!');
                    this.rl.close();
                    return;
                default:
                    console.log('❌ Invalid choice. Please try again.');
                    await this.showMenu();
                    return;
            }
        });
    }

    async migrateToDatabase(dbType) {
        try {
            console.log(`\n🔄 Starting migration to ${dbType.toUpperCase()}...`);
            
            const { spawn } = await import('child_process');
            const scriptPath = `./src/scripts/${dbType}.js`;
            
            const migrationProcess = spawn('node', [scriptPath], {
                stdio: 'inherit',
                env: { ...process.env, TARGET_DATABASE: dbType }
            });

            migrationProcess.on('close', (code) => {
                if (code === 0) {
                    console.log(`\n✅ Migration to ${dbType.toUpperCase()} completed successfully!`);
                } else {
                    console.log(`\n❌ Migration to ${dbType.toUpperCase()} failed with code ${code}`);
                }
                
                this.rl.question('\nPress Enter to return to menu...', () => {
                    this.showMenu();
                });
            });

        } catch (error) {
            console.error(`❌ Error starting migration to ${dbType}:`, error.message);
            this.showMenu();
        }
    }

    async testConnections() {
        console.log('\n🔍 Testing database connections...\n');

        const databases = ['postgres', 'mysql', 'mongodb'];
        
        for (const dbType of databases) {
            try {
                console.log(`Testing ${dbType.toUpperCase()}...`);
                const db = new DatabaseManager(dbType);
                await db.connect();
                await db.disconnect();
                console.log(`✅ ${dbType.toUpperCase()} connection successful\n`);
            } catch (error) {
                console.log(`❌ ${dbType.toUpperCase()} connection failed: ${error.message}\n`);
            }
        }

        this.rl.question('Press Enter to return to menu...', () => {
            this.showMenu();
        });
    }
}

const cli = new MigrationCLI();
cli.start();