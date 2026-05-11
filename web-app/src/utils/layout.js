import dagre from "dagre";

const dagreGraph = new dagre.graphlib.Graph();

dagreGraph.setDefaultEdgeLabel(
  () => ({})
);

export const getLayoutedElements = (
  nodes,
  edges
) => {

  dagreGraph.setGraph({
    rankdir: "LR"
  });

  nodes.forEach((node) => {

    dagreGraph.setNode(node.id, {
      width: 180,
      height: 60
    });
  });

  edges.forEach((edge) => {

    dagreGraph.setEdge(
      edge.source,
      edge.target
    );
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {

    const position =
      dagreGraph.node(node.id);

    node.position = {
      x: position.x,
      y: position.y
    };
  });

  return { nodes, edges };
};