export function expandRecurrence({ pattern, n }, startMonth, endMonth) {
  const dates = [];
  let m = new Date(startMonth);
  while (m <= endMonth) {
    if (pattern === "LAST_FRIDAY") {
      let d = new Date(m.getFullYear(), m.getMonth() + 1, 0); // last day of month
      while (d.getDay() !== 5) d.setDate(d.getDate() - 1); // 5 = Friday
      dates.push(new Date(d));
    } else if (pattern === "NTH_DAY" && n > 0) {
      let d = new Date(m.getFullYear(), m.getMonth(), n);
      if (d.getMonth() === m.getMonth()) dates.push(d);
    } // ...others
    m.setMonth(m.getMonth() + 1);
  }
  return dates;
}