const mysql = require('mysql2/promise');

async function testDatabase() {
    try {
        // Create connection
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '#Vengence1',
            database: 'MovieDB'
        });

        console.log('Successfully connected to the database!');

        // Test query
        const [movies] = await connection.query('SELECT * FROM Movies');
        console.log('Movies in database:', movies);

        // Check if tables exist
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Available tables:', tables);

        await connection.end();
    } catch (error) {
        console.error('Database connection error:', error);
    }
}

testDatabase(); 