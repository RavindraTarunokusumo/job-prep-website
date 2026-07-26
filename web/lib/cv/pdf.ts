import {
  cvSectionKeys,
  type CvSectionConfig,
  type StructuredCv,
} from "@/lib/validation/cv";
import { defaultSectionConfig } from "@/lib/validation/cv";

/**
 * Minimal PDF 1.4 writer for selectable text lines.
 * No external deps — produces a valid non-empty PDF byte array.
 */
function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E\n]/g, "?");
}

function buildTextLines(
  content: StructuredCv,
  sectionConfig: CvSectionConfig
): string[] {
  const hidden = new Set(sectionConfig.hidden);
  const order =
    sectionConfig.order.length > 0 ? sectionConfig.order : [...cvSectionKeys];
  const lines: string[] = [];

  const push = (s: string) => {
    const t = s.trimEnd();
    if (t.length > 0) lines.push(t);
  };

  for (const key of order) {
    if (hidden.has(key)) continue;
    switch (key) {
      case "contact": {
        const c = content.contact ?? {};
        const header = [c.name, c.email, c.phone, c.location]
          .filter(Boolean)
          .join(" | ");
        if (header) {
          push(header);
          if (c.linkedin) push(c.linkedin);
          if (c.website) push(c.website);
          push("");
        }
        break;
      }
      case "summary":
        if (content.summary?.trim()) {
          push("SUMMARY");
          push(content.summary.trim());
          push("");
        }
        break;
      case "experience":
        if (content.experience.length) {
          push("EXPERIENCE");
          for (const e of content.experience) {
            push(
              [e.title, e.company].filter(Boolean).join(" — ") ||
                "Experience entry"
            );
            const dates = [e.startDate, e.endDate].filter(Boolean).join(" – ");
            if (dates) push(dates);
            if (e.description) push(e.description);
            for (const b of e.bullets ?? []) {
              if (b.trim()) push(`• ${b.trim()}`);
            }
            push("");
          }
        }
        break;
      case "education":
        if (content.education.length) {
          push("EDUCATION");
          for (const e of content.education) {
            push(
              [e.degree, e.field, e.institution].filter(Boolean).join(", ") ||
                "Education entry"
            );
            const dates = [e.startDate, e.endDate].filter(Boolean).join(" – ");
            if (dates) push(dates);
            if (e.description) push(e.description);
            push("");
          }
        }
        break;
      case "skills":
        if (content.skills.length) {
          push("SKILLS");
          push(content.skills.join(", "));
          push("");
        }
        break;
      case "projects":
        if (content.projects.length) {
          push("PROJECTS");
          for (const p of content.projects) {
            push(p.name || "Project");
            if (p.description) push(p.description);
            if (p.technologies?.length) push(p.technologies.join(", "));
            push("");
          }
        }
        break;
      case "certifications":
        if (content.certifications.length) {
          push("CERTIFICATIONS");
          for (const c of content.certifications) push(`• ${c}`);
          push("");
        }
        break;
      case "languages":
        if (content.languages.length) {
          push("LANGUAGES");
          push(content.languages.join(", "));
          push("");
        }
        break;
    }
  }

  if (lines.length === 0) {
    lines.push("Curriculum Vitae");
    lines.push("(No content yet)");
  }

  // PDF line width safety
  return lines.flatMap((line) => {
    if (line.length <= 90) return [line];
    const chunks: string[] = [];
    let rest = line;
    while (rest.length > 90) {
      chunks.push(rest.slice(0, 90));
      rest = rest.slice(90);
    }
    if (rest) chunks.push(rest);
    return chunks;
  });
}

export function buildPdfBytes(
  content: StructuredCv,
  sectionConfig: CvSectionConfig = defaultSectionConfig()
): Uint8Array {
  const lines = buildTextLines(content, sectionConfig);
  const fontSize = 11;
  const leading = 14;
  // MediaBox height is 792; keep first baseline inside the page.
  const startY = 770;
  const startX = 50;

  let stream = "BT\n/F1 " + fontSize + " Tf\n";
  stream += `${startX} ${startY} Td\n`;
  stream += `${leading} TL\n`;

  lines.forEach((line, i) => {
    const escaped = escapePdfText(line);
    if (i === 0) {
      stream += `(${escaped}) Tj\n`;
    } else {
      stream += `T*\n(${escaped}) Tj\n`;
    }
  });
  stream += "ET";

  const streamBytes = new TextEncoder().encode(stream);
  const objects: string[] = [];

  // 1: Catalog
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  // 2: Pages
  objects.push(
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
  );
  // 3: Page
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
  );
  // 4: Content stream
  objects.push(
    `4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream\nendobj\n`
  );
  // 5: Font (Helvetica — standard, selectable text)
  objects.push(
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
  );

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF\n`;

  return new Uint8Array(Buffer.from(pdf, "utf8"));
}

export function isPdfBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  const head = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]);
  return head === "%PDF-";
}
