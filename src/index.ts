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
        octokit.log.info(
          `${requestOptions.method} ${path} - ${response.status} in ${
            Date.now() - start
          }ms`,
        );
        return response;
      })

      .catch((error) => {
        octokit.log.info(
          `${requestOptions.method} ${path} - ${error.status} in ${
            Date.now() - start
          }ms`,
        );
        throw error;
      });
  });
}
requestLog.VERSION = VERSION;
