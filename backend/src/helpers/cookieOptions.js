/**
 * Common cookie options for both local and production.
 */
function getCookieOptions() {
  // More robust production check
  const isProduction = process.env.NODE_ENV === "production" || 
                       process.env.NODE_ENV === "prod" ||
                       (process.env.RENDER_EXTERNAL_URL); // specific to Render
  
  return {
    httpOnly: true,
    path: "/",
    expires: new Date(Date.now() + 7 * 24 * 3600000), // 7 days
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  };
}

module.exports = { getCookieOptions };
