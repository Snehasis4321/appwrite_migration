import AppwriteClient from './src/config/appwrite.js';
import DatabaseManager from './src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function testConnections() {
    console.log('🔍 Testing all database connections...\n');

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
    } catch (error) {
        console.log('❌ Appwrite connection failed:', error.message);
    }

    // Test PostgreSQL
    console.log('\n2. Testing PostgreSQL connection...');
    try {
        const pg = new DatabaseManager('postgres');
        await pg.connect();
        await pg.disconnect();
        results.postgres = true;
        console.log('✅ PostgreSQL connection successful');
    } catch (error) {
        console.log('❌ PostgreSQL connection failed:', error.message);
    }

    // Test MySQL
    console.log('\n3. Testing MySQL connection...');
    try {
        const mysql = new DatabaseManager('mysql');
        await mysql.connect();
        await mysql.disconnect();
        results.mysql = true;
        console.log('✅ MySQL connection successful');
    } catch (error) {
        console.log('❌ MySQL connection failed:', error.message);
    }

    // Test MongoDB
    console.log('\n4. Testing MongoDB connection...');
    try {
        const mongodb = new DatabaseManager('mongodb');
        await mongodb.connect();
        await mongodb.disconnect();
        results.mongodb = true;
        console.log('✅ MongoDB connection successful');
    } catch (error) {
        console.log('❌ MongoDB connection failed:', error.message);
    }

    // Summary
    const connectedCount = Object.values(results).filter(Boolean).length;
    console.log('\n' + '='.repeat(50));
    console.log('📊 CONNECTION TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Appwrite:    ${results.appwrite ? '✅ Connected' : '❌ Failed'}`);
    console.log(`PostgreSQL:  ${results.postgres ? '✅ Connected' : '❌ Failed'}`);
    console.log(`MySQL:       ${results.mysql ? '✅ Connected' : '❌ Failed'}`);
    console.log(`MongoDB:     ${results.mongodb ? '✅ Connected' : '❌ Failed'}`);
    console.log('='.repeat(50));
    console.log(`🎯 ${connectedCount}/4 databases connected successfully\n`);
    
    if (connectedCount > 1) {
        console.log('✅ Ready to migrate! You can choose any connected database.');
        console.log('📝 Set TARGET_DATABASE in .env to your preferred choice.');
    } else if (connectedCount === 1) {
        console.log('⚠️  Only one database connected. Consider adding more options.');
    } else {
        console.log('❌ No databases connected. Please check your configuration.');
    }
}

testConnections();