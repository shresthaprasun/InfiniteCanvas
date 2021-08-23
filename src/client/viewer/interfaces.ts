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
    translate(point:IPoint): IPoint;
}

export interface IBox {
    min: IPoint;
    max: IPoint;
    Id: string;
    copy(box: IBox): IBox;
    clone(): IBox;
    isEmpty(): boolean;
    contains(box: IBox): boolean;
    subtract(box: IBox): IBox[];
    translate(point: IPoint): IBox;
    containsPoint(point: IPoint): boolean;
    intersect(box: IBox): IBox | undefined;
    equals(box: IBox): boolean;
    generateBoxesAlongDiagonal(offset: number, tolerance: number, diagonalType: "minmax" | "other"): IBox[];
    expandByScalar(offset: number): IBox;
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
    //cache
    SAVE_PIXEL_ARRAY = "savePixelArray",
    SAVE_IMAGEDATA = "saveImageData",
    GET_SUBBOX_OF_GRID = "getSubBoxOfGrid",
    //from server
    FETCH_SUBBOX_OF_GRID = "fetchSubBoxOfGrid",    
    DELETE_GRID_DATA = "deleteGridData",
    FETCH_IMAGE_DATA_OF_SUBBOX = "fetchImageDataOfSubBoxInGrid",

    SUB_BOX_DATA = "subBoxData",
    SUB_BOX_IMAGE = "subBoxImage",

    //put to canvas
    PUT_PIXEL_ARRAY="putPixelArray",

    //socket
    INIT_SOCKET="initSocket"
}

export interface IDrawData { 
    imageData: ImageData; 
    box: IBox; 
    start: IPoint; 
    end: IPoint; 
}



