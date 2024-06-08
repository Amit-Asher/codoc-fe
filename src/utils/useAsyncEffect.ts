import { DependencyList, useEffect } from "react";

declare const UNDEFINED_VOID_ONLY: unique symbol;
// Destructors are only allowed to return void.
type Destructor = () => void | { [UNDEFINED_VOID_ONLY]: never };
type AsyncEffectCallback = () => Promise<(void | Destructor)>;

export const useAsyncEffect = (effect: AsyncEffectCallback, deps?: DependencyList) => {
    return useEffect(() => {
        (async () => {
            await effect();
        })();
    }, deps);
}