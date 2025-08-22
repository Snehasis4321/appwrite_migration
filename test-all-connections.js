import AppwriteClient from './src/config/appwrite.js';
import DatabaseManager from './src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAllConnections() {
    console.log('🔍 Testing all database connections with 30-second timeouts...\n');

    const results = {
        appwrite: false,
        postgres: false,
        mysql: false,
        mongodb: false
    };

    // Test Appwrite
    console.log('1. Testing Appwrite connection...');
    try {
        const appwrite = new AppwriteClient();
        const connected = await appwrite.testConnection();
        results.appwrite = connected;
        if (connected) {
            console.log('✅ Appwrite connection successful\n');
        }
    } catch (error) {
        console.log('❌ Appwrite connection failed:', error.message, '\n');
    }

    // Test PostgreSQL
    console.log('2. Testing PostgreSQL connection...');
    try {
        const pg = new DatabaseManager('postgres');
        await pg.connect();
        await pg.disconnect();
        results.postgres = true;
        console.log('✅ PostgreSQL connection successful\n');
    } catch (error) {
        console.log('❌ PostgreSQL connection failed:', error.message);
        if (error.code === 'ETIMEDOUT') {
            console.log('💡 Connection timeout - check host/port/credentials\n');
        } else {
            console.log('💡 Check PostgreSQL configuration in .env file\n');
        }
    }

    // Test MySQL
    console.log('3. Testing MySQL connection...');
    try {
        const mysql = new DatabaseManager('mysql');
        await mysql.connect();
        await mysql.disconnect();
        results.mysql = true;
        console.log('✅ MySQL connection successful\n');
    } catch (error) {
        console.log('❌ MySQL connection failed:', error.message);
        if (error.code === 'ETIMEDOUT') {
            console.log('💡 Connection timeout - remote database might be slow\n');
        } else {
            console.log('💡 Check MySQL configuration in .env file\n');
        }
    }

    // Test MongoDB
    console.log('4. Testing MongoDB connection...');
    try {
        const mongodb = new DatabaseManager('mongodb');
        await mongodb.connect();
        await mongodb.disconnect();
        results.mongodb = true;
        console.log('✅ MongoDB connection successful\n');
    } catch (error) {
        console.log('❌ MongoDB connection failed:', error.message);
        if (error.message.includes('ECONNRESET') || error.message.includes('timeout')) {
            console.log('💡 Connection timeout - check IP whitelist in MongoDB Atlas\n');
        } else {
            console.log('💡 Check MongoDB configuration in .env file\n');
        }
    }

    // Summary
    console.log('📊 Connection Test Summary:');
    console.log('========================');
    console.log(`Appwrite:    ${results.appwrite ? '✅ Connected' : '❌ Failed'}`);
    console.log(`PostgreSQL:  ${results.postgres ? '✅ Connected' : '❌ Failed'}`);
    console.log(`MySQL:       ${results.mysql ? '✅ Connected' : '❌ Failed'}`);
    console.log(`MongoDB:     ${results.mongodb ? '✅ Connected' : '❌ Failed'}`);
    
    const connectedCount = Object.values(results).filter(Boolean).length;
    console.log(`\n🎯 ${connectedCount}/4 databases connected successfully`);
    
    if (connectedCount > 1) {
        console.log('\n✅ Migration ready! You can migrate to any connected database.');
        console.log('📝 Update TARGET_DATABASE in .env to your preferred choice.');
    } else if (connectedCount === 1) {
        console.log('\n⚠️  Only one database connected. Consider setting up additional options.');
    } else {
        console.log('\n❌ No databases connected. Please check your configuration.');
    }
}

testAllConnections();