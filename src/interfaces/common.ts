export interface MouseTracking {
    x: number;
    y: number;
}

export interface MouseTrackingDto extends MouseTracking {
    sessionId: string;
}
