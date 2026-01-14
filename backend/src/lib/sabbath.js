function parseWindow(str) {
  const [day, time] = str.trim().split(/\s+/);
  const [hh, mm] = time.split(':').map(Number);
  return { day: day.toUpperCase(), hh, mm };
}
const DOW = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

function isSabbathNow(date = new Date()) {
  if ((process.env.SABBATH_PAUSE || 'true').toLowerCase() !== 'true') return false;
  const start = parseWindow(process.env.SABBATH_START || 'FRI 18:00');
  const end = parseWindow(process.env.SABBATH_END || 'SAT 18:00');
  const dow = DOW[date.getDay()];
  const minutes = date.getHours()*60 + date.getMinutes();

  const startDayIndex = DOW.indexOf(start.day);
  const endDayIndex = DOW.indexOf(end.day);
  const nowDayIndex = DOW.indexOf(dow);

  const startMinutes = start.hh*60 + start.mm;
  const endMinutes = end.hh*60 + end.mm;

  if (nowDayIndex === startDayIndex) return minutes >= startMinutes;
  if (nowDayIndex === endDayIndex) return minutes < endMinutes;
  if (startDayIndex < endDayIndex) return nowDayIndex > startDayIndex && nowDayIndex < endDayIndex;
  return false;
}
module.exports = { isSabbathNow };
