const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all movies
app.get('/api/movies', async (req, res) => {
    try {
        console.log('Fetching movies from database...');
        const [movies] = await db.query(`
            SELECT m.*, GROUP_CONCAT(g.Genre_Name) as genres
            FROM Movies m
            LEFT JOIN Movie_Genres mg ON m.Movie_ID = mg.Movie_ID
            LEFT JOIN Genres g ON mg.Genre_ID = g.Genre_ID
            GROUP BY m.Movie_ID
        `);
        console.log('Movies fetched:', movies);
        if (!movies || movies.length === 0) {
            console.log('No movies found in database');
            return res.status(404).json({ error: 'No movies found' });
        }
        res.json(movies);
    } catch (error) {
        console.error('Error in /api/movies:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all actors
app.get('/api/actors', async (req, res) => {
    try {
        const [actors] = await db.query(`
            SELECT cm.*, GROUP_CONCAT(m.Title) as movies
            FROM Movie_Cast_Members cm
            LEFT JOIN Movie_Cast mc ON cm.Cast_ID = mc.Cast_ID
            LEFT JOIN Movies m ON mc.Movie_ID = m.Movie_ID
            WHERE cm.Role = 'Actor'
            GROUP BY cm.Cast_ID
        `);
        res.json(actors);
    } catch (error) {
        console.error('Error fetching actors:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all reviews
app.get('/api/reviews', async (req, res) => {
    try {
        const [reviews] = await db.query(`
            SELECT r.*, m.Title as movie_title
            FROM Reviews r
            JOIN Movie_Reviews mr ON r.Review_ID = mr.Review_ID
            JOIN Movies m ON mr.Movie_ID = m.Movie_ID
            ORDER BY r.Review_Date DESC
        `);
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add a new review
app.post('/api/reviews', async (req, res) => {
    const { movieId, userName, userEmail, rating, reviewText } = req.body;
    try {
        // First insert the review
        const [result] = await db.query(
            'INSERT INTO Reviews (User_Name, User_Email, Rating, Review_Text) VALUES (?, ?, ?, ?)',
            [userName, userEmail, rating, reviewText]
        );
        
        // Then link it to the movie
        await db.query(
            'INSERT INTO Movie_Reviews (Movie_ID, Review_ID) VALUES (?, ?)',
            [movieId, result.insertId]
        );
        
        res.json({ id: result.insertId });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get movie details
app.get('/api/movies/:id', async (req, res) => {
    try {
        const [movies] = await db.query(`
            SELECT m.*, 
                   GROUP_CONCAT(DISTINCT g.Genre_Name) as genres,
                   GROUP_CONCAT(DISTINCT l.Language_Name) as languages,
                   GROUP_CONCAT(DISTINCT cm.Name) as cast
            FROM Movies m
            LEFT JOIN Movie_Genres mg ON m.Movie_ID = mg.Movie_ID
            LEFT JOIN Genres g ON mg.Genre_ID = g.Genre_ID
            LEFT JOIN Movie_Languages ml ON m.Movie_ID = ml.Movie_ID
            LEFT JOIN Languages l ON ml.Language_ID = l.Language_ID
            LEFT JOIN Movie_Cast mc ON m.Movie_ID = mc.Movie_ID
            LEFT JOIN Movie_Cast_Members cm ON mc.Cast_ID = cm.Cast_ID
            WHERE m.Movie_ID = ?
            GROUP BY m.Movie_ID
        `, [req.params.id]);
        
        if (movies.length === 0) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        
        res.json(movies[0]);
    } catch (error) {
        console.error('Error fetching movie details:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add a new movie
app.post('/api/movies', async (req, res) => {
    try {
        const {
            title,
            releaseDate,
            productionCompany,
            description,
            budget,
            boxOffice,
            runtime,
            genres,
            languages
        } = req.body;

        // Start a transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Insert the movie
            const [result] = await connection.query(`
                INSERT INTO Movies (
                    Title, Release_Date, Production_Company, Description,
                    Budget, Box_Office, Runtime
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [title, releaseDate, productionCompany, description, budget, boxOffice, runtime]);

            const movieId = result.insertId;

            // Handle genres
            if (genres) {
                const genreList = genres.split(',').map(g => g.trim());
                for (const genreName of genreList) {
                    // Check if genre exists
                    const [existingGenre] = await connection.query(
                        'SELECT Genre_ID FROM Genres WHERE Genre_Name = ?',
                        [genreName]
                    );

                    let genreId;
                    if (existingGenre.length === 0) {
                        // Create new genre
                        const [newGenre] = await connection.query(
                            'INSERT INTO Genres (Genre_Name) VALUES (?)',
                            [genreName]
                        );
                        genreId = newGenre.insertId;
                    } else {
                        genreId = existingGenre[0].Genre_ID;
                    }

                    // Link movie to genre
                    await connection.query(
                        'INSERT INTO Movie_Genres (Movie_ID, Genre_ID) VALUES (?, ?)',
                        [movieId, genreId]
                    );
                }
            }

            // Handle languages
            if (languages) {
                const languageList = languages.split(',').map(l => l.trim());
                for (const languageName of languageList) {
                    // Check if language exists
                    const [existingLanguage] = await connection.query(
                        'SELECT Language_ID FROM Languages WHERE Language_Name = ?',
                        [languageName]
                    );

                    let languageId;
                    if (existingLanguage.length === 0) {
                        // Create new language
                        const [newLanguage] = await connection.query(
                            'INSERT INTO Languages (Language_Name) VALUES (?)',
                            [languageName]
                        );
                        languageId = newLanguage.insertId;
                    } else {
                        languageId = existingLanguage[0].Language_ID;
                    }

                    // Link movie to language
                    await connection.query(
                        'INSERT INTO Movie_Languages (Movie_ID, Language_ID) VALUES (?, ?)',
                        [movieId, languageId]
                    );
                }
            }

            // Commit the transaction
            await connection.commit();
            connection.release();

            // Return the newly created movie
            const [newMovie] = await db.query(`
                SELECT m.*, 
                       GROUP_CONCAT(g.Genre_Name) as genres,
                       GROUP_CONCAT(l.Language_Name) as languages
                FROM Movies m
                LEFT JOIN Movie_Genres mg ON m.Movie_ID = mg.Movie_ID
                LEFT JOIN Genres g ON mg.Genre_ID = g.Genre_ID
                LEFT JOIN Movie_Languages ml ON m.Movie_ID = ml.Movie_ID
                LEFT JOIN Languages l ON ml.Language_ID = l.Language_ID
                WHERE m.Movie_ID = ?
                GROUP BY m.Movie_ID
            `, [movieId]);

            res.status(201).json(newMovie[0]);
        } catch (error) {
            // Rollback the transaction in case of error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Error adding movie:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get reviews for a movie
app.get('/api/movies/:id/reviews', async (req, res) => {
    try {
        const [reviews] = await db.query(`
            SELECT r.*, m.Title as movie_title, m.Average_Rating
            FROM Reviews r
            JOIN Movie_Reviews mr ON r.Review_ID = mr.Review_ID
            JOIN Movies m ON mr.Movie_ID = m.Movie_ID
            WHERE m.Movie_ID = ?
            ORDER BY r.Review_Date DESC
        `, [req.params.id]);
        
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add a review
app.post('/api/movies/:id/reviews', async (req, res) => {
    try {
        const { userName, userEmail, rating, reviewText } = req.body;
        const movieId = req.params.id;

        // Start a transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Insert the review
            const [result] = await connection.query(`
                INSERT INTO Reviews (User_Name, User_Email, Rating, Review_Text)
                VALUES (?, ?, ?, ?)
            `, [userName, userEmail, rating, reviewText]);

            const reviewId = result.insertId;

            // Link the review to the movie
            await connection.query(`
                INSERT INTO Movie_Reviews (Movie_ID, Review_ID)
                VALUES (?, ?)
            `, [movieId, reviewId]);

            // Calculate new average rating
            const [avgResult] = await connection.query(`
                SELECT AVG(r.Rating) as newAverage
                FROM Reviews r
                JOIN Movie_Reviews mr ON r.Review_ID = mr.Review_ID
                WHERE mr.Movie_ID = ?
            `, [movieId]);

            const newAverage = avgResult[0].newAverage || 0;

            // Update movie's average rating
            await connection.query(`
                UPDATE Movies
                SET Average_Rating = ?
                WHERE Movie_ID = ?
            `, [newAverage, movieId]);

            // Commit the transaction
            await connection.commit();
            connection.release();

            // Return the newly created review and updated movie
            const [newReview] = await db.query(`
                SELECT r.*, m.Average_Rating
                FROM Reviews r
                JOIN Movie_Reviews mr ON r.Review_ID = mr.Review_ID
                JOIN Movies m ON mr.Movie_ID = m.Movie_ID
                WHERE r.Review_ID = ?
            `, [reviewId]);

            res.status(201).json(newReview[0]);
        } catch (error) {
            // Rollback the transaction in case of error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a review
app.delete('/api/movies/:movieId/reviews/:reviewId', async (req, res) => {
    try {
        const { movieId, reviewId } = req.params;

        // Start a transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Delete the review from Movie_Reviews first (due to foreign key constraints)
            await connection.query(`
                DELETE FROM Movie_Reviews 
                WHERE Movie_ID = ? AND Review_ID = ?
            `, [movieId, reviewId]);

            // Delete the review
            await connection.query(`
                DELETE FROM Reviews 
                WHERE Review_ID = ?
            `, [reviewId]);

            // Calculate new average rating
            const [avgResult] = await connection.query(`
                SELECT AVG(r.Rating) as newAverage
                FROM Reviews r
                JOIN Movie_Reviews mr ON r.Review_ID = mr.Review_ID
                WHERE mr.Movie_ID = ?
            `, [movieId]);

            const newAverage = avgResult[0].newAverage || 0;

            // Update movie's average rating
            await connection.query(`
                UPDATE Movies
                SET Average_Rating = ?
                WHERE Movie_ID = ?
            `, [newAverage, movieId]);

            // Commit the transaction
            await connection.commit();
            connection.release();

            res.json({ 
                success: true,
                newAverageRating: newAverage
            });
        } catch (error) {
            // Rollback the transaction in case of error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: error.message });
    }
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 