/**
 * QR Code Service
 * Generate and decode QR codes for check-ins
 */


/**
 * QR Code Data structure
 */
interface QRCodeData {
  type: "event_badge" | "check_in" | "user_profile";
  userId: string;
  eventId?: string;
  timestamp: number;
  signature: string;
}

/**
 * Generate a QR code data string for event badge
 */
export const generateBadgeQRData = (
  userId: string,
  eventId: string,
): string => {
  const data: QRCodeData = {
    type: "event_badge",
    userId,
    eventId,
    timestamp: Date.now(),
    signature: generateSignature(userId, eventId),
  };

  return encodeQRData(data);
};

/**
 * Generate a QR code data string for check-in
 */
export const generateCheckInQRData = (
  userId: string,
  eventId: string,
): string => {
  const data: QRCodeData = {
    type: "check_in",
    userId,
    eventId,
    timestamp: Date.now(),
    signature: generateSignature(userId, eventId),
  };

  return encodeQRData(data);
};

/**
 * Generate a QR code data string for user profile
 */
export const generateProfileQRData = (userId: string): string => {
  const data: QRCodeData = {
    type: "user_profile",
    userId,
    timestamp: Date.now(),
    signature: generateSignature(userId, ""),
  };

  return encodeQRData(data);
};

/**
 * Decode QR code data
 */
export const decodeQRData = (qrString: string): QRCodeData | null => {
  try {
    const decoded = Buffer.from(qrString, "base64").toString("utf-8");
    const data = JSON.parse(decoded) as QRCodeData;

    // Validate signature
    const expectedSignature = generateSignature(
      data.userId,
      data.eventId || "",
    );
    if (data.signature !== expectedSignature) {
      console.warn("Invalid QR code signature");
      return null;
    }

    // Check if QR code is expired (24 hours)
    const expiryTime = 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > expiryTime) {
      console.warn("QR code expired");
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error decoding QR data:", error);
    return null;
  }
};

/**
 * Validate QR code for event check-in
 */
export const validateEventQR = (
  qrString: string,
  eventId: string,
): { valid: boolean; userId?: string; error?: string } => {
  const data = decodeQRData(qrString);

  if (!data) {
    return { valid: false, error: "Invalid or expired QR code" };
  }

  if (data.type !== "check_in" && data.type !== "event_badge") {
    return { valid: false, error: "Invalid QR code type" };
  }

  if (data.eventId !== eventId) {
    return { valid: false, error: "QR code is for a different event" };
  }

  return { valid: true, userId: data.userId };
};

/**
 * Encode QR data to base64 string
 */
const encodeQRData = (data: QRCodeData): string => {
  const jsonString = JSON.stringify(data);
  // Use btoa for base64 encoding in React Native
  // Note: In production, use a proper base64 library
  return btoa(jsonString);
};

/**
 * Generate a simple signature for QR validation
 * In production, use proper cryptographic signing
 */
const generateSignature = (userId: string, eventId: string): string => {
  const secret = "event-app-secret-key"; // In production, use env variable
  const data = `${userId}-${eventId}-${secret}`;

  // Simple hash function (in production, use crypto)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16);
};

/**
 * Generate QR code SVG path (for rendering without external library)
 * This is a simplified version - use a proper QR library in production
 */
export const generateQRCodeSVG = (data: string): string => {
  // In production, use a library like 'qrcode' or 'react-native-qrcode-svg'
  // This returns a placeholder
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect fill="white" width="100" height="100"/>
      <text x="50" y="50" text-anchor="middle" fill="black">QR</text>
    </svg>
  `;
};

/**
 * Get QR code as data URL for display
 */
export const getQRCodeDataURL = async (data: string): Promise<string> => {
  // In production, use 'qrcode' library
  // For now, return a placeholder URL
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`;
};

// Polyfill btoa for React Native
const btoa = (str: string): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let output = "";

  for (let i = 0; i < str.length; i += 3) {
    const a = str.charCodeAt(i);
    const b = str.charCodeAt(i + 1);
    const c = str.charCodeAt(i + 2);

    const enc1 = a >> 2;
    const enc2 = ((a & 3) << 4) | (b >> 4);
    const enc3 = ((b & 15) << 2) | (c >> 6);
    const enc4 = c & 63;

    if (isNaN(b)) {
      output += chars.charAt(enc1) + chars.charAt(enc2) + "==";
    } else if (isNaN(c)) {
      output +=
        chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + "=";
    } else {
      output +=
        chars.charAt(enc1) +
        chars.charAt(enc2) +
        chars.charAt(enc3) +
        chars.charAt(enc4);
    }
  }

  return output;
};
