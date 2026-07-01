import type { EntityGetResponse, EntityRecord } from '@uipath/uipath-typescript/entities';

interface RecordsTableProps {
  entity: EntityGetResponse;
  records: EntityRecord[];
  loading: boolean;
}

const AUDIT_FIELDS = new Set(['CreateTime', 'UpdateTime', 'CreatedBy', 'UpdatedBy', 'RecordOwner']);
const SYSTEM_FIELDS = new Set(['Id']);

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'string') {
    // ISO date-like
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    return value;
  }
  if (typeof value === 'object') {
    // file reference
    if ('ID' in (value as Record<string, unknown>)) {
      return `[file: ${(value as Record<string, unknown>).ID}]`;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

function getColumnKeys(entity: EntityGetResponse, records: EntityRecord[]): string[] {
  // Prefer schema fields order; only include fields that appear in records
  const schemaKeys: string[] = [];
  const recordKeys = new Set<string>();

  for (const r of records) {
    Object.keys(r).forEach((k) => recordKeys.add(k));
  }

  if (entity.fields && Array.isArray(entity.fields)) {
    for (const f of entity.fields as Array<{ name: string }>) {
      if (recordKeys.has(f.name)) schemaKeys.push(f.name);
    }
  }

  // Add any extra keys in records not in schema
  for (const k of recordKeys) {
    if (!schemaKeys.includes(k)) schemaKeys.push(k);
  }

  // Move Id first, then non-audit, then audit at the end
  const id = schemaKeys.filter((k) => SYSTEM_FIELDS.has(k));
  const main = schemaKeys.filter((k) => !SYSTEM_FIELDS.has(k) && !AUDIT_FIELDS.has(k));
  const audit = schemaKeys.filter((k) => AUDIT_FIELDS.has(k));
  return [...id, ...main, ...audit];
}

function columnLabel(key: string): string {
  // camelCase / PascalCase → readable
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RecordsTable({ entity, records, loading }: RecordsTableProps) {
  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-sm text-slate-500">No records found</p>
      </div>
    );
  }

  const columns = getColumnKeys(entity, records);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={col}
                className={`px-4 py-3 text-left font-semibold whitespace-nowrap ${
                  AUDIT_FIELDS.has(col) ? 'text-slate-400' : 'text-slate-600'
                }`}
                title={col}
              >
                {columnLabel(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((record, rowIdx) => (
            <tr key={record.Id ?? rowIdx} className="hover:bg-slate-50 transition-colors">
              {columns.map((col) => {
                const raw = (record as Record<string, unknown>)[col];
                const display = formatValue(raw);
                const isAudit = AUDIT_FIELDS.has(col);
                const isId = SYSTEM_FIELDS.has(col);

                return (
                  <td
                    key={col}
                    className={`px-4 py-2.5 max-w-xs ${
                      isId
                        ? 'font-mono text-slate-400 text-[10px]'
                        : isAudit
                        ? 'text-slate-400'
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="truncate" title={display}>
                      {display}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
