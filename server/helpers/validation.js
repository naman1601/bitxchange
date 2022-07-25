const { validationResult } = require("express-validator");

module.exports.customValidationResult = validationResult.withDefaults({
  formatter: (error) => {
    const { msg, ...others } = error;
    return {
      message: msg,
      ...others,
    };
  },
});
