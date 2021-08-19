import Victor from "victor";
import { GestureType, PointerEventType } from "./data_types";

export interface IPoint {
    clone(): IPoint;
    copy(point: IPoint): void;
    negate(): IPoint;
    set(x: number, y: number): void
    x: number;
    y: number;
    add(point: IPoint): void;
    equals(point: IPoint): boolean;
}

export interface IBox {
    min: IPoint;
    max: IPoint;
    Id: string;
    copy(box: IBox): void;
    clone(): IBox;
    isEmpty(): boolean;
    contains(box:IBox):boolean;
    subtract(box: IBox): IBox[];
    translate(point: IPoint): void;
    containsPoint(point: IPoint): boolean;
    intersect(box: IBox): IBox | undefined;
    equals(box: IBox): boolean;

}

export interface ISwipeArgs {
    swipeFrom: Victor;
    swipeTo: Victor;
}

export interface IPinchArgs {
    center: Victor;
    pinchOffset: number;
}

export interface IInputEvenHandler {
    handlePointerEvent(eventType: PointerEventType, event: PointerEvent): void;
    handleMultiplePointerEvent(eventType: GestureType, args: ISwipeArgs | IPinchArgs): void;
}

export enum WorkerMessageType {
    SAVE_PIXEL_ARRAY = "savePixelArray",
    FETCH_SUBBOX_OF_GRID = "fetchSubBoxOfGrid",
    DELETE_GRID_DATA = "deleteGridData",
    FETCH_IMAGE_DATA_OF_SUBBOX = "fetchImageDataOfSubBoxInGrid",

    SUB_BOX_DATA = "subBoxData",
    SUB_BOX_IMAGE = "subBoxImage",
}

