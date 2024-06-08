import { useEffect, useState } from "react";
import { v4 } from "uuid";

export enum QueryKey {
    GetUsers = 'GetUsers',
    GetPosts = 'GetPosts',
    GetClasses = 'GetClasses',
}

const cache: { [key: string]: QueryCacheItem } = {};

interface QueryCacheItem {
    data: any;
    loading: boolean;
    error: string | null;
    listeners: {
        componentId: string;
        callback: () => void;
    }[];
    action: () => Promise<any>;
}

export function callListeners(key: string) {
    cache[key].listeners.forEach(listener => {
        listener.callback();
    });
}

export async function refresh(key: string) {
    cache[key].data = null;
    cache[key].loading = true;
    cache[key].error = null;
    callListeners(key);

    try {
        const data = await cache[key].action();
        cache[key].data = data;
        cache[key].loading = false;
        cache[key].error = null;
    } catch (err: any) {
        cache[key].data = null;
        cache[key].loading = false;
        cache[key].error = err.message;
    }

    callListeners(key);
}

/**
 * custom hook to fetch data from the server and cache it.
 * it can be used in any component to fetch data from the server.
 */
export function useQuery<T>(key: string, query: () => Promise<T>) {
    const [_, rerender] = useState(false);
    const [componentId, __] = useState<string>(v4());

    useEffect(() => {
        (async () => {
            try {
                if (cache[key]) {
                    // become a listener to the cache
                    cache[key].listeners.push({
                        componentId,
                        callback: () => {
                            rerender(prev => !prev);
                        }
                    });
                    return;
                }

                cache[key] = {
                    data: null,
                    loading: true,
                    error: null,
                    listeners: [],
                    action: query
                };

                const data = await query();

                // update the cache
                cache[key].data = data;
                cache[key].loading = false;
                cache[key].error = null;

                // notify all listeners
                cache[key].listeners.forEach(listener => {
                    listener.callback();
                });

                // trigger a re-render
                rerender(prev => !prev);
            } catch (err: any) {
                // update the cache
                cache[key].data = null;
                cache[key].loading = false;
                cache[key].error = err.message;

                // notify all listeners
                cache[key].listeners.forEach(listener => {
                    listener.callback();
                });

                // trigger a re-render
                rerender(prev => !prev);
            }
        })();

        return () => {
            // remove the listener from the cache
            cache[key].listeners = cache[key].listeners.filter(listener => listener.componentId !== componentId);
        };
    }, []);

    return {
        data: cache[key]?.data ?? null,
        loading: cache[key]?.loading ?? true,
        error: cache[key]?.error ?? null
    };
}