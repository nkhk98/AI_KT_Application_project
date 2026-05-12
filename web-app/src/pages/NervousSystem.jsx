import React, { useEffect, useState, useCallback } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import axios from "axios";

function NervousSystem() {
  const [elements, setElements] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [search, setSearch] = useState("");
  const [analysisResult, setAnalysisResult] = useState(""); // New state for AI text

  useEffect(() => {
    fetchGraph();
  }, [selectedNode]); // Re-run to update highlight colors

  const fetchGraph = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:3000/graph");
      const data = res.data;

      const nodes = data.nodes.map((node, index) => ({
        id: node.id,
        position: { x: index * 300, y: 150 },
        data: { 
          label: node.label, 
          info: node.info.join("\n") 
        },
        style: {
          border: node.id === selectedNode?.id ? "3px solid #ff0072" : "1px solid #555",
          background: node.id === selectedNode?.id ? "#ffe6f2" : "#ffffff",
          padding: '10px',
          borderRadius: '5px'
        },
      }));

      const edges = data.edges.map((edge, index) => ({
        id: `e${index}`,
        source: edge.source,
        target: edge.target,
        animated: edge.source === selectedNode?.id || edge.target === selectedNode?.id,
        style: { 
          stroke: (edge.source === selectedNode?.id || edge.target === selectedNode?.id) ? "#ff0072" : "#999",
          strokeWidth: 2 
        }
      }));

      setElements([...nodes, ...edges]);
    } catch (err) {
      console.error("Graph Fetch Error:", err);
    }
  };

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
    setAnalysisResult(""); // Clear old analysis when new node picked
  };

  const runImpactAnalysis = async () => {
    if (!selectedNode) return alert("Please select a node first!");
    
    setAnalysisResult("Analyzing impact..."); 
    try {
      const res = await axios.post("http://127.0.0.1:3000/impact-analysis", {
        query: `Analyze impact of failure in ${selectedNode.data.label}`
      });
      setAnalysisResult(res.data.analysis);
    } catch (err) {
      setAnalysisResult("Error running analysis.");
    }
  };

  return (
    <div style={{ width: "100%", height: "100vh", background: "#f5f5f5", position: "relative" }}>
      <h2 style={{ padding: 10 }}>AI Nervous System</h2>
      
      <div style={{ padding: '0 10px' }}>
        <button 
          onClick={runImpactAnalysis}
          style={{ padding: '10px 20px', cursor: 'pointer', background: '#ff0072', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Analyze Impact
        </button>
      </div>

      <ReactFlow
        nodes={elements.filter(e => !e.source)}
        edges={elements.filter(e => e.source)}
        onNodeClick={onNodeClick}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>

      {/* Side Panel for Analysis Output */}
      {selectedNode && (
        <div style={{
          position: "absolute", right: 20, top: 80, width: 350, maxHeight: '80vh',
          background: "white", padding: 20, borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          overflowY: 'auto', zIndex: 1000
        }}>
          <h3>Module: {selectedNode.data.label}</h3>
          <p><strong>Functions:</strong></p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{selectedNode.data.info}</pre>
          
          <hr />
          
          <h4>AI Impact Analysis</h4>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              {analysisResult ? (
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: typeof window.marked !== 'undefined' 
                      ? window.marked.parse(analysisResult) 
                      : analysisResult.replace(/\n/g, '<br>') 
                  }} 
                />
              ) : (
                <p>Select a node and click 'Analyze Impact'</p>
              )}
            </div>
        </div>
      )}
    </div>
  );
}

export default NervousSystem;