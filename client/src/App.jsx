import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { LANGUAGE_VERSIONS, CODE_SNIPPETS } from "./constants"; 
import "./App.css";

function App() {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(CODE_SNIPPETS["javascript"]); 
  const [output, setOutput] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Function to handle language change
  const onSelectChange = (lang) => {
    setLanguage(lang);
    setCode(CODE_SNIPPETS[lang]); 
    setOutput(""); 
    setAiAnalysis(null); 
  };

  const runCode = async () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    if (!backendUrl) {
      setError(true);
      setOutput("Error: Backend URL is not set in .env file.");
      return;
    }

    setLoading(true);
    setAiAnalysis(null);
    setOutput("");
    setError(false);

    try {
      const response = await axios.post(`${backendUrl}/api/compile`, {
        code,
        language,
      });

      const { run, aiFix } = response.data;

      if (response.data.error) {
        setError(true);
        setOutput(response.data.stderr || response.data.stdout);
        setAiAnalysis(response.data.aiFix); 
      } else {
        // Success
        setError(false);
        setOutput(response.data.stdout);
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setOutput(
        stderrr.response?.data?.error || "An error occurred while communicating with the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header className="header">
        <h2>Compiler</h2>
        <div className="controls">
          <div className="language-selector">
            <select
              className="lang-select"
              value={language}
              onChange={(e) => onSelectChange(e.target.value)}
            >
              {Object.entries(LANGUAGE_VERSIONS).map(([lang]) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <button
            className={`run-btn ${loading ? "loading" : ""}`}
            onClick={runCode}
            disabled={loading}
          >
            {loading ? "Compiling..." : "Run & Debug"}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="workspace">
        {/* Left Panel: Code Editor */}
        <div className="editor-panel">
          <Editor
            height="100%"
            theme="vs-dark"
            language={language === "cpp" || language === "c" ? "cpp" : language} // Monaco uses 'cpp' for both C and C++
            value={code}
            onChange={(val) => setCode(val)}
            options={{
              fontSize: 18,
              minimap: { enabled: false },
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        {/* Right Panel: Terminal & AI Output */}
        <div className="output-panel">
          {/* Terminal Window */}
          <div className="terminal-window">
            <div className="terminal-title">Terminal Output</div>
            <pre className={`terminal-content ${error ? "error-text" : ""}`}>
              {output || "Ready to compile..."}
            </pre>
          </div>

          {/* AI Debugger Panel*/}
          {aiAnalysis && (
            <div className="ai-panel">
              <h3 className="ai-title">AI Debugger Analysis</h3>
              <p className="ai-explanation">
                <strong>Issue:</strong> {aiAnalysis.explanation}
              </p>
              <div className="code-block">
                <pre>{aiAnalysis.correctedCode}</pre>
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(aiAnalysis.correctedCode);
                    alert("Code copied to clipboard!");
                  }}
                >
                  Copy Fix
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
