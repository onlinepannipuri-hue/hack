/**
 * Privacy-compliant request logger
 * Logs only metadata (userId, deviceId, method, path, status, timestamp)
 * Explicitly omits passwords, tokens, SMS content, and sender information
 */
export const auditLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.user ? req.user._id : 'unauthenticated';
    const deviceId = req.body?.deviceId || req.params?.deviceId || 'n/a';

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs: duration,
        userId: userId.toString(),
        deviceId: String(deviceId),
        ip: req.ip,
      })
    );
  });

  next();
};
