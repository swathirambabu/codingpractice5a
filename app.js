const express = require("express");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertMovieDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};
const convertDirectorDbObjectToResponseObject = (dbObject) => {
  return {
    directorName: dbObject.director_name,
    directorId: dbObject.director_id,
  };
};
const convertMovieNameToPascalCase = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};
//Returns a list of all movie names in the movie table
app.get("/movies/", async (request, response) => {
  const getAllMovieQuery = `SELECT movie_name FROM movie;`;
  const moviesArray = await db.all(getAllMovieQuery);

  response.send(
    moviesArray.map((eachMovie) => convertMovieNameToPascalCase(eachMovie))
  );
});
//Creates a new movie in the movie table. `movie_id` is auto-incremented
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const postMovieQuery = `
     INSERT INTO 
     movie (director_id,movie_name,lead_actor)
     VALUES
     (
         ${directorId},
         '${movieName}',
         '${leadActor}');`;
  await db.run(postMovieQuery);
  response.send("Movie Successfully Added");
});

//Returns a movie based on the movie ID
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const getMovieQuery = `SELECT * FROM movie WHERE movie_id=${movieId};`;
  const movie = await db.get(getMovieQuery);

  response.send(convertMovieDbObjectToResponseObject(movie));
});
//Updates the details of a movie in the movie table based on the movie ID
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateMovieQuery = `UPDATE movie SET 
      director_id=${directorId},
      movie_name='${movieName}',
      lead_actor='${leadActor}'
      WHERE
       movie_id=${movieId};`;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});
//Deletes a movie from the movie table based on the movie ID
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `DELETE FROM movie
    WHERE movie_id=${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});
//Returns a list of all directors in the director table
app.get("/directors/", async (request, response) => {
  const getAllDirectorQuery = `SELECT * FROM director;`;

  const directorsArray = await db.all(getAllDirectorQuery);
  response.send(
    directorsArray.map((eachDirector) =>
      convertDirectorDbObjectToResponseObject(eachDirector)
    )
  );
});
//returns a list of all movie names directed by a specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;

  const getDirectorMovieQuery = `select movie_name from  movie    
    where director_id='${directorId}'; `;
  const movieArray = await db.all(getDirectorMovieQuery);

  response.send(
    movieArray.map((eachMovie) => convertMovieNameToPascalCase(eachMovie))
  );
});
module.exports = app;
