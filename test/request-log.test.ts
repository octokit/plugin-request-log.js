import { Octokit } from "@octokit/core";
import fetchMock from "fetch-mock";

import { requestLog } from "../src";

describe("logging", () => {
  it("logs sucessful 'GET /'", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce("https://api.github.com/", { ok: true });

    const mockLogInfo = jest.fn();
    const mockDebugInfo = jest.fn();
    const MyOctokit = Octokit.plugin(requestLog);
    const octokit = new MyOctokit({
      request: {
        fetch: mock,
      },
      log: {
        debug: mockDebugInfo,
        info: mockLogInfo,
        warn() {},
        error() {},
      },
    });

    await octokit.request("GET /");
    expect(mockDebugInfo.mock.calls[0][0]).toEqual("request");
    expect(mockDebugInfo.mock.calls[0][1]).toMatchObject({
      method: "GET",
      url: "/",
    });
    expect(mockLogInfo.mock.calls[0][0]).toMatch(/GET \/ - 200 in \d+ms/);
  });

  it("logs 404 for 'GET /unknown'", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce("https://api.github.com/unknown", 404);

    const mockLogInfo = jest.fn();
    const mockDebugInfo = jest.fn();
    const MyOctokit = Octokit.plugin(requestLog);
    const octokit = new MyOctokit({
      request: {
        fetch: mock,
      },
      log: {
        debug: mockDebugInfo,
        info: mockLogInfo,
        warn() {},
        error() {},
      },
    });

    try {
      await octokit.request("GET /unknown");
    } catch (error) {
      expect(mockLogInfo.mock.calls[0][0]).toMatch(
        /GET \/unknown - 404 in \d+ms/
      );
      return;
    }

    throw new Error('"GET /unknown" should not resolve');
  });
});
