// server/src/utils/logger.js
const format = (level, message, meta = {}) => {
  const ts = new Date().toISOString();
  return JSON.stringify({ ts, level, message, ...meta });
};

export const logger = {
  info: (msg, meta) => console.log(format('info', msg, meta)),
  warn: (msg, meta) => console.warn(format('warn', msg, meta)),
  error: (msg, meta) => console.error(format('error', msg, meta)),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') console.log(format('debug', msg, meta));
  },
};
