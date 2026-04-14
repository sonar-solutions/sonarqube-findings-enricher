// -------- Date Formatter --------

// -- Convert a date value to readable format --
// Handles both ISO strings ("2020-01-25T10:35:33+0000")
// and epoch millisecond strings ("1488206038283")
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';

  let d;

  // -- Check if it's a pure numeric epoch timestamp --
  if (/^\d+$/.test(dateStr)) {
    d = new Date(Number.parseInt(dateStr, 10));
  } else {
    d = new Date(dateStr);
  }

  if (Number.isNaN(d.getTime())) return dateStr;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

module.exports = { formatDate };
