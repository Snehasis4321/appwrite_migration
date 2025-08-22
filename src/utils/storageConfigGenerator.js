import AppwriteClient from '../config/appwrite.js';
import readline from 'readline';

class StorageConfigGenerator {
    constructor() {
        this.appwrite = new AppwriteClient();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async generateConfig() {
        console.log('🔧 Storage Migration Configuration Generator');
        console.log('===========================================\n');

        try {
            // Ask for storage provider preference
            const storageProvider = await this.selectStorageProvider();
            
            const databases = await this.appwrite.getAllDatabases();
            const config = {
                storageProvider: storageProvider,
                collections: []
            };

            console.log('📊 Found databases:');
            databases.forEach((db, index) => {
                console.log(`${index + 1}. ${db.name} (${db.$id})`);
            });

            for (const database of databases) {
                console.log(`\n📁 Checking database: ${database.name}`);
                const collections = await this.appwrite.getCollections(database.$id);

                for (const collection of collections) {
                    console.log(`\n📋 Analyzing collection: ${collection.name}`);
                    const attributes = await this.appwrite.getAttributes(database.$id, collection.$id);
                    
                    const fileAttributes = attributes.filter(attr => 
                        attr.type === 'string' && this.mightBeFileAttribute(attr)
                    );

                    if (fileAttributes.length > 0) {
                        console.log(`🖼️  Potential file attributes found:`);
                        fileAttributes.forEach((attr, index) => {
                            console.log(`   ${index + 1}. ${attr.key} (${attr.type}, size: ${attr.size})`);
                        });

                        const collectionConfig = await this.configureCollection(
                            database, collection, fileAttributes
                        );

                        if (collectionConfig.fileAttributes.length > 0) {
                            config.collections.push(collectionConfig);
                        }
                    }
                }
            }

            this.rl.close();
            return config;

        } catch (error) {
            this.rl.close();
            throw error;
        }
    }

    mightBeFileAttribute(attr) {
        const suspiciousNames = [
            'image', 'img', 'photo', 'picture', 'avatar', 'file', 'attachment',
            'document', 'media', 'upload', 'asset', 'thumbnail', 'banner',
            'logo', 'icon', 'gallery', 'video', 'audio'
        ];
        
        const key = attr.key.toLowerCase();
        return suspiciousNames.some(name => key.includes(name)) || attr.size > 500;
    }

    async configureCollection(database, collection, potentialFileAttributes) {
        console.log(`\n🔧 Configure collection: ${collection.name}`);
        
        const fileAttributes = [];
        
        for (const attr of potentialFileAttributes) {
            const hasFiles = await this.askYesNo(
                `Does "${attr.key}" contain file IDs or URLs? (y/n): `
            );

            if (hasFiles) {
                const attrConfig = await this.configureAttribute(attr);
                if (attrConfig) {
                    fileAttributes.push(attrConfig);
                }
            }
        }

        if (fileAttributes.length === 0) {
            return { fileAttributes: [] };
        }

        const bucketId = await this.askQuestion(
            `What is the Appwrite Storage Bucket ID for this collection? `
        );

        const folderPrefix = process.env.STORAGE_FOLDER_PREFIX || 'appwrite_migration';
        const storageFolder = await this.askQuestion(
            `Storage folder name (press Enter for '${folderPrefix}/${collection.name}'): `
        ) || `${folderPrefix}/${collection.name}`;

        const collectionConfig = {
            name: collection.name,
            databaseId: database.$id,
            collectionId: collection.$id,
            tableName: this.sanitizeTableName(collection.name),
            bucketId: bucketId,
            fileAttributes: fileAttributes
        };

        // Add storage-specific folder configuration
        if (process.env.STORAGE_PROVIDER === 's3') {
            collectionConfig.s3Folder = storageFolder;
        } else {
            collectionConfig.cloudinaryFolder = storageFolder;
        }

        return collectionConfig;
    }

    async configureAttribute(attr) {
        console.log(`\n🏷️  Configuring attribute: ${attr.key}`);
        
        const typeOptions = [
            '1. Single file ID',
            '2. Array of file IDs', 
            '3. Full Appwrite URL (extract file ID)',
            '4. Skip this attribute'
        ];

        console.log('Select the type:');
        typeOptions.forEach(option => console.log(`   ${option}`));

        const choice = await this.askQuestion('Enter choice (1-4): ');

        switch (choice) {
            case '1':
                return {
                    field: attr.key,
                    type: 'single',
                    bucketId: null, // Will be set at collection level
                };
            case '2':
                const returnType = await this.askQuestion(
                    'Return as (1) JSON string or (2) Array? (1/2): '
                );
                return {
                    field: attr.key,
                    type: 'array',
                    returnType: returnType === '1' ? 'json' : 'array',
                    bucketId: null,
                };
            case '3':
                return {
                    field: attr.key,
                    type: 'url_extract',
                    bucketId: null,
                };
            case '4':
                return null;
            default:
                console.log('Invalid choice, skipping attribute.');
                return null;
        }
    }

    sanitizeTableName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    askYesNo(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.toLowerCase().startsWith('y'));
            });
        });
    }

    async selectStorageProvider() {
        console.log('📁 Select Storage Provider:');
        console.log('   1. Cloudinary (recommended for images/videos)');
        console.log('   2. AWS S3 (flexible file storage)');
        
        const choice = await this.askQuestion('Enter choice (1-2): ');
        
        switch (choice) {
            case '1':
                return 'cloudinary';
            case '2':
                return 's3';
            default:
                console.log('Invalid choice, defaulting to Cloudinary.');
                return 'cloudinary';
        }
    }
}

export default StorageConfigGenerator;