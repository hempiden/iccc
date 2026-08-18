import * as XLSX from 'xlsx';
import { VoCRecord, VoCComment, TimelineEvent, ActionOwner } from '../types';

/**
 * Helper to trigger browser download of a generated XLSX blob.
 */
function downloadWorkbook(workbook: XLSX.WorkBook, fileName: string) {
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Filter context metadata for export documentation
 */
export interface ExportFilterContext {
  category?: string;
  status?: string;
  channel?: string;
  dateRange?: string;
  searchQuery?: string;
  weekFilter?: string;
  isPartialSelection?: boolean;
  selectedCount?: number;
  customTitle?: string;
}

/**
 * Formats a record into a clean flat row object for Excel / CSV
 */
function mapRecordToRow(r: VoCRecord) {
  return {
    'Record ID': r.id,
    'Survey ID': r.surveyId || '',
    'AWB Number': r.awbNumber || '',
    'Customer Name': r.customerName || '',
    'Contact Phone': r.contactPhone || '',
    'Contact Email': r.contactEmail || '',
    'Likelihood (NPS)': r.likelihood,
    'NPS Category': r.category,
    'Ease Of Use': r.easeOfUse ?? '',
    'Primary Customer Comment (Combined)': r.comment,
    'Custom Summary': r.customSummary || '',
    'Action Summary': r.actionSummary || '',
    'Follow-up Owner': r.owner,
    'Case Status': r.status,
    'Assigned Facility / Interaction': r.interaction || '',
    'Transaction Name': r.transactionName || '',
    'Journey Name': r.journeyName || '',
    'Moment Of Truth': r.momentOfTruthName || '',
    'Topic / Theme': r.topic || '',
    'Sentiment': r.sentiment || 'NO_OPINION',
    'Response Date': r.responseDate || '',
    'Creation Date': r.creationDate || '',
    'Follow-up Comments Column': r.followUpComments || '',
    'Action Details (Raw Logs)': r.actionDetailsRaw || '',
    'Root Cause Category': r.rootCauseCategory || '',
    'Root Cause': r.rootCause || '',
    'Root Cause Comment': r.rootCauseComment || '',
    'Account Name': r.accountName || '',
    'Industry': r.industry || '',
    'Country': r.countryName || 'Cambodia'
  };
}

/**
 * Exports filtered VoC database records into a structured, multi-sheet Excel file (.xlsx)
 * with dedicated filter metadata sheet.
 */
export function exportFilteredExcelWorkbook(
  records: VoCRecord[], 
  filterContext?: ExportFilterContext,
  currentUser?: ActionOwner | null
): void {
  const workbook = XLSX.utils.book_new();

  // SHEET 1: Filtered Master VoC Records
  const masterDataRows = records.map(mapRecordToRow);
  const masterSheet = XLSX.utils.json_to_sheet(masterDataRows.length > 0 ? masterDataRows : [mapRecordToRow({
    id: 'NO_DATA',
    likelihood: 0,
    category: 'Detractor',
    comment: 'No records matched the selected filter criteria.',
    owner: 'N/A',
    status: 'New'
  } as VoCRecord)]);
  XLSX.utils.book_append_sheet(workbook, masterSheet, 'Filtered VoC Records');

  // SHEET 2: Follow-up Comments Thread (for filtered records)
  const commentRows: any[] = [];
  records.forEach(r => {
    if (r.comments && r.comments.length > 0) {
      r.comments.forEach(c => {
        commentRows.push({
          'Record ID': r.id,
          'Survey ID': r.surveyId || '',
          'AWB Number': r.awbNumber || '',
          'Comment ID': c.id,
          'Timestamp': c.timestamp,
          'Author Name': c.author,
          'Author Role / Facility': c.role,
          'Follow-up Remark Text': c.text
        });
      });
    }
  });

  const commentsSheet = XLSX.utils.json_to_sheet(commentRows.length > 0 ? commentRows : [{
    'Record ID': 'INFO',
    'Survey ID': 'N/A',
    'Comment ID': 'N/A',
    'Timestamp': new Date().toISOString(),
    'Author Name': 'System',
    'Author Role / Facility': 'System',
    'Follow-up Remark Text': 'No follow-up remarks found for the filtered records.'
  }]);
  XLSX.utils.book_append_sheet(workbook, commentsSheet, 'Follow-up Comments');

  // SHEET 3: Action Timeline History (for filtered records)
  const timelineRows: any[] = [];
  records.forEach(r => {
    if (r.timeline && r.timeline.length > 0) {
      r.timeline.forEach((t, idx) => {
        timelineRows.push({
          'Record ID': r.id,
          'Survey ID': r.surveyId || '',
          'Step Index': idx + 1,
          'Timestamp': t.timestamp,
          'Action Executed': t.action,
          'PIC / Owner': t.pic || r.owner,
          'Target Deadline': t.deadline || '',
          'Step Status': t.status || r.status
        });
      });
    }
  });

  const timelineSheet = XLSX.utils.json_to_sheet(timelineRows.length > 0 ? timelineRows : [{
    'Record ID': 'INFO',
    'Survey ID': 'N/A',
    'Step Index': 0,
    'Timestamp': new Date().toISOString(),
    'Action Executed': 'No timeline events found for the filtered records.',
    'PIC / Owner': 'System',
    'Target Deadline': '',
    'Step Status': 'Completed'
  }]);
  XLSX.utils.book_append_sheet(workbook, timelineSheet, 'Timeline History');

  // SHEET 4: Active Filter Parameters & Audit Summary
  const filterAuditData = [{
    'Export Type': filterContext?.isPartialSelection ? 'Selected Records Export' : 'Filtered Query Export',
    'Total Exported Records': records.length,
    'Applied NPS Category Filter': filterContext?.category || 'All',
    'Applied Case Status Filter': filterContext?.status || 'All',
    'Applied Feedback Channel Filter': filterContext?.channel || 'All Channels',
    'Applied Timeline Window': filterContext?.dateRange || 'All Time',
    'Applied Text Search': filterContext?.searchQuery || '(None)',
    'Export Timestamp': new Date().toLocaleString('en-GB', { timeZoneName: 'short' }),
    'Exported By': currentUser?.fullName || 'DHL Colleague',
    'User Role / Facility': `${currentUser?.role || 'Colleague'} (${currentUser?.facility || 'PNHGTW'})`,
    'Data Classification': 'DHL Express Confidential - Internal Workspace Only'
  }];
  const auditSheet = XLSX.utils.json_to_sheet(filterAuditData);
  XLSX.utils.book_append_sheet(workbook, auditSheet, 'Filter Parameters');

  // Determine friendly filename
  const dateSuffix = new Date().toISOString().split('T')[0];
  const catTag = filterContext?.category && filterContext.category !== 'All' ? `_${filterContext.category}` : '';
  const countTag = `_${records.length}Records`;
  const fileName = `DHL_VoC_Filtered${catTag}${countTag}_${dateSuffix}.xlsx`;

  downloadWorkbook(workbook, fileName);
}

/**
 * Exports filtered records as a clean CSV file with UTF-8 BOM.
 */
export function exportFilteredCSV(records: VoCRecord[], filterContext?: ExportFilterContext): void {
  const rows = records.map(mapRecordToRow);
  if (rows.length === 0) {
    alert('No records available to export.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(',')];

  rows.forEach(row => {
    const values = headers.map(header => {
      const val = (row as any)[header] ?? '';
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateSuffix = new Date().toISOString().split('T')[0];
  const catTag = filterContext?.category && filterContext.category !== 'All' ? `_${filterContext.category}` : '';
  const countTag = `_${records.length}Records`;
  a.download = `DHL_VoC_Filtered${catTag}${countTag}_${dateSuffix}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Exports the entire VoC database into a structured, multi-sheet SharePoint-compliant Excel file.
 */
export function exportMasterExcelWorkbook(records: VoCRecord[], currentUser?: ActionOwner | null): void {
  const workbook = XLSX.utils.book_new();

  // SHEET 1: Master VoC Records
  const masterDataRows = records.map(r => ({
    'Record ID': r.id,
    'Survey ID': r.surveyId || '',
    'AWB Number': r.awbNumber || '',
    'Customer Name': r.customerName || '',
    'Contact Phone': r.contactPhone || '',
    'Contact Email': r.contactEmail || '',
    'Likelihood (NPS)': r.likelihood,
    'NPS Category': r.category,
    'Ease Of Use': r.easeOfUse ?? '',
    'Primary Customer Comment (Combined)': r.comment,
    'Custom Summary': r.customSummary || '',
    'Action Summary': r.actionSummary || '',
    'Follow-up Owner': r.owner,
    'Case Status': r.status,
    'Assigned Facility / Interaction': r.interaction || '',
    'Transaction Name': r.transactionName || '',
    'Journey Name': r.journeyName || '',
    'Moment Of Truth': r.momentOfTruthName || '',
    'Topic / Theme': r.topic || '',
    'Sentiment': r.sentiment || 'NO_OPINION',
    'Response Date': r.responseDate || '',
    'Creation Date': r.creationDate || '',
    'Follow-up Comments Column': r.followUpComments || '',
    'Action Details (Raw Logs)': r.actionDetailsRaw || '',
    'Root Cause Category': r.rootCauseCategory || '',
    'Root Cause': r.rootCause || '',
    'Root Cause Comment': r.rootCauseComment || '',
    'Account Name': r.accountName || '',
    'Industry': r.industry || '',
    'Country': r.countryName || 'Cambodia'
  }));

  const masterSheet = XLSX.utils.json_to_sheet(masterDataRows);
  XLSX.utils.book_append_sheet(workbook, masterSheet, 'VoC Master Data');

  // SHEET 2: Follow-up Comments Thread
  const commentRows: any[] = [];
  records.forEach(r => {
    if (r.comments && r.comments.length > 0) {
      r.comments.forEach(c => {
        commentRows.push({
          'Record ID': r.id,
          'Survey ID': r.surveyId || '',
          'AWB Number': r.awbNumber || '',
          'Comment ID': c.id,
          'Timestamp': c.timestamp,
          'Author Name': c.author,
          'Author Role / Facility': c.role,
          'Follow-up Remark Text': c.text
        });
      });
    }
  });

  if (commentRows.length > 0) {
    const commentsSheet = XLSX.utils.json_to_sheet(commentRows);
    XLSX.utils.book_append_sheet(workbook, commentsSheet, 'Follow-up Comments');
  } else {
    const emptyCommentsSheet = XLSX.utils.json_to_sheet([{
      'Record ID': 'INFO',
      'Survey ID': 'N/A',
      'Comment ID': 'N/A',
      'Timestamp': new Date().toISOString(),
      'Author Name': 'System',
      'Author Role / Facility': 'System',
      'Follow-up Remark Text': 'No follow-up conversation remarks logged yet.'
    }]);
    XLSX.utils.book_append_sheet(workbook, emptyCommentsSheet, 'Follow-up Comments');
  }

  // SHEET 3: Action Timeline History
  const timelineRows: any[] = [];
  records.forEach(r => {
    if (r.timeline && r.timeline.length > 0) {
      r.timeline.forEach((t, idx) => {
        timelineRows.push({
          'Record ID': r.id,
          'Survey ID': r.surveyId || '',
          'Step Index': idx + 1,
          'Timestamp': t.timestamp,
          'Action Executed': t.action,
          'PIC / Owner': t.pic || r.owner,
          'Target Deadline': t.deadline || '',
          'Step Status': t.status || r.status
        });
      });
    }
  });

  if (timelineRows.length > 0) {
    const timelineSheet = XLSX.utils.json_to_sheet(timelineRows);
    XLSX.utils.book_append_sheet(workbook, timelineSheet, 'Timeline History');
  } else {
    const emptyTimelineSheet = XLSX.utils.json_to_sheet([{
      'Record ID': 'INFO',
      'Survey ID': 'N/A',
      'Step Index': 0,
      'Timestamp': new Date().toISOString(),
      'Action Executed': 'No timeline events recorded.',
      'PIC / Owner': 'System',
      'Target Deadline': '',
      'Step Status': 'Completed'
    }]);
    XLSX.utils.book_append_sheet(workbook, emptyTimelineSheet, 'Timeline History');
  }

  // SHEET 4: Storage Metadata & Audit Trail
  const auditSheet = XLSX.utils.json_to_sheet([{
    'Export Timestamp': new Date().toLocaleString('en-GB', { timeZoneName: 'short' }),
    'Exported By': currentUser?.fullName || 'DHL Colleague',
    'User Facility': currentUser?.facility || 'PNHGTW',
    'Total VoC Records': records.length,
    'Storage Type': 'SharePoint Enterprise Excel Workbook (.xlsx)',
    'Data Classification': 'DHL Express Confidential - Internal Workspace Only'
  }]);
  XLSX.utils.book_append_sheet(workbook, auditSheet, 'SharePoint Metadata');

  // Trigger Download
  const dateSuffix = new Date().toISOString().split('T')[0];
  downloadWorkbook(workbook, `DHL_Voice_Of_Customer_Master_${dateSuffix}.xlsx`);
}
