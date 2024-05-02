import { Octokit } from "@octokit/core";
import fetchMock from "fetch-mock";
import { jest } from "@jest/globals";

import { requestLog } from "../src/index.js";

describe("logging", () => {
  it("logs successful 'GET /'", async () => {
    const mock = fetchMock.sandbox().getOnce("https://api.github.com/", {
      status: 200,
      body: {
        ok: true,
      },
      headers: {
        "x-github-request-id": "1234",
      },
    });

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
    expect(mockLogInfo.mock.calls[0][0]).toMatch(
      /GET \/ - 200 with id 1234 in \d+ms/,
    );
  });

  it("logs 404 for 'GET /unknown'", async () => {
    const mock = fetchMock.sandbox().getOnce("https://api.github.com/unknown", {
      status: 404,
      body: { message: "Not Found" },
      headers: {
        "x-github-request-id": "1234",
      },
    });

    const mockLogInfo = jest.fn();
    const mockErrorInfo = jest.fn();
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
        error: mockErrorInfo,
      },
    });

    try {
      await octokit.request("GET /unknown");
    } catch (error) {
      expect(mockErrorInfo.mock.calls[0][0]).toMatch(
        /GET \/unknown - 404 with id 1234 in \d+ms/,
      );
      return;
    }

    throw new Error('"GET /unknown" should not resolve');
  });

  it("logs malformed error response for 'GET /unknown'", async () => {
    const mock = fetchMock.sandbox().getOnce("https://api.github.com/unknown", {
      status: 500,
      body: "Internal Server Error",
    });

    const mockLogInfo = jest.fn();
    const mockErrorInfo = jest.fn();
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
        error: mockErrorInfo,
      },
    });

    try {
      await octokit.request("GET /unknown");
    } catch (error) {
      expect(mockErrorInfo.mock.calls[0][0]).toMatch(
        /GET \/unknown - 500 with id UNKNOWN in \d+ms/,
      );
      return;
    }

    throw new Error('"GET /unknown" should not resolve');
  });
});
