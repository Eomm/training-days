// frontend/src/pages/HomePage.tsx
import { Button } from "../components/ui/button.js";

export function HomePage() {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h1 className="text-2xl font-bold">MotivaTodo</h1>
      <Button variant="default">Add Task</Button>
    </div>
  );
}
