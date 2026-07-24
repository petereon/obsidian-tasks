function escapeRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function segmentToRegex(segment: string): RegExp {
  const pattern = segment.split("*").map(escapeRegex).join("[^/]*");
  return new RegExp(`^${pattern}$`);
}

function matchSegments(patternSegs: string[], pathSegs: string[]): boolean {
  if (patternSegs.length === 0) return pathSegs.length === 0;

  const [head, ...restPattern] = patternSegs;

  if (head === "**") {
    for (let i = 0; i <= pathSegs.length; i++) {
      if (matchSegments(restPattern, pathSegs.slice(i))) return true;
    }
    return false;
  }

  if (pathSegs.length === 0) return false;
  const [pathHead, ...restPath] = pathSegs;
  if (!segmentToRegex(head as string).test(pathHead as string)) return false;

  return matchSegments(restPattern, restPath);
}

export function matchesAnyPattern(path: string, patterns: string[]): boolean {
  const pathSegs = path.split("/");
  return patterns.some((pattern) => matchSegments(pattern.split("/"), pathSegs));
}
