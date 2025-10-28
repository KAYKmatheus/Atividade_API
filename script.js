document.addEventListener('DOMContentLoaded', () => {
   
    const API_KEY ='Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyNjIwODUxY2JhNjZhMzllNzMxNWY2N2FiNDUwYmFjYiIsIm5iZiI6MTc2MTYxODkzOS42NjYsInN1YiI6IjY5MDAyYmZiZjFlODkyNGEzMzlmYjg1NiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.XshU-jQb8QP9dUW1nD9xG0V1CCc69rsjBlgcg--amMk';
    
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMG_URL = 'https://image.tmdb.org/t/p/w500';
    const LANG = 'pt-BR';

  
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const filterForm = document.getElementById('filter-form');
    const genreSelect = document.getElementById('genre-select');
    const yearInput = document.getElementById('year-input');
    const moviesContainer = document.getElementById('movies-container');
    
 
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const modalBody = document.getElementById('modal-body');

    const fetchOptions = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: API_KEY
        }
    };

    async function fetchMovies(endpoint, queryParams = '') {
        try {
            const url = `${BASE_URL}${endpoint}?language=${LANG}&${queryParams}`;
            const response = await fetch(url, fetchOptions);
            if (!response.ok) throw new Error('Falha ao buscar dados da API.');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(error);
            displayError('Não foi possível carregar os filmes. Tente novamente.');
            return null;
        }
    }
    function displayMovies(movies) {
        moviesContainer.innerHTML = ''; // Limpa resultados anteriores

        if (movies.length === 0) {
            moviesContainer.innerHTML = '<p>Nenhum filme encontrado para esta busca.</p>';
            return;
        }

        movies.forEach(movie => {
            
            if (!movie.poster_path) return; 
            
            const movieCard = document.createElement('div');
            movieCard.classList.add('movie-card');
            
            
            movieCard.dataset.movieId = movie.id; 

            movieCard.innerHTML = `
                <img src="${IMG_URL}${movie.poster_path}" alt="${movie.title}">
                <h3>${movie.title} (${(movie.release_date || 'N/A').split('-')[0]})</h3>
            `;
            
            
            movieCard.addEventListener('click', () => openModal(movie.id));

            moviesContainer.appendChild(movieCard);
        });
    }

    function displayError(message) {
        moviesContainer.innerHTML = `<p class="error">${message}</p>`;
    }
    async function getGenres() {
        const data = await fetchMovies('/genre/movie/list');
        if (data && data.genres) {
            data.genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.id;
                option.textContent = genre.name;
                genreSelect.appendChild(option);
            });
        }
    }

    async function openModal(movieId) {

        const [details, credits] = await Promise.all([
            fetchMovies(`/movie/${movieId}`),
            fetchMovies(`/movie/${movieId}/credits`)
        ]);

        if (details && credits) {
            displayModal(details, credits.cast);
            modalOverlay.classList.remove('hidden');
        } else {
            alert('Não foi possível carregar os detalhes deste filme.');
        }
    }

    /**
     * [NOVO] Constrói o HTML do modal e o exibe.
     * @param {object} details - Objeto com detalhes do filme.
     * @param {Array} cast - Array com o elenco (atores).
     */
    function displayModal(details, cast) {
        const year = (details.release_date || 'N/A').split('-')[0];
        const rating = details.vote_average.toFixed(1);
        const runtime = details.runtime; // em minutos

        // Pega os 10 primeiros atores
        const actors = cast.slice(0, 10).map(actor => `<li>${actor.name}</li>`).join('');

        modalBody.innerHTML = `
            <img src="${IMG_URL}${details.poster_path}" alt="${details.title}">
            <div class="modal-info">
                <h2>${details.title} (${year})</h2>
                <p>${details.overview || 'Sinopse não disponível.'}</p>
                <div id="modal-details">
                    <span><strong>Nota:</strong> ${rating} / 10</span>
                    <span><strong>Duração:</strong> ${runtime} min</span>
                </div>
                <div id="modal-actors">
                    <h4>Elenco Principal:</h4>
                    <ul>${actors}</ul>
                </div>
            </div>
        `;
    }

    /**
     * Fecha o modal.
     */
    function closeModal() {
        modalOverlay.classList.add('hidden');
        modalBody.innerHTML = ''; // Limpa o conteúdo
    }

    // --- EVENT LISTENERS ---

    /**
     * Listener do formulário de Busca (exercício anterior).
     */
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            const data = await fetchMovies('/search/movie', `query=${encodeURIComponent(query)}`);
            if (data) displayMovies(data.results);
        }
    });

    /**
     * [NOVO] Listener do formulário de Filtros (exercício atual).
     */
    filterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const genreId = genreSelect.value;
        const year = yearInput.value;

        let queryParams = 'sort_by=popularity.desc'; // Trazer os mais populares primeiro

        if (genreId) {
            queryParams += `&with_genres=${genreId}`;
        }
        if (year) {
            queryParams += `&primary_release_year=${year}`;
        }

        const data = await fetchMovies('/discover/movie', queryParams);
        if (data) displayMovies(data.results);
    });

    // Listeners do Modal
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        // Fecha o modal se clicar fora do conteúdo
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // --- INICIALIZAÇÃO ---
    
    // Carrega filmes populares ao iniciar
    async function init() {
        await getGenres(); // [NOVO] Carrega os gêneros no select
        const data = await fetchMovies('/movie/popular');
        if (data) displayMovies(data.results);
    }

    init();
});