/**
 * Production Session Manager for Shinme LMS
 * Implements a 7-day Rolling Session (Inactivity Expiry) policy.
 *
 * Rules:
 * - Active users who use the platform regularly within 7 days stay logged in seamlessly.
 * - If a user is inactive for more than 7 consecutive days, the session expires and requires re-login.
 */

export const SESSION_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
export const SESSION_STORAGE_KEY = "shinme:last_active_at";
const THROTTLE_INTERVAL_MS = 5 * 60 * 1000; // Throttle storage writes to every 5 minutes

let lastWrittenTimestamp = 0;

/**
 * Checks whether the stored session has exceeded the 7-day inactivity threshold.
 * Returns true if expired, false otherwise.
 */
export function isSessionExpired(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      // First time or key not yet written - initialize it now
      touchSession(true);
      return false;
    }

    const lastActive = parseInt(raw, 10);
    if (isNaN(lastActive)) {
      touchSession(true);
      return false;
    }

    const elapsed = Date.now() - lastActive;
    return elapsed > SESSION_TIMEOUT_MS;
  } catch {
    return false;
  }
}

/**
 * Updates the user's last activity timestamp (rolling the 7-day window).
 * Throttled to avoid unnecessary localStorage writes on high-frequency UI events.
 */
export function touchSession(force = false): void {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (force || now - lastWrittenTimestamp >= THROTTLE_INTERVAL_MS) {
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, now.toString());
      lastWrittenTimestamp = now;
    } catch {
      /* ignore storage quota or private browsing errors */
    }
  }
}

/**
 * Clears the session activity timestamp upon logout.
 */
export function clearSession(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    lastWrittenTimestamp = 0;
  } catch {
    /* ignore */
  }
}

/**
 * Registers user interaction listeners to keep the rolling session alive,
 * and sets up a periodic background check (every 5 minutes) to detect expiry.
 */
export function setupSessionActivityListeners(onExpire: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleActivity = () => {
    if (isSessionExpired()) {
      onExpire();
    } else {
      touchSession();
    }
  };

  const events: (keyof WindowEventMap)[] = ["click", "keydown", "scroll", "touchstart"];
  events.forEach((evt) => {
    window.addEventListener(evt, handleActivity, { passive: true });
  });

  // Background check interval (e.g., if tab is kept open for days)
  const intervalId = window.setInterval(() => {
    if (isSessionExpired()) {
      onExpire();
    }
  }, 5 * 60 * 1000); // Check every 5 minutes

  // Return cleanup function
  return () => {
    events.forEach((evt) => {
      window.removeEventListener(evt, handleActivity);
    });
    window.clearInterval(intervalId);
  };
}

