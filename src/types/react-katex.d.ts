declare module 'react-katex' {
  import type { HTMLAttributes } from 'react';

  interface MathProps extends HTMLAttributes<HTMLElement> {
    math: string;
    errorColor?: string;
    renderError?: (error: Error) => React.ReactNode;
  }

  export function BlockMath(props: MathProps): React.ReactElement;
  export function InlineMath(props: MathProps): React.ReactElement;
}
