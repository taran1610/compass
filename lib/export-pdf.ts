import { jsPDF } from "jspdf";

/**
 * Strip HTML tags for plain text export.
 */
function stripHtml(html: string): string {
  const tmp = typeof document !== "undefined" ? document.createElement("div") : null;
  if (tmp) {
    tmp.innerHTML = html;
    return tmp.textContent ?? tmp.innerText ?? html;
  }
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Export content to PDF. Works with markdown, HTML (PRD), and plain text.
 * Uses jspdf for reliable multi-page text export.
 */
export function exportContentToPdf(
  content: string,
  title: string,
  type?: "prd" | "mermaid" | "markdown"
): void {
  const text = type === "prd" ? stripHtml(content) : content;
  const pdf = new jsPDF("p", "mm", "a4");
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pageWidth - 2 * margin;
  const lineHeight = 6;

  const lines = pdf.splitTextToSize(text, maxWidth);
  let y = margin;

  for (const line of lines) {
    if (y + lineHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += lineHeight;
  }

  const filename = `${title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`;
  pdf.save(filename);
}
