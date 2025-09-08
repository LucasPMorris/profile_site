/* eslint-disable react-hooks/exhaustive-deps */
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { LuPlay as PlayIcon, LuTrash2 as ClearIcon } from 'react-icons/lu';
import { ImperativePanelHandle, Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import useIsMobile from '@/common/hooks/useIsMobile';

import CodeEditor from './CodeEditor';
import ConsoleOutput from './ConsoleOutput';
import { CSSPreview } from './CSSPreview';
import { HTMLPreview } from './HTMLPreview'; 
import { MDPreview } from './MDPreview';
import PanelFooter from './PanelFooter';
import PanelHeader from './PanelHeader';
import { RegexPreview } from './RegexPreview';

// Define playground modes
export type PlaygroundMode = 'javascript' | 'css' | 'html' | 'markdown' | 'regex';

interface CodePlaygroundProps {
  id?: string | undefined;
  mode?: PlaygroundMode; // Add mode prop
  
  // For JavaScript mode
  code?: string;
  output?: string;
  onRunCode?: () => void;
  onSetCode?: (code: string) => void;
  onSetOutput?: (output: string) => void;
  isError?: boolean;
  
  // For CSS mode
  cssCode?: string;
  htmlCode?: string;
  onSetCssCode?: (code: string) => void;
  onSetHtmlCode?: (code: string) => void;
  
  // For HTML mode
  htmlContent?: string;
  onSetHtmlContent?: (content: string) => void;
  
  // For Markdown mode
  markdownCode?: string;
  onSetMarkdownCode?: (code: string) => void;
  
  // For Regex mode
  regexCode?: string;
  testString?: string;
  onSetRegexCode?: (code: string) => void;
  onSetTestString?: (text: string) => void;

  // Common props
  isFullScreen?: boolean;
  onFullScreen?: () => void;
  onCloseFullScreen?: () => void;
}

const CodePlayground = ({ id = undefined, mode = 'javascript',
  
  // JavaScript props
  code = '',
  output = '',
  onRunCode,
  onSetCode,
  onSetOutput,
  isError = false,
  
  // CSS props
  cssCode = '',
  onSetCssCode,
  
  // HTML props
  htmlContent = '<h1>Hello World</h1>',
  onSetHtmlContent,

  // Markdown props
  markdownCode = '# Hello World\n\nThis is a markdown preview.',
  onSetMarkdownCode,
  
  // Regex props
  regexCode = '',
  testString = '',
  onSetRegexCode,
  onSetTestString,

  // CSS and Regex props
  htmlCode = '<div class="preview-container">Preview</div>',
  onSetHtmlCode,

  // Common props
  isFullScreen,
  onFullScreen,
  onCloseFullScreen,
}: CodePlaygroundProps) => {
  const editorRef = useRef<ImperativePanelHandle>(null);
  const isMobile = useIsMobile();

  const panelDirection = isMobile ? 'vertical' : 'horizontal';

  // Clear functions based on mode
  const handleClearPrimary = () => {
    switch (mode) {
      case 'javascript':
        onSetCode?.('');
        break;
      case 'css':
        onSetCssCode?.('');
        break;
      case 'html':
        onSetHtmlContent?.('');
        break;
      case 'markdown':
        onSetMarkdownCode?.('');
        break;
    }
  };

  const handleClearSecondary = () => {
    switch (mode) {
      case 'javascript':
        onSetOutput?.('');
        break;
      case 'css':
        onSetHtmlCode?.('<div class="preview-container">Preview</div>');
        break;
    }
  };

  const onLayout = (sizes: number[]) => { document.cookie = `react-resizable-panels:layout:${mode}=${JSON.stringify(sizes)}`; };

  const handlePanelResize = () => {
    const panel = editorRef.current;
    if (panel !== null) { isMobile && panel.resize(50); }
  };

  useEffect(() => {
    isMobile && handlePanelResize();
  }, [isMobile]);

  // Get primary editor content and language
  const getPrimaryEditor = () => {
    switch (mode) {
      case 'javascript': return { code: code, language: 'javascript', onChange: (newCode: string) => onSetCode?.(newCode), title: 'JavaScript' };
      case 'css': return { code: cssCode, language: 'css', onChange: (newCode: string) => onSetCssCode?.(newCode), title: 'CSS' };
      case 'html': return { code: htmlContent, language: 'html', onChange: (newCode: string) => onSetHtmlContent?.(newCode), title: 'HTML' };
      case 'markdown': return { code: markdownCode, language: 'markdown', onChange: (newCode: string) => onSetMarkdownCode?.(newCode), title: 'Markdown' };
      case 'regex': return { code: regexCode, language: 'javascript', onChange: (newCode: string) => onSetRegexCode?.(newCode), title: 'Regular Expression' };
      default: return { code: code, language: 'javascript', onChange: (newCode: string) => onSetCode?.(newCode), title: 'Code' };
    }
  };

  // Get secondary panel content
  const getSecondaryPanel = () => {
    switch (mode) {
      case 'javascript': return { title: 'Console', content: ( <ConsoleOutput output={output} isError={isError} isFullScreen={isFullScreen} /> ), showClear: true, clearContent: output };
      case 'css': return { title: 'Preview', content: ( <CSSPreview cssCode={cssCode} htmlCode={htmlCode} isFullScreen={isFullScreen} /> ), showClear: false, clearContent: '' };
      case 'html': return { title: 'Preview', content: ( <HTMLPreview htmlCode={htmlContent} isFullScreen={isFullScreen} /> ), showClear: false, clearContent: '' };
      case 'markdown': return { title: 'Preview', content: ( <MDPreview markdownCode={markdownCode} isFullScreen={isFullScreen} /> ), showClear: false, clearContent: '' };
      case 'regex': return { title: 'Test Results', content: (<RegexPreview regexCode={regexCode} testString={testString} isFullScreen={isFullScreen} /> ), showClear: false, clearContent: '' };
      default: return { title: 'Output', content: <div className="p-4 text-neutral-400">No preview available</div>, showClear: false, clearContent: '' }; } };

  // Get third panel for CSS and Regex mode (HTML editor)
  const getThirdPanel = () => {
    if (mode === 'css') { return { title: 'HTML', content: (<CodeEditor code={htmlCode} language="html" height="500px" isFullScreen={isFullScreen} onChange={(newCode) => newCode !== undefined && onSetHtmlCode?.(newCode) } /> ), showClear: true, clearContent: htmlCode }; }
    else if (mode === 'regex') { return { title: 'Test String', content: ( <CodeEditor code={testString} language="text" height="500px" isFullScreen={isFullScreen} onChange={(newCode) => newCode !== undefined && onSetTestString?.(newCode) } /> ), showClear: true, clearContent: testString }; }
    return null;
  };

  const primaryEditor = getPrimaryEditor();
  const secondaryPanel = getSecondaryPanel();
  const thirdPanel = getThirdPanel();

  return (
    <>
      <div className='flex flex-auto rounded-t-md border border-neutral-700 bg-neutral-900'>
        <PanelGroup autoSaveId={`${id}-${mode}`} direction={panelDirection} onLayout={onLayout} style={{ height: isMobile ? '100vh' : '100%' }} >
          {/* Primary Editor Panel */}
          <Panel ref={editorRef} defaultSize={thirdPanel ? 33 : 50} minSize={20} collapsible={true} >
            <PanelHeader title={primaryEditor.title}>
              <div className='flex items-center gap-5'>
                {/* TODO-Pending: Decide about umami */}
                {/* <div className='cursor-pointer'onClick={handleClearPrimary} data-umami-event={`Clear ${primaryEditor.title} Playground`} > */}
                <div className='cursor-pointer'onClick={handleClearPrimary} data-umami-event={`Clear ${primaryEditor.title} Playground`} >
                  <ClearIcon size={18} className={clsx( 'text-neutral-400', primaryEditor.code && 'text-red-400' )} />
                </div>
                {mode === 'javascript' && (
                  // TODO-Pending: Decide about umami
                  // <div className='cursor-pointer' onClick={onRunCode} data-umami-event='Run Code Playground' >
                  <div className='cursor-pointer' onClick={onRunCode} data-umami-event='Run Code Playground' >
                    <PlayIcon size={18} className={clsx( 'text-sky-500', !primaryEditor.code && '!text-neutral-400' )}/>
                  </div>
                )}
              </div>
            </PanelHeader>
            <CodeEditor code={primaryEditor.code} language={primaryEditor.language} height='500px' isFullScreen={isFullScreen} onChange={(newCode) => newCode !== undefined && primaryEditor.onChange(newCode) } />
          </Panel>

          <PanelResizeHandle className='w-2 bg-neutral-700' />

          {/* Third Panel (HTML editor for CSS mode) */}
          {thirdPanel && (
            <>
              <PanelResizeHandle className='w-2 bg-neutral-700' />
              <Panel defaultSize={34} minSize={20} collapsible={true}>
                <PanelHeader title={thirdPanel.title}>
                  {thirdPanel.showClear && (
                    <div className='flex items-center'>
                      {/* TODO-Pending: Decide about umami */}
                      {/* <div className='cursor-pointer' onClick={() => onSetHtmlCode?.('<div class="preview-container">Preview</div>')} data-umami-event={`Clear ${thirdPanel.title} Playground`} > */}
                      <div className='cursor-pointer' onClick={() => {
                        if (mode === 'css') onSetHtmlCode?.('<div class="preview-container">Preview</div>'); 
                        else if (mode === 'regex') onSetTestString?.(''); 
                      }}>
                        <ClearIcon size={18} className={clsx( 'text-neutral-400', thirdPanel.clearContent && 'text-red-400', )} />
                      </div>
                    </div>
                  )}
                </PanelHeader>
                {thirdPanel.content}
              </Panel>
            </>
          )}

          {/* Secondary Panel (Console/Preview) */}
          <Panel defaultSize={thirdPanel ? 33 : 50} minSize={20} collapsible={true} >
            <PanelHeader title={secondaryPanel.title}>
              {secondaryPanel.showClear && (
                <div className='flex items-center'>
                  {/* TODO-Pending: Decide about umami */}
                  {/* <div className='cursor-pointer' onClick={handleClearSecondary} data-umami-event={`Clear ${secondaryPanel.title} Playground`} > */}
                  <div className='cursor-pointer' onClick={handleClearSecondary} >
                    <ClearIcon size={18} className={clsx( 'text-neutral-400', secondaryPanel.clearContent && 'text-red-400', )} />
                  </div>
                </div>
              )}
            </PanelHeader>
            {secondaryPanel.content}
          </Panel>
        </PanelGroup>
      </div>
      <PanelFooter isFullScreen={isFullScreen} onCloseFullScreen={onCloseFullScreen} onFullScreen={onFullScreen} />
    </>
  );
};

export default CodePlayground;