const { MongoClient } = require('mongodb');

// Your MongoDB connection string
const connectionString = 'mongodb+srv://messaging_user:3DBZNGn62h9xGQVR@cluster0.z0ofrfz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
    const client = new MongoClient(connectionString);
    
    try {
        console.log('Attempting to connect to MongoDB...');
        
        // Connect to the MongoDB cluster
        await client.connect();
        console.log('✅ Successfully connected to MongoDB!');
        
        // List all databases to verify connection
        const adminDb = client.db('admin');
        const databases = await adminDb.admin().listDatabases();
        
        console.log('\n📊 Available databases:');
        databases.databases.forEach(db => {
            console.log(`  - ${db.name} (${db.sizeOnDisk} bytes)`);
        });
        
        // Test a simple operation
        const testDb = client.db('test');
        const collections = await testDb.listCollections().toArray();
        console.log('\n📁 Collections in test database:');
        if (collections.length === 0) {
            console.log('  No collections found (this is normal for a new database)');
        } else {
            collections.forEach(collection => {
                console.log(`  - ${collection.name}`);
            });
        }
        
        console.log('\n🎉 Connection verification completed successfully!');
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Error details:', error);
    } finally {
        // Close the connection
        await client.close();
        console.log('\n🔌 Connection closed.');
    }
}

// Run the test
testConnection(); 