// Instances:
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// App Config:
const app = express();
const port = 3000;

// Middleware(s):
app.use(bodyParser.json());

// MongoDB Connection:
mongoose
  .connect("mongodb://mongo:27017/users", {
    serverSelectionTimeoutMS: 5000, // fail fast if unreachable.
  })
  .then((data) =>
    console.log("Status: Connected to MongoDB -", data.connection.host)
  )
  .catch((error) =>
    console.log("Status: MongoDB failed to connect -", error.message)
  );

// User Schema:
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
  },
  {
    bufferCommands: false,
  }
);

const User = mongoose.model("User", userSchema);

// Controllers:
app.get("/users", async (_, res) => {
  const users = await User.find();
  return res.status(200).json({
    message: "Status: Users retrieved successfully.",
    users,
  });
});

app.post("/users", async (req, res) => {
  try {
    console.log(req.body);
    const { name, email } = req.body;
    const user = new User({ name, email });
    await user.save();

    return res.status(201).json({
      message: "Status: User created successfully.",
      user,
    });
  } catch {
    return res.status(500).json({
      message: "Status: Error creating user.",
    });
  }
});

// Route(s):
app.get("/", (_, res) => {
  res.send("User Service is running");
});

// Server:
app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});
