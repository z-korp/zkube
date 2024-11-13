import { beforeEach, afterEach } from "node:test";

import "@testing-library/jest-dom";
import { vi } from "vitest";

beforeEach(() => {
  vi.spyOn(Math, "random").mockImplementation(() => 0.5);
  vi.spyOn(Date, "now").mockImplementation(() => 1234567890);
});

afterEach(() => {
  vi.restoreAllMocks();
});
