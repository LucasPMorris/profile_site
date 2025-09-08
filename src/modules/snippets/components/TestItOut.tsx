import { useState } from 'react';
import { LuPlay as PlayIcon } from 'react-icons/lu';
import { SiJavascript, SiCss3, SiHtml5, SiMarkdown } from 'react-icons/si';

import ModalWrapper from '@/common/components/elements/ModalWrapper';
import CodePlayground, { PlaygroundMode } from '@/modules/playground/components/CodePlayground';

interface TestItOutProps { title: string; description: string; snippetId: string; code: string; html: string, mode?: PlaygroundMode; }

const TestItOut = ({ title, description, snippetId, code, html, mode = 'javascript' }: TestItOutProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // State for JavaScript mode
  const [jsCode, setJsCode] = useState(mode === 'javascript' ? code : '');
  const [jsOutput, setJsOutput] = useState('');
  const [isError, setIsError] = useState(false);

  // State for CSS mode
  const [cssCode, setCssCode] = useState(mode === 'css' ? code : '');
  const [htmlCode, setHtmlCode] = useState(
    mode === 'css' 
      ? '<div class="demo-element">Test Element</div>' 
      : '<div class="demo-element">Test Element</div>'
  );

  const [regexCode, setRegexCode] = useState(mode === 'regex' ? code : '');
  const [testString, setTestString] = useState('');

  const [htmlContent, setHtmlContent] = useState(mode === 'html' ? code : '');
  const [markdownCode, setMarkdownCode] = useState(mode === 'markdown' ? code : '');

  const handleOpen = () => {
    setIsOpen(true);
    // Initialize the correct state based on mode when opening
    if (mode === 'javascript') { setJsCode(code); }
    else if (mode === 'css') { 
      setCssCode(code);
      const defaultHTML = html || '<div class="demo-element">Test Element</div>';
      setHtmlCode(defaultHTML);
    }
    else if (mode === 'html') { setHtmlContent(code); }
    else if (mode === 'markdown') { setMarkdownCode(code); }
    else if (mode === 'regex') {
      setRegexCode(code);
      setTestString(html || 'Sample text to test your regex pattern against.\nMultiple lines supported!\nTry matching: emails, phone numbers, dates, etc.');
    }
  };

  const handleClose = () => setIsOpen(false);

  const handleRunCode = () => {
    if (mode !== 'javascript') return;
    
    try {
      setIsError(false);

      let capturedConsoleOutput = '';
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;

      // Helper function to properly stringify values
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

      // Capture console outputs
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

      // Set output
      let finalOutput = capturedConsoleOutput;
      
      // If there's a return value, add it to the output
      if (result !== undefined) { finalOutput += 'Return value: ' + formatValue(result); }
      
      setJsOutput(finalOutput || 'Code executed successfully (no output)');
    } catch (error) {
      setIsError(true);
      if (error instanceof Error) { setJsOutput(error.toString()); }
      else { setJsOutput('An unknown error occurred.'); }
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'javascript': return <SiJavascript size={18} className='text-yellow-400' />;
      case 'css': return <SiCss3 size={18} className='text-blue-400' />;
      case 'html': return <SiHtml5 size={18} className='text-orange-500' />;
      case 'markdown': return <SiMarkdown size={18} className='text-gray-600' />;
      case 'regex': return <span className="text-xl">🔍</span>;
      default: return <PlayIcon size={18} className='text-blue-500' />;
    }
  };

  const getPlaygroundProps = () => { const baseProps = { id: `test-${snippetId}`, mode, isFullScreen: true, onCloseFullScreen: handleClose };

    switch (mode) {
      case 'javascript': return {...baseProps, code: jsCode, output: jsOutput, isError, onRunCode: handleRunCode, onSetCode: setJsCode, onSetOutput: setJsOutput };
      case 'css': return {...baseProps, cssCode, htmlCode, onSetCssCode: setCssCode, onSetHtmlCode: setHtmlCode };
      case 'html': return {...baseProps, htmlContent, onSetHtmlContent: setHtmlContent };
      case 'markdown': return {...baseProps, markdownCode, onSetMarkdownCode: setMarkdownCode };
      case 'regex': return {...baseProps, regexCode, testString, onSetRegexCode: setRegexCode, onSetTestString: setTestString };
      default: return baseProps;
    }
  };

  return (
    <>
      <div className="my-6 rounded-lg border border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-medium text-neutral-800 dark:text-neutral-200">{title}</h4>
          <button onClick={handleOpen} className="flex items-center gap-2 rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600">{getIcon()}Test It Out</button>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
      </div>

      <ModalWrapper isOpen={isOpen} onClose={handleClose}>
        <div className="h-[80vh] w-full">
          <CodePlayground {...getPlaygroundProps()} />
        </div>
      </ModalWrapper>
    </>
  );
};

export default TestItOut;