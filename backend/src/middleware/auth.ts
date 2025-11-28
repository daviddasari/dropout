import express from "express";

// Very simple demo auth: accepts a single hardcoded token
// and attaches the demo teacher to req.user
export function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const auth = req.headers["authorization"] || "";
  const token = Array.isArray(auth) ? auth[0] : auth;

  const bearer = token.startsWith("Bearer ") ? token.slice(7) : token;

  // Map known dev tokens to user profiles
  const tokenMap: Record<string, { email: string; name: string; role: string }> = {
    "demo-token": {
      email: "demo@edtrack.test",
      name: "Demo User",
      role: "Teacher",
    },
    "demo-token-admin": {
      email: "admin@demo.edu",
      name: "Admin Demo",
      role: "Admin",
    },
    "demo-token-counselor": {
      email: "counselor@demo.edu",
      name: "Counselor Demo",
      role: "Counselor",
    },
  };

  const profile = tokenMap[bearer];
  if (profile) {
    (req as any).user = profile;
    return next();
  }

  // Dynamic dev token: user:email=<email>;role=<role>
  if (bearer.startsWith("user:")) {
    try {
      const rest = bearer.slice(5);
      const parts = Object.fromEntries(
        (rest.split(";") as string[]).map((kv: string) => {
          const [k, v] = kv.split("=");
          return [String(k || "").trim(), String(v || "").trim()];
        })
      ) as Record<string, string>;
      if (parts.email && parts.role) {
        (req as any).user = { email: parts.email, role: parts.role, name: parts.email.split("@")[0] };
        return next();
      }
    } catch {}
  }

  return res.status(401).json({ success: false, message: "Unauthorized" });
}
