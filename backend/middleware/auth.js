const { supabaseAdmin } = require("../lib/supabase");

/**
 * requireAuth — Verifies the Supabase JWT from the Authorization header.
 * Attaches req.user = { id, email } on success.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing authorization token." });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }

  req.user = { id: data.user.id, email: data.user.email };
  next();
}

/**
 * requireCompanyAccess — After requireAuth, checks that req.user is a
 * member of the company in req.params.companyId.
 * Attaches req.companyRole on success.
 */
async function requireCompanyAccess(req, res, next) {
  const { companyId } = req.params;
  const userId = req.user?.id;

  if (!companyId) return next(); // routes without :companyId skip this

  const { data, error } = await supabaseAdmin
    .from("company_users")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return res.status(403).json({ message: "Access denied to this company." });
  }

  req.companyRole = data.role;
  next();
}

/**
 * requireRole(roles) — Middleware factory that checks companyRole.
 * Call after requireCompanyAccess.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.companyRole)) {
      return res.status(403).json({ message: "Insufficient permissions." });
    }
    next();
  };
}

module.exports = { requireAuth, requireCompanyAccess, requireRole };
