let db = firebase.firestore()

firebase.auth().onAuthStateChanged(async function (user) {
  // setting up firesbase and API
  let apiKey = '426eb0f90521d4c76fbc67a9acd43da6'
  let response = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US`)
  let json = await response.json()
  let movies = json.results
  console.log(movies)

  if (user) {
    // Signed in
    console.log(`signed in as ${user.email}`)

    // Push user metadata to firebase
    db.collection('users').doc(user.uid).set({
      name: user.displayName,
      email: user.email,
      userId: user.uid
    })

    // Sign-out button

    document.querySelector('.sign-in-or-sign-out').innerHTML =
      `
        <h1>Hey ${user.displayName}! - got any more movies to cross off your list?</h1>
        <button class="text-pink-500 underline sign-out">Sign Out</button>
      `
    document.querySelector('.sign-out').addEventListener('click', function (event) {
      console.log('sign out clicked')
      firebase.auth().signOut()
      document.location.href = 'movies.html'
    })

    //call print function
    printMovie(movies)

  } else {
    // Signed out
    console.log('signed out')
    // Hide the movies when signed-out
    document.querySelector('.movies').classList.add('hidden')
    // Initializes FirebaseUI Auth
    let ui = new firebaseui.auth.AuthUI(firebase.auth())
    // FirebaseUI configuration
    let authUIConfig = {
      signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ],
      signInSuccessUrl: 'movies.html'
    }
    // Starts FirebaseUI Auth
    ui.start('.sign-in-or-sign-out', authUIConfig)
  }
})

async function printMovie(movies) {
  // cycling through movies in API
  for (let i = 0; i < movies.length; i++) {
    let movie = movies[i]
    let currentUser = firebase.auth().currentUser
    let docRef = await db.collection('watched').doc(`${movie.id}-${currentUser.uid}`).get()
    let watchedMovie = docRef.data()
    let opacityClass = ''
    // changing opacity based on watched status in firebase
    if (watchedMovie) {
      opacityClass = 'opacity-20'
    }

    // printing movies
    document.querySelector('.movies').insertAdjacentHTML('beforeend',
      `
        <div class="w-1/5 p-4 movie-${movie.id} ${opacityClass}">
          <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" class="w-full">
          <a href="#" class="watched-button block text-center text-white bg-green-500 mt-4 px-4 py-2 rounded">I've watched this!</a>
        </div>
      `
    )

    // listening to click
    document.querySelector(`.movie-${movie.id}`).addEventListener('click', async function (event) {
      event.preventDefault()

      // setting current user to firebase user
      let currentUser = firebase.auth().currentUser
      console.log(`${currentUser.email} just watched ${movie.id}`);

      // changing opacity based on click
      let movieElement = document.querySelector(`.movie-${movie.id}`)
      movieElement.classList.add('opacity-20')

      // pushing metadata of clicked movie and logged-in user to firebase
      await db.collection('watched').doc(`${movie.id}-${currentUser.uid}`).set({
        movieId: movie.id,
        movieTitle: movie.original_title,
        watcherId: currentUser.uid,
        watcherEmail: currentUser.email
      })
    })
  }


}

// Goal:   Refactor the movies application from last week, so that it supports
//         user login and each user can have their own watchlist.
//         Look at instagram lab for inspiration 

// Step 3: Setting the TMDB movie ID as the document ID on your "watched" collection
//         will no longer work. The document ID should now be a combination of the
//         TMDB movie ID and the user ID indicating which user has watched. 
//         This "composite" ID could simply be `${movieId}-${userId}`. This should 
//         be set when the "I've watched" button on each movie is clicked. Likewise, 
//         when the list of movies loads and is shown on the page, only the movies 
//         watched by the currently logged-in user should be opaque.