import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, HelpCircle, Download, Database, MessageSquare } from 'lucide-react';
import { VoCRecord, ActionOwner, VoCComment, TimelineEvent } from '../types';
import { parseActionDetails, inferStatus, getNPSCategory, classifyTopic, analyzeSentiment } from '../utils/parser';
import { exportMasterExcelWorkbook } from '../utils/excelDatabase';

interface ExcelUploaderProps {
  onRecordsLoaded: (records: VoCRecord[]) => Promise<void>;
  onAppendRecords: (records: VoCRecord[]) => Promise<void>;
  currentCount: number;
  allRecords?: VoCRecord[];
  currentUser?: ActionOwner | null;
}

export default function ExcelUploader({ onRecordsLoaded, onAppendRecords, currentCount, allRecords = [], currentUser }: ExcelUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [uploadMode, setUploadMode] = useState<'replace' | 'append'>('replace');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Helper to find a cell value regardless of header variations
  const findValueByHeader = (row: any, keysToSearch: string[]): any => {
    const rowKeys = Object.keys(row);
    for (const keyToSearch of keysToSearch) {
      const foundKey = rowKeys.find(
        k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === keyToSearch.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (foundKey) {
        return row[foundKey];
      }
    }
    return undefined;
  };

  const parseExcelDate = (val: any): string | undefined => {
    if (val === undefined || val === null || val === '') return undefined;

    // 1. If it's a JS Date object
    if (val instanceof Date) {
      if (!isNaN(val.getTime())) {
        const yyyy = val.getFullYear();
        const mm = String(val.getMonth() + 1).padStart(2, '0');
        const dd = String(val.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      return undefined;
    }

    // 2. If it's a number (Excel serial date)
    const num = Number(val);
    if (!isNaN(num) && typeof val !== 'string' && num > 0) {
      if (num > 1 && num < 100000) {
        const ms = (num - 25569) * 86400 * 1000;
        const date = new Date(ms);
        if (!isNaN(date.getTime())) {
          const yyyy = date.getFullYear();
          if (yyyy >= 1970 && yyyy <= 2100) {
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
          }
        }
      }
    }

    // 3. If it's a string
    const str = String(val).trim();
    if (!str) return undefined;

    // Check if string is a numeric Excel serial date
    if (/^\d+(\.\d+)?$/.test(str)) {
      const numStr = Number(str);
      if (!isNaN(numStr) && numStr > 1000 && numStr < 100000) {
        const ms = (numStr - 25569) * 86400 * 1000;
        const date = new Date(ms);
        if (!isNaN(date.getTime())) {
          const yyyy = date.getFullYear();
          if (yyyy >= 1970 && yyyy <= 2100) {
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
          }
        }
      }
    }

    // Check YYYY-MM-DD or DD/MM/YYYY
    const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (ymd) {
      return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
    }

    const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
    if (dmy) {
      let yr = dmy[3];
      if (yr.length === 2) yr = '20' + yr;
      return `${yr}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }

    return str;
  };

  const processFile = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls' && fileExtension !== 'csv') {
      setStatus({
        type: 'error',
        message: 'Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV file.'
      });
      return;
    }

    setStatus({ type: 'idle', message: '' });
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;

        if (fileExtension === 'csv') {
          const text = new TextDecoder().decode(data as ArrayBuffer);
          workbook = XLSX.read(text, { type: 'string' });
        } else {
          const bytes = new Uint8Array(data as ArrayBuffer);
          workbook = XLSX.read(bytes, { type: 'array' });
        }

        const sheetNames = workbook.SheetNames;

        // 1. Check for Secondary Sheets (Follow-up Comments & Timeline History)
        const commentsSheetName = sheetNames.find(s => 
          s.toLowerCase().includes('comment') || s.toLowerCase().includes('follow-up')
        );
        const commentsByRecordId = new Map<string, VoCComment[]>();
        const commentsBySurveyId = new Map<string, VoCComment[]>();

        if (commentsSheetName && workbook.Sheets[commentsSheetName]) {
          const commentsJson = XLSX.utils.sheet_to_json(workbook.Sheets[commentsSheetName]);
          commentsJson.forEach((cRow: any) => {
            const recId = findValueByHeader(cRow, ['Record ID', 'RecordID', 'ID']);
            const surId = findValueByHeader(cRow, ['Survey ID', 'SurveyID']);
            const text = findValueByHeader(cRow, ['Follow-up Remark Text', 'Comment', 'Text', 'Remark', 'Message']);
            if (!text || String(text).trim() === '' || String(text).includes('No follow-up remarks')) return;

            const commentObj: VoCComment = {
              id: String(findValueByHeader(cRow, ['Comment ID', 'CommentID', 'ID']) || `c-${Date.now()}-${Math.random()}`),
              timestamp: String(findValueByHeader(cRow, ['Timestamp', 'Date', 'Time']) || new Date().toISOString()),
              author: String(findValueByHeader(cRow, ['Author Name', 'Author', 'User']) || 'DHL Colleague'),
              role: String(findValueByHeader(cRow, ['Author Role / Facility', 'Role', 'Facility']) || 'Colleague'),
              text: String(text).trim()
            };

            if (recId) {
              const rKey = String(recId).trim();
              if (!commentsByRecordId.has(rKey)) commentsByRecordId.set(rKey, []);
              commentsByRecordId.get(rKey)!.push(commentObj);
            }
            if (surId) {
              const sKey = String(surId).trim();
              if (!commentsBySurveyId.has(sKey)) commentsBySurveyId.set(sKey, []);
              commentsBySurveyId.get(sKey)!.push(commentObj);
            }
          });
        }

        const timelineSheetName = sheetNames.find(s => 
          s.toLowerCase().includes('timeline') || s.toLowerCase().includes('history')
        );
        const timelineByRecordId = new Map<string, TimelineEvent[]>();
        const timelineBySurveyId = new Map<string, TimelineEvent[]>();

        if (timelineSheetName && workbook.Sheets[timelineSheetName]) {
          const timelineJson = XLSX.utils.sheet_to_json(workbook.Sheets[timelineSheetName]);
          timelineJson.forEach((tRow: any) => {
            const recId = findValueByHeader(tRow, ['Record ID', 'RecordID', 'ID']);
            const surId = findValueByHeader(tRow, ['Survey ID', 'SurveyID']);
            const action = findValueByHeader(tRow, ['Action Executed', 'Action', 'Event', 'Description']);
            if (!action || String(action).trim() === '' || String(action).includes('No timeline events')) return;

            const timelineObj: TimelineEvent = {
              timestamp: String(findValueByHeader(tRow, ['Timestamp', 'Date']) || 'Recent'),
              action: String(action).trim(),
              pic: String(findValueByHeader(tRow, ['PIC / Owner', 'PIC', 'Owner']) || 'DHL Team'),
              deadline: findValueByHeader(tRow, ['Target Deadline', 'Deadline']) ? String(findValueByHeader(tRow, ['Target Deadline', 'Deadline'])).trim() : undefined,
              status: (findValueByHeader(tRow, ['Step Status', 'Status']) || 'Completed') as any
            };

            if (recId) {
              const rKey = String(recId).trim();
              if (!timelineByRecordId.has(rKey)) timelineByRecordId.set(rKey, []);
              timelineByRecordId.get(rKey)!.push(timelineObj);
            }
            if (surId) {
              const sKey = String(surId).trim();
              if (!timelineBySurveyId.has(sKey)) timelineBySurveyId.set(sKey, []);
              timelineBySurveyId.get(sKey)!.push(timelineObj);
            }
          });
        }

        // 2. Locate Master Sheet
        const masterSheetName = sheetNames.find(s => 
          s.toLowerCase().includes('master') || 
          s.toLowerCase().includes('voc') || 
          s.toLowerCase().includes('record') ||
          s.toLowerCase().includes('filtered') ||
          s.toLowerCase().includes('survey')
        ) || sheetNames[0];

        const worksheet = workbook.Sheets[masterSheetName];

        // Find the actual header row dynamically to avoid issues with blank rows on top
        const sheetRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        let headerRowIdx = 0;
        const targetKeywords = [
          'survey id', 'id', 'surveyid', 'likelihood', 'nps', 'score', 'rating',
          'comment', 'feedback', 'action details', 'actiondetails', 'owner', 'custom summary'
        ];

        if (sheetRows && sheetRows.length > 0) {
          for (let i = 0; i < Math.min(sheetRows.length, 25); i++) {
            const row = sheetRows[i];
            if (!row || !Array.isArray(row)) continue;

            const hasKeyword = row.some(cell => {
              if (cell === undefined || cell === null) return false;
              const str = String(cell).toLowerCase().replace(/[^a-z0-9]/g, '');
              return targetKeywords.some(kw => str.includes(kw));
            });

            if (hasKeyword) {
              headerRowIdx = i;
              break;
            }
          }
        }

        // Parse starting from the detected header row index
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIdx });

        if (rawJson.length === 0) {
          setStatus({ type: 'error', message: 'The uploaded file appears to be empty or has no recognizable header row.' });
          return;
        }

        // Map raw JSON to VoCRecord
        const parsedRecords: VoCRecord[] = [];
        let skippedRows = 0;

        rawJson.forEach((row: any, idx) => {
          // Identify columns with smart matching
          const recordIdVal = findValueByHeader(row, ['Record ID', 'RecordID', 'Database ID']);
          const surveyIdVal = findValueByHeader(row, ['Survey ID', 'id', 'SurveyID', 'Survey_ID', 'Interaction', 'Interaction ID']);
          const likelihoodVal = findValueByHeader(row, ['Likelihood (NPS)', 'Likelihood', 'likelihood', 'NPS', 'Score', 'rating', 'NPS Score', 'Likelihood to Recommend']);
          const commentVal = findValueByHeader(row, ['Primary Customer Comment (Combined)', 'Primary Customer Comment', 'comment', 'feedback', 'Primary Comment', 'Comments', 'Primary Customer Comment (Translated)']);
          
          // Skip completely empty or unmapped rows to prevent phantom empty cards
          const hasSurveyId = surveyIdVal !== undefined && String(surveyIdVal).trim() !== '';
          const hasLikelihood = likelihoodVal !== undefined && String(likelihoodVal).trim() !== '';
          const hasComment = commentVal !== undefined && String(commentVal).trim() !== '';

          if (!hasSurveyId && !hasLikelihood && !hasComment) {
            skippedRows++;
            return; // Skip empty row
          }

          // User Edits & Custom Summaries Preservation
          const customSummaryVal = findValueByHeader(row, ['Custom Summary', 'Summary', 'Customer Summary', 'Comment Summary', 'Short Summary']);
          const actionSummaryVal = findValueByHeader(row, ['Action Summary', 'Resolution Summary', 'Actions Summary', 'Resolution Note']);
          const caseStatusVal = findValueByHeader(row, ['Case Status', 'status', 'Alert Status', 'Status', 'CaseStatus']);
          const deadlineVal = findValueByHeader(row, ['Target Deadline', 'Deadline', 'TargetDeadline']);
          const commentsJsonVal = findValueByHeader(row, ['In-System Comments JSON', 'Comments JSON', 'Comments Array', 'comments']);
          const timelineJsonVal = findValueByHeader(row, ['Timeline Events JSON', 'Timeline JSON', 'Timeline Array']);

          const actionDetailsVal = findValueByHeader(row, ['Action Details (Raw Logs)', 'Action Details', 'Logs', 'ActionDetails', 'Action description', 'All log notes combined (if any)', 'timeline']);
          const ownerVal = findValueByHeader(row, ['Follow-up Owner', 'Follow up Owner', 'Current Follow-up Owner', 'owner', 'staff', 'Current Alert Owner', 'PIC']);
          const interactionVal = findValueByHeader(row, ['Assigned Facility / Interaction', 'Interaction', 'Interaction ID', 'InteractionID', 'Code', 'Facility']);
          const followUpCommentsVal = findValueByHeader(row, ['Follow-up Comments Column', 'Follow-up: Customer Comments', 'Followup Comments', 'Customer Comments']);

          // Management & BA Fields Smart Extraction
          const journeyNameVal = findValueByHeader(row, ['Journey Name', 'Journey']);
          const momentOfTruthNameVal = findValueByHeader(row, ['Moment Of Truth', 'Moment Of Truth Name', 'MomentOfTruth']);
          const transactionNameVal = findValueByHeader(row, ['Transaction Name', 'Transaction', 'MOT Transaction Type']);
          const easeOfUseVal = findValueByHeader(row, ['Ease Of Use', 'EaseOfUse', 'Ease']);
          const responseDateVal = findValueByHeader(row, ['Response Date', 'Responsedate', 'Date', 'Local Response Date']);
          const creationDateVal = findValueByHeader(row, ['Creation Date', 'Creationdate', 'Local Creation Date']);
          const customerNameVal = findValueByHeader(row, ['Customer Name', 'CustomerName', 'First Call - Updated Customer Name', 'Follow-up Updated Customer Name']);
          const contactPhoneVal = findValueByHeader(row, ['Contact Phone', 'Phone', 'Contact Phone Number', 'First Call - Updated Phone Number', 'Follow-up Updated Phone Number']);
          const contactEmailVal = findValueByHeader(row, ['Contact Email', 'Email', 'Contact Email Address', 'First Call - Updated Email Address', 'Follow-up Updated Email']);
          const countryNameVal = findValueByHeader(row, ['Country', 'Country name', 'Country Code']);
          const regionVal = findValueByHeader(row, ['Region']);
          const industryVal = findValueByHeader(row, ['Industry']);
          const accountNameVal = findValueByHeader(row, ['Account Name', 'AccountName']);
          const awbNumberVal = findValueByHeader(row, ['AWB Number', 'Combined AWB', 'AWB', 'Waybill Number', 'Waybill']);
          const rootCauseCategoryVal = findValueByHeader(row, ['Root Cause Category', 'RootCauseCategory']);
          const rootCauseVal = findValueByHeader(row, ['Root Cause', 'RootCause']);
          const rootCauseCommentVal = findValueByHeader(row, ['Root Cause Comment', 'RootCauseComment']);
          const topicVal = findValueByHeader(row, ['Topic / Theme', 'Topic/Theme', 'Topic', 'Theme']);
          const sentimentVal = findValueByHeader(row, ['Sentiment', 'Primary Sentiment']);
          const responseFeedbackChannelVal = findValueByHeader(row, ['Feedback Channel', 'Response Feedback Channel', 'ResponseFeedbackChannel', 'Channel', 'Response Feedback']);

          // Treat missing survey ID as a skip, or generate one
          const rawSurveyId = surveyIdVal ? String(surveyIdVal).trim() : `UPLOAD-${idx + 1}`;
          
          // Separate clean Survey ID from any concatenated suffix (e.g. 290628401_Pickup -> 290628401 and Pickup)
          let cleanSurveyId = rawSurveyId;
          let extractedSuffix = '';
          if (rawSurveyId.includes('_')) {
            const parts = rawSurveyId.split('_');
            cleanSurveyId = parts[0];
            extractedSuffix = parts.slice(1).join('_');
          }

          // Parse Likelihood NPS score (default to 5 if empty or invalid)
          let likelihood = 5;
          if (likelihoodVal !== undefined) {
            const parsedScore = parseInt(String(likelihoodVal).trim(), 10);
            if (!isNaN(parsedScore)) {
              likelihood = Math.max(0, Math.min(10, parsedScore));
            }
          }

          const comment = commentVal ? String(commentVal).trim() : 'No comment provided.';
          const actionDetailsRaw = actionDetailsVal ? String(actionDetailsVal).trim() : '';
          const owner = ownerVal ? String(ownerVal).trim() : 'Rothana Art';
          const interaction = interactionVal ? String(interactionVal).trim() : undefined;
          const followUpComments = followUpCommentsVal ? String(followUpCommentsVal).trim() : undefined;

          // Process Ease Of Use score
          let easeOfUse: number | undefined = undefined;
          if (easeOfUseVal !== undefined) {
            const parsedEase = parseInt(String(easeOfUseVal).trim(), 10);
            if (!isNaN(parsedEase)) {
              easeOfUse = Math.max(0, Math.min(10, parsedEase));
            }
          }

          // BA Categorization fallbacks
          const transactionName = transactionNameVal ? String(transactionNameVal).trim() : 'Delivery by Courier';
          const topic = topicVal ? String(topicVal).trim() : (extractedSuffix || classifyTopic(comment, transactionName));
          
          // Determine ID
          const cleanTopic = topic ? topic.replace(/[^a-zA-Z0-9]/g, '_') : 'General';
          const id = recordIdVal ? String(recordIdVal).trim() : `${cleanSurveyId}_${cleanTopic}`;

          // Reconstruct timeline events (Sheet 3 > JSON Column > Raw Action Details Parsing)
          let timeline: TimelineEvent[] = [];
          if (timelineByRecordId.has(id) && timelineByRecordId.get(id)!.length > 0) {
            timeline = timelineByRecordId.get(id)!;
          } else if (timelineBySurveyId.has(cleanSurveyId) && timelineBySurveyId.get(cleanSurveyId)!.length > 0) {
            timeline = timelineBySurveyId.get(cleanSurveyId)!;
          } else if (timelineJsonVal && typeof timelineJsonVal === 'string' && timelineJsonVal.startsWith('[')) {
            try {
              timeline = JSON.parse(timelineJsonVal);
            } catch {
              timeline = parseActionDetails(actionDetailsRaw);
            }
          } else {
            timeline = parseActionDetails(actionDetailsRaw);
          }

          // Reconstruct in-system conversation comments (Sheet 2 > JSON Column)
          let comments: VoCComment[] = [];
          if (commentsByRecordId.has(id) && commentsByRecordId.get(id)!.length > 0) {
            comments = commentsByRecordId.get(id)!;
          } else if (commentsBySurveyId.has(cleanSurveyId) && commentsBySurveyId.get(cleanSurveyId)!.length > 0) {
            comments = commentsBySurveyId.get(cleanSurveyId)!;
          } else if (commentsJsonVal && typeof commentsJsonVal === 'string' && commentsJsonVal.startsWith('[')) {
            try {
              comments = JSON.parse(commentsJsonVal);
            } catch {
              comments = [];
            }
          }

          // Status normalization
          let statusVal: 'New' | 'In Progress' | 'Completed' = 'New';
          if (caseStatusVal) {
            const s = String(caseStatusVal).trim();
            if (s === 'Completed' || s === 'Closed') statusVal = 'Completed';
            else if (s === 'In Progress' || s === 'Pending') statusVal = 'In Progress';
            else if (s === 'New') statusVal = 'New';
            else statusVal = inferStatus(timeline, actionDetailsRaw);
          } else {
            statusVal = inferStatus(timeline, actionDetailsRaw);
          }
          
          let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'NO_OPINION' = 'NO_OPINION';
          if (sentimentVal) {
            const sText = String(sentimentVal).toUpperCase().trim();
            if (sText.includes('POS')) sentiment = 'POSITIVE';
            else if (sText.includes('NEG')) sentiment = 'NEGATIVE';
            else if (sText.includes('NEU')) sentiment = 'NEUTRAL';
          } else {
            sentiment = analyzeSentiment(comment, likelihood);
          }

          parsedRecords.push({
            id,
            surveyId: cleanSurveyId,
            likelihood,
            category: getNPSCategory(likelihood),
            comment,
            customSummary: customSummaryVal ? String(customSummaryVal).trim() : undefined,
            actionSummary: actionSummaryVal ? String(actionSummaryVal).trim() : undefined,
            actionDetailsRaw,
            timeline,
            comments,
            owner,
            status: statusVal,
            interaction,
            followUpComments,
            deadline: deadlineVal ? String(deadlineVal).trim() : undefined,
            // Extended Mapped columns:
            journeyName: journeyNameVal ? String(journeyNameVal).trim() : undefined,
            momentOfTruthName: momentOfTruthNameVal ? String(momentOfTruthNameVal).trim() : undefined,
            transactionName,
            easeOfUse,
            responseDate: parseExcelDate(responseDateVal),
            creationDate: parseExcelDate(creationDateVal),
            customerName: customerNameVal ? String(customerNameVal).trim() : undefined,
            contactPhone: contactPhoneVal ? String(contactPhoneVal).trim() : undefined,
            contactEmail: contactEmailVal ? String(contactEmailVal).trim() : undefined,
            countryName: countryNameVal ? String(countryNameVal).trim() : undefined,
            region: regionVal ? String(regionVal).trim() : undefined,
            industry: industryVal ? String(industryVal).trim() : undefined,
            accountName: accountNameVal ? String(accountNameVal).trim() : undefined,
            awbNumber: awbNumberVal ? String(awbNumberVal).trim() : undefined,
            rootCauseCategory: rootCauseCategoryVal ? String(rootCauseCategoryVal).trim() : undefined,
            rootCause: rootCauseVal ? String(rootCauseVal).trim() : undefined,
            rootCauseComment: rootCauseCommentVal ? String(rootCauseCommentVal).trim() : undefined,
            topic,
            sentiment,
            responseFeedbackChannel: responseFeedbackChannelVal ? String(responseFeedbackChannelVal).trim() : undefined
          });
        });

        if (parsedRecords.length === 0) {
          setStatus({ type: 'error', message: 'Could not parse any valid survey rows from the file.' });
          return;
        }

        const totalRestoredComments = parsedRecords.reduce((acc, r) => acc + (r.comments?.length || 0), 0);
        const totalSummaries = parsedRecords.filter(r => !!r.customSummary || !!r.actionSummary).length;

        if (uploadMode === 'append') {
          setStatus({
            type: 'idle',
            message: `Appending ${parsedRecords.length} records to local workspace...`
          });
          await onAppendRecords(parsedRecords);
          setStatus({
            type: 'success',
            message: `Successfully appended ${parsedRecords.length} customer records (Restored ${totalSummaries} custom summaries & ${totalRestoredComments} conversation comments)!`
          });
        } else {
          setStatus({
            type: 'idle',
            message: `Replacing database with ${parsedRecords.length} records...`
          });
          await onRecordsLoaded(parsedRecords);
          setStatus({
            type: 'success',
            message: `Successfully restored ${parsedRecords.length} customer records with full fidelity (${totalSummaries} custom summaries, ${totalRestoredComments} follow-up comments)!`
          });
        }

      } catch (err: any) {
        console.error(err);
        setStatus({
          type: 'error',
          message: `Error parsing spreadsheet: ${err.message || 'Unknown error'}`
        });
      }
    };

    reader.onerror = () => {
      setStatus({ type: 'error', message: 'Failed to read the file.' });
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* 1. Quick Master Export Card (Allows offline export & resume) */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-5 border border-emerald-800/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
              Portable Backup & Resume
            </span>
            <span className="text-xs text-slate-300 font-medium">
              {allRecords.length} total active records
            </span>
          </div>
          <h3 className="text-base font-black tracking-tight text-white">
            Export Master VoC Excel (.xlsx)
          </h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Download your entire workspace into a multi-sheet Excel file. All updated case statuses, follow-up owners, AI summaries, action plans, timelines, and conversation comments are preserved so you can upload it later to resume anytime.
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportMasterExcelWorkbook(allRecords.length > 0 ? allRecords : [], currentUser)}
          disabled={allRecords.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
        >
          <Download className="w-4 h-4 text-slate-950" />
          <span>Export Master Backup</span>
        </button>
      </div>

      {/* 2. Ingestion Dropzone Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Upload VoC Survey Records
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Upload previously exported DHL VoC Master Workbooks or raw survey logs.
            </p>
          </div>
          
          {currentCount > 0 && (
            <div className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg self-start md:self-auto">
              Currently loaded: <span className="text-emerald-700 font-bold">{currentCount}</span> records
            </div>
          )}
        </div>

        {/* Upload Mode Selector */}
        <div className="mb-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide block">Upload Mode</span>
            <span className="text-[11px] text-slate-500 block">Choose how to handle the uploaded dataset.</span>
          </div>
          <div className="flex bg-slate-200/60 p-1 rounded-lg border border-slate-200 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setUploadMode('replace')}
              className={`px-3 py-1.5 text-xs font-black rounded-md transition-all cursor-pointer ${
                uploadMode === 'replace' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Replace Entire DB (Resume)
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('append')}
              className={`px-3 py-1.5 text-xs font-black rounded-md transition-all cursor-pointer ${
                uploadMode === 'append' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Append Records
            </button>
          </div>
        </div>

        <div
          id="file-dropzone"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`relative group cursor-pointer transition-all duration-250 border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center ${
            dragActive
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
          />
          
          <div className={`p-4 rounded-full mb-3 transition-colors duration-250 ${
            dragActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'
          }`}>
            <Upload className="w-8 h-8" />
          </div>

          <p className="text-sm font-medium text-gray-700">
            {dragActive ? 'Drop your file here' : 'Drag and drop your spreadsheet here'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            or click to browse local files (.xlsx, .xls, .csv)
          </p>
        </div>

        {status.type !== 'idle' && (
          <div className={`mt-4 flex items-start gap-3 p-3.5 rounded-xl text-sm border ${
            status.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}>
            {status.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="font-medium">{status.message}</span>
          </div>
        )}

        {/* Quick Help Collapsible Panel */}
        <div className="mt-4 bg-slate-50 border border-slate-100/80 rounded-xl p-3.5 text-xs text-slate-600">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            What is preserved when resuming with an exported Excel workbook?
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-500 pl-1 text-[11px]">
            <div>• <strong className="text-slate-700">Custom Summaries & Action Notes:</strong> Restores user-crafted AI summaries and resolution plans.</div>
            <div>• <strong className="text-slate-700">Follow-up Comments Thread:</strong> Restores multi-user conversation history and facility dispatches.</div>
            <div>• <strong className="text-slate-700">Case Owners & Statuses:</strong> Preserves assigned PICs, deadlines, and 'In Progress' / 'Completed' states.</div>
            <div>• <strong className="text-slate-700">Action Timelines:</strong> Rebuilds step-by-step audit events and timestamps.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
