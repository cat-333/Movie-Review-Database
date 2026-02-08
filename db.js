const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '#Vengence1',
    database: 'MovieDB',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convert pool to promise-based
const promisePool = pool.promise();

module.exports = promisePool; 