import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import authRouter from "./routes/auth";
import dataRouter from "./routes/data";
import emailRouter from "./routes/email";

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const MONGODB_URI = process.env.MONGODB_URI || "";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
const allowedOrigins = FRONTEND_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Demo auth routes
app.use("/auth", authRouter);
app.use("/data", dataRouter);
app.use("/email", emailRouter);

app.get("/health", (_req: express.Request, res: express.Response) => {
  res.json({ status: "ok" });
});

async function start() {
  try {
    if (MONGODB_URI) {
      await connectDB(MONGODB_URI);
    } else {
      console.warn("MONGODB_URI not set. Starting server without a database connection (demo mode).");
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
