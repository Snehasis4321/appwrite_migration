import AppwriteClient from './src/config/appwrite.js';
import DatabaseManager from './src/config/database.js';
import { v2 as cloudinary } from 'cloudinary';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

async function testConnections() {
    console.log('🔍 Testing all connections...\n');

    const results = {
        appwrite: false,
        postgres: false,
        mysql: false,
        mongodb: false,
        cloudinary: false,
        s3: false
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

    // Test Cloudinary
    console.log('\n5. Testing Cloudinary connection...');
    try {
        await testCloudinaryConnection();
        results.cloudinary = true;
        console.log('✅ Cloudinary connection successful');
    } catch (error) {
        console.log('❌ Cloudinary connection failed:', error.message);
    }

    // Test AWS S3
    console.log('\n6. Testing AWS S3 connection...');
    try {
        await testS3Connection();
        results.s3 = true;
        console.log('✅ AWS S3 connection successful');
    } catch (error) {
        console.log('❌ AWS S3 connection failed:', error.message);
    }

    // Summary
    const dbCount = [results.appwrite, results.postgres, results.mysql, results.mongodb].filter(Boolean).length;
    const storageCount = [results.cloudinary, results.s3].filter(Boolean).length;
    const totalCount = Object.values(results).filter(Boolean).length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 CONNECTION TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('DATABASE CONNECTIONS:');
    console.log(`  Appwrite:    ${results.appwrite ? '✅ Connected' : '❌ Failed'}`);
    console.log(`  PostgreSQL:  ${results.postgres ? '✅ Connected' : '❌ Failed'}`);
    console.log(`  MySQL:       ${results.mysql ? '✅ Connected' : '❌ Failed'}`);
    console.log(`  MongoDB:     ${results.mongodb ? '✅ Connected' : '❌ Failed'}`);
    console.log('\nSTORAGE CONNECTIONS:');
    console.log(`  Cloudinary:  ${results.cloudinary ? '✅ Connected' : '❌ Failed'}`);
    console.log(`  AWS S3:      ${results.s3 ? '✅ Connected' : '❌ Failed'}`);
    console.log('='.repeat(60));
    console.log(`🎯 ${dbCount}/4 databases | ${storageCount}/2 storage providers | ${totalCount}/6 total\n`);
    
    if (dbCount > 1 && storageCount > 0) {
        console.log('✅ Ready to migrate with storage! All systems connected.');
        console.log('📝 Set TARGET_DATABASE and STORAGE_PROVIDER in .env.');
    } else if (dbCount > 1) {
        console.log('✅ Ready for database migration!');
        console.log('⚠️  No storage providers connected - storage migration unavailable.');
        console.log('📝 Set TARGET_DATABASE in .env to your preferred choice.');
    } else if (dbCount === 1) {
        console.log('⚠️  Only one database connected. Consider adding more options.');
    } else {
        console.log('❌ No databases connected. Please check your configuration.');
    }
}

async function testCloudinaryConnection() {
    // Configure Cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Check if config is present
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Missing Cloudinary credentials in .env file');
    }

    // Test by calling the ping API
    return new Promise((resolve, reject) => {
        cloudinary.api.ping((error, result) => {
            if (error) {
                reject(new Error(`Cloudinary API error: ${error.message}`));
            } else {
                resolve(result);
            }
        });
    });
}

async function testS3Connection() {
    // Check if config is present
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_BUCKET_NAME) {
        throw new Error('Missing AWS S3 credentials in .env file');
    }

    // Configure S3 client
    const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });

    // Test by checking if bucket exists and is accessible
    const command = new HeadBucketCommand({
        Bucket: process.env.AWS_BUCKET_NAME
    });

    await s3Client.send(command);
}

testConnections();