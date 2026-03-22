/**
 * Generates a demo PDF for testing Compass upload and AI analysis.
 * Run: npx tsx scripts/generate-demo-pdf.ts
 * Output: public/demo-product-feedback.pdf
 */

import { jsPDF } from "jspdf";
import { writeFileSync } from "fs";
import { join } from "path";

const CONTENT = `
PRODUCT FEEDBACK SUMMARY
Q1 2025 Customer Research

---

CUSTOMER INTERVIEW #1
Date: Jan 15, 2025
Participant: Sarah M., Product Manager at TechCorp

Key quotes:
"The onboarding flow is confusing. We lost 40% of new users in the first week. I'd love to see an interactive product tour that adapts based on user role."

"We need better API rate limit alerts. Last month we hit limits during a critical demo and had no warning. Email notifications would help."

"Team collaboration features are a must. Right now we're copying links in Slack. Native comments and @mentions would save us hours."

---

CUSTOMER INTERVIEW #2
Date: Jan 22, 2025
Participant: Marcus L., Engineering Lead at ScaleAI

Key quotes:
"In-app onboarding redesign is our top request. The current flow assumes too much context. New users don't know where to start."

"Debugging tools are the bottleneck. AI can generate code but when something breaks we're on our own. Integration with error tracking would be huge."

"We'd pay more for dedicated support. The docs are good but complex integrations need human help."

---

SUPPORT TICKET #8472
Subject: Export fails for large datasets
Status: Resolved

Customer reported that exporting more than 10,000 rows causes the request to timeout. We implemented pagination for exports. Customer confirmed fix works.

Follow-up feedback: "Would love bulk export scheduling - run weekly and email me the file."

---

FEATURE REQUEST #2341
Title: API rate limit alerts
Votes: 47

Description: We need proactive notifications when approaching API limits. Options: email, webhook, or in-dashboard banner. Email is highest priority per user survey.

---

FEATURE REQUEST #2289
Title: In-app onboarding redesign
Votes: 89

Description: Current onboarding doesn't adapt to user type (PM vs engineer vs designer). Users want role-based flows, interactive tours, and skip options for power users.

---

SUMMARY OF RECURRING THEMES
1. In-app onboarding redesign - 89 votes, 12 interview mentions
2. API rate limit alerts - 47 votes, 8 interview mentions  
3. Team collaboration features - 34 votes, 6 interview mentions
4. Better debugging integration - 28 votes, 5 interview mentions
5. Bulk export scheduling - 19 votes, 3 support ticket mentions
`;

function main() {
  const pdf = new jsPDF("p", "mm", "a4");
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pageWidth - 2 * margin;
  const lineHeight = 6;

  pdf.setFontSize(16);
  pdf.text("Compass Demo - Product Feedback", margin, 20);
  pdf.setFontSize(10);
  pdf.text("Upload this PDF to test AI insights, opportunity detection, and RAG.", margin, 28);
  pdf.setFontSize(9);

  const lines = pdf.splitTextToSize(CONTENT.trim(), maxWidth);
  let y = 38;

  for (const line of lines) {
    if (y + lineHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += lineHeight;
  }

  const outPath = join(process.cwd(), "public", "demo-product-feedback.pdf");
  const buf = pdf.output("arraybuffer");
  writeFileSync(outPath, Buffer.from(buf));
  console.log("Created:", outPath);
  console.log("Upload at: http://localhost:3000/app (Upload Documents)");
}

main();
