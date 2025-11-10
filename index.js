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
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("moviescope_db");
    const moviesCollection = db.collection("movies");
    const usersCollection = db.collection("users");

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

    // get-movies
    app.get("/movies", async (req, res) => {
      const cursor = moviesCollection.find().sort({rating: -1});
      const result = await cursor.toArray();
      res.send(result);
    });

     // top-rated-movies
    app.get("/top-rated-movies", async (req, res) => {
      const cursor = moviesCollection.find().sort({rating: -1}).limit(5);
      const result = await cursor.toArray();
      res.send(result);
    });

    // recent-movies
    app.get("/recent-movies", async (req, res) => {
      const cursor = moviesCollection.find().sort({releaseYear: -1}).limit(10);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get-single-movie
    app.get("/movies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await moviesCollection.findOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
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

app.listen(port, () => {
  console.log("Moviescope Pro Server is Running on Port: ", port);
});
