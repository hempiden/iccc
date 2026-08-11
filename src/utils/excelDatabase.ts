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
