/**
 * A middleware for browser's fetch.
 * @param url The request URL
 * @param options The fetch HTTP options
 * @returns The object contained the HTTP Response
 */
export async function fetchMiddleware(url: string, options?: any): Promise<Response> {

    // Start by calling the original fetch 
    const response: Response = await fetch(url, {
        ...options,
        credentials: 'include'
    });

    return response;
}
