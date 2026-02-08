<<<<<<< HEAD
# Movie Database Management System

A full-stack web application for managing and browsing movies, built with Node.js, Express, MySQL, and vanilla JavaScript.

## Features

- Browse movies with a modern, responsive UI
- Filter movies by genre and year
- Search functionality
- Detailed movie information with posters
- Rating and review system
- Support for multiple languages and genres
- Cast and crew information
- Production details and box office data

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **Database**: MySQL
- **API**: RESTful API
- **Other**: CORS for cross-origin requests

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/movie-database.git
   cd movie-database
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   # Create database and tables
   node init-db.js
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Database Configuration

Update the database configuration in `db.js` with your MySQL credentials:

```javascript
const config = {
    host: 'localhost',
    user: 'root',
    password: '#Vengence1',
    database: 'MovieDB'
};
```

## Project Structure

```
movie-database/
├── public/               # Static files
│   ├── index.html       # Main HTML file
│   ├── styles.css       # Stylesheet
│   └── script.js        # Frontend JavaScript
├── server.js            # Express server
├── db.js                # Database configuration
├── init-db.js           # Database initialization
├── clean-db.js          # Database cleanup
├── package.json         # Project dependencies
└── README.md           # Project documentation
```

## API Endpoints

- `GET /api/movies` - Get all movies
- `GET /api/movies/:id` - Get movie details
- `GET /api/reviews` - Get all reviews
- `POST /api/reviews` - Add a new review
- `GET /api/actors` - Get all actors

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Movie data sourced from various public APIs
- Icons from Font Awesome
- Movie posters from Unsplash 
=======
# Movie-Review-Database
A full-stack web application for managing and browsing movies, built with Node.js, Express, MySQL, and vanilla JavaScript.
>>>>>>> 91471dac0028453ac58a11908fd939454f304a45
