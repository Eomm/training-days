// frontend/src/components/SkeletonList.tsx
import { Skeleton } from "./ui/skeleton.js";

export function SkeletonList() {
  return (
    <ul
      aria-busy="true"
      aria-label="Loading tasks"
      className="flex flex-col gap-2 w-full"
    >
      {[1, 2, 3].map((i) => (
        <li key={i}>
          <Skeleton className="h-12 w-full rounded-md" />
        </li>
      ))}
    </ul>
  );
}
