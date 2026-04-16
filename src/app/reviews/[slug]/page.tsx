import { notFound } from 'next/navigation';
import { createWaybookConfig } from '@/lib/config';
import { runSecretaryLoop } from '@/server/jobs/secretaryLoopJob';
import { getReviewDraft } from '@/server/reviews/secretaryLoop';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function ReviewDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = createWaybookConfig();

  if (config.secretaryAutogenerateOnRead) {
    await runSecretaryLoop(config, { useLlm: false });
  }

  const review = await getReviewDraft(config, slug);
  if (!review) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
        {review.reviewType}
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-stone-950">{review.title}</h1>
      <p className="mt-4 text-base leading-7 text-stone-600">{review.canonicalSummary}</p>
      <pre className="mt-8 overflow-x-auto rounded-3xl border border-stone-200 bg-white p-6 text-sm text-stone-700">
        {review.managedMarkdown}
      </pre>
    </main>
  );
}
