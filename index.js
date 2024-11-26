import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import router from "./routes/UserRoutes.js";
import cookieParser from "cookie-parser";
import connect from "./db/connect.js";
dotenv.config({
  path: "./env",
});

const port = process.env.PORT;

const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

const app = express();
app.use(cookieParser());
app.use(cors(corsOptions));

app.use(
  express.json({
    limit: "20mb",
  })
);

app.get("/", (req, res) => {
  console.log("clicked on home route");
  res.json({
    message: "Did you summoned me?",
  });
});

app.use("/api", router);

app.listen(port, () => {
  console.log("server is listening on port", process.env.PORT);
  connect();
});
