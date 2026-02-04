/**
 * Console logger for Continuum demo output.
 * Consistent prefix formatting and separators.
 */

const PREFIX = "[Continuum]";
const SEP = "---";

/** Log a section header (e.g. RUN START, REPLAY VERIFIED). */
export function logSection(title: string): void {
  console.log("\n" + SEP + " " + title + " " + SEP);
}

export function logStep(stepNumber: number, description: string): void {
  console.log(PREFIX + " Step " + stepNumber + ": " + description);
}

export function logCheckpoint(stepNumber: number, checkpointId: string): void {
  console.log(PREFIX + " Checkpoint after step " + stepNumber + ": " + checkpointId);
}

export function logCrash(stepNumber: number): void {
  console.log(PREFIX + " Crash simulated after step " + stepNumber);
}

export function logRecovery(checkpointId: string): void {
  console.log(PREFIX + " Recovery from checkpoint: " + checkpointId);
}

export function logReplayStart(): void {
  console.log(PREFIX + " Replay started");
}

export function logReplayResult(pass: boolean): void {
  console.log(PREFIX + " Replay " + (pass ? "PASS" : "FAIL"));
}

/** Log a single prefixed line (e.g. Run ID, Checkpoint ID). */
export function logInfo(message: string): void {
  console.log(PREFIX + " " + message);
}
