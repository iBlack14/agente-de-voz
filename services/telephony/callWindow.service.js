const LIMA_UTC_OFFSET_HOURS = parseInt(process.env.CALL_WINDOW_UTC_OFFSET || '-5', 10);
const CALL_WINDOW_START_HOUR = Math.max(0, Math.min(23, parseInt(process.env.CALL_WINDOW_START_HOUR || '8', 10)));
const CALL_WINDOW_END_HOUR = Math.max(1, Math.min(24, parseInt(process.env.CALL_WINDOW_END_HOUR || '22', 10)));

function getPeruLocalDate(date = new Date()) {
  return new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (LIMA_UTC_OFFSET_HOURS * 3600000));
}

function toActualUtcDateFromLocal(localDate) {
  return new Date(localDate.getTime() - (LIMA_UTC_OFFSET_HOURS * 3600000));
}

function getPeruHour(date = new Date()) {
  return getPeruLocalDate(date).getUTCHours();
}

function isWithinAllowedCallWindow(date = new Date()) {
  const hour = getPeruHour(date);
  return hour >= CALL_WINDOW_START_HOUR && hour < CALL_WINDOW_END_HOUR;
}

function getNextAllowedCallTime(date = new Date()) {
  if (isWithinAllowedCallWindow(date)) {
    return new Date(date);
  }

  const local = getPeruLocalDate(date);
  const hour = local.getUTCHours();

  if (hour >= CALL_WINDOW_END_HOUR) {
    local.setUTCDate(local.getUTCDate() + 1);
  }

  local.setUTCHours(CALL_WINDOW_START_HOUR, 0, 0, 0);
  return toActualUtcDateFromLocal(local);
}

module.exports = {
  CALL_WINDOW_START_HOUR,
  CALL_WINDOW_END_HOUR,
  isWithinAllowedCallWindow,
  getNextAllowedCallTime
};
