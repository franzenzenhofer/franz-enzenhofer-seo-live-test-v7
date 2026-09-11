/** 'starting': Run test was clicked and the page is being reloaded; no run record exists yet. */
export type RunStatus = 'starting' | 'pending' | 'running' | 'completed' | 'aborted' | 'error' | 'skipped'
