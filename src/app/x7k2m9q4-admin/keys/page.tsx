"use client"

import APIKeyManagement from "@/components/workspace/APIKeyManagement"

export default function AdminKeysPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Centro de Chaves de API</h1>
        <p className="text-sm text-textSecondary">
          Credenciais dos motores de IA — acesso restrito com verificação 2FA
        </p>
      </div>
      <APIKeyManagement />
    </div>
  )
}
