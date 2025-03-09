import React, { useState, useEffect } from 'react';
import { Search, Bookmark, Star, Play, Info, Home } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// TMDB API configuration
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  overview: string;
  release_date: string;
}

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  useEffect(() => {
    if (!TMDB_API_KEY) {
      setError('API key is missing. Please add your TMDB API key to the .env file.');
      setLoading(false);
      return;
    }
    fetchTrendingMovies();
    const savedBookmarks = localStorage.getItem('movieVaultBookmarks');
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
  }, []);

  const fetchTrendingMovies = async () => {
    if (!TMDB_API_KEY) {
      setError('API key is missing. Please add your TMDB API key to the .env file.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      setShowBookmarksOnly(false);
      setSearchQuery('');
      const response = await fetch(
        `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.results) {
        setMovies(data.results);
      } else {
        setMovies([]);
        setError('No movies found');
      }
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      setError('Failed to fetch movies. Please try again later.');
      toast.error('Failed to fetch movies. Please try again later.');
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const searchMovies = async (query: string) => {
    if (!TMDB_API_KEY) {
      setError('API key is missing. Please add your TMDB API key to the .env file.');
      return;
    }

    if (!query.trim()) {
      fetchTrendingMovies();
      return;
    }

    try {
      setError(null);
      setLoading(true);
      setShowBookmarksOnly(false);
      const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          query
        )}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.results) {
        setMovies(data.results);
        if (data.results.length === 0) {
          setError('No movies found for your search');
        }
      } else {
        setMovies([]);
        setError('No movies found');
      }
    } catch (error) {
      console.error('Error searching movies:', error);
      setError('Failed to search movies. Please try again later.');
      toast.error('Failed to search movies. Please try again later.');
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (movieId: number) => {
    const newBookmarks = bookmarks.includes(movieId)
      ? bookmarks.filter((id) => id !== movieId)
      : [...bookmarks, movieId];
    
    setBookmarks(newBookmarks);
    localStorage.setItem('movieVaultBookmarks', JSON.stringify(newBookmarks));
    
    toast.success(
      bookmarks.includes(movieId)
        ? 'Removed from bookmarks'
        : 'Added to bookmarks'
    );
  };

  const displayedMovies = showBookmarksOnly
    ? movies.filter((movie) => bookmarks.includes(movie.id))
    : movies;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={fetchTrendingMovies}
                className="text-3xl font-bold text-purple-500 hover:text-purple-400 transition-colors flex items-center gap-2"
              >
                <Home className="w-8 h-8" />
                MovieVault
              </button>
              <button
                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showBookmarksOnly
                    ? 'bg-purple-500 hover:bg-purple-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <Bookmark className={showBookmarksOnly ? 'fill-current' : ''} />
                Bookmarks
              </button>
            </div>
            <div className="relative flex-1 md:max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search movies..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchMovies(e.target.value);
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[400px] text-center">
            <div>
              <p className="text-gray-400 text-lg mb-4">{error}</p>
              {error.includes('API key') && (
                <div className="text-sm text-gray-500">
                  <p>To get your TMDB API key:</p>
                  <ol className="list-decimal list-inside mt-2">
                    <li>Visit <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">TMDB Sign Up</a></li>
                    <li>Create an account and verify your email</li>
                    <li>Go to Settings → API and request an API key</li>
                    <li>Add the API key to your .env file</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        ) : displayedMovies.length === 0 && showBookmarksOnly ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <Bookmark className="w-16 h-16 text-gray-500 mb-4" />
            <p className="text-gray-400 text-lg">No bookmarked movies yet</p>
            <button
              onClick={fetchTrendingMovies}
              className="mt-4 text-purple-500 hover:text-purple-400 transition-colors"
            >
              Browse trending movies
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {displayedMovies.map((movie) => (
              <div
                key={movie.id}
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transform transition-transform hover:scale-105"
              >
                <div className="relative">
                  <img
                    src={movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image'}
                    alt={movie.title}
                    className="w-full h-[300px] object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Image';
                    }}
                  />
                  <button
                    onClick={() => toggleBookmark(movie.id)}
                    className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition-opacity"
                  >
                    <Bookmark
                      className={`w-5 h-5 ${
                        bookmarks.includes(movie.id) ? 'text-purple-500 fill-current' : 'text-white'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => setSelectedMovie(movie)}
                    className="absolute bottom-2 right-2 p-2 bg-purple-500 rounded-full hover:bg-purple-600 transition-colors"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{movie.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span>{movie.vote_average.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(movie.release_date).getFullYear()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Movie Details Modal */}
      {selectedMovie && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img
                src={selectedMovie.poster_path ? `${TMDB_IMAGE_BASE_URL}${selectedMovie.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image'}
                alt={selectedMovie.title}
                className="w-full h-[400px] object-cover rounded-t-lg"
              />
              <button
                onClick={() => setSelectedMovie(null)}
                className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition-opacity"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{selectedMovie.title}</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-1" />
                  <span>{selectedMovie.vote_average.toFixed(1)}</span>
                </div>
                <span className="text-gray-400">
                  {new Date(selectedMovie.release_date).getFullYear()}
                </span>
              </div>
              <p className="text-gray-300">{selectedMovie.overview}</p>
              <div className="mt-6 flex gap-4">
                <button className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg transition-colors">
                  <Play className="w-5 h-5" />
                  Watch Trailer
                </button>
                <button
                  onClick={() => toggleBookmark(selectedMovie.id)}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                >
                  <Bookmark
                    className={bookmarks.includes(selectedMovie.id) ? 'text-purple-500 fill-current' : ''}
                  />
                  {bookmarks.includes(selectedMovie.id) ? 'Bookmarked' : 'Bookmark'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;