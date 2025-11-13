require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

// uri
const uri = process.env.MONGODB_URI;

// client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("moviescope_db");
    const moviesCollection = db.collection("movies");
    const usersCollection = db.collection("users");

    // create-user
    app.post("/users", async (req, res) => {
      try {
        const newUser = req.body;
        const existingUser = await usersCollection.findOne({
          email: newUser.email,
        });
        if (existingUser) {
          return res.status(400).send({ error: "User already exists" });
        }
        const result = await usersCollection.insertOne(newUser);
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to register user" });
      }
    });

    // get-user
    app.get("/users", async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();
        res.send(users);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch users" });
      }
    });

    // insert-movie
    app.post("/movies", async (req, res) => {
      try {
        const newMovie = req.body;
        const result = await moviesCollection.insertOne(newMovie);
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to insert movie" });
      }
    });

    // update-movie
    app.patch("/movies/:id", async (req, res) => {
      const id = req.params.id;
      const updatedMovie = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: updatedMovie,
      };
      const result = await moviesCollection.updateOne(query, update);
      res.send(result);
    });

    // delete-movie
    app.delete("/movies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await moviesCollection.deleteOne(query);
      res.send(result);
    });

    // get-movies || /movies?addedBy=sultanmdayman@gmail.com
    app.get("/movies", async (req, res) => {
      const { addedBy } = req.query;
      try {
        const query = addedBy ? { addedBy: addedBy } : {};
        // console.log("Querying movies with:", query);
        const movies = await moviesCollection.find(query).toArray();
        res.json(movies);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch movies" });
      }
    });

    // get-single-movie
    app.get("/movies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await moviesCollection.findOne(query);
      res.send(result);
    });

    // top-rated-movies
    app.get("/top-rated-movies", async (req, res) => {
      try {
        const pipeline = [
          { $addFields: { numericRating: { $toDouble: "$rating" } } },
          { $sort: { numericRating: -1 } },
          { $limit: 5 },
        ];

        const result = await moviesCollection.aggregate(pipeline).toArray();
        res.send(result);
      } catch (err) {
        console.error("Failed to fetch top-rated movies:", err);
        res.status(500).send({ error: "Failed to fetch top-rated movies" });
      }
    });

    // recent-movies
    app.get("/recent-movies", async (req, res) => {
      const cursor = moviesCollection.find().sort({ releaseYear: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get total counts -stats
    app.get("/stats", async (req, res) => {
      try {
        const totalMovies = await moviesCollection.countDocuments();
        const totalUsers = await usersCollection.countDocuments();
        res.send({ totalMovies, totalUsers });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch stats" });
      }
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Moviescope-pro server is Running!");
});

// app.listen(port, () => {
//   console.log("Moviescope Pro Server is Running on Port: ", port);
// });

// ---or--- 

// module.exports = app;


// it will work on local server
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log("Moviescope Pro Server running locally on port:", port);
  });
}

// this will work on vercel
module.exports = app;
