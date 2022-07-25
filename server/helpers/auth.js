const jwt = require("jsonwebtoken");
const async = require("async");

module.exports.validateEmail = (email) => {
  // hardcoded for now
  return email.endsWith("@bitmesra.ac.in");
};

module.exports.extractUserMiddleware = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    if (bearer.length > 1) {
      const accessToken = bearer[1];
      jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET,
        (err, jwtPayload) => {
          if (err || !jwtPayload) {
            return next();
          }

          const { _id } = jwtPayload;
          req.models.User.findById(_id).exec((err, user) => {
            if (err) {
              return next();
            }

            if (user) {
              req.user = user;
            }
            next();
          });
        }
      );
    } else {
      next();
    }
  } else {
    next();
  }
};

module.exports.isLoggedIn = (req, callback) => {
  if (req.user) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

module.exports.anyChecker = (...checkers) => {
  return (req, callback) => {
    const wrappers = [];
    for (const checker of checkers) {
      wrappers.push((cb) => checker(req, cb));
    }

    async.parallel(wrappers, (err, results) => {
      if (err) {
        return callback(err);
      }

      return callback(
        null,
        results.reduce((previous, result) => previous | result, 0)
      );
    });
  };
};

module.exports.checkAuthority = (checker) => {
  return (req, res, next) => {
    checker(req, (err, result) => {
      if (err) {
        return next(err);
      }

      if (result) {
        return next();
      }

      if (req.user) {
        return res.status(403).end();
      }
      return res.status(401).end();
    });
  };
};
