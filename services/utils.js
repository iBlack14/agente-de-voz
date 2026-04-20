function isValidE164(number) {
  return /^\+[1-9]\d{1,14}$/.test(number);
}

function formatToE164(number) {
  if (!number) return '';
  let cleaned = number.trim();
  
  // Detect if already has +
  const hasPlus = cleaned.startsWith('+');
  
  // Remove all non-digits
  let digits = cleaned.replace(/\D/g, '');
  
  // If no plus and it starts with 9 and has 9 digits, assume Peru (+51)
  if (!hasPlus && digits.length === 9 && digits.startsWith('9')) {
    digits = '51' + digits;
  }
  
  // Ensure it has the plus prefix
  return `+${digits}`;
}

module.exports = { isValidE164, formatToE164 };
