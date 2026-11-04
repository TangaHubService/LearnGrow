import type { ReferenceData } from "../types/teacher.types";

export function displayDate(value?: string | Date | null): string {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function relativeTime(value?: string | Date | null): string {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function initials(name?: string): string {
  return (name ?? "Teacher")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function uniqueBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function resolveReadableReferences(
  record: unknown,
  reference: ReferenceData | undefined,
): unknown {
  if (!record || typeof record !== "object" || Array.isArray(record)) return record;

  const rec = record as Record<string, unknown>;
  const classRecord = rec.classId
    ? reference?.classes.find((item) => item.id === rec.classId)
    : undefined;
  const studentRecord = rec.studentId
    ? reference?.students.find((item) => item.id === rec.studentId || item.userId === rec.studentId)
    : undefined;
  const teacherRecord = rec.teacherId
    ? reference?.teachers.find((item) => item.id === rec.teacherId || item.userId === rec.teacherId)
    : undefined;
  const recipientRecord = rec.recipientId
    ? reference?.recipients.find(
        (item) => item.recipientId === rec.recipientId || item.id === rec.recipientId,
      )
    : undefined;

  return {
    ...record,
    ...(classRecord && !rec.className
      ? {
          className: `${(classRecord as { name: string }).name}${(classRecord as { levelName?: string }).levelName ? ` - ${(classRecord as { levelName: string }).levelName}` : ""}`,
        }
      : {}),
    ...(studentRecord && !rec.studentName
      ? { studentName: (studentRecord as { name: string }).name }
      : {}),
    ...(teacherRecord && !rec.teacherName
      ? { teacherName: (teacherRecord as { name: string }).name }
      : {}),
    ...(recipientRecord && !rec.recipientName
      ? { recipientName: (recipientRecord as { name: string }).name }
      : {}),
  };
}

export function aiResponseToText(data: unknown): string {
  if (!data) return "";
  if (typeof data === "string") return data;

  const d = data as {
    title?: string;
    sections?: { heading?: string; content?: string; items?: string[] }[];
    materials?: string[];
    recommendations?: string[];
    estimatedDuration?: string;
  };

  const sections = (d.sections ?? [])
    .map((section) => {
      const items = (section.items ?? []).map((item: string) => `- ${item}`).join("\n");
      return [section.heading, section.content, items].filter(Boolean).join("\n");
    })
    .join("\n\n");

  const materialsList = d.materials ?? [];
  const recommendationList = d.recommendations ?? [];
  const materials = materialsList.length
    ? `Materials\n${materialsList.map((item: string) => `- ${item}`).join("\n")}`
    : "";
  const recommendations = recommendationList.length
    ? `Recommendations\n${recommendationList.map((item: string) => `- ${item}`).join("\n")}`
    : "";

  return [
    d.title,
    d.estimatedDuration ? `Duration: ${d.estimatedDuration}` : "",
    materials,
    sections,
    recommendations,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function aiResponseToHtml(data: unknown): string {
  if (!data) return "";
  if (typeof data === "string") return `<p>${data}</p>`;

  const d = data as {
    title?: string;
    sections?: { heading?: string; content?: string; items?: string[] }[];
    materials?: string[];
    recommendations?: string[];
    estimatedDuration?: string;
  };

  const titleHtml = d.title ? `<h1>${d.title}</h1>` : "";
  const durationHtml = d.estimatedDuration
    ? `<p><strong>Estimated Duration:</strong> ${d.estimatedDuration}</p>`
    : "";

  const cbcMetaHtml =
    (d as any).keyCompetence ||
    (d as any).learningObjectives ||
    (d as any).genericCompetencies?.length ||
    (d as any).crossCuttingIssues?.length
      ? `<div class="cbc-meta-box" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        ${(d as any).keyCompetence ? `<p><strong>Key Unit Competence:</strong> ${(d as any).keyCompetence}</p>` : ""}
        ${(d as any).learningObjectives ? `<p><strong>Learning Objectives:</strong> ${(d as any).learningObjectives}</p>` : ""}
        ${(d as any).genericCompetencies?.length ? `<p><strong>Generic Competencies:</strong> ${(d as any).genericCompetencies.join(", ")}</p>` : ""}
        ${(d as any).crossCuttingIssues?.length ? `<p><strong>Cross-Cutting Issues:</strong> ${(d as any).crossCuttingIssues.join(", ")}</p>` : ""}
      </div>`
      : "";

  const materialsHtml =
    d.materials && d.materials.length > 0
      ? `<h3>Teaching and Learning Materials</h3><ul>${d.materials.map((m) => `<li>${m}</li>`).join("")}</ul>`
      : "";

  const sectionsHtml = (d.sections ?? [])
    .map((section) => {
      const heading = section.heading ? `<h2>${section.heading}</h2>` : "";
      const content = section.content ? `<p>${section.content}</p>` : "";
      const items =
        (section.items ?? []).length > 0
          ? `<ul>${section.items?.map((item: string) => `<li>${item}</li>`).join("")}</ul>`
          : "";
      return `${heading}${content}${items}`;
    })
    .join("");

  const recommendationsHtml =
    d.recommendations && d.recommendations.length > 0
      ? `<h3>AI Recommendations</h3><ul>${d.recommendations.map((r) => `<li>${r}</li>`).join("")}</ul>`
      : "";

  return `${titleHtml}${durationHtml}${cbcMetaHtml}${materialsHtml}${sectionsHtml}${recommendationsHtml}`;
}

export function initialAiPrompt(kind: string, record: unknown): string {
  const rec = record && typeof record === "object" ? (record as Record<string, unknown>) : {};
  const context = [
    rec.title,
    rec.name,
    rec.subjectName,
    rec.topic,
    rec.topicName,
    rec.className,
    rec.studentName,
  ]
    .filter(Boolean)
    .join(" - ");

  const templates: Record<string, string> = {
    "ai-lesson": `Prepare a classroom-ready lesson plan.${context ? ` Context: ${context}.` : ""}`,
    "ai-quiz":
      "Generate assessment questions. I will add the class, subject, topic, number of questions, marks, answers, and marking guide details here.",
    "ai-homework": `Create homework aligned to today's learning.${context ? ` Context: ${context}.` : ""}`,
    "ai-activity": `Create an engaging classroom activity.${context ? ` Context: ${context}.` : ""}`,
    "ai-message":
      "Draft a parent communication message. I will describe the learner, situation, tone, and what the parent should know here.",
    "ai-report": `Analyze learner performance and recommend interventions.${context ? ` Context: ${context}.` : ""}`,
    "ai-delivery": `Prepare teaching notes and delivery guidance.${context ? ` Context: ${context}.` : ""}`,
    "ai-approval": `Give teacher decision-support guidance.${context ? ` Context: ${context}.` : ""}`,
    "ai-assistant":
      "Prepare a classroom resource. I will add the class, subject, topic, learners, and desired output here.",
  };

  return templates[kind] ?? "";
}

export function resizeAiTextarea(element: HTMLTextAreaElement): void {
  element.style.height = "auto";
  element.style.height = `${Math.min(element.scrollHeight, 260)}px`;
}

export function titleFromPrompt(prompt: string): string {
  const firstSentence = prompt.split(/[.!?]/)[0]?.trim();
  return (firstSentence || "AI Assistant Output").slice(0, 90);
}

export function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function getReadableToday(): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}
