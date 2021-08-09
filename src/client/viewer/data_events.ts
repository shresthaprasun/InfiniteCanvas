import { EventEmitter } from "events";
import { StrictEventEmitter } from "strict-event-emitter-types";
import { IBox, IPoint } from "./interfaces";

export interface ViewerEvents {
    anchorPointUpdated: (point:IPoint) => void,
    gridUpdated:(grid: Map<string, IBox>) => void,
    pixelUpdated:(payload:{xBatch:number[], yBatch: number[], colorBatch: Uint8ClampedArray})=> void
}

export type ICanvasEventEmitter = StrictEventEmitter<EventEmitter, ViewerEvents>;
export const iCanvasEventEmitter: ICanvasEventEmitter = new EventEmitter();
