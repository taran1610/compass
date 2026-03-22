declare module "pdf-parse/lib/pdf-parse.js" {
  function pdfParse(
    dataBuffer: Buffer,
    options?: { pagerender?: (pageData: unknown) => string }
  ): Promise<{ text: string; numpages: number; info?: unknown }>;
  export default pdfParse;
}
