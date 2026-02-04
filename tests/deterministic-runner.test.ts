/**
 * Deterministic behavior tests for runDeterministicAgent.
 * No engine or storage code modified; runner behavior only.
 */

import { jest } from "@jest/globals";
import { runDeterministicAgent } from "../src/agent/deterministic-runner.js";
import type { DeterministicPhase } from "../src/agent/deterministic-runner.js";
import { InMemoryStore } from "../src/engine/memory-store.js";
import { InMemoryAgentRunStore } from "../src/engine/agent-run-store.js";
import type { MemoryStore } from "../src/engine/memory-store.js";
import type { CreateCheckpointInput } from "../src/types/checkpoint.js";

function fixedPhases(): DeterministicPhase[] {
  return [
    { name: "plan", execute: async () => ({ plan: "test", steps: ["a", "b"] }) },
    { name: "gather", execute: async () => ({ constraints: ["deterministic"] }) },
    { name: "decide", execute: async () => ({ action: "go", reason: "fixed" }) },
    { name: "produce", execute: async () => ({ result: "ok", status: "done" }) },
  ];
}

describe("runDeterministicAgent", () => {
  let consoleLogSpy: ReturnType<typeof jest.spyOn>;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(() => {
    if (consoleLogSpy) consoleLogSpy.mockRestore();
  });

  test("same phases twice produces identical step outputs", async () => {
    const store = new InMemoryStore();
    const agentRunStore = new InMemoryAgentRunStore(store);
    const phases = fixedPhases();

    const result1 = await runDeterministicAgent({
      agentId: "test-org",
      taskId: "test-task",
      phases,
      store,
      agentRunStore,
    });

    const store2 = new InMemoryStore();
    const agentRunStore2 = new InMemoryAgentRunStore(store2);

    const result2 = await runDeterministicAgent({
      agentId: "test-org",
      taskId: "test-task",
      phases: fixedPhases(),
      store: store2,
      agentRunStore: agentRunStore2,
    });

    expect(result1.phaseResults).toEqual(result2.phaseResults);
  });

  test("duplicate phase names throws error", async () => {
    const store = new InMemoryStore();
    const agentRunStore = new InMemoryAgentRunStore(store);
    const phases: DeterministicPhase[] = [
      { name: "same", execute: async () => ({ a: 1 }) },
      { name: "same", execute: async () => ({ b: 2 }) },
    ];

    await expect(
      runDeterministicAgent({
        agentId: "test-org",
        taskId: "test-task",
        phases,
        store,
        agentRunStore,
      })
    ).rejects.toThrow("Duplicate phase name detected: same");
  });

  test("checkpoint created once per phase", async () => {
    let createCheckpointCount = 0;
    const backing = new InMemoryStore();

    const countingStore: MemoryStore = {
      write: (e) => backing.write(e),
      read: (f) => backing.read(f),
      resolve: (c, t) => backing.resolve(c, t),
      createCheckpoint: async (input: CreateCheckpointInput) => {
        createCheckpointCount += 1;
        return backing.createCheckpoint(input);
      },
      restoreCheckpoint: (id, orgId) => backing.restoreCheckpoint(id, orgId),
      getCheckpoint: (id, orgId) => backing.getCheckpoint(id, orgId),
      listCheckpoints: (orgId) => backing.listCheckpoints(orgId),
      deleteCheckpoint: (id, orgId) => backing.deleteCheckpoint(id, orgId),
    };

    const agentRunStore = new InMemoryAgentRunStore(countingStore);
    const phases = fixedPhases();

    await runDeterministicAgent({
      agentId: "test-org",
      taskId: "test-task",
      phases,
      store: countingStore,
      agentRunStore,
    });

    expect(createCheckpointCount).toBe(1 + phases.length);
  });
});
