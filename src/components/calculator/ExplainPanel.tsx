/** 2–4 plain-English sentences about the current result. */
export default function ExplainPanel({ sentences }: { sentences: string[] }) {
  if (!sentences.length) return null;
  return (
    <section class="panel" aria-labelledby="explain-h">
      <h2 id="explain-h" class="text-lg">
        What this means
      </h2>
      <div class="mt-2 grid gap-2">
        {sentences.map((s) => (
          <p key={s}>{s}</p>
        ))}
      </div>
    </section>
  );
}
