import type { Octokit } from "@octokit/core";
import { VERSION } from "./version.js";

/**
 * @param octokit Octokit instance
 * @param options Options passed to Octokit constructor
 */
export function requestLog(octokit: Octokit) {
  octokit.hook.wrap("request", (request, options) => {
    octokit.log.debug("request", options);

    const start = Date.now();
    const requestOptions = octokit.request.endpoint.parse(options);
    const path = requestOptions.url.replace(options.baseUrl, "");

    return (request as typeof octokit.request)(options)
      .then((response) => {
        const requestId = response.headers["x-github-request-id"];
        octokit.log.info(
          `${requestOptions.method} ${path} - ${response.status} with id ${requestId} in ${
            Date.now() - start
          }ms`,
        );
        return response;
      })

      .catch((error) => {
        const requestId =
          error.response.headers["x-github-request-id"] || "UNKNOWN";
        octokit.log.error(
          `${requestOptions.method} ${path} - ${error.status} with id ${requestId} in ${
            Date.now() - start
          }ms`,
        );
        throw error;
      });
  });
}
requestLog.VERSION = VERSION;
