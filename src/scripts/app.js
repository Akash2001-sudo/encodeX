const $ = (id) => document.getElementById(id);

function reverseBytes(hex, start, length) {
  let result = "";

  for (let i = start + length - 2; i >= start; i -= 2) {
    result += hex.substring(i, i + 2);
  }

  return result;
}

function toBase64Utf8(uuidStr) {
  const hex = uuidStr.replace(/-/g, "");
  const timeLow = reverseBytes(hex, 0, 8);
  const timeMid = reverseBytes(hex, 8, 4);
  const timeHigh = reverseBytes(hex, 12, 4);
  const clock = hex.substring(16);
  const encodedHex = timeLow + timeMid + timeHigh + clock;
  const bsonBinary = new Uint8Array(16);

  for (let i = 0; i < encodedHex.length; i += 2) {
    bsonBinary[i / 2] = parseInt(encodedHex.substring(i, i + 2), 16);
  }

  let binary = "";

  for (let i = 0; i < bsonBinary.length; i += 1) {
    binary += String.fromCharCode(bsonBinary[i]);
  }

  return btoa(binary);
}

function fromBase64Utf8(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const encodedHex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const timeLow = reverseBytes(encodedHex, 0, 8);
  const timeMid = reverseBytes(encodedHex, 8, 4);
  const timeHigh = reverseBytes(encodedHex, 12, 4);
  const clock = encodedHex.substring(16);
  const hex = timeLow + timeMid + timeHigh + clock;

  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join("-");
}

function toUrlSafe(b64) {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromUrlSafe(b64url) {
  let normalized = b64url.replace(/-/g, "+").replace(/_/g, "/");
  normalized += "=".repeat((4 - (normalized.length % 4)) % 4);
  return normalized;
}

function isLikelyUuidString(value) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
}

function setMessage(elementId, message, isValid) {
  const element = $(elementId);
  element.className = isValid ? "ok" : "error";
  element.textContent = message;
}

function encodeUuidString() {
  const uuid = $("uuid").value.trim();
  const urlsafe = $("urlsafe").checked;
  const looksValid = isLikelyUuidString(uuid);

  setMessage(
    "uuidMsg",
    looksValid
      ? "Looks like a valid UUID string."
      : "Warning: input does not look like a standard UUID string. Proceeding anyway.",
    looksValid
  );

  if (uuid.length === 0) {
    return;
  }

  let b64 = toBase64Utf8(uuid);
  if (urlsafe) {
    b64 = toUrlSafe(b64);
  }

  $("b64").value = b64;
  setMessage("b64Msg", "Encoded successfully.", true);
}

function decodeToUuidString() {
  let b64 = $("b64").value.trim();
  const urlsafe = $("urlsafe").checked;

  if (b64.length === 0) {
    return;
  }

  try {
    if (urlsafe) {
      b64 = fromUrlSafe(b64);
    }

    const uuid = fromBase64Utf8(b64);
    const looksValid = isLikelyUuidString(uuid);

    $("uuid").value = uuid;
    setMessage("b64Msg", "Decoded successfully.", true);
    setMessage(
      "uuidMsg",
      looksValid
        ? "Looks like a valid UUID string."
        : "Decoded string does not look like a standard UUID.",
      looksValid
    );
  } catch (_error) {
    setMessage("b64Msg", "Invalid Base64 input.", false);
  }
}

$("encodeBtn").addEventListener("click", encodeUuidString);
$("decodeBtn").addEventListener("click", decodeToUuidString);
$("uuid").addEventListener("input", encodeUuidString);
$("b64").addEventListener("input", decodeToUuidString);

$("copyUuid").addEventListener("click", async () => {
  await navigator.clipboard.writeText($("uuid").value);
});

$("copyB64").addEventListener("click", async () => {
  await navigator.clipboard.writeText($("b64").value);
});

$("uuid").value = "0773711e-d3f6-4003-aa8d-db585e3abda4";
encodeUuidString();
