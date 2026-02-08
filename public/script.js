const API_BASE_URL = 'http://localhost:3000/api';
let allMovies = [];
let genres = new Set();
let years = new Set();
let watchlist = new Set(JSON.parse(localStorage.getItem('movieWatchlist') || '[]'));
let showingWatchlistOnly = false;

// DOM Elements
const moviesGrid = document.getElementById('moviesGrid');
const movieModal = document.getElementById('movieModal');
const closeButton = document.querySelector('.close-button');
const searchInput = document.getElementById('searchInput');
const genreFilter = document.getElementById('genreFilter');
const yearFilter = document.getElementById('yearFilter');
const watchlistBtn = document.getElementById('watchlistBtn');
const watchlistCount = document.getElementById('watchlistCount');
const toastContainer = document.getElementById('toastContainer');
const movieCardTemplate = document.getElementById('movieCardTemplate');

// Add Movie Modal Elements
const addMovieBtn = document.getElementById('addMovieBtn');
const addMovieModal = document.getElementById('addMovieModal');
const addMovieForm = document.getElementById('addMovieForm');
const closeAddMovieBtn = addMovieModal.querySelector('.close-button');

// Event Listeners
searchInput.addEventListener('input', handleSearch);
genreFilter.addEventListener('change', handleFilters);
yearFilter.addEventListener('change', handleFilters);
watchlistBtn.addEventListener('click', toggleWatchlistView);
closeButton.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === movieModal) closeModal();
});

// Update initial watchlist count
updateWatchlistCount();

// Event Listeners for Add Movie Modal
addMovieBtn.addEventListener('click', () => {
    addMovieModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
});

closeAddMovieBtn.addEventListener('click', () => {
    addMovieModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

window.addEventListener('click', (e) => {
    if (e.target === addMovieModal) {
        addMovieModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Fetch all movies
async function fetchMovies() {
    try {
        console.log('Fetching movies from API...');
        const response = await fetch(`${API_BASE_URL}/movies`);
        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Movies data received:', data);

        if (!data || data.length === 0) {
            throw new Error('No movies found in the response');
        }

        allMovies = data;
        updateFilters();
        displayMovies(allMovies);
    } catch (error) {
        console.error('Error in fetchMovies:', error);
        moviesGrid.innerHTML = `
            <div class="error-message">
                <p>Error loading movies: ${error.message}</p>
                <p>Please check the console for more details.</p>
            </div>
        `;
    }
}

// Display movies in the grid
function displayMovies(movies) {
    console.log('Displaying movies:', movies);
    moviesGrid.innerHTML = '';
    if (!movies || movies.length === 0) {
        console.log('No movies to display');
        moviesGrid.innerHTML = '<p class="error">No movies found.</p>';
        return;
    }
    movies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        moviesGrid.appendChild(movieCard);
    });
}

// Create a movie card
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.movieId = movie.Movie_ID;

    // Check if in watchlist
    const isWatchlisted = watchlist.has(movie.Movie_ID);

    // Create poster container
    const poster = document.createElement('div');
    poster.className = 'movie-poster';
    poster.innerHTML = `
        <img src="${movie.Poster_URL || 'https://via.placeholder.com/300x450?text=No+Poster'}" 
             alt="${movie.Title}" loading="lazy">
        <div class="heart-icon ${isWatchlisted ? 'active' : ''}" title="${isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}">
            <i class="fas fa-heart"></i>
        </div>
    `;

    // Heart icon click event
    const heartIcon = poster.querySelector('.heart-icon');
    heartIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWatchlist(movie.Movie_ID, heartIcon);
    });

    // Create info container
    const info = document.createElement('div');
    info.className = 'movie-info';
    info.innerHTML = `
        <h3 class="movie-title">${movie.Title}</h3>
        <div class="movie-meta">
            <span class="movie-rating">
                <i class="fas fa-star" style="color: #ffd700;"></i> ${parseFloat(movie.Average_Rating || 0).toFixed(1)}
            </span>
            <span class="movie-year">${new Date(movie.Release_Date).getFullYear()}</span>
        </div>
        <div class="movie-genres">
            ${movie.genres ? movie.genres.split(',').slice(0, 3).map(genre =>
        `<span>${genre.trim()}</span>`
    ).join('') : ''}
        </div>
    `;

    // Add click event for movie details
    card.addEventListener('click', () => showMovieDetails(movie));

    // Append elements
    card.appendChild(poster);
    card.appendChild(info);

    return card;
}

// Show movie details in modal
async function showMovieDetails(movie) {
    try {
        const response = await fetch(`${API_BASE_URL}/movies/${movie.Movie_ID}`);
        const movieDetails = await response.json();

        const modalBody = document.querySelector('.modal-body');
        modalBody.dataset.movieId = movie.Movie_ID;
        modalBody.innerHTML = `
            <div class="modal-header">
                <div class="modal-poster">
                    <img src="${movie.Poster_URL || 'https://via.placeholder.com/300x450?text=No+Poster'}" 
                         alt="${movie.Title}">
                </div>
                <div class="modal-info">
                    <h2>${movie.Title}</h2>
                    <div class="meta-info">
                        <span class="year">${new Date(movie.Release_Date).getFullYear()}</span>
                        <span class="rating">
                            <i class="fas fa-star"></i> ${parseFloat(movie.Average_Rating || 0).toFixed(1)}
                        </span>
                        <span class="runtime">${movie.Runtime || 'N/A'} min</span>
                    </div>
                    <div class="genres">
                        ${movieDetails.genres?.split(',').map(genre =>
            `<span class="genre-tag">${genre.trim()}</span>`).join('') || ''}
                    </div>
                    <p class="description">${movie.Description || 'No description available.'}</p>
                    <div class="production">
                        <strong>Production:</strong> ${movie.Production_Company || 'N/A'}
                    </div>
                    <div class="languages">
                        <strong>Languages:</strong> ${movieDetails.languages || 'N/A'}
                    </div>
                    <div class="cast">
                        <strong>Cast:</strong> ${movieDetails.cast || 'N/A'}
                    </div>
                </div>
            </div>
            <div class="modal-reviews">
                <h3>Reviews</h3>
                <div class="reviews-container">
                    <!-- Reviews will be loaded here -->
                </div>
                <div class="add-review">
                    <h4>Add Your Review</h4>
                    <form id="reviewForm" data-movie-id="${movie.Movie_ID}">
                        <div class="form-group">
                            <label for="userName">Your Name</label>
                            <input type="text" id="userName" name="userName" required>
                        </div>
                        <div class="form-group">
                            <label for="userEmail">Your Email</label>
                            <input type="email" id="userEmail" name="userEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="rating">Rating (1-10)</label>
                            <input type="number" id="rating" name="rating" min="1" max="10" required>
                        </div>
                        <div class="form-group">
                            <label for="reviewText">Your Review</label>
                            <textarea id="reviewText" name="reviewText" required></textarea>
                        </div>
                        <button type="submit" class="submit-btn">Submit Review</button>
                    </form>
                </div>
            </div>
        `;

        // Load reviews
        await loadReviews(movie.Movie_ID);

        // Add event listener for the review form
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.addEventListener('submit', handleReviewSubmit);
        }

        movieModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error loading movie details:', error);
    }
}

// Load reviews for a movie
async function loadReviews(movieId) {
    try {
        const response = await fetch(`${API_BASE_URL}/movies/${movieId}/reviews`);
        const reviews = await response.json();

        const reviewsContainer = document.querySelector('.reviews-container');
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
            return;
        }

        reviewsContainer.innerHTML = reviews.map(review => `
            <div class="review" data-review-id="${review.Review_ID}">
                <div class="review-header">
                    <span class="reviewer-name">${review.User_Name}</span>
                    <span class="review-rating">
                        <i class="fas fa-star"></i> ${review.Rating}
                    </span>
                    <button class="delete-review-btn" onclick="deleteReview(${review.Review_ID}, ${movieId})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="review-date">
                    ${new Date(review.Review_Date).toLocaleDateString()}
                </div>
                <p class="review-text">${review.Review_Text}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.querySelector('.reviews-container').innerHTML =
            '<p>Error loading reviews. Please try again later.</p>';
    }
}

// Delete a review
async function deleteReview(reviewId, movieId) {
    if (!confirm('Are you sure you want to delete this review?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/movies/${movieId}/reviews/${reviewId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Update the movie's average rating in the UI
        const movieCard = document.querySelector(`.movie-card[data-movie-id="${movieId}"]`);
        if (movieCard) {
            const ratingElement = movieCard.querySelector('.movie-rating');
            if (ratingElement) {
                ratingElement.innerHTML = `<i class="fas fa-star"></i> ${parseFloat(result.newAverageRating).toFixed(1)}`;
            }
        }

        // Update the rating in the modal
        const modalRating = document.querySelector('.modal-info .rating');
        if (modalRating) {
            modalRating.innerHTML = `<i class="fas fa-star"></i> ${parseFloat(result.newAverageRating).toFixed(1)}`;
        }

        // Reload reviews
        await loadReviews(movieId);

        // Show success message
        showMessage('Review deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting review:', error);
        showMessage('Error deleting review. Please try again.', 'error');
    }
}

// Handle review form submission
async function handleReviewSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const movieId = form.dataset.movieId;
    const formData = new FormData(form);
    const reviewData = {
        userName: formData.get('userName'),
        userEmail: formData.get('userEmail'),
        rating: parseInt(formData.get('rating')),
        reviewText: formData.get('reviewText')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/movies/${movieId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reviewData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newReview = await response.json();

        // Update the movie's average rating in the UI
        const movieCard = document.querySelector(`.movie-card[data-movie-id="${movieId}"]`);
        if (movieCard) {
            const ratingElement = movieCard.querySelector('.movie-rating');
            if (ratingElement) {
                ratingElement.innerHTML = `<i class="fas fa-star"></i> ${parseFloat(newReview.Average_Rating).toFixed(1)}`;
            }
        }

        // Update the rating in the modal
        const modalRating = document.querySelector('.modal-info .rating');
        if (modalRating) {
            modalRating.innerHTML = `<i class="fas fa-star"></i> ${parseFloat(newReview.Average_Rating).toFixed(1)}`;
        }

        // Clear the form
        form.reset();

        // Reload reviews
        await loadReviews(movieId);

        // Show success message
        showMessage('Review submitted successfully!', 'success');
    } catch (error) {
        console.error('Error submitting review:', error);
        showMessage('Error submitting review. Please try again.', 'error');
    }
}

// Show message function (Redirect to new Toast system)
function showMessage(message, type) {
    showToast(message, type);
}

// Close modal
function closeModal() {
    movieModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Update filter options
function updateFilters() {
    // Update genres filter
    genres = new Set(allMovies.flatMap(movie =>
        movie.genres ? movie.genres.split(',').map(g => g.trim()) : []
    ));
    genreFilter.innerHTML = `
        <option value="">All Genres</option>
        ${[...genres].sort().map(genre =>
        `<option value="${genre}">${genre}</option>`
    ).join('')}
    `;

    // Update years filter
    years = new Set(allMovies.map(movie =>
        new Date(movie.Release_Date).getFullYear()
    ));
    yearFilter.innerHTML = `
        <option value="">All Years</option>
        ${[...years].sort().reverse().map(year =>
        `<option value="${year}">${year}</option>`
    ).join('')}
    `;
}

// Handle search
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredMovies = allMovies.filter(movie =>
        movie.Title.toLowerCase().includes(searchTerm) ||
        movie.Description?.toLowerCase().includes(searchTerm) ||
        movie.genres?.toLowerCase().includes(searchTerm)
    );
    displayMovies(filteredMovies);
}

// Handle filters
function handleFilters() {
    const selectedGenre = genreFilter.value;
    const selectedYear = yearFilter.value;

    let filteredMovies = allMovies;

    // Apply Watchlist filter if active
    if (showingWatchlistOnly) {
        filteredMovies = filteredMovies.filter(movie => watchlist.has(movie.Movie_ID));
    }

    if (selectedGenre) {
        filteredMovies = filteredMovies.filter(movie =>
            movie.genres?.includes(selectedGenre)
        );
    }

    if (selectedYear) {
        filteredMovies = filteredMovies.filter(movie =>
            new Date(movie.Release_Date).getFullYear() === parseInt(selectedYear)
        );
    }

    displayMovies(filteredMovies);
}

// Watchlist Functions
function toggleWatchlist(movieId, iconElement) {
    const isAdding = !watchlist.has(movieId);

    if (isAdding) {
        watchlist.add(movieId);
        iconElement.classList.add('active');
        iconElement.title = "Remove from Watchlist";
        showToast('Added to Watchlist', 'success');
    } else {
        watchlist.delete(movieId);
        iconElement.classList.remove('active');
        iconElement.title = "Add to Watchlist";
        showToast('Removed from Watchlist', 'error'); // Using error style for remove but it's just a style

        // If we are in watchlist view, refresh the grid to remove the item immediately
        if (showingWatchlistOnly) {
            handleFilters();
        }
    }

    // Update LocalStorage
    localStorage.setItem('movieWatchlist', JSON.stringify([...watchlist]));
    updateWatchlistCount();
}

function updateWatchlistCount() {
    watchlistCount.textContent = watchlist.size;
}

function toggleWatchlistView() {
    showingWatchlistOnly = !showingWatchlistOnly;

    if (showingWatchlistOnly) {
        watchlistBtn.classList.add('active');
        watchlistBtn.innerHTML = `<i class="fas fa-heart"></i> Show All`;
    } else {
        watchlistBtn.classList.remove('active');
        watchlistBtn.innerHTML = `<i class="fas fa-heart"></i> <span id="watchlistCount">${watchlist.size}</span>`;
        // Re-bind the span we just destroyed
        // Actually, better to just update text content if structure allows, but here we replace innerHTML
    }

    handleFilters();
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOutRight 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Handle Add Movie Form Submission
addMovieForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        title: document.getElementById('title').value,
        releaseDate: document.getElementById('releaseDate').value,
        productionCompany: document.getElementById('productionCompany').value,
        description: document.getElementById('description').value,
        budget: document.getElementById('budget').value,
        boxOffice: document.getElementById('boxOffice').value,
        runtime: document.getElementById('runtime').value,
        genres: document.getElementById('genres').value,
        languages: document.getElementById('languages').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/movies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to add movie');
        }

        const newMovie = await response.json();
        allMovies.push(newMovie);
        updateFilters();
        displayMovies(allMovies);
        addMovieModal.style.display = 'none';
        addMovieForm.reset();
        showMessage('Movie added successfully!', 'success');
    } catch (error) {
        console.error('Error adding movie:', error);
        showMessage('Error adding movie. Please try again.', 'error');
    }
});

// Add some CSS for the modal content
const style = document.createElement('style');
style.textContent = `
    .modal-header {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .modal-poster img {
        width: 100%;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .modal-info h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
    }

    .meta-info {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 1rem;
        color: var(--text-secondary);
    }

    .genre-tag {
        background: var(--secondary-color);
        padding: 0.3rem 1rem;
        border-radius: 20px;
        margin: 0.2rem;
        display: inline-block;
    }

    .description {
        margin: 1.5rem 0;
        line-height: 1.6;
    }

    .production, .languages, .cast {
        margin: 0.5rem 0;
        color: var(--text-secondary);
    }

    .modal-reviews {
        border-top: 1px solid var(--secondary-color);
        padding-top: 2rem;
    }

    .review {
        background: var(--secondary-color);
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
    }

    .review-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
    }

    .reviewer {
        font-weight: bold;
    }

    .review-rating {
        color: #ffd700;
    }

    .review-date {
        display: block;
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
        .modal-header {
            grid-template-columns: 1fr;
        }

        .modal-poster {
            max-width: 300px;
            margin: 0 auto;
        }
    }

    .delete-review-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.2rem;
        margin-left: 0.5rem;
        transition: color 0.3s;
    }

    .delete-review-btn:hover {
        color: #ff4444;
    }
`;

document.head.appendChild(style);

// Initialize the page
fetchMovies(); 