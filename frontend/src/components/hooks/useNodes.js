import { useState, useCallback } from 'react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';

export function useNodes(initialNodes = [], initialEdges = []) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [clipboard, setClipboard] = useState(null);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    []
  );

  const addNode = useCallback((type, position, data = {}) => {
    const id = `node_${Date.now()}`;
    const newNode = {
      id,
      type,
      position,
      data: { label: type, ...data },
    };
    setNodes((nds) => [...nds, newNode]);
    return newNode;
  }, []);

  const updateNode = useCallback((id, data) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n))
    );
  }, []);

  const removeNode = useCallback((id) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    if (selectedNode?.id === id) setSelectedNode(null);
  }, [selectedNode]);

  const duplicateNode = useCallback((id) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    const newNode = {
      ...node,
      id: `node_${Date.now()}`,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
    };
    setNodes((nds) => [...nds, newNode]);
    return newNode;
  }, [nodes]);

  const copyNode = useCallback((id) => {
    const node = nodes.find((n) => n.id === id);
    if (node) setClipboard(node);
  }, [nodes]);

  const pasteNode = useCallback((offset = { x: 40, y: 40 }) => {
    if (!clipboard) return;
    const newNode = {
      ...clipboard,
      id: `node_${Date.now()}`,
      position: {
        x: clipboard.position.x + offset.x,
        y: clipboard.position.y + offset.y,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    return newNode;
  }, [clipboard]);

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
  }, []);

  const loadGraph = useCallback(({ nodes: n = [], edges: e = [] }) => {
    setNodes(n);
    setEdges(e);
  }, []);

  const getGraph = useCallback(() => ({ nodes, edges }), [nodes, edges]);

  return {
    nodes,
    edges,
    selectedNode,
    setSelectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNode,
    removeNode,
    duplicateNode,
    copyNode,
    pasteNode,
    clearCanvas,
    loadGraph,
    getGraph,
  };
}
