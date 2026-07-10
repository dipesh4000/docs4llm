import type {
  AiWorkflowStep,
  ApiEndpoint,
  AuthType,
  CompressedTool,
  SuggestedWorkflow,
  WorkflowCategory,
  WorkflowComplexity,
  WorkflowDetection,
} from "@/types/platform";

const AUTH_PATTERN = /\b(auth|oauth|token|login|session|key|bearer)\b/i;
const PAYMENT_PATTERN = /\b(payment|charge|checkout|invoice|refund|billing)\b/i;
const UPLOAD_PATTERN = /\b(upload|file|media|attachment|image|document)\b/i;
const WEBHOOK_PATTERN = /\b(webhook|event|callback|subscribe|notification)\b/i;
const SUBSCRIPTION_PATTERN = /\b(subscription|plan|recurring|seat|trial)\b/i;
const SUPPORT_PATTERN = /\b(ticket|support|case|conversation|message)\b/i;
const CRUD_METHODS = new Set(["GET", "POST", "PATCH", "PUT", "DELETE"]);

type RawWorkflow = {
  name?: string;
  description?: string;
  useCase?: string;
  category?: string;
  complexity?: string;
  confidence?: number;
  steps?: Array<string | Partial<AiWorkflowStep>>;
};

type WorkflowEngineInput = {
  parsedWorkflows: RawWorkflow[];
  endpoints: ApiEndpoint[];
  tools: CompressedTool[];
  authPatterns: Array<{ type: string; description: string }>;
  useCases: string[];
  projectName: string;
};

const CATEGORY_LABEL: Record<WorkflowCategory, string> = {
  auth: "Authentication",
  payment: "Billing",
  upload: "Uploads",
  webhook: "Webhooks",
  crud: "Resource Management",
  subscription: "Subscriptions",
  support: "Support",
  automation: "Automation",
  custom: "Custom",
};

export function inferWorkflowDetection({
  parsedWorkflows,
  endpoints,
  tools,
  authPatterns,
  useCases,
  projectName,
}: WorkflowEngineInput): WorkflowDetection {
  const detectedPatterns = detectPatterns(endpoints, tools, authPatterns);
  const normalized = normalizeParsedWorkflows({
    parsedWorkflows,
    endpoints,
    tools,
    projectName,
  });
  const generated = generatePatternWorkflows({
    patterns: detectedPatterns,
    endpoints,
    tools,
    projectName,
    useCases,
  });
  const workflows = dedupeWorkflows([...normalized, ...generated]).slice(0, 8);
  const confidence = calculateWorkflowConfidence(workflows, detectedPatterns);

  return {
    workflows,
    detectedPatterns,
    recommendations: buildRecommendations({
      workflows,
      patterns: detectedPatterns,
      tools,
      endpoints,
    }),
    confidence,
  };
}

function normalizeParsedWorkflows({
  parsedWorkflows,
  endpoints,
  tools,
  projectName,
}: {
  parsedWorkflows: RawWorkflow[];
  endpoints: ApiEndpoint[];
  tools: CompressedTool[];
  projectName: string;
}): SuggestedWorkflow[] {
  return parsedWorkflows
    .filter((workflow) => typeof workflow.name === "string")
    .map((workflow, index) => {
      const category = normalizeCategory(workflow.category ?? workflow.name);
      const relatedTools = pickRelatedTools(category, tools).map(
        (tool) => tool.name
      );
      const relatedEndpoints = pickRelatedEndpoints(category, endpoints).map(
        (endpoint) => endpoint.id
      );
      const steps = normalizeSteps({
        rawSteps: workflow.steps ?? [],
        category,
        relatedTools,
        relatedEndpoints,
      });

      return {
        id: `workflow-ai-${slugify(workflow.name ?? "workflow")}-${String(index)}`,
        name: workflow.name ?? `${CATEGORY_LABEL[category]} Workflow`,
        description:
          workflow.description ??
          `AI-ready ${CATEGORY_LABEL[category].toLowerCase()} workflow inferred from ${projectName} documentation.`,
        useCase:
          workflow.useCase ??
          `Use when an agent needs to complete a ${CATEGORY_LABEL[category].toLowerCase()} task end-to-end.`,
        category,
        complexity: normalizeComplexity(workflow.complexity, steps.length),
        confidence: clampScore(workflow.confidence ?? 82),
        steps,
        agentPrompt: buildAgentPrompt({
          projectName,
          name: workflow.name ?? `${CATEGORY_LABEL[category]} Workflow`,
          category,
          steps,
        }),
        requiredAuth: inferRequiredAuth(relatedEndpoints, endpoints),
        relatedTools,
        relatedEndpoints,
      };
    });
}

function normalizeSteps({
  rawSteps,
  category,
  relatedTools,
  relatedEndpoints,
}: {
  rawSteps: Array<string | Partial<AiWorkflowStep>>;
  category: WorkflowCategory;
  relatedTools: string[];
  relatedEndpoints: string[];
}): AiWorkflowStep[] {
  if (rawSteps.length === 0) {
    return defaultSteps(category, relatedTools, relatedEndpoints);
  }

  return rawSteps.map((step, index) => {
    const fallbackName = `Step ${String(index + 1)}`;
    if (typeof step === "string") {
      return {
        id: `step-${String(index + 1)}`,
        name: step,
        description: step,
        type: categoryToStepType(category),
        toolName: relatedTools.at(index) ?? relatedTools.at(0),
        endpointIds: relatedEndpoints.length > 0 ? relatedEndpoints : undefined,
        confidence: 78,
      };
    }
    return {
      id: step.id ?? `step-${String(index + 1)}`,
      name: step.name ?? fallbackName,
      description: step.description ?? step.name ?? fallbackName,
      type: step.type ?? categoryToStepType(category),
      toolName: step.toolName ?? relatedTools.at(index) ?? relatedTools.at(0),
      endpointIds: step.endpointIds ?? relatedEndpoints,
      inputs: step.inputs,
      outputs: step.outputs,
      confidence: clampScore(step.confidence ?? 80),
    };
  });
}

function detectPatterns(
  endpoints: ApiEndpoint[],
  tools: CompressedTool[],
  authPatterns: Array<{ type: string; description: string }>
): WorkflowCategory[] {
  const haystack = [
    ...endpoints.map((endpoint) =>
      [
        endpoint.method,
        endpoint.path,
        endpoint.summary,
        endpoint.description,
        ...(endpoint.tags ?? []),
      ].join(" ")
    ),
    ...tools.map((tool) => [tool.name, tool.description].join(" ")),
    ...authPatterns.map((auth) => `${auth.type} ${auth.description}`),
  ].join("\n");

  const categories: WorkflowCategory[] = [];
  if (AUTH_PATTERN.test(haystack) || authPatterns.length > 0) {
    categories.push("auth");
  }
  if (PAYMENT_PATTERN.test(haystack)) {
    categories.push("payment");
  }
  if (UPLOAD_PATTERN.test(haystack)) {
    categories.push("upload");
  }
  if (WEBHOOK_PATTERN.test(haystack)) {
    categories.push("webhook");
  }
  if (SUBSCRIPTION_PATTERN.test(haystack)) {
    categories.push("subscription");
  }
  if (SUPPORT_PATTERN.test(haystack)) {
    categories.push("support");
  }
  if (hasCrudPattern(endpoints)) {
    categories.push("crud");
  }
  if (tools.length > 0) {
    categories.push("automation");
  }
  return Array.from(new Set(categories));
}

function generatePatternWorkflows({
  patterns,
  endpoints,
  tools,
  projectName,
  useCases,
}: {
  patterns: WorkflowCategory[];
  endpoints: ApiEndpoint[];
  tools: CompressedTool[];
  projectName: string;
  useCases: string[];
}): SuggestedWorkflow[] {
  return patterns.map((category, index) => {
    const relatedTools = pickRelatedTools(category, tools).map(
      (tool) => tool.name
    );
    const relatedEndpoints = pickRelatedEndpoints(category, endpoints).map(
      (endpoint) => endpoint.id
    );
    const steps = defaultSteps(category, relatedTools, relatedEndpoints);
    const name = defaultWorkflowName(category, projectName);

    return {
      id: `workflow-${category}-${String(index)}`,
      name,
      description: defaultWorkflowDescription(category, projectName),
      useCase:
        useCases.find((useCase) => categoryMatchesText(category, useCase)) ??
        defaultUseCase(category),
      category,
      complexity: complexityFromSignals(steps.length, relatedEndpoints.length),
      confidence: workflowConfidence(category, relatedTools, relatedEndpoints),
      steps,
      agentPrompt: buildAgentPrompt({ projectName, name, category, steps }),
      requiredAuth: inferRequiredAuth(relatedEndpoints, endpoints),
      relatedTools,
      relatedEndpoints,
    };
  });
}

function defaultSteps(
  category: WorkflowCategory,
  relatedTools: string[],
  relatedEndpoints: string[]
): AiWorkflowStep[] {
  const firstTool = relatedTools.at(0);
  const secondTool = relatedTools.at(1) ?? firstTool;

  if (category === "auth") {
    return [
      workflowStep(
        "detect-auth",
        "Detect auth requirements",
        "Identify required token, OAuth, API key, or environment configuration.",
        "auth",
        firstTool,
        relatedEndpoints,
        88
      ),
      workflowStep(
        "validate-auth",
        "Validate credentials",
        "Run a safe request or schema check before invoking protected tools.",
        "condition",
        secondTool,
        relatedEndpoints,
        82
      ),
      workflowStep(
        "call-protected-tool",
        "Call protected tool",
        "Invoke the target MCP tool with validated auth context.",
        "api",
        secondTool,
        relatedEndpoints,
        80
      ),
    ];
  }

  if (category === "payment") {
    return [
      workflowStep(
        "lookup-customer",
        "Find or create customer",
        "Resolve the customer record before billing operations.",
        "api",
        firstTool,
        relatedEndpoints,
        84
      ),
      workflowStep(
        "create-payment",
        "Create payment action",
        "Create charge, invoice, checkout session, or refund based on intent.",
        "payment",
        secondTool,
        relatedEndpoints,
        82
      ),
      workflowStep(
        "confirm-result",
        "Confirm billing result",
        "Inspect returned status and surface next action to the agent.",
        "condition",
        relatedTools.at(2) ?? secondTool,
        relatedEndpoints,
        80
      ),
    ];
  }

  if (category === "upload") {
    return [
      workflowStep(
        "prepare-file",
        "Prepare file metadata",
        "Validate filename, content type, size, and destination.",
        "data",
        firstTool,
        relatedEndpoints,
        82
      ),
      workflowStep(
        "upload-file",
        "Upload file",
        "Submit binary or multipart payload through the generated MCP tool.",
        "upload",
        secondTool,
        relatedEndpoints,
        82
      ),
      workflowStep(
        "attach-reference",
        "Attach uploaded reference",
        "Use the returned file identifier in a downstream workflow.",
        "api",
        relatedTools.at(2) ?? secondTool,
        relatedEndpoints,
        78
      ),
    ];
  }

  if (category === "webhook") {
    return [
      workflowStep(
        "register-webhook",
        "Register webhook endpoint",
        "Create or update event subscriptions with the desired callback URL.",
        "webhook",
        firstTool,
        relatedEndpoints,
        82
      ),
      workflowStep(
        "verify-signature",
        "Verify event signature",
        "Validate incoming events before executing agent actions.",
        "condition",
        secondTool,
        relatedEndpoints,
        84
      ),
      workflowStep(
        "route-event",
        "Route event to workflow",
        "Map event types to downstream agent tools.",
        "ai",
        relatedTools.at(2) ?? secondTool,
        relatedEndpoints,
        78
      ),
    ];
  }

  if (category === "subscription") {
    return [
      workflowStep(
        "select-plan",
        "Select plan",
        "Resolve plan, seat, and billing interval from user intent.",
        "data",
        firstTool,
        relatedEndpoints,
        80
      ),
      workflowStep(
        "apply-subscription",
        "Create or update subscription",
        "Create, upgrade, downgrade, cancel, or renew subscription state.",
        "payment",
        secondTool,
        relatedEndpoints,
        82
      ),
      workflowStep(
        "sync-entitlements",
        "Sync entitlements",
        "Return the access changes an agent should apply after billing succeeds.",
        "api",
        relatedTools.at(2) ?? secondTool,
        relatedEndpoints,
        80
      ),
    ];
  }

  if (category === "support") {
    return [
      workflowStep(
        "summarize-request",
        "Summarize request",
        "Extract the user's issue, account context, and severity.",
        "ai",
        firstTool,
        relatedEndpoints,
        78
      ),
      workflowStep(
        "create-ticket",
        "Create or update ticket",
        "Open the relevant support record with structured metadata.",
        "api",
        secondTool,
        relatedEndpoints,
        82
      ),
      workflowStep(
        "suggest-response",
        "Suggest response",
        "Return an agent-ready answer with ticket reference and next steps.",
        "ai",
        relatedTools.at(2) ?? secondTool,
        relatedEndpoints,
        78
      ),
    ];
  }

  return [
    workflowStep(
      "understand-intent",
      "Understand user intent",
      "Map natural language request to the most relevant semantic tool.",
      "ai",
      firstTool,
      relatedEndpoints,
      80
    ),
    workflowStep(
      "execute-tool",
      "Execute semantic tool",
      "Run the generated MCP tool instead of exposing raw endpoint calls.",
      "api",
      secondTool,
      relatedEndpoints,
      82
    ),
    workflowStep(
      "validate-output",
      "Validate output",
      "Check returned data and explain follow-up options to the agent.",
      "condition",
      relatedTools.at(2) ?? secondTool,
      relatedEndpoints,
      78
    ),
  ];
}

function workflowStep(
  id: string,
  name: string,
  description: string,
  type: AiWorkflowStep["type"],
  toolName: string | undefined,
  endpointIds: string[],
  confidence: number
): AiWorkflowStep {
  return {
    id,
    name,
    description,
    type,
    toolName,
    endpointIds: endpointIds.length > 0 ? endpointIds : undefined,
    confidence,
  };
}

function pickRelatedTools(
  category: WorkflowCategory,
  tools: CompressedTool[]
): CompressedTool[] {
  const matching = tools.filter((tool) =>
    categoryMatchesText(category, `${tool.name} ${tool.description}`)
  );
  return (matching.length > 0 ? matching : tools).slice(0, 4);
}

function pickRelatedEndpoints(
  category: WorkflowCategory,
  endpoints: ApiEndpoint[]
): ApiEndpoint[] {
  const matching = endpoints.filter((endpoint) =>
    categoryMatchesText(
      category,
      [
        endpoint.method,
        endpoint.path,
        endpoint.summary,
        endpoint.description,
        ...(endpoint.tags ?? []),
      ].join(" ")
    )
  );
  return (matching.length > 0 ? matching : endpoints).slice(0, 6);
}

function categoryMatchesText(
  category: WorkflowCategory,
  text: string
): boolean {
  if (category === "auth") {
    return AUTH_PATTERN.test(text);
  }
  if (category === "payment") {
    return PAYMENT_PATTERN.test(text);
  }
  if (category === "upload") {
    return UPLOAD_PATTERN.test(text);
  }
  if (category === "webhook") {
    return WEBHOOK_PATTERN.test(text);
  }
  if (category === "subscription") {
    return SUBSCRIPTION_PATTERN.test(text);
  }
  if (category === "support") {
    return SUPPORT_PATTERN.test(text);
  }
  if (category === "crud") {
    return CRUD_METHODS.has(text.trim().toUpperCase());
  }
  return true;
}

function hasCrudPattern(endpoints: ApiEndpoint[]): boolean {
  const methodsByResource = new Map<string, Set<string>>();
  for (const endpoint of endpoints) {
    const resource = endpoint.path.split("/").filter(Boolean).at(0) ?? "api";
    const existing = methodsByResource.get(resource) ?? new Set<string>();
    existing.add(endpoint.method.toUpperCase());
    methodsByResource.set(resource, existing);
  }
  for (const methods of methodsByResource.values()) {
    if (
      methods.size >= 2 &&
      Array.from(methods).some((method) => CRUD_METHODS.has(method))
    ) {
      return true;
    }
  }
  return false;
}

function normalizeCategory(value: string | undefined): WorkflowCategory {
  const text = value ?? "";
  if (AUTH_PATTERN.test(text)) {
    return "auth";
  }
  if (PAYMENT_PATTERN.test(text)) {
    return "payment";
  }
  if (UPLOAD_PATTERN.test(text)) {
    return "upload";
  }
  if (WEBHOOK_PATTERN.test(text)) {
    return "webhook";
  }
  if (SUBSCRIPTION_PATTERN.test(text)) {
    return "subscription";
  }
  if (SUPPORT_PATTERN.test(text)) {
    return "support";
  }
  if (/\b(create|update|delete|list|manage|crud)\b/i.test(text)) {
    return "crud";
  }
  return "automation";
}

function categoryToStepType(
  category: WorkflowCategory
): AiWorkflowStep["type"] {
  if (category === "auth") {
    return "auth";
  }
  if (category === "payment" || category === "subscription") {
    return "payment";
  }
  if (category === "upload") {
    return "upload";
  }
  if (category === "webhook") {
    return "webhook";
  }
  return "api";
}

function normalizeComplexity(
  complexity: string | undefined,
  stepCount: number
): WorkflowComplexity {
  if (
    complexity === "simple" ||
    complexity === "moderate" ||
    complexity === "complex"
  ) {
    return complexity;
  }
  return complexityFromSignals(stepCount, stepCount);
}

function complexityFromSignals(
  stepCount: number,
  endpointCount: number
): WorkflowComplexity {
  if (stepCount >= 5 || endpointCount >= 6) {
    return "complex";
  }
  if (stepCount >= 3 || endpointCount >= 3) {
    return "moderate";
  }
  return "simple";
}

function workflowConfidence(
  category: WorkflowCategory,
  relatedTools: string[],
  relatedEndpoints: string[]
): number {
  const base = category === "automation" ? 74 : 80;
  return clampScore(base + relatedTools.length * 3 + relatedEndpoints.length);
}

function calculateWorkflowConfidence(
  workflows: SuggestedWorkflow[],
  patterns: WorkflowCategory[]
): number {
  if (workflows.length === 0) {
    return 35;
  }
  const average =
    workflows.reduce((sum, workflow) => sum + workflow.confidence, 0) /
    workflows.length;
  return clampScore(Math.round(average + Math.min(patterns.length, 5)));
}

function inferRequiredAuth(
  endpointIds: string[],
  endpoints: ApiEndpoint[]
): AuthType[] | undefined {
  const auth = new Set<AuthType>();
  for (const endpoint of endpoints) {
    if (
      endpointIds.includes(endpoint.id) &&
      endpoint.auth &&
      endpoint.auth !== "none"
    ) {
      auth.add(endpoint.auth);
    }
  }
  return auth.size > 0 ? Array.from(auth) : undefined;
}

function buildAgentPrompt({
  projectName,
  name,
  category,
  steps,
}: {
  projectName: string;
  name: string;
  category: WorkflowCategory;
  steps: AiWorkflowStep[];
}): string {
  const stepList = steps
    .map(
      (step, index) => `${String(index + 1)}. ${step.name}: ${step.description}`
    )
    .join("\n");
  return `You are a ${projectName} ${CATEGORY_LABEL[category]} agent. Complete the workflow "${name}" by choosing semantic MCP tools, not raw endpoints.\n\nWorkflow:\n${stepList}\n\nBefore each tool call, verify required inputs. After each call, inspect output status and explain the next action.`;
}

function buildRecommendations({
  workflows,
  patterns,
  tools,
  endpoints,
}: {
  workflows: SuggestedWorkflow[];
  patterns: WorkflowCategory[];
  tools: CompressedTool[];
  endpoints: ApiEndpoint[];
}): string[] {
  const recommendations: string[] = [];
  if (patterns.includes("auth")) {
    recommendations.push(
      "Expose auth setup as a first-class MCP resource so agents know which secrets or OAuth scopes are required."
    );
  }
  if (workflows.length > tools.length && tools.length > 0) {
    recommendations.push(
      "Consider merging overlapping workflows into higher-level agent prompts to reduce tool-selection ambiguity."
    );
  }
  if (endpoints.length > tools.length * 8 && tools.length > 0) {
    recommendations.push(
      "Keep semantic compression enabled: this API has many endpoints relative to generated tools."
    );
  }
  if (patterns.includes("webhook")) {
    recommendations.push(
      "Add webhook signature verification examples to improve agent reliability around event-driven workflows."
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Generated workflows are ready for the playground. Validate them with real tool calls before sharing with production agents."
    );
  }
  return recommendations;
}

function dedupeWorkflows(workflows: SuggestedWorkflow[]): SuggestedWorkflow[] {
  const seen = new Set<string>();
  const deduped: SuggestedWorkflow[] = [];
  for (const workflow of workflows) {
    const key = `${workflow.category}:${slugify(workflow.name)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(workflow);
  }
  return deduped;
}

function defaultWorkflowName(
  category: WorkflowCategory,
  projectName: string
): string {
  if (category === "support") {
    return "Customer Support Agent";
  }
  if (category === "payment") {
    return "Billing Agent";
  }
  if (category === "subscription") {
    return "Subscription Lifecycle Agent";
  }
  if (category === "webhook") {
    return "Webhook Automation Agent";
  }
  if (category === "auth") {
    return "Auth Setup Agent";
  }
  if (category === "upload") {
    return "Upload Workflow Agent";
  }
  if (category === "crud") {
    return `${projectName} Resource Management Toolkit`;
  }
  return `${projectName} Automation Agent`;
}

function defaultWorkflowDescription(
  category: WorkflowCategory,
  projectName: string
): string {
  return `Suggested AI workflow for ${projectName} ${CATEGORY_LABEL[category].toLowerCase()} tasks, built from docs, endpoints, and generated MCP tools.`;
}

function defaultUseCase(category: WorkflowCategory): string {
  if (category === "payment") {
    return "Use for customer billing, invoice, checkout, refund, and payment-resolution agents.";
  }
  if (category === "support") {
    return "Use for customer support agents that need to inspect account state and take safe follow-up actions.";
  }
  if (category === "webhook") {
    return "Use for event-driven automations that turn webhook events into agent actions.";
  }
  if (category === "subscription") {
    return "Use for plan upgrades, cancellations, renewals, and entitlement sync.";
  }
  return "Use when an agent needs a guided multi-step interaction instead of isolated tool calls.";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
