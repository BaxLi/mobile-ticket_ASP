import * as Mongoose from "mongoose";
import * as fs from "fs";


let database: Mongoose.Connection;
let configuration: any;
const userConfigFile = "mt-service/src/config/config.json";
configuration = JSON.parse(
  fs.readFileSync(__dirname.split('mt-service')[0] + userConfigFile).toString()
);
const localConString = configuration.db_connection_string.value;
const reconnectTimeoutMS = 90000;
const initialTimeoutMS = 5000;

export const connectDB = () => {
  const uri = localConString;
  let isConnectedBefore = false;

  if (database) {
   return;
  }

  function connect(timeout) {
    Mongoose.connect(uri, {
      useNewUrlParser: true,
      useFindAndModify: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      serverSelectionTimeoutMS: timeout,
      heartbeatFrequencyMS: 3000
    });
  }

  connect(initialTimeoutMS);

  database = Mongoose.connection;

  database.once("open", async () => {
    isConnectedBefore = true;
    console.log("Connected to database");
  });

  database.on("disconnected", async () => {
    console.log("Disconnected from database");
    if (isConnectedBefore) {
      connect(reconnectTimeoutMS);
    }
  });

  database.on("reconnected", async () => {
    console.log("Reconnected to database"); 
  });

  database.on("reconnectFailed", async () => {
    console.log("Reconnect timed out");
    process.exit(1);
  });

  database.on("error", () => {
    console.log("Error connecting to database");
    process.exit(1);
  });
};

export const disconnectDB = () => {
  if (!database) {
    return;
  }
  Mongoose.disconnect();
};