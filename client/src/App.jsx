import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import "./App.css";

function App() {
  const [code, setCode] = useState("// Write your code here...");
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false); 

  const runCode = async () => {
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    setLoading(true);
    setAiAnalysis(null);
    setOutput("");
    setError(false);

    try {
      //Send code to Backend
      const response = await axios.post(`${backendUrl}/api/compile`, {
        code,
        language,
      });

      //Handle Response
      if (response.data.error) {
        //Compilation Error
        setError(true);
        setOutput(response.data.stderr);
        setAiAnalysis(response.data.aiFix); // AI's suggestion
      } else {
        //Success
        setError(false);
        setOutput(response.data.stdout);
      }
    } catch (err) {
      setError(true);
      setOutput(
        "Error: Could not connect to the backend server. Is it running?"
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
          <select
            className="lang-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
          </select>
          <button className="run-btn" onClick={runCode} disabled={loading}>
            {loading ? "Processing..." : "Run & Debug"}
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
            language={language}
            value={code}
            onChange={(val) => setCode(val)}
            options={{
              fontSize: 17,
              minimap: { enabled: false },
              automaticLayout: true,
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

          {/* AI Debugger Panel (Only shows on error) */}
          {aiAnalysis && (
            <div className="ai-panel">
              <h3 className="ai-title">🤖 AI Debugger Analysis</h3>
              <p className="ai-explanation">
                <strong>Issue:</strong> {aiAnalysis.explanation}
              </p>
              <div className="code-block">{aiAnalysis.correctedCode}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
