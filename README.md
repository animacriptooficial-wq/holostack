# HoloStack-PSO

Ecosystemo unificado de desenvolvimento com IA, apresentando uma interface moderna em tema escuro azul-noite com detalhes em dourado brilhante e efeitos de brilho ambiente.

## Funcionalidades

### Gerador de Texto Principal
- **Fundo elegante:** Azul-noite/slate escuro profundo com efeitos sutis de brilho ambiente
- **Navbar superior:** Links de navegação, seletor de idioma "BR PT" e botão "API"
- **Badge de destaque:** "Animacripto's Pro..." com ícone
- **Título principal:** "O que você vai construir hoje?" (com destaque em amarelo)
- **Chips de categorias:** Web App, Mobile App, Site, Video, Game, Bot
- **Caixa de prompt:** Efeito glassmorphism com borda sutil e placeholder personalizado
- **Controles de IA:** Botões + Auto, + Mirror, + Criar (destaque em dourado)
- **Tags de sugestões:** Wingman (Beta), Meu Eu Alternativo, Gerador de Contas, Palavra do Dia
- **Filtros de visualização:** Todos (1), Aplicações, Publicadas, Vídeos
- **Projetos recentes:** Cards com informações e status

### Workspace de Execução
- Tela dividida para pré-visualização de código/componentes
- Árvore de arquivos interativa
- Editor de código com Syntax Highlighting
- Abas para múltiplos arquivos
- Gestão de estado ativa com monitoramento em tempo real
- Gerenciador dedicado de chaves de API com campos seguros
- Métricas de componentes, rotas, state stores e chamadas de API

## Stack Tecnológica

- **Framework**: Next.js 15.2.0
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS com glassmorphism
- **Ícones**: Lucide React
- **Runtime**: Node.js v24.21.0

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse [http://localhost:3000](http://localhost:3000)

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter (requer instalação do eslint)

## Estrutura do Projeto

```
HoloStack-PSO/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx (Dashboard/Generator)
│   │   └── workspace/
│   │       └── page.tsx (Workspace)
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── PromptBox.tsx
│   │   │   └── PSOStatus.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── ui/
│   │   │   └── Button.tsx
│   │   └── workspace/
│   │       ├── APIKeyManagement.tsx
│   │       ├── CodePreview.tsx
│   │       └── StateMonitor.tsx
│   └── lib/
├── public/
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Configuração de Chaves de API

A aplicação inclui um gerenciador de chaves de API dedicado e seguro através do componente `APIKeyManagement`. As chaves são mascaradas e podem ser configuradas por provedor específico na seção Workspace.

Provedores suportados:
- OpenAI (GPT-4 Turbo, GPT-5, GPT-6)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
- Google (Gemini 1.5 Pro)
- Meta (LLaMA 3)
- Luna AI

## Tema Visual

A aplicação utiliza um tema elegante em azul-noite escuro com detalhes em dourado brilhante:
- **Background**: #0b1120 (azul-noite profundo)
- **Primary/Accent**: #f59e0b / #fbbf24 (amarelo/dourado)
- **Surface**: rgba(15, 23, 42, 0.8) com backdrop-blur-md
- **Text**: #f1f5f9
- **Efeitos**: Brilho ambiente sutil, glassmorphism, sombras com tinta dourada

## Desenvolvimento

Para adicionar novas funcionalidades:

1. Crie componentes em `src/components/`
2. Adicione páginas em `src/app/`
3. Utilize os componentes UI base em `src/components/ui/`
4. Siga o padrão de estilização com Tailwind CSS
5. Use as classes utilitárias `.glass`, `.glass-card`, `.chip`, `.badge-gold` para efeitos especiais

## Qualidade de Código

- 100% completo sem comentários TODO
- Zero erros de compilação
- Build de produção validada
- TypeScript strict mode habilitado
- Componentes React com hooks modernos
- Estado gerenciado com useState
- Separação clara de responsabilidades
- Design responsivo para todos os dispositivos

## Licença

MIT
