import Victor from "victor";
import { GestureType, PointerEventType } from "./data_types";

export interface IPoint {
    clone(): IPoint;
    copy(point: IPoint): void;
    negate():IPoint;
    set(x: number, y: number): void
    x: number;
    y: number;
    add(point: IPoint):void;
}

export interface IBox {
    min: IPoint;
    max: IPoint;
    Id: string;
    copy(box: IBox);
    clone():IBox;
    isEmpty(): boolean;
    subtract(box: IBox): IBox[];
    translate(point: IPoint):void;
    containsPoint(point: IPoint): boolean;
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
    handlePointerEvent(eventType: PointerEventType, event: PointerEvent);
    handleMultiplePointerEvent(eventType: GestureType, args: ISwipeArgs | IPinchArgs);
}