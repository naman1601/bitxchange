const express = require("express");

const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const createHttpError = require("http-errors");
const cookieParser = require("cookie-parser");
const xssClean = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const cors = require("cors");

const mongoose = require("mongoose");

const models = require("./models");

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

app.use(express.json());
app.use(cookieParser());

app.use(xssClean());
app.use(
  mongoSanitize({
    allowDots: true,
  })
);

app.use((req, res, next) => {
  req.models = models;
  next();
});

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error: "));

// 404 handler
app.use((req, res, next) => {
  next(createHttpError(404, "route not found"));
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const response = {
    message: err.message,
  };

  res.status(err.status || 500);
  res.json(response);
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
