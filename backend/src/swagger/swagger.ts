import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TeleMedicine AI Decision-Support API",
      version: "1.0.0",
description: `REST API for heuristic disease-risk estimation (decision support).

**Important**: This system is a **decision-support tool** and is **not a substitute for professional medical diagnosis**. The default engine produces a deterministic **risk score** (a heuristic estimate), NOT a statistically calibrated probability and NOT a clinical diagnosis. Once a trained, calibrated ML model is integrated, the API may return a true calibrated probability (model.calibrated = true).

## Authentication
Use the demo login endpoint to obtain a JWT, then include it in the \`Authorization: Bearer <token>\` header. Roles: \`patient\`, \`doctor\`, \`admin\`.

Local-development demo users (demo login is disabled in production):
- patient@demo.com (patient)
- doctor@demo.com (doctor)
- admin@demo.com (admin)`,
      license: {
        name: "Educational / Research Use",
      },
    },
    servers: [
      {
        url: "http://localhost:8080",
        description: "Local development",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
