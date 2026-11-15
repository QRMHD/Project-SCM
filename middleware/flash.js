/**
 * middleware/flash.js
 *
 * Lightweight flash message middleware for OLMS.
 *
 * Flash messages are one-time notifications stored in the user's server-side
 * session that survive a single redirect and are automatically cleared after
 * being displayed.  This gives users immediate feedback after actions like
 * adding items to the cart, placing an order, or updating their profile.
 *
 * Supported message types: 'success', 'error', 'warning', 'info'.
 *
 * Usage in route handlers:
 *   req.flash('success', 'Item added to cart!');
 *   res.redirect('/cart');
 *
 * Available in EJS templates as:
 *   flash.success  — array of success messages
 *   flash.error    — array of error messages
 *   flash.warning  — array of warning messages
 *   flash.info     — array of info messages
 *
 * Requires the sessions Map and session token to already be attached to req
 * (by the existing session middleware in app.js).
 */

/**
 * Creates the flash middleware bound to the application's session store.
 *
 * @param {Map} sessions - The server-side sessions Map from app.js
 * @returns {Function} Express middleware
 */
export function flashMiddleware(sessions) {
  return (req, res, next) => {
    const token = req.sessionToken;
    const session = token ? sessions.get(token) : null;

    // ── req.flash(type, message) ─────────────────────────────────────────
    // Stores a message that will be available on the very next request only.
    req.flash = (type, message) => {
      const activeToken = req.sessionToken;
      if (!activeToken || !sessions.has(activeToken)) return;

      const current = sessions.get(activeToken);
      if (!current.flash) {
        current.flash = {};
      }
      if (!current.flash[type]) {
        current.flash[type] = [];
      }
      current.flash[type].push(message);
    };

    // ── Read & clear flash messages for the current request ──────────────
    // Messages are consumed once: read into res.locals.flash, then deleted
    // from the session so they never appear twice.
    const pending = session && session.flash ? { ...session.flash } : {};
    if (session) {
      delete session.flash;
    }

    res.locals.flash = {
      success: pending.success || [],
      error: pending.error || [],
      warning: pending.warning || [],
      info: pending.info || []
    };

    // Also populate the legacy res.locals.message / res.locals.error
    // so existing EJS templates continue to work without changes.
    if (pending.success && pending.success.length) {
      res.locals.message = pending.success[0];
    }
    if (pending.error && pending.error.length) {
      res.locals.error = pending.error[0];
    }

    next();
  };
}

