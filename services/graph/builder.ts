import type {
  ApiEndpoint,
  ApiGraphEdge,
  ApiGraphNode,
  SuggestedWorkflow,
} from "@/types/platform";

export function buildApiGraph(
  endpoints: ApiEndpoint[],
  authPatterns: Array<{ type: string; description: string }>,
  workflows: SuggestedWorkflow[] = []
): { nodes: ApiGraphNode[]; edges: ApiGraphEdge[] } {
  const nodes: ApiGraphNode[] = [];
  const edges: ApiGraphEdge[] = [];

  if (authPatterns.length > 0) {
    nodes.push({
      id: "auth-root",
      type: "auth",
      label: authPatterns.at(0)?.type ?? "Auth",
      data: { description: authPatterns.at(0)?.description },
      position: { x: 400, y: 50 },
    });
  }

  const resourceGroups = new Map<string, ApiEndpoint[]>();
  for (const endpoint of endpoints) {
    const resource = endpoint.path.split("/").filter(Boolean).at(0) ?? "api";
    const existing = resourceGroups.get(resource) ?? [];
    existing.push(endpoint);
    resourceGroups.set(resource, existing);
  }

  let resourceIndex = 0;
  for (const [resource, groupEndpoints] of resourceGroups) {
    const resourceNodeId = `resource-${resource}`;
    const xBase = 100 + (resourceIndex % 4) * 220;
    const yBase = 200 + Math.floor(resourceIndex / 4) * 180;

    nodes.push({
      id: resourceNodeId,
      type: "resource",
      label: resource,
      data: { endpointCount: groupEndpoints.length },
      position: { x: xBase, y: yBase },
    });

    if (authPatterns.length > 0) {
      edges.push({
        id: `auth-${resource}`,
        source: "auth-root",
        target: resourceNodeId,
        label: "authenticates",
        animated: true,
      });
    }

    for (const [i, endpoint] of groupEndpoints.entries()) {
      const nodeId = `endpoint-${endpoint.id}`;
      nodes.push({
        id: nodeId,
        type: "endpoint",
        label: `${endpoint.method} ${endpoint.path}`,
        data: {
          method: endpoint.method,
          path: endpoint.path,
          summary: endpoint.summary,
          auth: endpoint.auth,
        },
        position: {
          x: xBase + (i % 2) * 100,
          y: yBase + 80 + Math.floor(i / 2) * 60,
        },
      });

      edges.push({
        id: `${resourceNodeId}-${nodeId}`,
        source: resourceNodeId,
        target: nodeId,
        label: endpoint.method,
      });
    }

    resourceIndex++;
  }

  workflows.forEach((workflow, workflowIndex) => {
    const workflowNodeId = `workflow-${workflow.id}`;
    const workflowX = 120 + (workflowIndex % 3) * 300;
    const workflowY =
      260 + Math.ceil(resourceGroups.size / 4) * 180 + workflowIndex * 36;

    nodes.push({
      id: workflowNodeId,
      type: "workflow",
      label: workflow.name,
      data: {
        category: workflow.category,
        confidence: workflow.confidence,
        description: workflow.description,
        complexity: workflow.complexity,
        stepCount: workflow.steps.length,
      },
      position: { x: workflowX, y: workflowY },
    });

    workflow.relatedEndpoints.slice(0, 4).forEach((endpointId, stepIndex) => {
      const endpointNodeId = `endpoint-${endpointId}`;
      if (!nodes.some((node) => node.id === endpointNodeId)) {
        return;
      }
      edges.push({
        id: `${workflowNodeId}-${endpointNodeId}-${String(stepIndex)}`,
        source: workflowNodeId,
        target: endpointNodeId,
        label: `step ${String(stepIndex + 1)}`,
        animated: true,
      });
    });
  });

  return { nodes, edges };
}
