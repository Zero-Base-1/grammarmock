export type OutputFormat = 'text' | 'json' | 'csv';

export function formatOutput(records: string[], format: OutputFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(records, null, 2);
    case 'csv': {
      const header = 'value';
      const rows = records.map((r) => {
        if (r.includes('"') || r.includes(',') || r.includes('\n')) {
          return `"${r.replace(/"/g, '""')}"`;
        }
        return r;
      });
      return [header, ...rows].join('\n');
    }
    case 'text':
    default:
      return records.join('\n');
  }
}
