const inflightRequests = new Map();

/**
 * Deduplicates concurrent API requests.
 * @param {Object} fpi - FPI instance
 * @param {string} query - GraphQL query
 * @param {Object} variables - GraphQL variables
 * @param {string} key - Unique key for this request
 * @param {Object} options - execution options
 * @returns {Promise}
 */
export const deduplicatedFetch = (fpi, query, variables = {}, key = null, options = {}) => {
    const requestKey = key || `${query}_${JSON.stringify(variables)}`;

    if (inflightRequests.has(requestKey)) {
        return inflightRequests.get(requestKey);
    }

    const promise = fpi.executeGQL(query, variables, options).finally(() => {
        inflightRequests.delete(requestKey);
    });

    inflightRequests.set(requestKey, promise);
    return promise;
};
