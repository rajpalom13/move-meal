import express from "express";
import cors from "cors";
import { createServer } from "http";
import rateLimit from "express-rate-limit";

import config from "./config/index.js";
import { connectDB } from "./config/database.js";
import { initializeSocket } from "./services/socket.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import morgan from "morgan";

const app = express();
const httpServer = createServer(app);

// Trust proxy for Heroku/reverse proxy deployments
app.set('trust proxy', 1);

// Initialize socket.io
initializeSocket(httpServer);

// Middleware
app.use(cors());

app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
});
app.use("/api", limiter);

// Routes
app.use("/api", routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(config.port, () => {
      console.log(
        `Server running on port ${config.port} in ${config.nodeEnv} mode`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
