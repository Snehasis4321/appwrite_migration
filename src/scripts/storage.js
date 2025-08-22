import dotenv from 'dotenv';
import StorageMigration from '../migrations/storageMigration.js';
import StorageConfigGenerator from '../utils/storageConfigGenerator.js';
import fs from 'fs';
import readline from 'readline';

dotenv.config();

async function migrateStorage() {
    console.log('🗂️ Starting Appwrite Storage Migration');
    console.log('====================================\n');

    try {
        // Check if storage config already exists
        let config;
        const configPath = './storage-config.json';

        if (fs.existsSync(configPath)) {
            console.log('📋 Found existing storage configuration');
            const useExisting = await askYesNo('Use existing config? (y/n): ');
            
            if (useExisting) {
                config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } else {
                config = await generateNewConfig();
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            }
        } else {
            console.log('📋 No storage configuration found. Let\'s create one!');
            config = await generateNewConfig();
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(`✅ Configuration saved to ${configPath}`);
        }

        if (config.collections.length === 0) {
            console.log('ℹ️  No collections with file attributes found. Storage migration skipped.');
            return;
        }

        console.log(`\n📊 Storage Migration Plan:`);
        console.log(`Collections to migrate: ${config.collections.length}`);
        config.collections.forEach(coll => {
            console.log(`  • ${coll.name}: ${coll.fileAttributes.length} file attributes`);
        });

        const proceed = await askYesNo('\nProceed with storage migration? (y/n): ');
        if (!proceed) {
            console.log('Migration cancelled.');
            return;
        }

        // Run the migration
        const targetDb = process.env.TARGET_DATABASE || 'postgres';
        const storageProvider = config.storageProvider || process.env.STORAGE_PROVIDER || 'cloudinary';
        const migration = new StorageMigration(targetDb, storageProvider);
        await migration.migrateStorage(config);

        console.log('\n🎉 Storage migration completed successfully!');
        console.log('\nNext steps:');
        if (storageProvider === 'cloudinary') {
            console.log('1. Verify files in Cloudinary dashboard');
        } else {
            console.log('1. Verify files in AWS S3 bucket');
        }
        console.log('2. Update your application to use new URLs');
        console.log('3. Test image/file loading in your app');

    } catch (error) {
        console.error('❌ Storage migration failed:', error.message);
        process.exit(1);
    }
}

async function generateNewConfig() {
    const generator = new StorageConfigGenerator();
    return await generator.generateConfig();
}

function askYesNo(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase().startsWith('y'));
        });
    });
}

migrateStorage();