const { response } = require("express");
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const UserSchema = require("./model/user");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log("mongoose", mongoose.model("UserSchema").collection.name);
app.use(express.json());
const token = process.env.ACCESS_TOKEN_SECRET;
const users = [
  {
    username: "Carlos",
    password: "First post",
  },
  {
    username: "Thay",
    password: "Second post",
  },
];

app.get("/users", authenticateToken, (res, req) => {
  let usersToShow = users.filter((post) => post.username === res.user.name);
  req.json(usersToShow);
});
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const encryptedPassword = await bcrypt.hash(password, 10);
  try {
    const response = await UserSchema.create({
      username: username,
      password: encryptedPassword,
    });
    res.json(response);
  } catch (error) {
    console.log(error.message);
    return res.json({ status: "error" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await UserSchema.findOne({ username }).lean().exec();

  if (!user)
    return res.json({ status: "error", error: "Invalid username/password." });
  if (await bcrypt.compare(password, user.password)) {
    console.log("USER: ", user);
    const accessToken = jwt.sign(
      { name: username },
      process.env.ACCESS_TOKEN_SECRET
    );
    res.json({ accessToken });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token === null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
app.listen(3000);
