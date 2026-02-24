import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";

const uri = process.env.MONGO_URI; // your Atlas URI
const client = new MongoClient(uri);
await client.connect();
const db = client.db("sample_mflix");
const users = db.collection("users");

export const signupController = async (c) => {
  try {
    const { username, email, birthdate, password } = await c.req.json();

    if (!username || !email || !birthdate || !password) {
      return c.json({ message: "All fields are required" }, 400);
    }

    const existing = await users.findOne({ email });
    if (existing) return c.json({ message: "Email already used" }, 400);

    const hash = await bcrypt.hash(password, 10);

    const result = await users.insertOne({
      username,
      email,
      birthdate,
      password: hash,
      savedAnime: [],
      watchlist: [],
    });

    return c.json({
      id: result.insertedId,
      username,
      email,
    });
  } catch (err) {
    console.error(err);
    return c.json({ message: "Something went wrong" }, 500);
  }
};

export const loginController = async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ message: "Email and password required" }, 400);
    }

    const user = await users.findOne({ email });
    if (!user) return c.json({ message: "User not found" }, 400);

    const match = await bcrypt.compare(password, user.password);
    if (!match) return c.json({ message: "Invalid password" }, 400);

    return c.json({
      id: user._id,
      username: user.username,
      email: user.email,
      savedAnime: user.savedAnime,
      watchlist: user.watchlist,
    });
  } catch (err) {
    console.error(err);
    return c.json({ message: "Something went wrong" }, 500);
  }
};
