import { asi1GenerateText } from "@/lib/asi1/client";

export interface WorkflowStep {
  name: string;
  description: string;
  inputParameters: string[];
  outputParameters: string[];
  errorHandling: string;
  alternatives?: string[];
}

export interface DetectedWorkflow {
  name: string;
  description: string;
  useCase: string;
  steps: WorkflowStep[];
  integrationPoints: string[];
  complexity: "simple" | "moderate" | "complex";
  estimatedTime: string;
}

export interface WorkflowDetectionResult {
  workflows: DetectedWorkflow[];
  commonPatterns: string[];
  recommendations: string[];
}

export async function detectWorkflows(
  documentationContent: string,
  projectName: string
): Promise<WorkflowDetectionResult> {
  const prompt = `Analyze the documentation and extract typical workflows/use cases.

Documentation (first 5000 chars):
${documentationContent.slice(0, 5000)}

Project: ${projectName}

For each workflow, provide:
{
  "workflows": [
    {
      "name": "workflow name",
      "description": "what it does",
      "useCase": "when to use it",
      "steps": [
        {
          "name": "step name",
          "description": "what happens",
          "inputParameters": ["param1", "param2"],
          "outputParameters": ["output1", "output2"],
          "errorHandling": "how errors are handled",
          "alternatives": ["alternative approaches"]
        }
      ],
      "integrationPoints": ["external apis"],
      "complexity": "simple|moderate|complex",
      "estimatedTime": "estimated execution time"
    }
  ],
  "commonPatterns": ["list of common patterns"],
  "recommendations": ["optimization recommendations"]
}`;

  const response = await asi1GenerateText(
    [
      {
        role: "system",
        content:
          "You are an expert AI workflow architect. Return valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    {
      max_tokens: 2048,
    }
  );

  const text = response.text;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        workflows: parsed.workflows || [],
        commonPatterns: parsed.commonPatterns || [],
        recommendations: parsed.recommendations || [],
      };
    }
  } catch {
    return {
      workflows: [],
      commonPatterns: [],
      recommendations: [],
    };
  }

  return {
    workflows: [],
    commonPatterns: [],
    recommendations: [],
  };
}

export async function generateWorkflowCode(
  workflow: DetectedWorkflow,
  language = "typescript"
): Promise<string> {
  const stepsDesc = workflow.steps
    .map((s) => `${s.name}: ${s.description}`)
    .join("\n");

  const prompt = `Generate ${language} code implementing this workflow:
Name: ${workflow.name}
Description: ${workflow.description}
Steps:
${stepsDesc}

Include:
1. Class/function structure
2. Error handling
3. Input/output validation
4. Logging
5. Type definitions

Return production-ready code.`;

  const response = await asi1GenerateText(
    [
      {
        role: "system",
        content:
          "You generate production-ready workflow implementation code. Return code only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    {
      max_tokens: 2048,
    }
  );

  return response.text;
}

export function workflowToMermaid(workflow: DetectedWorkflow): string {
  let mermaid = "graph TD\n";
  let nodeId = 0;

  mermaid += `  Start[${workflow.name}]\n`;
  nodeId++;

  for (const step of workflow.steps) {
    mermaid += `  Node${nodeId}["${step.name}"]\n`;
    mermaid += `  Start --> Node${nodeId}\n`;
    nodeId++;
  }

  mermaid += `  Node${nodeId}[End]\n`;
  mermaid += `  Node${nodeId - 1} --> Node${nodeId}\n`;

  return mermaid;
}
