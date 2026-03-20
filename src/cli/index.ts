#!/usr/bin/env node
/**
 * CLI Entry Point
 *
 * Commands: resolve, demo, write (see daemon for dispatch).
 */

export { main } from "../daemon/index.js";
export { runDemo } from "./demo-command.js";
export { printRunSummary } from "./run-inspector.js";
export { printReplayDiff, areReplayResultsEqual } from "./replay-diff.js";
export { runReplayCheck } from "./replay-check.js";
export { validateRunInvariants } from "./invariant-validator.js";

