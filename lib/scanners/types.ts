import type { ScanCategory, FindingSeverity } from '../types';

export interface ScanResult {
  category: ScanCategory;
  score: number; // 0-100
  findings: ScannerFinding[];
}

export interface ScannerFinding {
  category: ScanCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  file_path?: string;
  line_number?: number;
  fix_suggestion?: string;
}

export interface RepoContext {
  files: { path: string; type: 'file' | 'dir'; size: number }[];
  fileContents: Record<string, string>;
  packageJson?: Record<string, unknown>;
  language: string;
  framework: string;
}
