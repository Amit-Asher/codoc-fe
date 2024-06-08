import { useEffect, useMemo } from "react";
import { createComponent } from "../components/ComponentFactory";
import { ApiFacade, DocumentTrack, ShapeElement, WSTopic } from "../generated/swagger/api";
import { webSocketService } from "../services/ws-service";
import { observer } from "mobx-react";
import { stores } from "../stores/stores";
import { DocumentStore, Revision } from "../stores/document-store";
import ReactDOM from "react-dom";
import { Toolbar } from "../components/Toolbar";
import { MouseTrackingDto } from "../interfaces/common";
import '../theme/collaborative-doc.css';

function CollaborativeDocComponent(props: any) {
    const documentStore: DocumentStore<ShapeElement> = stores.documentStore;

    useEffect(() => {
        const cursorTrackingListener = (data: MouseTrackingDto) => {
            const marker = document.getElementById(`marker-${data.sessionId}`);
            if (!marker) {
                // create new marker
                const newMarker = document.createElement("div");
                ReactDOM.render(<Cursor sessionId={data.sessionId} color="red" />, newMarker);
                document.getElementById("cursors")?.appendChild(newMarker);
                return;
            }

            marker.style.left = (data.x - marker.offsetWidth / 2) + 'px';
            marker.style.top = (data.y - marker.offsetHeight / 2) + 'px';
        };

        const publishRevisionListener = (payload: Revision<ShapeElement>) => {
            documentStore.sync(payload);
        };

        const handleMouseMove = (e: MouseEvent) => {
            const reduceNetwork = e.clientX % 2 == 0 && e.clientY % 3 == 0;
            const marker = document.getElementById(`marker-${webSocketService.sessionId}`);
            if (!marker) return;

            marker.style.left = (e.clientX - marker.offsetWidth / 2) + 'px';
            marker.style.top = (e.clientY - marker.offsetHeight / 2) + 'px';

            if (webSocketService.ws && reduceNetwork) {
                webSocketService.send(WSTopic.CursorTracking, {
                    x: e.clientX,
                    y: e.clientY
                });
            }
        };

        (async () => {
            try {
                webSocketService.addListener(WSTopic.CursorTracking, cursorTrackingListener);
                webSocketService.addListener(WSTopic.PublishRevision, publishRevisionListener);
                document.addEventListener('mousemove', handleMouseMove);
                const docFromServer: DocumentTrack = await ApiFacade.DocumentsApi.getDocument();
                documentStore.init(docFromServer);
            } catch (err) {
            }
        })();

        return () => {
            document.removeEventListener('mousemove', () => handleMouseMove);
            webSocketService.removeListener(WSTopic.CursorTracking, cursorTrackingListener);
            webSocketService.removeListener(WSTopic.PublishRevision, publishRevisionListener);
        }
    }, []);

    const Cursor = useMemo(() => ({ sessionId, color }: { sessionId: string, color: string }) => (
        <div id={`marker-${sessionId}`} className="custom-marker" style={{ backgroundColor: color }}>
            <div style={{ marginTop: '-30px', marginLeft: '-10px' }}>
                {sessionId.slice(0, 5)}
            </div>
        </div>
    ), []);

    return <div className="collab-doc-container">
        <Toolbar />
        <div id="elements-container">
            {documentStore.elements?.map((element: any) => createComponent(element))}
        </div>
        <div id="cursors">
            <div><Cursor sessionId={webSocketService.sessionId} color="blue" /></div>
        </div>
    </div >;
}

export const CollaborativeDoc = observer(CollaborativeDocComponent);