interface TemplateContext {
  date: string;
  time: string;
  isoTimestamp: string;
  quote: string;
  repo: string;
  owner: string;
  random: string;
}

const TOKEN_REGEX = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

export function renderTemplate(template: string, context: TemplateContext) {
  return template.replace(TOKEN_REGEX, (_, token: keyof TemplateContext) => {
    if (token in context) {
      return context[token] ?? "";
    }

    return "";
  });
}

export function buildTemplateContext(params: {
  owner: string;
  repo: string;
  quote: string;
  timestamp: Date;
}) {
  const { owner, repo, quote, timestamp } = params;

  return {
    date: timestamp.toISOString().slice(0, 10),
    time: timestamp.toISOString().slice(11, 19),
    isoTimestamp: timestamp.toISOString(),
    quote,
    repo,
    owner,
    random: Math.random().toString(36).slice(2)
  };
}
