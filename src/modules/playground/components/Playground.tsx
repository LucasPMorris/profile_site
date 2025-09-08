/* eslint-disable no-console */
import { useState } from 'react';

import ModalWrapper from '@/common/components/elements/ModalWrapper';

import CodePlayground, { PlaygroundMode } from './CodePlayground';
import PlaygroundHeader from './PlaygroundHeader';

interface PlaygroundProps { id?: string | undefined; isHeading?: boolean; initialCode?: string; mode?: PlaygroundMode; }

const Playground = ({
  id = undefined,
  isHeading = false,
  initialCode,
  mode = 'javascript', // Default to javascript for backward compatibility
}: PlaygroundProps) => {
  // JavaScript state (existing)
  const [jsCode, setJsCode] = useState<string>(initialCode ?? '');
  const [jsOutput, setJsOutput] = useState<string>('');
  const [isError, setError] = useState<boolean>(false);
  const [cssCode, setCssCode] = useState<string>('');
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [markdownCode, setMarkdownCode] = useState<string>('');
  const [isFullScreen, setFullScreen] = useState<boolean>(false);
  const [regexCode, setRegexCode] = useState<string>(`/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g`);
  const [testString, setTestString] = useState<string>('');

  const handleFullScreen = () => { setFullScreen(!isFullScreen); };

  const handleRunCode = () => {
    if (mode !== 'javascript') return;
    
    try {
      setError(false);

      let capturedConsoleOutput = '';
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;

      const formatValue = (value: any): string => {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (typeof value === 'function') return value.toString();
        
        // For objects and arrays, use JSON.stringify with proper formatting
        try { return JSON.stringify(value, null, 2); }
        catch (error) { return String(value); }
      };

      // Capture all console outputs
      console.log = (...messages) => {
        const formattedMessages = messages.map(formatValue);
        capturedConsoleOutput += formattedMessages.join(' ') + '\n';
      }; 
      console.error = (...messages) => {
        const formattedMessages = messages.map(formatValue);
        capturedConsoleOutput += 'ERROR: ' + formattedMessages.join(' ') + '\n';
      };
      console.warn = (...messages) => {
        const formattedMessages = messages.map(formatValue);
        capturedConsoleOutput += 'WARN: ' + formattedMessages.join(' ') + '\n';
      };

      // Execute the code
      const result = new Function(jsCode)();
      
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;

      let finalOutput = capturedConsoleOutput;
      if (result !== undefined) { finalOutput += 'Return value: ' + formatValue(result); }

      // Set output
      setJsOutput(finalOutput || 'Code executed successfully (no output)');
    } catch (error) {
      setError(true);
      if (error instanceof Error) { setJsOutput(error.toString()); }
      else { setJsOutput('An unknown error occurred.'); }
    }
  };

  // Get the appropriate props based on mode
  const getPlaygroundProps = () => {
    const baseProps = { id, mode, onFullScreen: handleFullScreen, };

    switch (mode) {
      case 'javascript': return {...baseProps, code: jsCode, output: jsOutput, isError, onRunCode: handleRunCode, onSetCode: setJsCode, onSetOutput: setJsOutput };
      case 'css': return { ...baseProps, cssCode, htmlCode, onSetCssCode: setCssCode, onSetHtmlCode: setHtmlCode, };
      case 'html': return { ...baseProps, htmlContent, onSetHtmlContent: setHtmlContent };
      case 'markdown': return { ...baseProps, markdownCode, onSetMarkdownCode: setMarkdownCode };
      case 'regex': return { ...baseProps, regexCode, testString, onSetCode: setRegexCode, onSetOutput: setTestString };
      default: return baseProps;
    }
  };

  const getFullScreenProps = () => {
    const baseProps = { id, mode, isFullScreen, onCloseFullScreen: handleFullScreen };

    switch (mode) {
      case 'javascript': return {...baseProps, code: jsCode, output: jsOutput, isError, onRunCode: handleRunCode, onSetCode: setJsCode, onSetOutput: setJsOutput };
      case 'css': return { ...baseProps, cssCode, htmlCode, onSetCssCode: setCssCode, onSetHtmlCode: setHtmlCode };
      case 'html': return { ...baseProps, htmlContent, onSetHtmlContent: setHtmlContent };
      case 'markdown': return { ...baseProps, markdownCode, onSetMarkdownCode: setMarkdownCode };
      case 'regex': return { ...baseProps, regexCode, testString, onSetCode: setRegexCode, onSetOutput: setTestString };
      default: return baseProps;
    }
  };

  return (
    <>
      {isHeading && <PlaygroundHeader mode={mode} />}

      <CodePlayground {...getPlaygroundProps()} />

      <ModalWrapper isOpen={isFullScreen} onClose={handleFullScreen}><CodePlayground {...getFullScreenProps()} /></ModalWrapper>
    </>
  );
};

export default Playground;