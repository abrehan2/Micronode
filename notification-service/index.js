// Instances:
const amqp = require("amqplib");

let channel, connection;
async function start() {
  try {
    connection = await amqp.connect("amqp://rabbitmq");
    channel = await connection.createChannel();
    await channel.assertQueue("TASK_CREATED");
    console.log("Status: Notification service is listening to messages");

    channel.consume("TASK_CREATED", (data) => {
      const { userId, title } = JSON.parse(data.content.toString());
      console.log(`Notification sent to user ${userId} for task "${title}"`);
      channel.ack(data);
    });
  } catch {
    console.log(`Status: RabbitMQ failed to connect`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

start();
