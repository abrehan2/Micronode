// Instances:
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// App Config:
const app = express();
const port = 3001;

// Middleware(s):
app.use(bodyParser.json());

// MongoDB Connection:
mongoose
  .connect("mongodb://mongo:27017/tasks", {
    serverSelectionTimeoutMS: 5000, // fail fast if unreachable.
  })
  .then((data) =>
    console.log("Status: Connected to MongoDB -", data.connection.host)
  )
  .catch((error) =>
    console.log("Status: MongoDB failed to connect -", error.message)
  );

// Task Schema:
const taskSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    userId: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    bufferCommands: false,
  }
);

const Task = mongoose.model("Task", taskSchema);

// Controllers:
app.get("/tasks", async (_, res) => {
  const tasks = await Task.find();
  return res.status(200).json({
    message: "Status: Tasks retrieved successfully.",
    tasks,
  });
});

app.post("/tasks", async (req, res) => {
  try {
    const { title, description, userId } = req.body;
    const task = new Task({ title, description, userId });
    await task.save();

    return res.status(201).json({
      message: "Status: Task created successfully.",
      task,
    });
  } catch {
    return res.status(500).json({
      message: "Status: Error creating task.",
    });
  }
});

// Route(s):
app.get("/", (_, res) => {
  res.send("Task Service is running");
});

// Server:
app.listen(port, () => {
  console.log(`Task Service listening at http://localhost:${port}`);
});
