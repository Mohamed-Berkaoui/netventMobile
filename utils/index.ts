/**
 * Utility Functions
 */

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Format time to readable string
 */
export const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format date and time together
 */
export const formatDateTime = (date: string | Date): string => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const d = new Date(date);
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMs > 0) {
    // Future
    if (diffMins < 60) return `in ${diffMins} min`;
    if (diffHours < 24) return `in ${diffHours} hours`;
    if (diffDays < 7) return `in ${diffDays} days`;
    return formatDate(date);
  } else {
    // Past
    const absMins = Math.abs(diffMins);
    const absHours = Math.abs(diffHours);
    const absDays = Math.abs(diffDays);

    if (absMins < 1) return "just now";
    if (absMins < 60) return `${absMins}m ago`;
    if (absHours < 24) return `${absHours}h ago`;
    if (absDays < 7) return `${absDays}d ago`;
    return formatDate(date);
  }
};

/**
 * Format duration between two dates
 */
export const formatDuration = (
  start: string | Date,
  end: string | Date,
): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  }
  return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
};

/**
 * Check if a date is today
 */
export const isToday = (date: string | Date): boolean => {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is in the past
 */
export const isPast = (date: string | Date): boolean => {
  return new Date(date).getTime() < Date.now();
};

/**
 * Check if a date is in the future
 */
export const isFuture = (date: string | Date): boolean => {
  return new Date(date).getTime() > Date.now();
};

/**
 * Check if an event is currently happening
 */
export const isOngoing = (
  start: string | Date,
  end: string | Date,
): boolean => {
  const now = Date.now();
  return new Date(start).getTime() <= now && new Date(end).getTime() >= now;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance to readable string
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
};

/**
 * Get initials from a name
 */
export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Sleep/delay function
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Safe JSON parse
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Pluralize a word based on count
 */
export const pluralize = (
  count: number,
  singular: string,
  plural?: string,
): string => {
  if (count === 1) return singular;
  return plural || `${singular}s`;
};
