import { generateObject } from "ai";
import { z } from "zod";
import { getChatModel } from "@/lib/ai/get-model";
import { fetchDocumentsForExtraction } from "./extract-features";

const UserStorySchema = z.object({
  as: z.string().describe("User type, e.g. 'a power user'"),
  want: z.string().describe("Action, e.g. 'bulk export to CSV'"),
  soThat: z.string().describe("Benefit, e.g. 'I can analyze data offline'"),
});

const PRDSchema = z.object({
  problem: z.string().describe("Problem statement"),
  goals: z.string().describe("Success criteria and objectives"),
  scope: z.string().describe("In scope / Out of scope"),
  userStories: z.array(UserStorySchema).describe("User stories in As a / I want / So that format"),
  impactMetrics: z.string().describe("How success will be measured"),
  predictedImpact: z.object({
    retentionImprovement: z.string().describe("e.g. '+8%'"),
    adoptionImprovement: z.string().describe("e.g. '+15%'"),
    confidenceScore: z.number().min(0).max(100).describe("Confidence 0-100"),
  }),
});

const EngineeringPRDSchema = z.object({
  technicalRequirements: z.string().describe("Technical requirements"),
  apiConsiderations: z.string().describe("API design and integration considerations"),
  systemComponents: z.string().describe("System components affected"),
  edgeCases: z.string().describe("Edge cases to handle"),
});

export type GeneratedPRD = z.infer<typeof PRDSchema> & {
  evidence: { featureRequests: number; supportTickets: number; interviewMentions: number };
};
export type EngineeringPRD = z.infer<typeof EngineeringPRDSchema>;

function countEvidenceBySource(
  documents: { sourceType: string }[]
): { featureRequests: number; supportTickets: number; interviewMentions: number } {
  let featureRequests = 0;
  let supportTickets = 0;
  let interviewMentions = 0;
  for (const d of documents) {
    if (d.sourceType === "feature-requests") featureRequests++;
    else if (d.sourceType === "support-tickets") supportTickets++;
    else if (d.sourceType === "interviews") interviewMentions++;
  }
  return { featureRequests, supportTickets, interviewMentions };
}

export async function generatePRDFromDocuments(
  featureContext?: string
): Promise<GeneratedPRD & { engineering?: EngineeringPRD }> {
  const documents = await fetchDocumentsForExtraction(30);
  const evidence = countEvidenceBySource(documents);

  const context =
    documents.length > 0
      ? documents
          .map(
            (d) =>
              `[Source: ${d.sourceType}, File: ${d.fileName}]\n${d.content.slice(0, 1500)}`
          )
          .join("\n\n---\n\n")
      : "No documents uploaded. Generate a sample PRD based on common product patterns.";

  const featureHint = featureContext
    ? `\n\nFocus this PRD on the feature/theme: ${featureContext}`
    : "";

  const prompt = `You are a product manager. Generate a PRD (Product Requirements Document) based on the following product data from customer interviews, feature requests, and support tickets.

Extract key themes and create:
1. Problem statement - the core problem being solved
2. Goals - success criteria and objectives
3. Scope - what's in and out of scope
4. User stories - in "As a [user type] I want to [action] So that [benefit]" format (3-6 stories)
5. Impact metrics - how we'll measure success
6. Predicted impact - estimate retention improvement (e.g. +8%), adoption improvement (e.g. +15%), and confidence score (0-100)

Documents:
${context}${featureHint}`;

  const model = getChatModel();
  const { object } = await generateObject({
    model,
    schema: PRDSchema,
    prompt,
  });

  return {
    ...object,
    evidence,
  };
}

export async function generateEngineeringPRD(
  problem: string,
  goals: string,
  userStories: { as: string; want: string; soThat: string }[]
): Promise<EngineeringPRD> {
  const documents = await fetchDocumentsForExtraction(20);
  const context =
    documents.length > 0
      ? documents.map((d) => d.content.slice(0, 1000)).join("\n\n")
      : "";

  const prompt = `You are a technical product manager. Given this PRD summary, generate engineering-focused content:

Problem: ${problem}
Goals: ${goals}
User Stories: ${JSON.stringify(userStories)}

${context ? `Additional context from documents:\n${context}` : ""}

Generate:
1. Technical requirements - what needs to be built technically
2. API considerations - API design, endpoints, integrations
3. System components - which parts of the system are affected
4. Edge cases - technical edge cases to handle`;

  const model = getChatModel();
  const { object } = await generateObject({
    model,
    schema: EngineeringPRDSchema,
    prompt,
  });

  return object;
}
