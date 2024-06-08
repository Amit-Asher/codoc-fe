import { observer } from "mobx-react";
import { DocumentStore } from "../stores/document-store";
import { ShapeElement } from "../generated/swagger/api";
import { stores } from "../stores/stores";
import { createNewElement } from "./ComponentFactory";
import { createOperation } from "../stores/ot-client";
import { useCallback } from "react";

function ToolbarComponent(props: any) {
    const documentStore: DocumentStore<ShapeElement> = stores.documentStore;

    const renderNewElement = (type: 'Shape') => {
        const container = document.getElementById("elements-container");
        if (container) {
            const newDocElement = createNewElement(type);
            const newOperation = createOperation('insert', documentStore.elements.length, newDocElement);
            documentStore.makeOperation(newOperation);
        }
    }

    const toggleEraseMode = () => {
        if (documentStore.mode === 'erase') {
            documentStore.mode = 'regular';
            document.removeEventListener('mousedown', eraseElement);
        } else {
            documentStore.mode = 'erase';
            document.addEventListener('mousedown', eraseElement);
        }

        // change mouse cursor
        document.body.style.cursor = documentStore.mode === 'erase' ? 'crosshair' : 'default';
    }

    const eraseElement = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const elementId = target.id;
        const element = documentStore.elements.find((element: any) => element.id === elementId);
        if (element) {
            const operation = createOperation('delete', documentStore.elements.indexOf(element), element);
            documentStore.makeOperation(operation);
        }
    }, []);


    return <div id="toolbar" style={{ backgroundColor: 'lightgray', padding: '10px', marginBottom: '10px' }}>
        <button onClick={() => renderNewElement('Shape')}>Create</button>
        <button onClick={() => toggleEraseMode()} style={{ backgroundColor: documentStore.mode === 'erase' ? 'red' : 'green' }}>Erase</button>
    </div>;
}

export const Toolbar = observer(ToolbarComponent);