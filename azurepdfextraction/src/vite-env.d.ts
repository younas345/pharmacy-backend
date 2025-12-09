/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_OPENAI_API_KEY: string
  readonly VITE_AZURE_OPENAI_ENDPOINT: string
  readonly VITE_AZURE_OPENAI_DEPLOYMENT: string
  readonly VITE_AZURE_OPENAI_API_VERSION: string
  readonly VITE_OPENAI_MODEL: string
  readonly VITE_OPENAI_MAX_TOKENS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

