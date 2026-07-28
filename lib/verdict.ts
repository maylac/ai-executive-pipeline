export function extractVerdict(content: string): "INVEST" | "PASS" | undefined {
  const verdictSection = content
    .split(/^##\s+/m)
    .find((section) => /^2\.\s*The Verdict\b/i.test(section));

  if (!verdictSection) return undefined;

  const explicitVerdict = verdictSection.match(
    /(?:^|\n)\s*(?:\*\*)?VERDICT(?:\*\*)?\s*:\s*(?:\*\*)?(INVEST|PASS)\b/i
  )?.[1];
  const fallbackVerdict = verdictSection.match(/\b(INVEST|PASS)\b/i)?.[1];
  return (explicitVerdict ?? fallbackVerdict)?.toUpperCase() as "INVEST" | "PASS" | undefined;
}
