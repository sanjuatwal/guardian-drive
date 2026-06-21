// Shared BLE identity for the Guardian Drive car unit <-> phone link.
//
// These three values MUST match the firmware's guardian-firmware/src/config.h
// (GUARDIAN_SERVICE_UUID / GUARDIAN_AUTH_CHAR_UUID / OWNER_AUTH_TOKEN) exactly.
// The car unit (ESP32) advertises GUARDIAN_SERVICE_UUID; this app scans for it,
// connects, and writes OWNER_AUTH_TOKEN to the auth characteristic to prove it
// is the owner's phone (feature-document.md Section 12).
export const GUARDIAN_SERVICE_UUID = '6b2f0001-9d6f-4c2a-9b3a-2a4f9c1e7a10';
export const GUARDIAN_AUTH_CHAR_UUID = '6b2f0002-9d6f-4c2a-9b3a-2a4f9c1e7a10';
export const OWNER_AUTH_TOKEN = 'guardian-dev-owner-token';

// react-native-ble-plx reads/writes characteristic values as base64. The auth
// token is plain ASCII, so this minimal encoder avoids pulling in a base64 dep.
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function asciiToBase64(input: string): string {
  let output = '';
  for (let i = 0; i < input.length; i += 3) {
    const b0 = input.charCodeAt(i);
    const b1 = i + 1 < input.length ? input.charCodeAt(i + 1) : NaN;
    const b2 = i + 2 < input.length ? input.charCodeAt(i + 2) : NaN;

    const enc0 = b0 >> 2;
    const enc1 = ((b0 & 0x03) << 4) | (Number.isNaN(b1) ? 0 : b1 >> 4);
    const enc2 = Number.isNaN(b1) ? 64 : (((b1 & 0x0f) << 2) | (Number.isNaN(b2) ? 0 : b2 >> 6));
    const enc3 = Number.isNaN(b2) ? 64 : b2 & 0x3f;

    output +=
      B64_CHARS[enc0] +
      B64_CHARS[enc1] +
      (enc2 === 64 ? '=' : B64_CHARS[enc2]) +
      (enc3 === 64 ? '=' : B64_CHARS[enc3]);
  }
  return output;
}
