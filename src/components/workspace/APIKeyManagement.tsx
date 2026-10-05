"use client"

import { useState } from "react"
import { Key, Eye, EyeOff, Save, CheckCircle2, AlertCircle, Plus, Trash2, Zap, Moon } from "lucide-react"

interface APIKeyData {
  provider: string
  models: string[]
  key: string
  status: "configured" | "not-configured"
}

const providers = [
  {
    id: "openai",
    name: "OpenAI",
    models: ["GPT-4 Turbo", "GPT-5", "GPT-6"],
    icon: "🤖",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: ["Claude 3.5 Sonnet", "Claude 3 Opus"],
    icon: "🧠",
  },
  {
    id: "google",
    name: "Google",
    models: ["Gemini 1.5 Pro"],
    icon: "✨",
  },
  {
    id: "meta",
    name: "Meta",
    models: ["LLaMA 3"],
    icon: "💻",
  },
  {
    id: "luna",
    name: "Luna AI",
    models: ["Luna AI"],
    icon: "🌙",
  },
]

export default function APIKeyManagement() {
  const [apiKeys, setApiKeys] = useState<Record<string, APIKeyData>>({
    openai: {
      provider: "OpenAI",
      models: ["GPT-4 Turbo", "GPT-5", "GPT-6"],
      key: "",
      status: "not-configured",
    },
    anthropic: {
      provider: "Anthropic",
      models: ["Claude 3.5 Sonnet", "Claude 3 Opus"],
      key: "",
      status: "not-configured",
    },
    google: {
      provider: "Google",
      models: ["Gemini 1.5 Pro"],
      key: "",
      status: "not-configured",
    },
    meta: {
      provider: "Meta",
      models: ["LLaMA 3"],
      key: "",
      status: "not-configured",
    },
    luna: {
      provider: "Luna AI",
      models: ["Luna AI"],
      key: "",
      status: "not-configured",
    },
  })

  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})
  const [editingProvider, setEditingProvider] = useState<string | null>(null)
  const [lunaKey, setLunaKey] = useState("")
  const [lunaVisible, setLunaVisible] = useState(false)
  const [lunaSaved, setLunaSaved] = useState(false)

  const handleSaveLuna = () => {
    if (!lunaKey.trim()) return
    setLunaSaved(true)
  }

  const toggleKeyVisibility = (providerId: string) => {
    setVisibleKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }))
  }

  const handleKeyChange = (providerId: string, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        key: value,
        status: value.length > 0 ? "configured" : "not-configured",
      },
    }))
  }

  const handleSaveKey = (providerId: string) => {
    console.log(`Saving API key for ${providerId}:`, apiKeys[providerId].key)
    setEditingProvider(null)
  }

  const handleDeleteKey = (providerId: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        key: "",
        status: "not-configured",
      },
    }))
    setVisibleKeys((prev) => ({ ...prev, [providerId]: false }))
  }

  const startEditing = (providerId: string) => {
    setEditingProvider(providerId)
  }

  const cancelEditing = () => {
    setEditingProvider(null)
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
          <Key className="w-5 h-5 text-black" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text">API Key Management</h3>
          <p className="text-sm text-textSecondary">Configure your AI provider keys</p>
        </div>
      </div>

      {/* Featured: GPT-5.6 Luna */}
      <div className="mb-6 rounded-xl border border-primary bg-surface2 p-5 shadow-glow-gold">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Moon className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-text">GPT-5.6 Luna</h4>
                <span className="badge-gold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Motor principal
                </span>
              </div>
              <p className="text-xs text-textSecondary">Chave dedicada para o motor de geração prioritário</p>
            </div>
          </div>
          {lunaSaved && lunaKey ? (
            <span className="flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="w-4 h-4" />
              Configurada
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-warning">
              <AlertCircle className="w-4 h-4" />
              Necessária
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={lunaVisible ? "text" : "password"}
              value={lunaKey}
              onChange={(e) => {
                setLunaKey(e.target.value)
                setLunaSaved(false)
              }}
              placeholder="luna-sk-..."
              className="w-full bg-surface3 border border-border rounded-lg px-4 py-2.5 pr-12 text-sm text-text placeholder-textSecondary focus:outline-none focus:border-primary font-mono transition-colors"
            />
            <button
              onClick={() => setLunaVisible(!lunaVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-accent transition-colors"
            >
              {lunaVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={handleSaveLuna}
            disabled={!lunaKey.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primaryDark disabled:bg-surface3 disabled:text-textSecondary rounded-lg text-black text-sm font-semibold transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{lunaSaved ? "Atualizar" : "Guardar"}</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => {
          const providerData = apiKeys[provider.id]
          const isEditing = editingProvider === provider.id
          const isVisible = visibleKeys[provider.id]

          return (
            <div key={provider.id} className="bg-surface2 rounded-xl p-4 border border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div>
                    <h4 className="text-base font-semibold text-text">{provider.name}</h4>
                    <p className="text-xs text-textSecondary">
                      {provider.models.join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {providerData.status === "configured" ? (
                    <div className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Configured</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-textSecondary">
                      <AlertCircle className="w-3 h-3" />
                      <span>Not Configured</span>
                    </div>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={isVisible ? "text" : "password"}
                      value={providerData.key}
                      onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                      placeholder={`Enter ${provider.name} API Key`}
                      className="w-full bg-surface3 border border-border rounded-lg px-4 py-2.5 pr-24 text-sm text-text placeholder-textSecondary focus:outline-none focus:border-primary transition-colors"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      <button
                        onClick={() => toggleKeyVisibility(provider.id)}
                        className="p-1.5 rounded hover:bg-surface2 text-textSecondary hover:text-accent transition-colors"
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveKey(provider.id)}
                      disabled={!providerData.key}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primaryDark disabled:bg-surface3 disabled:text-textSecondary rounded-lg text-black text-sm font-semibold transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Key</span>
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 bg-surface3 hover:bg-surface2 rounded-lg text-text text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 bg-surface3 rounded-lg px-4 py-2.5 mr-3">
                    <span className="text-sm text-textSecondary font-mono">
                      {providerData.key
                        ? isVisible
                          ? providerData.key
                          : "•".repeat(Math.min(providerData.key.length, 32))
                        : "No key configured"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {providerData.key && (
                      <button
                        onClick={() => toggleKeyVisibility(provider.id)}
                        className="p-2 rounded-lg hover:bg-surface2 text-textSecondary hover:text-accent transition-colors"
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                    {providerData.key && (
                      <button
                        onClick={() => handleDeleteKey(provider.id)}
                        className="p-2 rounded-lg hover:bg-surface2 text-textSecondary hover:text-error transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => startEditing(provider.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-surface3 hover:bg-surface2 rounded-lg text-text text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{providerData.key ? "Update" : "Add New Key"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-surface2 rounded-lg border border-border">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text">Security Notice</p>
            <p className="text-xs text-textSecondary mt-1">
              API keys are stored locally in your browser. Never share your API keys with anyone.
              Each provider key enables access to their respective AI models.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
