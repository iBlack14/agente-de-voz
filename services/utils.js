function isValidE164(number) {
  return /^\+[1-9]\d{1,14}$/.test(number);
}

function formatToE164(number) {
  if (!number) return '';
  const cleaned = number.replace(/\D/g, '');
  return `+${cleaned}`;
}

module.exports = { isValidE164, formatToE164 };
