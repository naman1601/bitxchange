const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { body } = require("express-validator");

const { customValidationResult } = require("../helpers/validation");
const {
  validateEmail,
  checkAuthority,
  isLoggedIn,
} = require("../helpers/auth");

const createRefreshToken = ({ _id }) => {
  const refreshToken = jwt.sign({ _id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_VALID_TIME,
  });
  return refreshToken;
};

const createAccessToken = ({ _id, name, email, isVerified }) => {
  const accessToken = jwt.sign(
    { _id, name, email, isVerified },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_VALID_TIME,
    }
  );
  return accessToken;
};

const sendUser = (req, res, user) => {
  const refreshToken = createRefreshToken(user);
  const accessToken = createAccessToken(user);
  const productionCookie =
    req.app.get("env") === "development"
      ? {}
      : {
          secure: true,
          sameSite: "none",
        };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, {
      ...productionCookie,
      httpOnly: true,
    })
    .json({
      accessToken: accessToken,
    });
};

module.exports.handleLogin = (req, res, next) => {
  req.models.User.findOne({ email: req.body.email }, (err, user) => {
    if (err) {
      return next(err);
    }

    if (user) {
      bcrypt.compare(req.body.password, user.password, (err, success) => {
        if (err) {
          return next(err);
        }

        if (success) {
          return sendUser(req, res, user);
        }

        res.status(401).json({
          message: "invalid password",
        });
      });
    } else {
      res.status(401).json({
        message: "invalid email",
      });
    }
  });
};

module.exports.handleLogout = (req, res) => {
  res.status(204).clearCookie("refreshToken").end();
};

module.exports.handleRegister = [
  body("name").trim().isLength({ min: 1 }).withMessage("name is required"),
  body("email")
    .trim()
    .isLength({ min: 1 })
    .withMessage("email is required")
    .custom(
      (value, { req }) =>
        new Promise((resolve, reject) => {
          req.models.User.findOne({ email: value }).exec((err, user) => {
            if (err) {
              return reject(err);
            }

            if (!user) {
              resolve();
            } else {
              reject("email taken");
            }
          });
        })
    )
    .custom((value) => {
      if (!validateEmail(value)) {
        throw new Error(
          "email should be official BIT Mesra email (example - btech99999.20@bitmesra.ac.in)"
        );
      }
      return true;
    }),
  body("password")
    .trim()
    .isLength({ min: 5 })
    .withMessage("password should be atleast 5 characters long"),
  (req, res, next) => {
    const errors = customValidationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    bcrypt.hash(req.body.password, 10, (err, hashPassword) => {
      if (err) {
        return next(err);
      }

      const userData = {
        name: req.body.name,
        email: req.body.email,
        password: hashPassword,
      };

      const user = new req.models.User(userData);

      user.save((err, user) => {
        if (err) {
          return next(err);
        }

        return sendUser(req, res, user);
      });
    });
  },
];

module.exports.handleGenerateAccessToken = (req, res, next) => {
  jwt.verify(
    req.cookies.refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    (err, jwtPayload) => {
      if (err || !jwtPayload) {
        return res.status(401).clearCookie("refreshToken").json({
          message: "invalid refresh token",
        });
      }

      const { _id } = jwtPayload;
      req.models.User.findById(_id).exec((err, user) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(401).json({
            message: "user does not exist",
          });
        }

        const accessToken = createAccessToken(user);
        res.json({
          accessToken,
        });
      });
    }
  );
};

module.exports.handleGenerateVerificationEmail = [
  checkAuthority(isLoggedIn),
  async (req, res, next) => {
    if (req.user.isVerified) {
      return res.status(409).end();
    }

    const verificationToken = new req.models.VerificationToken({
      user: req.user,
    });

    verificationToken.save((err) => {
      if (err) {
        return next(err);
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      transporter.sendMail(
        {
          from: process.env.SMTP_EMAIL,
          to: req.user.email,
          subject: "Bitxchange email verification",
          html: `Hi ${req.user.name},<br>\
                                   <br>\
              Click <a href='${process.env.CLIENT_URL}/verify/${verificationToken._id}'>this</a> link to verify your email`,
        },
        (err) => {
          if (err) {
            return next(err);
          }

          res.status(201).end();
        }
      );
    });
  },
];

module.exports.handleUpdateVerificationStatus = (req, res, next) => {
  req.models.VerificationToken.findByIdAndDelete(req.params.token).exec(
    (err, verificationToken) => {
      if (err) {
        return next(err);
      }

      if (!verificationToken) {
        return res.status(401).json({
          message: "invalid verification token",
        });
      }

      if (verificationToken.isExpired()) {
        return res.status(401).json({
          message: "expired verification token",
        });
      }

      req.models.User.findByIdAndUpdate(
        verificationToken.user,
        { isVerified: true },
        (err) => {
          if (err) {
            return next(err);
          }
          return res.status(204).end();
        }
      );
    }
  );
};
