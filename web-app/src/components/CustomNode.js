import { Handle } from "reactflow";

function CustomNode({ data }) {

  return (

    <div
      title={data.info}
      style={{
        padding: 15,
        border: "2px solid #555",
        borderRadius: 10,
        background: "white",
        width: 150,
        textAlign: "center",
        fontWeight: "bold",
        cursor: "pointer"
      }}
    >

      <Handle
        type="target"
        position="top"
      />

      {data.label}

      <Handle
        type="source"
        position="bottom"
      />

    </div>
  );
}

export default CustomNode;