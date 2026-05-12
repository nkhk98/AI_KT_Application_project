import React, { useState } from "react";
import axios from "axios";

import {
  BrowserRouter,
  Routes,
  Route,
  Link
} from "react-router-dom";

import NervousSystem from "./pages/NervousSystem";

import "./App.css";

function HomePage() {

  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadStatus,setUploadStatus] = useState("");
  const handleQuery = async () => {

    if (!query) return;

    setLoading(true);

    try {

      const res = await axios.post(
        "http://127.0.0.1:3000/query",
        {
          query: query,
        }
      );

      setResponse(res.data);

    } catch (err) {

      setResponse({
        error: "Error connecting to backend"
      });
    }

    setLoading(false);
  };
  const handleFileUpload =
    async () => {

    if (!file) {

      alert(
        "Select a document"
      );

      return;
    }

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    try {

      setUploadStatus(
        "Uploading..."
      );

      const res =
        await axios.post(
          "http://127.0.0.1:3000/upload-doc",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data"
            }
          }
        );

      setUploadStatus(
        "Indexed successfully"
      );

    } catch (err) {

      setUploadStatus(
        " Upload failed"
      );
    }
  };

  return (

    <div className="container">

      <h2>🧠 AI Knowledge System</h2>

      <div style={{ marginBottom: "20px" }}>
        <Link to="/graph">
          View Application Nervous System →
        </Link>
      </div>
      <div className="upload-box">
        <h3>
          📂 Upload Knowledge Document
        </h3>
        <input
          type="file"
          accept=".pdf,.txt,.docx"
          onChange={(e) =>
            setFile(
              e.target.files[0]
            )
          }
        />
        <button
          onClick={handleFileUpload}
        >
          Upload & Index
        </button>
        <p>
          {uploadStatus}
        </p>
      </div>
      
      <div className="input-box">
        <input
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          placeholder="Ask about system..."
        />
        <button onClick={handleQuery}>
          Ask
        </button>

      </div>

      {loading && <p>Loading...</p>}

      {response && !response.error && (

        <div className="response-box">

          <h3>📌 Answer</h3>

          <div 
            className="markdown-content"
            dangerouslySetInnerHTML={{ 
              __html: window.marked 
                ? window.marked.parse(response.answer) 
                : response.answer.replace(/\n/g, '<br>') 
            }} 
          />

          <h4>📊 Confidence</h4>

          <p>
            Faithfulness:
            {" "}
            {response.confidence?.faithfulness}
            {" | "}
            Relevance:
            {" "}
            {response.confidence?.relevance}
          </p>

          <h4>📚 Sources</h4>

          {response.source_docs?.map(
            (doc, index) => (

              <div
                key={index}
                className="doc"
              >

                <b>Module:</b>
                {" "}
                {doc.metadata?.module}

                <p>
                  {doc.page_content.substring(
                    0,
                    120
                  )}...
                </p>

              </div>
            )
          )}

        </div>
      )}

      {response?.error && (
        <p>{response.error}</p>
      )}

    </div>
  );
}

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/graph"
          element={<NervousSystem />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;