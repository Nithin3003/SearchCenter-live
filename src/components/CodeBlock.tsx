import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';

interface CodeBlockProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  searchQuery?: string;
  lineOffset?: number;  // Added for grep-like display
}

const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  language, 
  showLineNumbers = true, 
  searchQuery = '',
  lineOffset = 0  // Start numbering from this line
}) => {
  const [copied, setCopied] = useState(false);

  // Normalize the language string to match what prism expects
  const getNormalizedLanguage = (lang: string): string => {
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'go': 'go',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'html': 'markup',
      'css': 'css',
      'json': 'json',
      'yml': 'yaml',
      'yaml': 'yaml',
      'md': 'markdown',
      'sh': 'bash',
      'bash': 'bash',
      'sql': 'sql',
      'plain': 'text',
      'text': 'text',
    };

    return langMap[lang.toLowerCase()] || lang.toLowerCase();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const normalizedLanguage = getNormalizedLanguage(language);

  // Create a regex pattern for highlighting search query matches
  const createHighlightPattern = (query: string) => {
    if (!query.trim()) return null;
    try {
      return new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    } catch (e) {
      return null;
    }
  };

  const highlightPattern = createHighlightPattern(searchQuery);

  return (
    <div className="relative rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-300 text-xs">
        <div>
          <span className="font-mono uppercase tracking-wide">{language}</span>
        </div>
        <button
          onClick={handleCopyCode}
          className="flex items-center text-gray-300 hover:text-white transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <Highlight 
        theme={themes.nightOwl}
        code={code}
        language={normalizedLanguage}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className="overflow-x-auto p-4 text-sm" style={style}>
            <code className={className}>
              {tokens.map((line, i) => {
                // Check if the line contains the search query
                const lineText = line.map(token => token.content).join('');
                const lineHasMatch = highlightPattern && highlightPattern.test(lineText);
                
                return (
                  <div 
                    key={i} 
                    {...getLineProps({ line, key: i })}
                    className={`${lineHasMatch ? 'bg-yellow-900 bg-opacity-20 -mx-4 px-4' : ''}`}
                  >
                    {showLineNumbers && (
                      <span className={`inline-block w-8 mr-4 text-right text-gray-500 select-none ${lineHasMatch ? 'text-yellow-200' : ''}`}>
                        {i + 1 + lineOffset}
                      </span>
                    )}
                    {line.map((token, key) => {
                      // Check if the token content matches the search query
                      const content = token.content;
                      if (highlightPattern && content.match(highlightPattern)) {
                        // Split the content by search query and wrap matches in mark tags
                        const parts = content.split(highlightPattern);
                        return (
                          <span key={key} {...getTokenProps({ token, key })}>
                            {parts.map((part, idx) => {
                              if (idx % 2 === 0) {
                                return part;
                              } else {
                                return (
                                  <mark key={idx} className="bg-yellow-300 text-gray-900 rounded-sm px-0.5">
                                    {part}
                                  </mark>
                                );
                              }
                            })}
                          </span>
                        );
                      }
                      return <span key={key} {...getTokenProps({ token, key })} />;
                    })}
                  </div>
                );
              })}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
};

export default CodeBlock;