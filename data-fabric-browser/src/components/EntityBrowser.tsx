import { useMemo, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Entities } from '@uipath/uipath-typescript/entities';
import type { EntityGetResponse, EntityRecord } from '@uipath/uipath-typescript/entities';
import RecordsTable from './RecordsTable';

const PAGE_SIZE = 25;

export default function EntityBrowser() {
  const { sdk } = useAuth();
  const entities = useMemo(() => new Entities(sdk), [sdk]);

  const [entityList, setEntityList] = useState<EntityGetResponse[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [entitiesError, setEntitiesError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [selectedEntity, setSelectedEntity] = useState<EntityGetResponse | null>(null);
  const [records, setRecords] = useState<EntityRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingEntities(true);
      setEntitiesError(null);
      try {
        const result = await entities.getAll();
        setEntityList(result);
      } catch (err) {
        setEntitiesError(err instanceof Error ? err.message : 'Failed to load entities');
      } finally {
        setLoadingEntities(false);
      }
    };
    load();
  }, [entities]);

  const loadRecords = useCallback(async (entity: EntityGetResponse, page: number) => {
    setLoadingRecords(true);
    setRecordsError(null);
    try {
      const result = await entities.getAllRecords(entity.id, {
        pageSize: PAGE_SIZE,
        jumpToPage: page,
      });
      setRecords(result.items);
      setTotalCount(result.totalCount ?? null);
    } catch (err) {
      setRecordsError(err instanceof Error ? err.message : 'Failed to load records');
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, [entities]);

  const handleSelectEntity = (entity: EntityGetResponse) => {
    setSelectedEntity(entity);
    setCurrentPage(1);
    setRecords([]);
    setTotalCount(null);
    setRecordsError(null);
    loadRecords(entity, 1);
  };

  const handlePageChange = (page: number) => {
    if (!selectedEntity) return;
    setCurrentPage(page);
    loadRecords(selectedEntity, page);
  };

  const filtered = entityList.filter((e) =>
    (e.displayName || e.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = totalCount != null ? Math.ceil(totalCount / PAGE_SIZE) : null;
  const startRow = (currentPage - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(currentPage * PAGE_SIZE, totalCount ?? currentPage * PAGE_SIZE);

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar — entity list */}
      <aside className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Entities</h2>
            {!loadingEntities && (
              <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                {filtered.length}
              </span>
            )}
          </div>

          <div className="px-3 py-2 border-b border-slate-100">
            <div className="relative">
              <svg className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Filter entities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-220px)]">
            {loadingEntities ? (
              <div className="flex flex-col gap-2 p-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : entitiesError ? (
              <div className="p-4 text-xs text-red-600 bg-red-50 m-3 rounded-lg">{entitiesError}</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-xs text-slate-400 text-center">No entities found</div>
            ) : (
              <ul className="p-2">
                {filtered.map((entity) => (
                  <li key={entity.id}>
                    <button
                      onClick={() => handleSelectEntity(entity)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all ${
                        selectedEntity?.id === entity.id
                          ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          selectedEntity?.id === entity.id ? 'bg-blue-500' : 'bg-slate-300'
                        }`} />
                        <span className="truncate" title={entity.displayName || entity.name}>
                          {entity.displayName || entity.name}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>

      {/* Main content — records */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        {!selectedEntity ? (
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center py-24">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M10 4v16M14 4v16M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Select an entity</p>
            <p className="text-xs text-slate-400">Choose an entity from the sidebar to browse its records</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            {/* Records header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-800 truncate">
                  {selectedEntity.displayName || selectedEntity.name}
                </h2>
                {totalCount != null && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {totalCount.toLocaleString()} record{totalCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              {loadingRecords && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {recordsError ? (
                <div className="p-6 text-sm text-red-600 bg-red-50 m-4 rounded-lg">{recordsError}</div>
              ) : (
                <RecordsTable
                  entity={selectedEntity}
                  records={records}
                  loading={loadingRecords}
                />
              )}
            </div>

            {/* Pagination */}
            {!loadingRecords && records.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Showing {startRow.toLocaleString()}–{endRow.toLocaleString()}
                  {totalCount != null && ` of ${totalCount.toLocaleString()}`}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  <PageNumbers
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onChange={handlePageChange}
                  />
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={totalPages != null && currentPage >= totalPages}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PageNumbers({ currentPage, totalPages, onChange }: {
  currentPage: number;
  totalPages: number | null;
  onChange: (page: number) => void;
}) {
  if (!totalPages || totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <>
      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="text-xs text-slate-400 px-1">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-7 h-7 text-xs rounded-lg transition-colors ${
              p === currentPage
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {p}
          </button>
        )
      )}
    </>
  );
}
