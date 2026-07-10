import { asi1GenerateText } from "@/lib/asi1/client";

export interface AuthMethod {
  type: "api_key" | "oauth2" | "bearer" | "basic" | "jwt" | "custom" | "none";
  description: string;
  headerName?: string;
  format?: string;
  scopes?: string[];
  endpoints?: string[];
}

export interface AuthInference {
  methods: AuthMethod[];
  confidence: number;
  summary: string;
  securityConsiderations: string[];
}

export async function inferAuthMethods(
  documentationContent: string,
  projectName: string
): Promise<AuthInference> {
  const prompt = `Analyze the following documentation and identify all authentication methods used. 
  
Documentation:
${documentationContent.slice(0, 5000)}

Project: ${projectName}

Return a JSON object with:
{
  "methods": [
    {
      "type": "api_key|oauth2|bearer|basic|jwt|custom|none",
      "description": "How to use this auth method",
      "headerName": "header name if applicable",
      "format": "format of the key/token",
      "scopes": ["list of scopes if OAuth"],
      "endpoints": ["which endpoints use this auth"]
    }
  ],
  "confidence": 0.0-1.0,
  "summary": "Brief summary of auth requirements",
  "securityConsiderations": ["list of security notes"]
}`;

  const response = await asi1GenerateText(
    [
      {
        role: "system",
        content:
          "You are a senior API security engineer. Return valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    {
      max_tokens: 1024,
    }
  );

  const text = response.text;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        methods: parsed.methods || [],
        confidence: parsed.confidence || 0,
        summary: parsed.summary || "",
        securityConsiderations: parsed.securityConsiderations || [],
      };
    }
  } catch {
    return {
      methods: [],
      confidence: 0,
      summary: "Unable to determine authentication methods",
      securityConsiderations: [],
    };
  }

  return {
    methods: [],
    confidence: 0,
    summary: "Unable to determine authentication methods",
    securityConsiderations: [],
  };
}

export async function generateAuthImplementation(
  authMethods: AuthMethod[],
  framework = "typescript"
): Promise<string> {
  const methodsDesc = authMethods
    .map((m) => `- ${m.type}: ${m.description}`)
    .join("\n");

  const prompt = `Generate ${framework} code for implementing the following authentication methods:
${methodsDesc}

Include:
1. Client initialization
2. Header/token setup
3. Error handling
4. Token refresh logic if applicable

Return production-ready code with comments.`;

  const response = await asi1GenerateText(
    [
      {
        role: "system",
        content:
          "You generate secure API authentication implementation code. Return code only.",
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
