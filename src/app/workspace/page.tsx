"use client"

import { useState } from "react"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import CodePreview from "@/components/workspace/CodePreview"
import StateMonitor from "@/components/workspace/StateMonitor"
import APIKeyManagement from "@/components/workspace/APIKeyManagement"
import {
  FileCode,
  FolderTree,
  Play,
  Save,
  Share2,
  MoreVertical,
  Plus,
  Search,
  Filter,
  ArrowLeft,
} from "lucide-react"

export default function Workspace() {
  const [selectedFile, setSelectedFile] = useState("App.tsx")
  const [selectedTab, setSelectedTab] = useState("app.tsx")

  const sampleCode = `import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to HoloStack
        </h1>
        <p className="text-textSecondary mb-8">
          Your AI-powered development workspace
        </p>
        <div className="bg-surface border border-border rounded-lg p-6">
          <p className="text-2xl mb-4">Count: {count}</p>
          <div className="flex gap-4">
            <Button onClick={() => setCount(c => c + 1)}>
              Increment
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCount(0)}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}`

  const fileTree = [
    {
      name: "src",
      type: "folder",
      children: [
        {
          name: "app",
          type: "folder",
          children: [
            { name: "page.tsx", type: "file" },
            { name: "layout.tsx", type: "file" },
            { name: "globals.css", type: "file" },
          ],
        },
        {
          name: "components",
          type: "folder",
          children: [
            {
              name: "ui",
              type: "folder",
              children: [
                { name: "Button.tsx", type: "file" },
                { name: "Input.tsx", type: "file" },
              ],
            },
            {
              name: "layout",
              type: "folder",
              children: [
                { name: "Sidebar.tsx", type: "file" },
                { name: "Header.tsx", type: "file" },
              ],
            },
          ],
        },
        {
          name: "lib",
          type: "folder",
          children: [{ name: "utils.ts", type: "file" }],
        },
      ],
    },
    {
      name: "public",
      type: "folder",
      children: [{ name: "favicon.ico", type: "file" }],
    },
    { name: "package.json", type: "file" },
    { name: "tsconfig.json", type: "file" },
    { name: "tailwind.config.ts", type: "file" },
  ]

  const renderFileTree = (items: any[], depth = 0) => {
    return items.map((item, index) => (
      <div key={index}>
        <div
          className={`flex items-center gap-2 px-3 py-2 hover:bg-surface2 cursor-pointer transition-colors ${
            selectedFile === item.name ? "bg-surface2 border-l-2 border-primary" : ""
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => item.type === "file" && setSelectedFile(item.name)}
        >
          {item.type === "folder" ? (
            <FolderTree className="w-4 h-4 text-accent" />
          ) : (
            <FileCode className="w-4 h-4 text-textSecondary" />
          )}
          <span className="text-sm text-text">{item.name}</span>
        </div>
        {item.children && renderFileTree(item.children, depth + 1)}
      </div>
    ))
  }

  const tabs = [
    { id: "app.tsx", name: "App.tsx" },
    { id: "button.tsx", name: "Button.tsx" },
    { id: "sidebar.tsx", name: "Sidebar.tsx" },
  ]

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1 ml-64">
        <Header />

        <main className="pt-24 pb-8 px-8">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-textSecondary hover:text-accent transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Dashboard</span>
            </button>

            <div className="grid grid-cols-12 gap-6">
              {/* File Explorer + Code Editor */}
              <div className="col-span-8">
                <div className="card overflow-hidden p-0">
                  <div className="flex items-center justify-between px-4 py-3 bg-surface2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-accent" />
                      <input
                        type="text"
                        placeholder="Search files..."
                        className="bg-transparent border-none text-sm text-text placeholder-textSecondary focus:outline-none w-48"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg hover:bg-surface3 text-textSecondary hover:text-accent transition-colors">
                        <Filter className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-surface3 text-textSecondary hover:text-accent transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex h-[600px]">
                    <div className="w-64 border-r border-border overflow-y-auto scrollbar-thin bg-surface2">
                      {renderFileTree(fileTree)}
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center border-b border-border bg-surface2">
                        {tabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id)}
                            className={`px-4 py-2 text-sm border-r border-border transition-colors ${
                              selectedTab === tab.id
                                ? "bg-surface text-text border-b-2 border-primary"
                                : "text-textSecondary hover:text-accent hover:bg-surface3"
                            }`}
                          >
                            {tab.name}
                          </button>
                        ))}
                      </div>

                      <div className="flex-1 overflow-auto scrollbar-thin bg-surface2">
                        <CodePreview code={sampleCode} language="TypeScript" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3 bg-surface2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-surface3 hover:bg-surface2 rounded-lg text-sm text-text transition-colors">
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primaryDark rounded-lg text-sm text-black font-semibold transition-colors">
                        <Play className="w-4 h-4" />
                        <span>Run</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-surface3 hover:bg-surface2 rounded-lg text-sm text-text transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                      <button className="p-2 rounded-lg hover:bg-surface3 text-textSecondary hover:text-accent transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <div className="col-span-4 space-y-6">
                <StateMonitor projectName="HoloStack" />
                <APIKeyManagement />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
