const mysql = require('mysql2/promise');

async function initializeDatabase() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '#Vengence1'
    });

    try {
        // Create database if it doesn't exist
        await connection.query('CREATE DATABASE IF NOT EXISTS MovieDB');
        await connection.query('USE MovieDB');

        // Drop existing tables in correct order
        await connection.query('DROP TABLE IF EXISTS Movie_Reviews');
        await connection.query('DROP TABLE IF EXISTS Movie_Genres');
        await connection.query('DROP TABLE IF EXISTS Movie_Languages');
        await connection.query('DROP TABLE IF EXISTS Movie_Cast');
        await connection.query('DROP TABLE IF EXISTS Movie_Awards');
        await connection.query('DROP TABLE IF EXISTS Reviews');
        await connection.query('DROP TABLE IF EXISTS Genres');
        await connection.query('DROP TABLE IF EXISTS Languages');
        await connection.query('DROP TABLE IF EXISTS Movie_Cast_Members');
        await connection.query('DROP TABLE IF EXISTS Awards');
        await connection.query('DROP TABLE IF EXISTS Movies');

        // Create main Movies table
        await connection.query(`
            CREATE TABLE Movies (
                Movie_ID INT PRIMARY KEY AUTO_INCREMENT,
                Title VARCHAR(255) NOT NULL,
                Release_Date DATE NOT NULL,
                Average_Rating DECIMAL(4,2) CHECK (Average_Rating BETWEEN 0 AND 10),
                Production_Company VARCHAR(255),
                Description TEXT,
                Budget DECIMAL(15,2),
                Box_Office DECIMAL(15,2),
                Runtime INT,
                Poster_URL VARCHAR(255)
            )
        `);

        // Create Genres table
        await connection.query(`
            CREATE TABLE Genres (
                Genre_ID INT PRIMARY KEY AUTO_INCREMENT,
                Genre_Name VARCHAR(100) UNIQUE NOT NULL
            )
        `);

        // Create Movie_Genres junction table
        await connection.query(`
            CREATE TABLE Movie_Genres (
                Movie_ID INT,
                Genre_ID INT,
                PRIMARY KEY (Movie_ID, Genre_ID),
                FOREIGN KEY (Movie_ID) REFERENCES Movies(Movie_ID) ON DELETE CASCADE,
                FOREIGN KEY (Genre_ID) REFERENCES Genres(Genre_ID) ON DELETE CASCADE
            )
        `);

        // Create Languages table
        await connection.query(`
            CREATE TABLE Languages (
                Language_ID INT PRIMARY KEY AUTO_INCREMENT,
                Language_Name VARCHAR(100) UNIQUE NOT NULL
            )
        `);

        // Create Movie_Languages junction table
        await connection.query(`
            CREATE TABLE Movie_Languages (
                Movie_ID INT,
                Language_ID INT,
                PRIMARY KEY (Movie_ID, Language_ID),
                FOREIGN KEY (Movie_ID) REFERENCES Movies(Movie_ID) ON DELETE CASCADE,
                FOREIGN KEY (Language_ID) REFERENCES Languages(Language_ID) ON DELETE CASCADE
            )
        `);

        // Create Movie_Cast_Members table
        await connection.query(`
            CREATE TABLE Movie_Cast_Members (
                Cast_ID INT PRIMARY KEY AUTO_INCREMENT,
                Name VARCHAR(255) NOT NULL,
                Role ENUM('Actor', 'Director', 'Producer', 'Music Director', 'Writer') NOT NULL,
                Biography TEXT,
                Photo_URL VARCHAR(255)
            )
        `);

        // Create Movie_Cast junction table
        await connection.query(`
            CREATE TABLE Movie_Cast (
                Movie_ID INT,
                Cast_ID INT,
                Character_Name VARCHAR(255),
                Role_In_Movie VARCHAR(100),
                PRIMARY KEY (Movie_ID, Cast_ID),
                FOREIGN KEY (Movie_ID) REFERENCES Movies(Movie_ID) ON DELETE CASCADE,
                FOREIGN KEY (Cast_ID) REFERENCES Movie_Cast_Members(Cast_ID) ON DELETE CASCADE
            )
        `);

        // Create Awards table
        await connection.query(`
            CREATE TABLE Awards (
                Award_ID INT PRIMARY KEY AUTO_INCREMENT,
                Award_Name VARCHAR(255) NOT NULL,
                Category VARCHAR(255),
                Year INT CHECK (Year >= 1900)
            )
        `);

        // Create Movie_Awards junction table
        await connection.query(`
            CREATE TABLE Movie_Awards (
                Movie_ID INT,
                Award_ID INT,
                Cast_ID INT,
                Won BOOLEAN DEFAULT TRUE,
                PRIMARY KEY (Movie_ID, Award_ID, Cast_ID),
                FOREIGN KEY (Movie_ID) REFERENCES Movies(Movie_ID) ON DELETE CASCADE,
                FOREIGN KEY (Award_ID) REFERENCES Awards(Award_ID) ON DELETE CASCADE,
                FOREIGN KEY (Cast_ID) REFERENCES Movie_Cast_Members(Cast_ID) ON DELETE CASCADE
            )
        `);

        // Create Reviews table
        await connection.query(`
            CREATE TABLE Reviews (
                Review_ID INT PRIMARY KEY AUTO_INCREMENT,
                User_Name VARCHAR(100) NOT NULL,
                User_Email VARCHAR(255) NOT NULL,
                Rating DECIMAL(4,2) CHECK (Rating BETWEEN 0 AND 10),
                Review_Text TEXT,
                Review_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create Movie_Reviews junction table
        await connection.query(`
            CREATE TABLE Movie_Reviews (
                Movie_ID INT,
                Review_ID INT,
                PRIMARY KEY (Movie_ID, Review_ID),
                FOREIGN KEY (Movie_ID) REFERENCES Movies(Movie_ID) ON DELETE CASCADE,
                FOREIGN KEY (Review_ID) REFERENCES Reviews(Review_ID) ON DELETE CASCADE
            )
        `);

        // Insert sample data
        await connection.query(`
            INSERT INTO Movies (Title, Release_Date, Average_Rating, Production_Company, Description, Budget, Box_Office, Runtime, Poster_URL)
            VALUES 
            ('Inception', '2010-07-16', 8.8, 'Warner Bros', 'A mind-bending thriller about dreams and reality', 160000000, 836836967, 148, 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg'),
            ('The Dark Knight', '2008-07-18', 9.0, 'Warner Bros', 'A battle between Batman and Joker', 185000000, 1004558444, 152, 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg'),
            ('Titanic', '1997-12-19', 7.8, '20th Century Fox', 'A tragic love story on the ill-fated ship', 200000000, 2201647264, 195, 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg'),
            ('The Matrix', '1999-03-31', 8.7, 'Warner Bros', 'A computer hacker learns about the true nature of his reality and his role in the war against its controllers.', 63000000, 463517383, 136, 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpQUk5H.jpg'),
            ('Pulp Fiction', '1994-10-14', 8.9, 'Miramax', 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.', 8000000, 213928762, 154, 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg'),
            ('Fight Club', '1999-10-15', 8.8, '20th Century Fox', 'An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into something much, much more.', 63000000, 100853753, 139, 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7Qf4n6a8MIx.jpg'),
            ('Forrest Gump', '1994-07-06', 8.8, 'Paramount Pictures', 'The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate and other historical events unfold through the perspective of an Alabama man with an IQ of 75.', 55000000, 677387716, 142, 'https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANmKrsFl.jpg'),
            ('Spirited Away', '2001-07-20', 8.6, 'Studio Ghibli', 'A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.', 19000000, 274925095, 125, 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUKGk251ytnZ.jpg')
        `);

        await connection.query(`
            INSERT INTO Genres (Genre_Name)
            VALUES 
            ('Action'), ('Drama'), ('Sci-Fi'), ('Thriller'), ('Romance'), ('Adventure'), ('Crime'), ('Animation'), ('Fantasy')
        `);

        // Movie IDs: 1:Inception, 2:Dark Knight, 3:Titanic, 4:Matrix, 5:Pulp Fiction, 6:Fight Club, 7:Forrest Gump, 8:Spirited Away
        // Genre IDs: 1:Action, 2:Drama, 3:Sci-Fi, 4:Thriller, 5:Romance, 6:Adventure, 7:Crime, 8:Animation, 9:Fantasy
        await connection.query(`
            INSERT INTO Movie_Genres (Movie_ID, Genre_ID)
            VALUES 
            (1, 3), (1, 4), -- Inception: Sci-Fi, Thriller
            (2, 1), (2, 4), (2, 7), -- Dark Knight: Action, Thriller, Crime
            (3, 2), (3, 5), -- Titanic: Drama, Romance
            (4, 1), (4, 3), -- Matrix: Action, Sci-Fi
            (5, 7), (5, 2), -- Pulp Fiction: Crime, Drama
            (6, 2), -- Fight Club: Drama
            (7, 2), (7, 5), -- Forrest Gump: Drama, Romance
            (8, 8), (8, 6), (8, 9) -- Spirited Away: Animation, Adventure, Fantasy
        `);

        await connection.query(`
            INSERT INTO Languages (Language_Name)
            VALUES 
            ('English'), ('French'), ('Spanish'), ('German'), ('Japanese')
        `);

        await connection.query(`
            INSERT INTO Movie_Languages (Movie_ID, Language_ID)
            VALUES 
            (1, 1), (1, 2), (1, 5),
            (2, 1),
            (3, 1), (3, 2), (3, 4),
            (4, 1),
            (5, 1), (5, 2),
            (6, 1),
            (7, 1),
            (8, 5) -- Japanese for Spirited Away
        `);

        await connection.query(`
            INSERT INTO Movie_Cast_Members (Name, Role, Biography, Photo_URL)
            VALUES 
            ('Leonardo DiCaprio', 'Actor', 'Academy Award-winning actor', 'https://image.tmdb.org/t/p/w500/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg'),
            ('Christian Bale', 'Actor', 'Versatile actor known for his transformations', 'https://image.tmdb.org/t/p/w500/b7fTC9WFkgqGOv77mLQzqDUI50.jpg'),
            ('Christopher Nolan', 'Director', 'Visionary filmmaker', 'https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaKgYZuz.jpg'),
            ('James Cameron', 'Director', 'Acclaimed director and producer', 'https://image.tmdb.org/t/p/w500/9NAhR64570bZ1VMRZ8s9Hl5y8jU.jpg'),
            ('Keanu Reeves', 'Actor', 'Known for The Matrix and John Wick', 'https://image.tmdb.org/t/p/w500/4D0PpNI0km39liNrCbkkU95sMub.jpg'),
            ('John Travolta', 'Actor', 'Known for Pulp Fiction and Grease', 'https://image.tmdb.org/t/p/w500/sHk1h3pQn7I3iGqXyQ5nZ9jX8.jpg'),
            ('Brad Pitt', 'Actor', 'One of the worlds most famous movie stars', 'https://image.tmdb.org/t/p/w500/cckcYc2v0yh1tc9QjRelptcOBko.jpg'),
            ('Tom Hanks', 'Actor', 'Beloved American actor and filmmaker', 'https://image.tmdb.org/t/p/w500/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg'),
            ('Hayao Miyazaki', 'Director', 'Legendary animator and director', 'https://image.tmdb.org/t/p/w500/m5f9l8i6gKkQ8jZ7xH9q51bL.jpg'),
            ('Quentin Tarantino', 'Writer', 'Acclaimed director and writer', 'https://image.tmdb.org/t/p/w500/1gjcpAa99FAjGclCQwKuha5Y2Gs.jpg')
        `);

        // Cast IDs: 1:Leo, 2:Bale, 3:Nolan, 4:Cameron, 5:Keanu, 6:Travolta, 7:Brad, 8:Hanks, 9:Miyazaki, 10:Tarantino
        await connection.query(`
            INSERT INTO Movie_Cast (Movie_ID, Cast_ID, Character_Name, Role_In_Movie)
            VALUES 
            (1, 1, 'Dom Cobb', 'Lead Actor'),
            (1, 3, NULL, 'Director'),
            (2, 2, 'Bruce Wayne/Batman', 'Lead Actor'),
            (2, 3, NULL, 'Director'),
            (3, 1, 'Jack Dawson', 'Lead Actor'),
            (3, 4, NULL, 'Director'),
            (4, 5, 'Neo', 'Lead Actor'),
            (5, 6, 'Vincent Vega', 'Lead Actor'),
            (6, 7, 'Tyler Durden', 'Lead Actor'),
            (7, 8, 'Forrest Gump', 'Lead Actor'),
            (8, 9, NULL, 'Director'),
            (5, 10, NULL, 'Writer')
        `);

        await connection.query(`
            INSERT INTO Awards (Award_Name, Category, Year)
            VALUES 
            ('Academy Award', 'Best Picture', 2011),
            ('Academy Award', 'Best Director', 2009),
            ('Golden Globe', 'Best Actor', 1998),
            ('Academy Award', 'Best Original Screenplay', 1995)
        `);

        await connection.query(`
            INSERT INTO Movie_Awards (Movie_ID, Award_ID, Cast_ID, Won)
            VALUES 
            (1, 1, 3, TRUE),
            (2, 2, 3, TRUE),
            (3, 3, 1, TRUE),
            (5, 4, 10, TRUE)
        `);

        await connection.query(`
            INSERT INTO Reviews (User_Name, User_Email, Rating, Review_Text)
            VALUES 
            ('John Doe', 'john@example.com', 9.0, 'Amazing concept and execution!'),
            ('Alice Smith', 'alice@example.com', 8.5, 'Mind-blowing but a bit confusing'),
            ('Bob Wilson', 'bob@example.com', 9.5, 'Best Batman movie ever made!'),
            ('Sarah Connor', 'sarah@example.com', 10.0, 'The Matrix changed my life.'),
            ('Movie Buff', 'buff@example.com', 9.2, 'Tarantino at his best.'),
            ('Tyler', 'tyler@example.com', 9.0, 'First rule of fight club...'),
            ('Jenny', 'jenny@example.com', 9.5, 'Run Forrest Run!'),
            ('Anime Fan', 'fan@example.com', 10.0, 'Pure magic. Ghibli masterpiece.')
        `);

        await connection.query(`
            INSERT INTO Movie_Reviews (Movie_ID, Review_ID)
            VALUES 
            (1, 1),
            (1, 2),
            (2, 3),
            (4, 4),
            (5, 5),
            (6, 6),
            (7, 7),
            (8, 8)
        `);

        console.log('Database and tables created successfully with sample data!');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await connection.end();
    }
}

initializeDatabase(); 