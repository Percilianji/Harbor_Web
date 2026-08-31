const checks = [
  [/[\w.+-]+@[\w-]+\.[\w.-]+/i, "Possible email address found."],
  [/\+?\d[\d\s().-]{7,}\d/, "Possible phone number found."],
  [/@[a-z0-9_]{3,}/i, "Possible social-media handle found."],
  [/\b\d{1,5}\s+[A-Z][a-z]+\s+(Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr)\b/, "Possible street address found."],
  [/\b(?:at|from)\s+[A-Z][A-Za-z]+\s+(School|University|Hospital|Company|Inc|LLC|Ltd)\b/, "Possible school, workplace, or institution found."],
  [/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/, "Possible full name found."],
];

export function scanForIdentifiers(text) {
  return checks.filter(([pattern]) => pattern.test(text)).map(([, message]) => message);
}
