import type { ReactNode } from 'react';

interface RowProps {
  href?: string;
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  description?: ReactNode;
}

export function Row({ href, leading, title, meta, trailing, description }: RowProps) {
  const body = (
    <div className="flex items-baseline gap-4 py-3">
      {leading ? <div className="flex-none self-center">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <div className="truncate text-[15px] text-stone-900">{title}</div>
          {meta ? <div className="caption flex-none num">{meta}</div> : null}
        </div>
        {description ? (
          <div className="mt-1 truncate text-[13px] leading-5 text-stone-500">{description}</div>
        ) : null}
      </div>
      {trailing ? (
        <div className="flex-none self-center text-right text-[12px] text-stone-500 num">
          {trailing}
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block border-b border-stone-200/60 hover:bg-stone-100/50">
        {body}
      </a>
    );
  }
  return <div className="border-b border-stone-200/60">{body}</div>;
}

export function RowList({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
