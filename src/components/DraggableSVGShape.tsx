import { observer } from "mobx-react";
import { useEffect, useRef, useState } from "react";
import { stores } from "../stores/stores";
import { DocumentStore } from "../stores/document-store";
import { ShapeElement } from "../generated/swagger/api";
import { webSocketService } from "../services/ws-service";

interface Props {
    id: string;
    top: number;
    left: number;
}

export const DraggableSVGShape = observer(DraggableSVGShapeComponent);
function DraggableSVGShapeComponent(props: Props) {
    const [position, setPosition] = useState({ x: props.left, y: props.top });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 });
    const [cursorIsGrabbing, setCursorIsGrabbing] = useState(false);
    const documentStore: DocumentStore<ShapeElement> = stores.documentStore;

    const handleMouseDown = (event: any) => {
        isDragging.current = true;
        dragStart.current = {
            x: event.clientX,
            y: event.clientY,
            left: position.x,
            top: position.y
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        setCursorIsGrabbing(true);
    };

    useEffect(() => {
        const element = documentStore.elements.find(e => e.id === props.id);
        if (element) {
            setPosition({
                x: element.left,
                y: element.top
            });
        }
    }, [documentStore.elements]);

    const handleMouseMove = (event: any) => {
        if (!isDragging.current) return;
        const dx = event.clientX - dragStart.current.x;
        const dy = event.clientY - dragStart.current.y;
        setPosition({
            x: dragStart.current.left + dx,
            y: dragStart.current.top + dy
        });
        const element = documentStore.elements.find(e => e.id === props.id);
        if (element) {
            documentStore.makeOperation({
                type: 'update',
                element: { ...element, top: dragStart.current.top + dy, left: dragStart.current.left + dx },
                updatedBy: webSocketService.sessionId,
                version: documentStore.offset
            });
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        setCursorIsGrabbing(false);
    };

    return (
        <div id={`${props.id}-container`} style={{ position: 'absolute', display: 'inline-block', left: `${position.x}px`, top: `${position.y}px`, cursor: cursorIsGrabbing ? 'grabbing' : 'grab' }}>
            <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <rect id={props.id} x="10" y="10" width="80" height="80" fill="blue" stroke="black" strokeWidth="2" onMouseDown={handleMouseDown} />
            </svg>
        </div>
    );
}