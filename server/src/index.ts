import cors from "cors";
import "dotenv/config";
import express from "express";
import { environmentRouter } from "./routes/environment";

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", environmentRouter);

app.listen(port, () => {
  console.log(`Land Advisor server listening on http://localhost:${port}`);
});
