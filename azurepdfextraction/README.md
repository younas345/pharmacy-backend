# PDF Information Extractor

A modern React + Vite + TypeScript application that allows users to upload PDF files and extract key information using Azure OpenAI.

## Features

- 📄 PDF file upload with drag & drop support
- 🤖 AI-powered information extraction using Azure OpenAI
- 📋 Structured display of extracted information
- 🎨 Modern, responsive UI
- ⚡ Fast and efficient with Vite

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. The environment variables are already configured in `.env` file. If you need to update them, edit `.env`:
```
VITE_AZURE_OPENAI_API_KEY=your_api_key
VITE_AZURE_OPENAI_ENDPOINT=your_endpoint
VITE_AZURE_OPENAI_DEPLOYMENT=your_deployment
VITE_AZURE_OPENAI_API_VERSION=2025-01-01-preview
VITE_OPENAI_MODEL=your_model
VITE_OPENAI_MAX_TOKENS=10000
```

## Development

Run the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## How It Works

1. User uploads a PDF file (drag & drop or click to select)
2. The PDF is parsed to extract text content using PDF.js
3. The extracted text is sent to Azure OpenAI with a prompt to analyze and extract key information
4. The AI response is parsed and displayed in a structured format
5. Users can see:
   - A summary of the document
   - Key information extracted (dates, names, amounts, etc.)
   - Full text preview

## Technologies Used

- React 18
- TypeScript
- Vite
- Azure OpenAI SDK
- PDF.js (for PDF text extraction in browser)
- react-dropzone (for file upload)

## License

MIT
