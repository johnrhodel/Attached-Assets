import { z } from "zod";

// Standard API response wrapper
export const apiResponse = <T extends z.ZodType>(data: T) => z.object({
  data,
  message: z.string().optional(),
});

export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/auth/login",
      input: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
      },
    },
    register: {
      method: "POST" as const,
      path: "/api/auth/register",
      input: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional(),
      }),
      responses: {
        201: z.object({ message: z.string() }),
        400: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/auth/logout",
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/auth/me",
      responses: {
        200: z.object({ id: z.number(), email: z.string(), role: z.string(), name: z.string().nullable().optional() }),
        401: z.object({ message: z.string() }),
      },
    }
  },
  projects: {
    list: {
      method: "GET" as const,
      path: "/api/projects",
      responses: {
        200: z.array(z.any()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/projects",
      input: z.any(),
      responses: {
        201: z.any(),
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/projects/:id",
      input: z.any(),
      responses: {
        200: z.any(),
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/projects/:id",
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },
  locations: {
    list: {
      method: "GET" as const,
      path: "/api/projects/:projectId/locations",
      responses: {
        200: z.array(z.any()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/projects/:projectId/locations",
      input: z.any(),
      responses: {
        201: z.any(),
      },
    },
    getBySlug: {
      method: "GET" as const,
      path: "/api/locations/slug/:slug",
      responses: {
        200: z.any(),
        404: z.object({ message: z.string() }),
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/projects/:projectId/locations/:id",
      input: z.any(),
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/projects/:projectId/locations/:id",
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },
  drops: {
    list: {
      method: "GET" as const,
      path: "/api/locations/:locationId/drops",
      responses: {
        200: z.array(z.any()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/locations/:locationId/drops",
      input: z.any(),
      responses: {
        201: z.any(),
      },
    },
    getActive: {
      method: "GET" as const,
      path: "/api/locations/:locationId/drops/active",
      responses: {
        200: z.any(),
        404: z.object({ message: z.string() }),
      },
    },
    publish: {
      method: "POST" as const,
      path: "/api/drops/:id/publish",
      responses: {
        200: z.any(),
      }
    },
    update: {
      method: "PUT" as const,
      path: "/api/drops/:id",
      input: z.any(),
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/drops/:id",
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },
  claims: {
    createSession: {
      method: "POST" as const,
      path: "/api/claims/session",
      input: z.object({
        locationId: z.number(),
      }),
      responses: {
        200: z.object({
          token: z.string(),
          expiresAt: z.string(),
          drop: z.any(),
        }),
        429: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      }
    },
    verifySession: {
      method: "GET" as const,
      path: "/api/claims/session/:token",
      responses: {
        200: z.object({
          valid: z.boolean(),
          drop: z.any(),
        }),
      }
    }
  },
  mint: {
    evmPermit: {
      method: "POST" as const,
      path: "/api/mint/evm/permit",
      input: z.object({
        claimToken: z.string(),
        recipient: z.string(),
        chainId: z.number(),
      }),
      responses: {
        200: z.object({
          signature: z.string(),
          nonce: z.string(),
          deadline: z.number(),
          amount: z.number(),
        }),
        400: z.object({ message: z.string() }),
      }
    },
    solanaTx: {
      method: "POST" as const,
      path: "/api/mint/solana/tx",
      input: z.object({
        claimToken: z.string(),
        recipient: z.string().optional(),
      }),
      responses: {
        200: z.object({
          txHash: z.string(),
          explorerUrl: z.string().optional(),
        }),
        400: z.object({ message: z.string() }),
      }
    },
    stellarXdr: {
      method: "POST" as const,
      path: "/api/mint/stellar/xdr",
      input: z.object({
        claimToken: z.string(),
        recipient: z.string(),
      }),
      responses: {
        200: z.object({
          xdr: z.string(),
          networkPassphrase: z.string(),
        }),
        400: z.object({ message: z.string() }),
      }
    },
    confirm: {
      method: "POST" as const,
      path: "/api/mints/confirm",
      input: z.object({
        claimToken: z.string(),
        txHash: z.string(),
        chain: z.enum(["evm", "solana"]),
      }),
      responses: {
        200: z.any(),
      }
    }
  },
  walletless: {
    start: {
      method: "POST" as const,
      path: "/api/walletless/start",
      input: z.object({ email: z.string().email() }),
      responses: {
        200: z.object({ message: z.string() }), // Code sent (logged)
      }
    },
    verify: {
      method: "POST" as const,
      path: "/api/walletless/verify",
      input: z.object({ 
        email: z.string().email(),
        code: z.string(),
      }),
      responses: {
        200: z.object({ 
          token: z.string(), // session token for walletless
          verified: z.boolean() 
        }),
      }
    },
    mine: {
      method: "POST" as const,
      path: "/api/walletless/mine", // User asks server to mint to their custodial wallet
      input: z.object({
        email: z.string(),
        code: z.string(),
        chain: z.enum(["evm", "solana"]),
        claimToken: z.string(),
        locale: z.enum(["en", "pt", "es"]).optional(),
      }),
      responses: {
        200: z.object({
          txHash: z.string(),
          address: z.string(),
          explorerUrl: z.string().optional(),
          chain: z.string().optional(),
        })
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
