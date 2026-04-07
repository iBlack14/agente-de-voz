function isValidE164(number) {
  return /^\+[1-9]\d{1,14}$/.test(number);
}

module.exports = { isValidE164 };
