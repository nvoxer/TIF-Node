document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('form');
    const movieIdInput = document.getElementById('movie-id');
    const titleInput = document.getElementById('title');
    const directorInput = document.getElementById('director');
    const yearInput = document.getElementById('year');
    const genreInput = document.getElementById('genre');
    const moviesTable = document.querySelector('#movies-table tbody');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('error-message');
    const registerErrorMessage = document.getElementById('register-error-message');

    let token = sessionStorage.getItem('token');

    // Redireccion a login si no esta autenticado
    if (!token && window.location.pathname !== '/login.html' && window.location.pathname !== '/register.html') {
        window.location.href = '/login.html';
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.token) {
                    sessionStorage.setItem('token', data.token);
                    window.location.href = '/';
                } else {
                    errorMessage.textContent = data.message || 'Login falló';
                }
            })
            .catch(err => {
                console.error('Login error:', err);
                errorMessage.textContent = 'Login error';
            });
        });
    }
// Form de registro
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;

            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Usuario registrado') {
                    alert(`Usuario ${username} registrado exitosamente, por favor inicie sesión`);
                    window.location.href = '/login.html';
                } else {
                    registerErrorMessage.textContent = data.message || 'Error al registrarse';
                }
            })
            .catch(err => {
                console.error('Error al registrarse:', err);
                registerErrorMessage.textContent = 'Error al registrarse';
            });
        });
    }

    // Recupera peliculas
    function fetchMovies() {
        fetch('/movies', {
            headers: {
                'Authorization': token
            }
        })
        .then(response => response.json())
        .then(movies => {
            moviesTable.innerHTML = '';
            movies.forEach(movie => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${movie.title}</td>
                    <td>${movie.director}</td>
                    <td>${movie.year}</td>
                    <td>${movie.genre}</td>
                    <td class="actions">
                        <button onclick="editMovie(${movie.id})">Editar</button>
                        <button onclick="deleteMovie(${movie.id})">Eliminar</button>
                    </td>
                `;
                moviesTable.appendChild(row);
            });
        });
    }

    // submit form
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const id = movieIdInput.value;
            const title = titleInput.value;
            const director = directorInput.value;
            const year = yearInput.value;
            const genre = genreInput.value;

            const movie = { title, director, year, genre };

            if (id) {
                // Update
                fetch(`/movies/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify(movie)
                }).then(response => response.json())
                    .then(() => {
                        form.reset();
                        fetchMovies();
                    });
            } else {
                // Add 
                fetch('/movies', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify(movie)
                }).then(response => response.json())
                    .then(() => {
                        form.reset();
                        fetchMovies();
                    });
            }
        });
    }

    // Rellenar edit form al editar
    window.editMovie = function (id) {
        fetch(`/movies/${id}`, {
            headers: {
                'Authorization': token
            }
        })
        .then(response => response.json())
        .then(movie => {
            movieIdInput.value = movie.id;
            titleInput.value = movie.title;
            directorInput.value = movie.director;
            yearInput.value = movie.year;
            genreInput.value = movie.genre;
        });
    }

    // Delete
    window.deleteMovie = function (id) {
        fetch(`/movies/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token
            }
        }).then(() => {
            fetchMovies();
        });
    }

    // Recupera peliculas
    if (moviesTable) {
        fetchMovies();
    }
});
