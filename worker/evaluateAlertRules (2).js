// ...existing code
if (rule.type === "temperature_above" && rule.temperature_above != null) {
  const sensors = (await db.query("SELECT * FROM sensors WHERE temperature >= $1", [rule.temperature_above])).rows;
  if (sensors.length > 0) {
    shouldTrigger = true;
    message = `High temperature: ${sensors.map(s => `${s.name} (${s.temperature})`).join(', ')}`;
  }
}
if (rule.type === "custom_sql" && rule.sql_condition) {
  const result = await db.query(rule.sql_condition);
  if (result.rows.length > 0) {
    shouldTrigger = true;
    message = `Custom rule triggered. Rows: ${result.rows.length}`;
  }
}