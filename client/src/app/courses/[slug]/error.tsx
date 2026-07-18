"use client";

import { Button } from "@heroui/react";
import { TriangleAlert } from "lucide-react";

export default function CourseDetailError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center">
      <TriangleAlert size={32} className="text-zinc-400" />
      <h1 className="mt-4 text-xl font-semibold text-zinc-900">Couldn&apos;t load this course</h1>
      <p className="mt-1 text-zinc-500">Something went wrong reaching the server.</p>
      <Button variant="primary" size="sm" className="mt-6" onPress={reset}>
        Try again
      </Button>
    </div>
  );
}
