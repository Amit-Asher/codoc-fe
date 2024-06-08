import { DocumentState, Operation, Revision } from "./document-store";

export function transform(transformedOperation: any, concurrentOperation: any) {
    // if operation is null, it means it is duplicate and should be ignored
    if (transformedOperation === null) return null;

    // insert vs insert
    if (transformedOperation.type === 'insert' && concurrentOperation.type === 'insert') {
        return transformInsertInsert(transformedOperation, concurrentOperation);
    }

    // insert vs delete
    if (transformedOperation.type === 'insert' && concurrentOperation.type === 'delete') {
        return transformInsertDelete(transformedOperation, concurrentOperation);
    }

    // delete vs insert
    if (transformedOperation.type === 'delete' && concurrentOperation.type === 'insert') {
        return transformDeleteInsert(transformedOperation, concurrentOperation);
    }

    // delete vs delete
    if (transformedOperation.type === 'delete' && concurrentOperation.type === 'delete') {
        return transformDeleteDelete(transformedOperation, concurrentOperation);
    }

    // never reach here, just in case
    return null;
}

export function applyRevision<T>(state: DocumentState<T>, revision: Revision<T>): Revision<T> {
    // if no conflict, apply the revision
    if (revision.number === state.revisions.length) {
        state.elements = applyOperationsNoTransform(state.elements, revision.operations);
        state.revisions.push(revision);
        return revision;
    }

    // else need to solve conflicts and transform the revision
    const newRevision: Revision<T> = { number: state.revisions.length, operations: [] };
    // get all the revisions after the current revision (i.e concurrent revisions)
    const concurrentOperations = state.revisions.slice(revision.number).flatMap(r => r.operations);
    for (const operation of revision.operations) {
        // skip transform of update operations- different algorithm
        if (operation.type === 'update') {
            newRevision.operations.push(operation);
            continue;
        }

        // iterate through all concurrent operations and transform the current operation
        const transformedOperation = concurrentOperations.reduce(transform, operation);

        // if transformed operation is null, it means it is duplicate and should be ignored
        if (transformedOperation === null) continue;

        // build transformed revision
        newRevision.operations.push(transformedOperation);
    }

    // apply transformed revision (if no operations exist, then empty revision created)
    state.elements = applyOperationsNoTransform(state.elements, newRevision.operations);
    state.revisions.push(newRevision);
    return newRevision;
}

export function applyOperationsNoTransform<T>(elements: T[], operations: Operation<T>[]): T[] {
    let newElements = [...elements];
    for (const operation of operations) {
        if (operation.type === 'insert') {
            newElements = insertElement(newElements, operation.element, operation.positionIdx);
        } else if (operation.type === 'delete') {
            newElements = deleteElement(newElements, operation.positionIdx);
        } else if (operation.type === 'update') {
            newElements = updateElement(newElements, operation.element);
        }
    }
    return newElements;
}

export function insertElement<T>(elements: T[], element: T, positionIdx: number): T[] {
    let newElements = [...elements];
    newElements.splice(positionIdx, 0, element);
    return newElements;
}

export function deleteElement<T>(elements: T[], positionIdx: number): T[] {
    let newElements = [...elements];
    newElements.splice(positionIdx, 1);
    return newElements;
}

export function updateElement(elements: any[], element: any): any[] {
    let newElements = [...elements];
    const index = elements.findIndex(e => (e as any).id === (element as any).id);
    if (index !== -1) {
        newElements[index] = {
            ...element,
            version: element.version + 1
        }
    }
    return newElements;
}

export function transformInsertInsert(transformedOperation: any, concurrentOperation: any) {
    if (transformedOperation.positionIdx <= concurrentOperation.positionIdx) {
        return transformedOperation;
    } else if (transformedOperation.positionIdx === concurrentOperation.positionIdx) {
        // duplicate by design
        return { ...transformedOperation, positionIdx: transformedOperation.positionIdx + 1 };
    } else {
        return { ...transformedOperation, positionIdx: transformedOperation.positionIdx + 1 };
    }
}

export function transformInsertDelete(transformedOperation: any, concurrentOperation: any) {
    if (transformedOperation.positionIdx <= concurrentOperation.positionIdx) {
        return transformedOperation;
    } else {
        return { ...transformedOperation, positionIdx: transformedOperation.positionIdx - 1 };
    }
}

export function transformDeleteInsert(transformedOperation: any, concurrentOperation: any) {
    if (transformedOperation.positionIdx < concurrentOperation.positionIdx) {
        return transformedOperation;
    } else {
        return { ...transformedOperation, positionIdx: transformedOperation.positionIdx + 1 };
    }
}

export function transformDeleteDelete(transformedOperation: any, concurrentOperation: any) {
    if (transformedOperation.positionIdx < concurrentOperation.positionIdx) {
        return transformedOperation;
    } else if (transformedOperation.positionIdx === concurrentOperation.positionIdx) {
        // cancel duplicate operation and avoid null pointer exception
        return null;
    } else {
        return { ...transformedOperation, positionIdx: transformedOperation.positionIdx - 1 };
    }
}

export function createOperation<T>(
    type: 'insert' | 'delete',
    positionIdx: number,
    element?: T
): Operation<T> {
    if (type === 'insert') {
        return { type, positionIdx, element: element! };
    } else {
        return { type, positionIdx };
    }
}