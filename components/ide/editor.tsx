"use client"

import * as React from "react"
import Editor, { useMonaco } from "@monaco-editor/react"
import { useTheme } from "next-themes"

interface CodeEditorProps {
    path: string
    value: string
    language?: string
    onChange: (value: string | undefined) => void
}

export function CodeEditor({ path, value, language, onChange }: CodeEditorProps) {
    const { theme } = useTheme()
    const monaco = useMonaco()

    // Determine language from file extension if not provided
    const detectedLanguage = React.useMemo(() => {
        if (language) return language
        const ext = path.split('.').pop()?.toLowerCase()
        switch (ext) {
            case 'ts':
            case 'tsx':
                return 'typescript'
            case 'js':
            case 'jsx':
                return 'javascript'
            case 'css':
                return 'css'
            case 'html':
                return 'html'
            case 'json':
                return 'json'
            case 'md':
                return 'markdown'
            case 'py':
                return 'python'
            case 'go':
                return 'go'
            case 'java':
                return 'java'
            default:
                return 'plaintext'
        }
    }, [path, language])

    return (
        <div className="h-full w-full overflow-hidden">
            <Editor
                height="100%"
                defaultLanguage="plaintext"
                language={detectedLanguage}
                value={value}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                onChange={onChange}
                path={path} // Important for intellisense model cache
                options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    wordWrap: 'on',
                    formatOnPaste: true,
                    formatOnType: true,
                }}
            />
        </div>
    )
}
