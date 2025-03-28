const baseURL = 'http://www.omdbapi.com/apikey.aspx?VERIFYKEY=a5f48368-c2c1-4dc9-8c4b-5cccff22bf1b';
const API_KEY = '82cca542';
// DOM Elements
const searchInput = document.getElementById('search');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const movieDetails = document.getElementById('movie-details');
const favoritesContainer = document.getElementById('favorites-container');

// Event Listeners
document.addEventListener('DOMContentLoaded', loadFavorites);
searchBtn.addEventListener('click', searchMovies);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchMovies();
    }
});

// Global Variables
let favorites = [];

// Functions
async function searchMovies() {
    const searchTerm = searchInput.value.trim();
    if (searchTerm.length === 0) {
        return;
    }

    try {
        // Show loading state
        searchResults.innerHTML = '<div class="loading">Searching for movies...</div>';
        movieDetails.classList.add('hidden');
        
        const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(searchTerm)}&apikey=${API_KEY}`);
        const data = await response.json();

        if (data.Response === 'False') {
            searchResults.innerHTML = `<div class="error">${data.Error}</div>`;
            return;
        }

        displaySearchResults(data.Search);
    } catch (error) {
        searchResults.innerHTML = `<div class="error">Error fetching movies: ${error.message}</div>`;
    }
}

function displaySearchResults(movies) {
    searchResults.innerHTML = '';
    
    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.dataset.imdbid = movie.imdbID;
        
        const posterUrl = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster+Available';
        
        movieCard.innerHTML = `
            <img class="movie-poster" src="${posterUrl}" alt="${movie.Title} poster">
            <div class="movie-info">
                <h3 class="movie-title">${movie.Title}</h3>
                <p class="movie-year">${movie.Year}</p>
            </div>
        `;
        
        movieCard.addEventListener('click', () => getMovieDetails(movie.imdbID));
        searchResults.appendChild(movieCard);
    });
}

async function getMovieDetails(imdbID) {
    try {
        // Show loading state
        movieDetails.innerHTML = '<div class="loading">Loading movie details...</div>';
        movieDetails.classList.remove('hidden');
        
        const response = await fetch(`https://www.omdbapi.com/?i=${imdbID}&plot=full&apikey=${API_KEY}`);
        const movie = await response.json();

        if (movie.Response === 'False') {
            movieDetails.innerHTML = `<div class="error">${movie.Error}</div>`;
            return;
        }

        displayMovieDetails(movie);
        
        // Scroll to movie details
        movieDetails.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        movieDetails.innerHTML = `<div class="error">Error fetching movie details: ${error.message}</div>`;
    }
}

function displayMovieDetails(movie) {
    const isFavorite = favorites.some(fav => fav.imdbID === movie.imdbID);
    const favoriteButtonClass = isFavorite ? 'favorite-btn active' : 'favorite-btn';
    const favoriteButtonText = isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
    
    const posterUrl = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster+Available';
    
    // Get trailer (Note: OMDb API doesn't provide trailers, so we're creating a YouTube search link)
    const trailerLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.Title + ' ' + movie.Year + ' trailer')}`;
    
    movieDetails.innerHTML = `
        <button class="back-btn" onclick="hideMovieDetails()"><i class="fas fa-arrow-left"></i> Back to Results</button>
        
        <div class="detail-header">
            <img class="detail-poster" src="${posterUrl}" alt="${movie.Title} poster">
            <div class="detail-info">
                <h2>${movie.Title} <span>(${movie.Year})</span></h2>
                <div class="detail-meta">
                    <span>${movie.Rated}</span>
                    <span>${movie.Runtime}</span>
                    <span>${movie.Genre}</span>
                    <span>${movie.Released}</span>
                </div>
                <div class="ratings">
                    ${movie.Ratings.map(rating => `
                        <span class="rating">${rating.Source}: ${rating.Value}</span>
                    `).join('')}
                </div>
                <button class="${favoriteButtonClass}" onclick="toggleFavorite('${movie.imdbID}', '${movie.Title.replace(/'/g, "\\'")}', '${posterUrl}')">
                    <i class="fas ${isFavorite ? 'fa-heart' : 'fa-heart'}"></i> ${favoriteButtonText}
                </button>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Plot</h3>
            <p>${movie.Plot}</p>
        </div>
        
        <div class="detail-section">
            <h3>Cast & Crew</h3>
            <p><strong>Director:</strong> ${movie.Director}</p>
            <p><strong>Writers:</strong> ${movie.Writer}</p>
            <p><strong>Actors:</strong> ${movie.Actors}</p>
        </div>
        
        <div class="detail-section">
            <h3>Watch Trailer</h3>
            <a href="${trailerLink}" target="_blank" class="trailer-link">
                <i class="fab fa-youtube"></i> Watch on YouTube
            </a>
        </div>
        
        <div class="detail-section">
            <h3>Additional Info</h3>
            <p><strong>Country:</strong> ${movie.Country}</p>
            <p><strong>Language:</strong> ${movie.Language}</p>
            <p><strong>Awards:</strong> ${movie.Awards}</p>
            <p><strong>Box Office:</strong> ${movie.BoxOffice || 'N/A'}</p>
            <p><strong>Production:</strong> ${movie.Production || 'N/A'}</p>
        </div>
    `;
}

function hideMovieDetails() {
    movieDetails.classList.add('hidden');
}

function toggleFavorite(imdbID, title, poster) {
    const index = favorites.findIndex(movie => movie.imdbID === imdbID);
    
    if (index === -1) {
        // Add to favorites
        favorites.push({ imdbID, title, poster });
        showToast(`${title} added to favorites!`);
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
        showToast(`${title} removed from favorites!`);
    }
    
    // Update UI
    saveFavorites();
    displayFavorites();
    
    // Update button in movie details if visible
    const favoriteBtn = document.querySelector('.favorite-btn');
    if (favoriteBtn) {
        if (index === -1) {
            favoriteBtn.classList.add('active');
            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
        } else {
            favoriteBtn.classList.remove('active');
            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Add to Favorites';
        }
    }
}

function displayFavorites() {
    favoritesContainer.innerHTML = '';
    
    if (favorites.length === 0) {
        favoritesContainer.innerHTML = '<p>No favorite movies yet. Add some!</p>';
        return;
    }
    
    favorites.forEach(movie => {
        const favoriteItem = document.createElement('div');
        favoriteItem.classList.add('favorite-item');
        
        favoriteItem.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title} poster">
            <span class="favorite-title">${movie.title}</span>
            <span class="remove-favorite" onclick="event.stopPropagation(); toggleFavorite('${movie.imdbID}', '${movie.title.replace(/'/g, "\\'")}', '${movie.poster}')">
                <i class="fas fa-times"></i>
            </span>
        `;
        
        favoriteItem.addEventListener('click', () => getMovieDetails(movie.imdbID));
        favoritesContainer.appendChild(favoriteItem);
    });
}

function saveFavorites() {
    localStorage.setItem('movieExplorerFavorites', JSON.stringify(favorites));
}

function loadFavorites() {
    const savedFavorites = localStorage.getItem('movieExplorerFavorites');
    if (savedFavorites) {
        favorites = JSON.parse(savedFavorites);
        displayFavorites();
    }
}

function showToast(message) {
    // Create toast element if it doesn't exist
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.classList.add('toast');
        document.body.appendChild(toast);
        
        // Add toast styles if not in CSS
        if (!document.querySelector('style#toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.textContent = `
                .toast {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 4px;
                    z-index: 1000;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .toast.show {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Set message and show toast
    toast.textContent = message;
    toast.classList.add('show');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}