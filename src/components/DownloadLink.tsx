"use client";

import type { MouseEvent, ReactNode } from "react";

function go(event: MouseEvent<HTMLAnchorElement>, href: string) {
  event.preventDefault();
  event.stopPropagation();
  window.location.assign(href);
}

export function DownloadLink({
  href,
  className,
  children,
  filename,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  filename?: string;
}) {
  return (
    <a className={className} href={href} download={filename} onClick={(event) => go(event, href)}>
      {children}
    </a>
  );
}

export function StaticPageLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a className={className} href={href} onClick={(event) => go(event, href)}>
      {children}
    </a>
  );
}
