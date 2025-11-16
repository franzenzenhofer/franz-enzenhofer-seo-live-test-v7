/**
 * Active Run ID Management
 * Tracks the currently active run ID per tab to prevent race conditions
 */

const sessionKey = (tabId: number) => `activeRun:${tabId}`;

export interface ActiveRunInfo {
  runId: string;
  startedAt: number;
}

/**
 * Generates a new unique run ID
 */
export const generateRunId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `run-${timestamp}-${random}`;
};

/**
 * Sets the active run ID for a tab
 */
export const setActiveRunId = async (tabId: number, runId: string): Promise<void> => {
  const info: ActiveRunInfo = {
    runId,
    startedAt: Date.now(),
  };
  await chrome.storage.session.set({ [sessionKey(tabId)]: info });
};

/**
 * Gets the active run ID for a tab
 * Returns null if no active run
 */
export const getActiveRunId = async (tabId: number): Promise<string | null> => {
  const result = await chrome.storage.session.get(sessionKey(tabId));
  const info = result[sessionKey(tabId)] as ActiveRunInfo | undefined;
  return info?.runId ?? null;
};

/**
 * Clears the active run ID for a tab
 */
export const clearActiveRunId = async (tabId: number): Promise<void> => {
  await chrome.storage.session.remove(sessionKey(tabId));
};

/**
 * Checks if a given run ID is still the active run for a tab
 * Returns false if the run has been superseded or cancelled
 */
export const isActiveRun = async (tabId: number, runId: string): Promise<boolean> => {
  const currentRunId = await getActiveRunId(tabId);
  return currentRunId === runId;
};

/**
 * Cancels the active run for a tab (if any)
 * Sets a special "cancelled" marker so in-flight operations can detect it
 */
export const cancelActiveRun = async (tabId: number): Promise<void> => {
  await clearActiveRunId(tabId);
};
