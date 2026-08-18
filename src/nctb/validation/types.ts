export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  message: string;
  questionId?: string;
}

export interface BankValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
