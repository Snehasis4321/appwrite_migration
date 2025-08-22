import AppwriteClient from '../config/appwrite.js';
import DatabaseManager from '../config/database.js';

class UserMigration {
    constructor(targetDbType) {
        this.appwrite = new AppwriteClient();
        this.targetDb = new DatabaseManager(targetDbType);
    }

    async migrate() {
        try {
            console.log('🚀 Starting user migration...');
            
            await this.targetDb.connect();
            await this.targetDb.createUsersTable();

            let offset = 0;
            const limit = 100;
            let totalMigrated = 0;

            while (true) {
                const usersResponse = await this.appwrite.getAllUsers(limit, offset);
                const users = usersResponse.users;

                if (users.length === 0) {
                    break;
                }

                console.log(`📦 Processing ${users.length} users (offset: ${offset})`);

                for (const user of users) {
                    const migratedUser = this.transformUser(user);
                    await this.targetDb.insertUser(migratedUser);
                    totalMigrated++;
                }

                offset += limit;

                if (users.length < limit) {
                    break;
                }
            }

            console.log(`✅ User migration completed! Migrated ${totalMigrated} users.`);
        } catch (error) {
            console.error('❌ User migration failed:', error);
            throw error;
        } finally {
            await this.targetDb.disconnect();
        }
    }

    transformUser(user) {
        return {
            id: user.$id,
            name: user.name || null,
            email: user.email || null,
            phone: user.phone || null,
            email_verification: user.emailVerification || false,
            phone_verification: user.phoneVerification || false,
            status: user.status || true,
            registration: user.registration ? new Date(user.registration) : null,
            password_update: user.passwordUpdate ? new Date(user.passwordUpdate) : null,
            prefs: user.prefs ? JSON.stringify(user.prefs) : null,
            created_at: user.$createdAt ? new Date(user.$createdAt) : new Date(),
            updated_at: user.$updatedAt ? new Date(user.$updatedAt) : new Date()
        };
    }
}

export default UserMigration;