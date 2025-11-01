// Instances:
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const amqp = require("amqplib");

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

let channel, connection;

async function connectRabbitMQWithRetries(retries = 5, delay = 3000) {
  while (retries) {
    try {
      connection = await amqp.connect("amqp://rabbitmq");
      channel = await connection.createChannel();
      await channel.assertQueue("TASK_CREATED");
      console.log("Status: Connected to RabbitMQ");
      return;
    } catch {
      retries -= 1;
      console.log(
        `Status: RabbitMQ connection failed, retrying in ${
          delay / 1000
        } seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

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

    // Publish event to RabbitMQ:
    const event = {
      type: "TASK_CREATED",
      data: {
        id: task._id,
        title: task.title,
        description: task.description,
        userId: task.userId,
        createdAt: task.createdAt,
      },
    };

    if (!channel) {
      return res.status(503).json({
        message:
          "Status: Error creating task - RabbitMQ channel not available.",
      });
    }

    channel.sendToQueue("TASK_CREATED", Buffer.from(JSON.stringify(event)));

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
  connectRabbitMQWithRetries();
});
