/* eslint-disable @typescript-eslint/no-explicit-any */
import MonacoEditor, { EditorProps } from '@monaco-editor/react';

interface CodeEditorProps { code: string; height?: string; onChange: EditorProps['onChange']; isFullScreen?: boolean; language?: string;}

const editorConfig = { fontSize: 14, minimap: { enabled: false }, wordWrap: 'on' as 'on', scrollbar: { verticalScrollbarSize: 9 }, scrollBeyondLastLine: false, formatOnPaste: true, formatOnType: true };

const CodeEditor = ({ code, onChange, height = '300px', isFullScreen = false, language}: CodeEditorProps) => {
  const handleEditorMount = (editor: any) => { 
    const formatableLanguages = ['javascript', 'typescript', 'css', 'html', 'json', 'regex'];
    if (formatableLanguages.includes(language || '')) { setTimeout(function () { editor.getAction('editor.action.formatDocument').run(); }, 500); }
  };

  return ( <MonacoEditor height={isFullScreen ? '70vh' : height} language={language || 'javascript'} theme='vs-dark' value={code} onChange={onChange} options={editorConfig} onMount={handleEditorMount} /> );
};

export default CodeEditor;
