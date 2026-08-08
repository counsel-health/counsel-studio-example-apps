import { z } from "zod";

// Access code configuration schema
// Supports two auth modes:
// - apiKey: API key auth (Bearer apiKey). Use when you have a Counsel API key.
// - issuer: JWT auth only. Use with COUNSEL_PRIVATE_KEY_PEM for RSA-signed JWTs.
// At least one of apiKey or issuer must be present for Browser direct calls to the Counsel API.
export const AccessCodeConfigSchema = z.object({
  client: z.string(),
  apiUrl: z.url(),
  userType: z.enum(["main", "onboarding"]).default("main"),
  // Navigation mode for the embedded chat experience.
  // "standalone" (default): full Counsel iframe with built-in sidebar
  // "integrated": host-managed sidebar with Counsel integrated view (no Counsel sidebar)
  navMode: z.enum(["standalone", "integrated"]).default("standalone"),
  // API key for API key auth. Needed for server→Counsel calls.
  apiKey: z.string(),
  // The iss claim put in JWTs for this access code's org.
  // Required for Browser direct calls to the Counsel API.
  // If skipped, all requests will be proxied through the demo server.
  issuer: z.url().optional(),
  // When "AI", demo user creation omits seeded phone (matches counsel studio AI-mode orgs).
  appContextMode: z.enum(["AI", "Physician"]).optional(),
});

// Environment configuration schema
export const envConfig = z
  .object({
    PORT: z.coerce.number().default(4003),
    JWT_SECRET: z.string().min(32),
    COUNSEL_WEBHOOK_SECRET: z.string(),
    // RSA private key PEM for signing JWTs. Required when any access code uses issuer-based auth.
    // Normalise literal \n sequences → real newlines so the value works whether it's stored
    // in a .env file without quotes, a cloud secret manager, or a shell export.
    COUNSEL_PRIVATE_KEY_PEM: z
      .string()
      .transform((pem) => pem.replace(/\\n/g, "\n"))
      .optional(),
    // JSON string mapping access codes to client/environment configs
    // Format: {"ACCESS_CODE_CONFIGS": {"MAIN01": {"client": "main", "apiUrl": "https://test-api.counselhealth.com", "userType": "main"}, ...}}
    ACCESS_CODE_CONFIGS: z
      .string()
      .transform((val) => {
        try {
          return JSON.parse(val);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`ACCESS_CODE_CONFIGS must be valid JSON: ${errorMessage}`);
        }
      })
      .pipe(
        z
          .record(z.string().length(6), AccessCodeConfigSchema)
          .refine((configs) => Object.keys(configs).length > 0, {
            message: "At least one access code configuration is required",
          }),
      ),
  })
  .superRefine((data, ctx) => {
    const hasIssuerConfig = Object.values(data.ACCESS_CODE_CONFIGS).some((c) => c.issuer);
    if (hasIssuerConfig && !data.COUNSEL_PRIVATE_KEY_PEM) {
      ctx.addIssue({
        code: "custom",
        message:
          "COUNSEL_PRIVATE_KEY_PEM is required when any access code uses issuer-based JWT auth",
        path: ["COUNSEL_PRIVATE_KEY_PEM"],
      });
    }
  });
