import { ElementTypeShape, ShapeElement } from "../generated/swagger/api";
import { DraggableSVGShape } from "./DraggableSVGShape";
import { v4 as uuidv4 } from 'uuid';

export function createNewElement(type: string): ShapeElement {
    return {
        type: 'Shape' as ElementTypeShape.Shape,
        id: uuidv4(),
        top: 0,
        left: 0
    };
}

export function createComponent(element: ShapeElement) {
    if (element?.type === 'Shape') {
        return <DraggableSVGShape
            key={element.id}
            id={element.id}
            top={element.top}
            left={element.left}
        />;
    }

    console.log('Unknown element type', element);
    return <div />;
}