const SECRET_KEY = 987654321; // change to your secret key

export const HashUtil = {
  // Hash (encode)
  hashNumber(num) {
    // XOR with secret key to make it less predictable
    const mixed = Number(num) ^ SECRET_KEY;

    // Convert to base36 (letters+numbers)
    const base36 = mixed.toString(36);

    // Add random segments for obfuscation
    const random1 = Math.random().toString(36).substring(2, 7);
    const random2 = Math.random().toString(36).substring(2, 7);

    return `${base36}-${random1}-${random2}`;
  },

  // Unhash (decode)
  unhashNumber(str) {
    // Take the first segment before "-"
    const base36 = str.split("-")[0];

    // Reverse the XOR
    return parseInt(base36, 36) ^ SECRET_KEY;
  }
};