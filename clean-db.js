const mysql = require('mysql2/promise');

async function cleanDatabase() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '#Vengence1'
    });

    try {
        await connection.query('DROP DATABASE IF EXISTS MovieDB');
        console.log('Database dropped successfully');
    } catch (error) {
        console.error('Error cleaning database:', error);
    } finally {
        await connection.end();
    }
}

cleanDatabase(); 