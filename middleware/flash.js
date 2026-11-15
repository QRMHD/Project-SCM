export function flashMiddleware(sessions) {
  return (req, res, next) => {
    const session = sessions.get(req.sessionToken);

    req.flash = (type, message) => {
      // Login can create a session after this middleware runs.
      const current = sessions.get(req.sessionToken);
      if (!current || current.expires <= Date.now()) return;

      if (!current.flash) current.flash = {};
      if (!current.flash[type]) current.flash[type] = [];
      current.flash[type].push(message);
    };

    // Read pending messages once, even when the next request is an API call.
    const pending = (session && session.flash) || {};
    if (session) delete session.flash;
    res.locals.flash = {
      success: pending.success || [],
      error: pending.error || [],
      warning: pending.warning || [],
      info: pending.info || []
    };
    if (res.locals.flash.success.length) res.locals.message = res.locals.flash.success[0];
    if (res.locals.flash.error.length) res.locals.error = res.locals.flash.error[0];

    next();
  };
}
