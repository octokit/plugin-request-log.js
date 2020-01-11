import { requestLog } from "../src";

describe("Smoke test", () => {
  it("is a function", () => {
    expect(requestLog).toBeInstanceOf(Function);
  });

  it("requestLog.VERSION is set", () => {
    expect(requestLog.VERSION).toEqual("0.0.0-development");
  });
});
