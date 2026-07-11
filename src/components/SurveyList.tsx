import React, { useState, useMemo } from 'react';
import { Search, Filter, ShieldAlert, Award, Sparkles, ArrowRight, UserCheck, CheckCircle, Clock } from 'lucide-react';
import { VoCRecord, DashboardFilters } from '../types';
import { getSurveyUrl } from '../utils/parser';

interface SurveyListProps {
  records: VoCRecord[];
  onSelectRecord: (record: VoCRecord) => void;
  selectedRecordId?: string;
}

export default function SurveyList({ records, onSelectRecord, selectedRecordId }: SurveyListProps) {
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Promoter' | 'Passive' | 'Detractor'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'New' | 'In Progress' | 'Closed' | 'Pending'>('All');
  const [sortBy, setSortBy] = useState<'id' | 'likelihood'>('likelihood');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter records based on state
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Search matching Survey ID, Customer Comment, Follow-up Owner, Customer Name, Topic, or Transaction
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = query === '' ||
        record.id.toLowerCase().includes(query) ||
        record.comment.toLowerCase().includes(query) ||
        record.owner.toLowerCase().includes(query) ||
        (record.customerName && record.customerName.toLowerCase().includes(query)) ||
        (record.topic && record.topic.toLowerCase().includes(query)) ||
        (record.transactionName && record.transactionName.toLowerCase().includes(query));

      const matchesCategory = categoryFilter === 'All' || record.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || record.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [records, searchQuery, categoryFilter, statusFilter]);

  // Sort filtered records
  const sortedRecords = useMemo(() => {
    const sorted = [...filteredRecords];
    sorted.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        // numbers
        return sortOrder === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      }
    });
    return sorted;
  }, [filteredRecords, sortBy, sortOrder]);

  const toggleSort = (field: 'id' | 'likelihood') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // Default to descending
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Promoter':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Award className="w-3 h-3" />
            Promoter
          </span>
        );
      case 'Passive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Sparkles className="w-3 h-3" />
            Passive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3 h-3" />
            Detractor
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Closed':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100">Closed</span>;
      case 'In Progress':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-800 border border-blue-100">In Progress</span>;
      case 'Pending':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-800 border border-amber-100">Pending</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-50 text-slate-800 border border-slate-100">New</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'bg-emerald-600 text-white';
    if (score >= 7) return 'bg-amber-500 text-white';
    return 'bg-rose-500 text-white';
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" id="voc-survey-compact-list">
      {/* Search & Filters Toolbar */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Survey ID, owner, or comment keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Quick Categories filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {(['All', 'Promoter', 'Passive', 'Detractor'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filters & Counts bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-t border-gray-100/60 pt-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-400">Case Status:</span>
            <div className="flex items-center gap-1">
              {(['All', 'New', 'In Progress', 'Pending', 'Closed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-700 border-slate-700 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="text-gray-400 font-medium">
            Showing <span className="font-bold text-slate-800">{sortedRecords.length}</span> of{' '}
            <span className="font-bold text-slate-800">{records.length}</span> records
          </div>
        </div>
      </div>

      {/* Surveys Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100">
            <tr>
              <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-gray-100/70" onClick={() => toggleSort('id')}>
                Survey ID {sortBy === 'id' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-gray-100/70" onClick={() => toggleSort('likelihood')}>
                Score (NPS) {sortBy === 'likelihood' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th scope="col" className="px-6 py-4">NPS Category</th>
              <th scope="col" className="px-6 py-4">Transaction & Theme</th>
              <th scope="col" className="px-6 py-4">Primary Customer Comment Preview</th>
              <th scope="col" className="px-6 py-4">Case Owner</th>
              <th scope="col" className="px-6 py-4">Status</th>
              <th scope="col" className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-100">
            {sortedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-base font-semibold">No records found</span>
                    <span className="text-xs">Try adjusting your search keywords or filter queries.</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedRecords.map((record) => {
                const isSelected = selectedRecordId === record.id;
                
                return (
                  <tr 
                    key={record.id} 
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    {/* Survey ID */}
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                      <a
                        href={getSurveyUrl(record.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {record.id}
                      </a>
                    </td>

                    {/* Score */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm ${getScoreColor(record.likelihood)}`}>
                          {record.likelihood}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      {getCategoryBadge(record.category)}
                    </td>

                    {/* Transaction & Theme */}
                    <td className="px-6 py-4 max-w-[180px]">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50 w-fit truncate max-w-full" title={record.transactionName}>
                          {record.transactionName || 'Delivery'}
                        </span>
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100/40 w-fit truncate max-w-full">
                          Theme: {record.topic || 'Brand'}
                        </span>
                      </div>
                    </td>

                    {/* Primary Comment Preview */}
                    <td className="px-6 py-4 max-w-sm">
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {record.comment}
                      </p>
                    </td>

                    {/* Case Owner */}
                    <td className="px-6 py-4 text-xs font-semibold text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                        {record.owner}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {getStatusBadge(record.status)}
                    </td>

                    {/* Details Button */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onSelectRecord(record)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-white border border-gray-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        View Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
