import { useEffect, useRef, useState } from 'react';
import { getWorkspaceGeneration, getWorkspaceOwnerId } from '../auth/session';
import { getEvidenceAttachmentBytes } from '../evidence';
import type { EvidenceAttachment } from '../case-intelligence/types';
import { evidenceSelectionKey } from './model';
import { checkBriefcaseOriginals, type EvidenceCheckReport } from './checks';

export function useEvidenceChecks(ownerId: string | null, caseId: string | null, attachments: EvidenceAttachment[]) {
  const selectionKey = `${ownerId}:${caseId}:${evidenceSelectionKey(attachments)}`;
  const sequence = useRef(0);
  const busyRun = useRef<number | null>(null);
  const selection = useRef(selectionKey);
  selection.current = selectionKey;
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<EvidenceCheckReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    sequence.current += 1;
    busyRun.current = null;
    setChecking(false); setProgress(0); setReport(null); setError(null);
    return () => { sequence.current += 1; };
  }, [selectionKey]);
  async function check() {
    if (busyRun.current !== null || !ownerId || !caseId || !attachments.length) return;
    const run = ++sequence.current;
    busyRun.current = run;
    const generation = getWorkspaceGeneration();
    const isCurrent = () => {
      try { return run === sequence.current && selection.current === selectionKey && generation === getWorkspaceGeneration() && getWorkspaceOwnerId() === ownerId; }
      catch { return false; }
    };
    setChecking(true); setProgress(0); setReport(null); setError(null);
    try {
      const result = await checkBriefcaseOriginals(attachments, {
        readVerifiedOriginal: (attachment) => getEvidenceAttachmentBytes(attachment, ownerId), isCurrent,
        onProgress: (completed) => { if (isCurrent()) setProgress(completed); },
      });
      if (result && isCurrent()) setReport(result);
    } catch (failure) {
      if (isCurrent()) setError(failure instanceof Error ? failure.message : 'The file check could not finish.');
    } finally {
      if (busyRun.current === run) busyRun.current = null;
      if (isCurrent()) setChecking(false);
    }
  }
  return { checking, progress, report, error, check };
}
