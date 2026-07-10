import { asi1GenerateText } from "@/lib/asi1/client";

export interface ParsedDocument {
  title: string;
  source: string;
  sections: DocumentSection[];
  keywords: string[];
  summary: string;
  contentType: "api" | "guide" | "reference" | "tutorial" | "unknown";
}

export interface DocumentSection {
  heading: string;
  level: number;
  content: string;
  codeBlocks: CodeBlock[];
  relatedSections: string[];
}

export interface CodeBlock {
  language: string;
  code: string;
  description: string;
  isExample: boolean;
}

export interface MultiDocAnalysis {
  documents: ParsedDocument[];
  commonThemes: string[];
  integrationMap: Map<string, string[]>;
  conceptGlossary: Record<string, string>;
  dataFlows: DataFlow[];
}

export interface DataFlow {
  from: string;
  to: string;
  description: string;
  dataFormat: string;
}

export async function parseMultipleDocs(
  documents: Array<{ title: string; content: string; source: string }>
): Promise<MultiDocAnalysis> {
  const docSummaries = documents
    .map((d) => `[${d.title}]\n${d.content.slice(0, 2000)}...`)
    .join("\n\n");

  const prompt = `Analyze these multiple documentation sources and extract:
1. Common themes across all docs
2. How different systems integrate
3. Key concepts and definitions
4. Data flow between systems

Documents:
${docSummaries}

Return JSON:
{
  "commonThemes": ["theme1", "theme2"],
  "integrationMap": {
    "SystemA": ["SystemB", "SystemC"],
    "SystemB": ["SystemA"]
  },
  "conceptGlossary": {
    "concept": "definition"
  },
  "dataFlows": [
    {
      "from": "source",
      "to": "destination",
      "description": "what flows",
      "dataFormat": "JSON|XML|REST|gRPC"
    }
  ]
}`;

  const response = await asi1GenerateText(
    [
      {
        role: "system",
        content:
          "You are a multi-document API architecture analyst. Return valid JSON only.",
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

  const parsed: ParsedDocument[] = [];
  for (const doc of documents) {
    const sections = extractSections(doc.content);
    const keywords = await extractKeywords(doc.content);
    const summary = await generateSummary(doc.content);
    const contentType = await detectContentType(doc.content);

    parsed.push({
      title: doc.title,
      source: doc.source,
      sections,
      keywords,
      summary,
      contentType,
    });
  }

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return {
        documents: parsed,
        commonThemes: analysis.commonThemes || [],
        integrationMap: new Map(Object.entries(analysis.integrationMap || {})),
        conceptGlossary: analysis.conceptGlossary || {},
        dataFlows: analysis.dataFlows || [],
      };
    }
  } catch {
    return {
      documents: parsed,
      commonThemes: [],
      integrationMap: new Map(),
      conceptGlossary: {},
      dataFlows: [],
    };
  }

  return {
    documents: parsed,
    commonThemes: [],
    integrationMap: new Map(),
    conceptGlossary: {},
    dataFlows: [],
  };
}

function extractSections(content: string): DocumentSection[] {
  // Simple markdown heading extraction
  const lines = content.split("\n");
  const sections: DocumentSection[] = [];
  let currentSection: Partial<DocumentSection> | null = null;
  let currentContent = "";

  for (const line of lines) {
    const headingMatch = line.match(/^(#+)\s+(.+)$/);
    if (headingMatch) {
      if (currentSection) {
        currentSection.content = currentContent.trim();
        currentSection.codeBlocks = extractCodeBlocks(currentContent);
        sections.push(currentSection as DocumentSection);
      }

      currentSection = {
        heading: headingMatch[2],
        level: headingMatch[1].length,
        relatedSections: [],
      };
      currentContent = "";
    } else {
      currentContent += `${line}\n`;
    }
  }

  if (currentSection) {
    currentSection.content = currentContent.trim();
    currentSection.codeBlocks = extractCodeBlocks(currentContent);
    sections.push(currentSection as DocumentSection);
  }

  return sections;
}

function extractCodeBlocks(content: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let match = regex.exec(content);

  while (match !== null) {
    blocks.push({
      language: match[1] || "text",
      code: match[2].trim(),
      description: "",
      isExample: true,
    });
    match = regex.exec(content);
  }

  return blocks;
}

async function extractKeywords(content: string): Promise<string[]> {
  const prompt = `Extract 5-10 key technical terms from this documentation:
${content.slice(0, 1000)}

Return JSON: { "keywords": ["term1", "term2"] }`;

  const response = await asi1GenerateText(
    [
      {
        role: "system",
        content: "Extract concise technical keywords. Return valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    {
      max_tokens: 256,
    }
  );

  const text = response.text;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.keywords || [];
    }
  } catch {
    return [];
  }

  return [];
}

async function generateSummary(content: string): Promise<string> {
  const prompt = `Create a 1-2 sentence summary of this documentation:
${content.slice(0, 1500)}`;

  const response = await asi1GenerateText(
    [
      {
        role: "system",
        content: "Summarize API documentation clearly and concisely.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    {
      max_tokens: 256,
    }
  );

  return response.text;
}

async function detectContentType(
  content: string
): Promise<ParsedDocument["contentType"]> {
  const prompt = `What type of documentation is this?
${content.slice(0, 1000)}

Return JSON: { "type": "api|guide|reference|tutorial|unknown" }`;

  const response = await asi1GenerateText(
    [
      {
        role: "system",
        content: "Classify documentation type. Return valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    {
      max_tokens: 128,
    }
  );

  const text = response.text;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const type = parsed.type as ParsedDocument["contentType"];
      if (["api", "guide", "reference", "tutorial", "unknown"].includes(type)) {
        return type;
      }
    }
  } catch {
    return "unknown";
  }

  return "unknown";
}

export function buildConceptMap(
  analysis: MultiDocAnalysis
): Record<string, Set<string>> {
  const conceptMap: Record<string, Set<string>> = {};

  for (const concept of Object.keys(analysis.conceptGlossary)) {
    conceptMap[concept] = new Set();

    // Find related documents
    for (const doc of analysis.documents) {
      const haystack = [
        doc.summary,
        ...doc.sections.map((section) => section.content),
      ].join("\n");
      if (haystack.includes(concept)) {
        conceptMap[concept].add(doc.title);
      }
    }
  }

  return conceptMap;
}

export async function generateIntegrationGuide(
  analysis: MultiDocAnalysis
): Promise<string> {
  const flowsList = analysis.dataFlows
    .map((f) => `${f.from} -> ${f.to}: ${f.description} (${f.dataFormat})`)
    .join("\n");

  const prompt = `Create an integration guide based on these data flows:
${flowsList}

Include:
1. Prerequisites
2. Step-by-step setup
3. Code examples
4. Troubleshooting

Return markdown format.`;

  const response = await asi1GenerateText(
    [
      {
        role: "system",
        content: "Generate practical integration guides in markdown.",
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
