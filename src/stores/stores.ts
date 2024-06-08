import { ShapeElement } from "../generated/swagger/api";
import { DocumentStore } from "./document-store";

export const stores = {
    documentStore: new DocumentStore<ShapeElement>()
};
