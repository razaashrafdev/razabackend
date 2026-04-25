const rateLimit = require("express-rate-limit");

function createLimiter({ windowMs, max }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests, please try again later.",
    },
  });
}

const requestOtpLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 5,
});

const verifyOtpLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
});

const contactSubmitLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 5,
});

const analyticsVisitLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 30,
});

const globalLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 100,
});

const authRoutesLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 30,
});

const contactRoutesLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 20,
});

module.exports = {
  globalLimiter,
  authRoutesLimiter,
  contactRoutesLimiter,
  requestOtpLimiter,
  verifyOtpLimiter,
  contactSubmitLimiter,
  analyticsVisitLimiter,
};
