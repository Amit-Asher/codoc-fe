import { action, computed, makeObservable, observable } from "mobx";
import { webSocketService } from "../services/ws-service";
import { WSTopic } from "../generated/swagger/api";
import { applyOperationsNoTransform } from "./ot-client";

enum Status {
    /**
     * The document is in sync with the server.
     */
    Synced = 'Synced',
    /**
     * The document is awaiting acknowledgment from the server.
     */
    Awaiting = 'Awaiting'
}

export type Operation<T> = {
    type: 'insert';
    positionIdx: number;
    element: T;
} | {
    type: 'delete',
    positionIdx: number;
} | {
    type: 'update',
    element: T,
    updatedBy: string,
    version: number
};

export interface Revision<T> {
    number: number;
    operations: Operation<T>[];
}

export interface DocumentState<T> {
    revisions: Revision<T>[];
    elements: T[];
}

export class DocumentStore<T> {

    /**
     * The document status
     */
    public status: Status = Status.Synced;

    /**
     * offset is the revision number of the last revision that was acknowledged by the server.
     */
    public offset: number = 0;

    /**
     * a state of the document that is in sync with the server.
     */
    @observable
    public synced: DocumentState<T> = {
        revisions: [],
        elements: [],
    };

    /**
     * holding the state of current awaiting revision that was sent to the server.
     * at each moment, there can be only one revision that is awaiting acknowledgment from the server.
     * null if there is no awaiting revision.
     */
    @observable
    public awaiting: Revision<T> | null = null;

    /**
     * buffer to accumulate local changes that are not yet sent to the server,
     * after the server acknowledges the awaiting revision, the buffer will be sent as new revision.
     */
    @observable
    public buffer: Operation<T>[] = [];

    /**
     * mode of the editor, regular or erase.
     */
    @observable
    public mode: 'regular' | 'erase' = 'regular';

    @observable
    public properties: { [elementId: string]: { version: number, updatedBy: string } & any } = {};

    /**
     * this computed property returns the current state of the document.
     * it takes into account the synced state, awaiting state, and the buffer.
     * therefore, it is also handles rebuilding the state after the server sent transformed revision.
     * notice, its optimized - computed once between renders until dependency observables changes.
     */
    @computed
    public get elements() {
        let elementsToReturn: T[] = [...this.synced.elements];

        if (this.status === Status.Awaiting && this.awaiting !== null) {
            elementsToReturn = applyOperationsNoTransform(this.synced.elements, this.awaiting.operations);
        }

        if (this.buffer.length > 0) {
            elementsToReturn = applyOperationsNoTransform(elementsToReturn, this.buffer);
        }

        return elementsToReturn;
    }

    @action
    public init(docFromServer: { nextRevision: number, elements: T[] }) {
        this.offset = docFromServer.nextRevision;
        this.synced = {
            revisions: [],
            elements: docFromServer.elements
        };
    }

    @action
    public makeOperation(operation: Operation<T>) {
        if (this.status === Status.Synced) {
            // create a new revision
            const newRevision: Revision<T> = {
                number: this.offset + this.synced.revisions.length + 1,
                operations: [operation]
            };
            // apply the revision to the awaiting state
            this.awaiting = newRevision;
            // set the status to awaiting
            this.status = Status.Awaiting;
            // send operation to server
            webSocketService.send(WSTopic.PostRevision, newRevision);
            return;
        }

        if (this.status === Status.Awaiting) {
            // add the operation to the buffer
            this.buffer.push(operation);
            return;
        }
    }

    /**
     * received a revision from the server.
     */
    @action
    public sync(revision: Revision<T>) {
        // push the revision to the synced state
        this.synced.revisions.push(revision);
        // apply the revision to the synced state
        this.synced.elements = applyOperationsNoTransform(this.synced.elements, revision.operations);

        if (this.buffer.length > 0) {
            // create a new revision
            const newRevision: Revision<T> = {
                number: this.synced.revisions.length + 1,
                operations: [...this.buffer]
            };
            // apply the revision to the awaiting state
            this.awaiting = newRevision;
            // set the status to awaiting
            this.status = Status.Awaiting;
            // reset the buffer
            this.buffer = [];
            // send operation to server
            webSocketService.send(WSTopic.PostRevision, newRevision);
            return;
        }

        // set the status to synced
        this.status = Status.Synced;
    }

    constructor() {
        makeObservable(this);
    }
}