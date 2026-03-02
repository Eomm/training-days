// frontend/src/pages/HomePage.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomePage } from "./HomePage.js";

describe("HomePage", () => {
  it("renders without throwing", () => {
    render(<HomePage />);
  });

  it("displays the MotivaTodo heading", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /motivatodo/i }),
    ).toBeInTheDocument();
  });
});
