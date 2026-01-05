'use client';

import { AuthGuard } from '@/components/AuthGuard';

export default function SelectiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
