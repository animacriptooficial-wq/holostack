"use client"

import { useState } from "react"
import { Copy, Play, Download, Eye, Code } from "lucide-react"

interface CodePreviewProps {
  code: string
  language: string
}

export default function CodePreview({ code, language }: CodePreviewProps) {
  const [viewMode, setViewMode] = useState<"code" | "preview">("code")

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className="bg-surface rounded-xl overflow-hidden border border-border">
      <div className="flex items-center justify-between px-4 py-3 bg-surface2 border-b border-border">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-text">{language}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("code")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
              viewMode === "code" 
                ? "bg-primary text-black font-semibold" 
                : "bg-surface3 text-text hover:bg-surface2"
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Code</span>
          </button>
          <button
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
              viewMode === "preview" 
                ? "bg-primary text-black font-semibold" 
                : "bg-surface3 text-text hover:bg-surface2"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-surface3 text-textSecondary hover:text-accent transition-colors"
            title="Copy code"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-surface3 text-textSecondary hover:text-accent transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-surface3 text-textSecondary hover:text-accent transition-colors"
            title="Run"
          >
            <Play className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 h-96 overflow-auto scrollbar-thin bg-surface2">
        {viewMode === "code" ? (
          <pre className="text-sm text-text font-mono whitespace-pre-wrap">
            <code>{code}</code>
          </pre>
        ) : (
          <div className="flex items-center justify-center h-full text-textSecondary">
            <div className="text-center">
              <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Preview mode - component rendered here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
