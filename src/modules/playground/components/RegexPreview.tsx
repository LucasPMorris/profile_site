import { useState, useEffect } from 'react';

interface RegexTesterProps { regexCode: string; testString: string; isFullScreen?: boolean; }

export const RegexPreview = ({ regexCode, testString, isFullScreen }: RegexTesterProps) => {
  const [matches, setMatches] = useState<RegExpMatchArray[] | null>(null);
  const [error, setError] = useState<string>('');
  const [regexInfo, setRegexInfo] = useState<{ flags: string; pattern: string; isValid: boolean; }>({ flags: '', pattern: '', isValid: false });

  useEffect(() => {
    if (!regexCode || !testString) {
      setMatches(null);
      setError('');
      return;
    }

    try {
      // Parse regex pattern and flags
      const regexMatch = regexCode.match(/^\/(.+)\/([gimuy]*)$/);
      
      let pattern: string;
      let flags: string;
      
      if (regexMatch) {
        // Format: /pattern/flags
        pattern = regexMatch[1];
        flags = regexMatch[2] || '';
      } else {
        // Plain pattern without slashes
        pattern = regexCode;
        flags = 'g'; // Default to global
      }

      setRegexInfo({ pattern, flags, isValid: true });

      const regex = new RegExp(pattern, flags);
      const allMatches: RegExpMatchArray[] = [];
      
      if (flags.includes('g')) {
        // Global search - find all matches
        let match;
        const globalRegex = new RegExp(pattern, flags);
        while ((match = globalRegex.exec(testString)) !== null) {
          allMatches.push(match);
          // Prevent infinite loop on zero-length matches
          if (match.index === globalRegex.lastIndex) {
            globalRegex.lastIndex++;
          }
        }
      } else {
        // Single match
        const match = testString.match(regex);
        if (match) { allMatches.push(match); }
      }

      setMatches(allMatches);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid regex pattern');
      setMatches(null);
      setRegexInfo({ pattern: regexCode, flags: '', isValid: false });
    }
  }, [regexCode, testString]);

  const highlightMatches = (text: string, matches: RegExpMatchArray[]) => {
    if (!matches || matches.length === 0) return text;

    const parts: { text: string; isMatch: boolean; groupIndex?: number }[] = [];
    let lastIndex = 0;

    // Sort matches by index to handle overlapping matches
    const sortedMatches = [...matches].sort((a, b) => (a.index || 0) - (b.index || 0));

    sortedMatches.forEach((match, matchIndex) => {
      const startIndex = match.index || 0;
      const endIndex = startIndex + match[0].length;

      // Add text before match
      if (startIndex > lastIndex) {
        parts.push({ text: text.slice(lastIndex, startIndex), isMatch: false });
      }

      // Add the match
      parts.push({ text: match[0], isMatch: true, groupIndex: matchIndex });

      lastIndex = endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), isMatch: false });
    }

    return parts.map((part, index) => (
      <span key={index} className={part.isMatch ? 'bg-yellow-200 border border-yellow-400 rounded px-1' : ''} title={part.isMatch ? `Match ${(part.groupIndex || 0) + 1}` : undefined} >
        {part.text}
      </span>
    ));
  };

  return (
    <div className="w-full h-full bg-white text-black p-4 overflow-auto font-mono text-sm" style={{ height: isFullScreen ? '70vh' : '500px' }} >
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
        <h3 className="font-bold text-lg mb-2">🔍 Regex Test Results</h3>
        
        {error 
          ? ( <div className="text-red-600 bg-red-50 p-2 rounded border border-red-200"><strong>Error:</strong> {error}</div> )
          : (
          <>
            <div className="mb-2">
              <strong>Pattern:</strong> <code className="bg-blue-50 px-1 rounded">{regexInfo.pattern}</code>
              {regexInfo.flags && ( <>{' '}<strong>Flags:</strong> <code className="bg-green-50 px-1 rounded">{regexInfo.flags}</code></> )}
            </div>
            
            <div className="mb-2">
              <strong>Matches found:</strong> <span className="font-bold text-blue-600">{matches?.length || 0}</span>
            </div>

            {matches && matches.length > 0 && (
              <div className="mb-2">
                <strong>Match details:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {matches.map((match, index) => (
                    <li key={index}>
                      Match {index + 1}: "<span className="bg-yellow-100 px-1 rounded">{match[0]}</span>" 
                      at position {match.index}
                      {match.length > 1 && (
                        <span className="text-gray-600">
                          {' '}(Groups: {match.slice(1).map((group, i) => `$${i + 1}="${group}"`).join(', ')})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <h4 className="font-bold mb-1">💡 Tips:</h4>
        <ul className="list-disc list-inside space-y-1 text-blue-800">
          <li>Use format <code>/pattern/flags</code> or just the pattern</li>
          <li>Common flags: <code>g</code> (global), <code>i</code> (ignore case), <code>m</code> (multiline)</li>
          <li>Use parentheses <code>()</code> for capture groups</li>
          <li>Test with different strings to verify your pattern works correctly</li>
        </ul>
      </div>
    </div>
  );
};