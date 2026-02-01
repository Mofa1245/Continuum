/**
 * API Server
 * 
 * Deterministic API layer
 * No AI in core loop
 */

import Fastify from "fastify";
import type { MemoryEntry, ResolveRequest } from "../types/memory.js";
import type { IdentityContext } from "../types/identity.js";
import { InMemoryStore } from "../engine/memory-store.js";
import { Resolver } from "../engine/resolver.js";
import { extractIdentityFromKey } from "../types/identity.js";
import { initializeDefaultKeys } from "./keys.js";

// Initialize default keys for development
initializeDefaultKeys();

const server = Fastify({
  logger: true,
});

// Initialize stores
const memoryStore = new InMemoryStore();
const resolver = new Resolver(memoryStore);

/**
 * POST /memory
 * Write memory entry
 */
server.post<{
  Body: Omit<MemoryEntry, "id" | "version" | "createdAt">;
  Headers: { "x-api-key": string };
}>("/memory", async (request, reply) => {
  const apiKey = request.headers["x-api-key"];
  if (!apiKey) {
    return reply.code(401).send({ error: "Missing API key" });
  }

  // Extract identity from API key
  const identity = extractIdentityFromKey(apiKey);

  // Validate entry belongs to this org
  if (request.body.orgId !== identity.orgId) {
    return reply.code(403).send({ error: "Org ID mismatch" });
  }

  const entry = await memoryStore.write(request.body);

  return reply.code(201).send(entry);
});

/**
 * POST /resolve
 * Resolve context for a task
 */
server.post<{
  Body: ResolveRequest;
  Headers: { "x-api-key": string };
}>("/resolve", async (request, reply) => {
  const apiKey = request.headers["x-api-key"];
  if (!apiKey) {
    return reply.code(401).send({ error: "Missing API key" });
  }

  const identity = extractIdentityFromKey(apiKey);

  // Build identity context from request
  const identityContext: IdentityContext = {
    orgId: identity.orgId,
    repoId: request.body.repo,
    projectId: request.body.project,
    environment: request.body.environment,
  };

  const response = await resolver.resolve(identityContext, request.body);

  return reply.send(response);
});

/**
 * GET /health
 */
server.get("/health", async () => {
  return { status: "ok" };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`Continuum API listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

