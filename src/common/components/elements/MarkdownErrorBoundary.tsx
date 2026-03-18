import React, { ReactNode } from 'react';

interface MarkdownErrorBoundaryProps {
  children: ReactNode;
}

interface MarkdownErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MarkdownErrorBoundary extends React.Component<MarkdownErrorBoundaryProps, MarkdownErrorBoundaryState> {
  constructor(props: MarkdownErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): MarkdownErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Log for debugging
    console.error('Markdown rendering error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800">
          <div className="flex items-start gap-3">
            <div className="text-red-600 dark:text-red-400 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-red-900 dark:text-red-200">
                Invalid Markdown Syntax
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {this.state.error?.message || 'There was an error rendering your markdown. Please check the syntax.'}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-mono break-words">
                {this.state.error?.toString().substring(0, 150)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MarkdownErrorBoundary;
