import React, { useEffect, useState } from "react";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";
import axios from "axios";
import {
  getLayoutedElements
} from "../utils/layout";
import CustomNode from "../components/CustomNode";

function NervousSystem() {

  const [elements, setElements] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchGraph();
  }, []);  //[selectedNode]

  // ---------------------------------
  // CUSTOM NODE TYPES
  // ---------------------------------

  const nodeTypes = {
    custom: CustomNode
  };

  // ---------------------------------
  // FETCH GRAPH FROM BACKEND
  // ---------------------------------

  const fetchGraph = async () => {

    try {

      const res = await axios.get(
        "http://127.0.0.1:3000/graph"
      );

      const data = res.data;

      console.log("🧠 GRAPH DATA:", data);

      // -----------------------------
      // DYNAMIC NODES
      // -----------------------------

      const nodes = data.nodes.map(
        (node, index) => ({

          id: node.id,

          position: {
            x: 250 * index,
            y: 200
          },

          data: {
            label: node.label,
            info: node.info.join("\n")
          },

          style: {
            border:
              node.id === selectedNode?.id
                ? "3px solid #ff0072"
                : "1px solid #555",

            background:
              node.id === selectedNode?.id
                ? "#ffe6f2"
                : "#fff",

            background:
              node.severity === "critical"
                ? "#ffcccc"
                : "#ffffff"
          },

          type: "custom"
        })
      );

      // -----------------------------
      // DYNAMIC EDGES
      // -----------------------------

      const edges = data.edges.map((edge, index) => {
        const isConnected =
          edge.source === selectedNode?.id ||
          edge.target === selectedNode?.id;
        return {
          id: `e${index}`,
          source: edge.source,
          target: edge.target,
          animated: isConnected,
          style: {
            stroke: isConnected
              ? "#ff0072"
              : "#999",
            strokeWidth: isConnected
              ? 3
              : 1
          }
        };
      });

      const layouted =
        getLayoutedElements(
          nodes,
          edges
        );
      setElements([
        ...layouted.nodes,
        ...layouted.edges
      ]);

    } catch (err) {

      console.error(
        "Graph Fetch Error:",
        err
      );
    }
  };
  const onNodeClick = (event, node) => {
    setSelectedNode(node);
  };

  const runImpactAnalysis = async () => {

  const res = await axios.post(
    "http://127.0.0.1:3000/impact-analysis",
    {
      selectedNode
    }
  );

  alert(res.data.analysis);


  // ---------------------------------
  // UI
  // ---------------------------------

  return (

    <div style={{
      width: "100%",
      height: "90vh"
    }}>

      <h2 style={{
        padding: 10
      }}>
        AI Nervous System
      </h2>
      
      <input
        type="text"
        placeholder="Search module"
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        style={{
          margin: 10,
          padding: 10,
          width: 250
        }}
      />

      <ReactFlow
        nodes={elements.filter(
          e => !e.source
        )}
        edges={elements.filter(
          e => e.source
        )}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
      />
      {
        selectedNode && (

          <div
            style={{
              position: "absolute",
              right: 20,
              top: 100,
              width: 300,
              background: "white",
              padding: 20,
              borderRadius: 10,
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.2)",
              // border: node.label.toLowerCase().includes(search.toLowerCase())
              //   ? "3px solid #ff0072"
              //   : "1px solid #555"
            }}
          >

            <h3>
              {selectedNode.data.label}
            </h3>

            <pre>
              {selectedNode.data.info}
            </pre>

          </div>
        )
      }
      {
        selectedNode && (

          <div className="kt-panel">

            <h3>
              {selectedNode.data.label}
            </h3>

            <pre>
              {selectedNode.data.info}
            </pre>

          </div>
        )
      }
      <button onClick={runImpactAnalysis}>
        Analyze Impact
      </button>
    </div>
  );
}

};

export default NervousSystem;