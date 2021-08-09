// https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events

import Victor from "victor";
import { GestureType, PointerEventButtonIDs, PointerEventType } from "./data_types";
import { IInputEvenHandler } from "./interfaces";

const clickTolerance = 10;//px
const doubleClickTimeDuration = 200;

interface IPointerInfo { //pointerId represents the device not the buttons
    pointerdownPoint: Victor;
    pointermovePoint: Victor;
    pointerdownCount: number;
    isPointerUp: boolean;
    isPointerDown: boolean;
    isDoubleClicked: boolean;
    pointerDownAnalyzer?: any;
    pointerUpAnalyzer?: any;
    isTimerNeeded: boolean;
    pointerEvent: PointerEvent;
}

//multiple mouse buttons cannot be clicked at a same moment //pointer down and pointer up is not detectable
//one button per device is permissable

export class InputManager {
    private pinchRadius: number;
    private pinchCenter: Victor;
    private pointerMap: Map<number, IPointerInfo>;
    private isPointerMoved: boolean;
    private isPointerDragged: boolean;
    private inputHandlers: IInputEvenHandler[];

    constructor(inputHandlers: IInputEvenHandler[]) {
        this.inputHandlers = inputHandlers;
        this.isPointerMoved = false;
        this.isPointerDragged = false;
        this.pointerMap = new Map();
        this.pinchRadius = 0;
    }

    private onPointerDown(pointerInfo: IPointerInfo) {
        pointerInfo.pointerUpAnalyzer && clearTimeout(pointerInfo.pointerUpAnalyzer);
        pointerInfo.isTimerNeeded = false;
        pointerInfo.isPointerDown = true;

        switch (pointerInfo.pointerEvent.button) { //down
            case PointerEventButtonIDs.PRIMARY: {
                for (const inputHandler of this.inputHandlers) {
                    inputHandler.handlePointerEvent(PointerEventType.PRIMARY_DOWN, pointerInfo.pointerEvent);
                }
            }
                break;
            case PointerEventButtonIDs.SECONDARY: {
                for (const inputHandler of this.inputHandlers) {
                    inputHandler.handlePointerEvent(PointerEventType.SECONDARY_DOWN, pointerInfo.pointerEvent);
                }
            }
                break;
            case PointerEventButtonIDs.AUXILARY: {
                for (const inputHandler of this.inputHandlers) {
                    inputHandler.handlePointerEvent(PointerEventType.AUXILARY_DOWN, pointerInfo.pointerEvent);
                }
            }
                break;
        }
    };


    public handlePointerDown(ev: PointerEvent): void {
        this.isPointerMoved = false;
        this.isPointerDragged = false;
        let pointerInfo = this.pointerMap.get(ev.pointerId);
        if (pointerInfo) {
            pointerInfo.isPointerUp = false;
            pointerInfo.pointerdownCount += 1;
        }
        else {
            pointerInfo = {
                pointerdownPoint: new Victor(ev.pageX, ev.pageY),
                pointermovePoint: new Victor(ev.pageX, ev.pageY),
                pointerdownCount: 1,
                isDoubleClicked: false,
                isPointerUp: false,
                isPointerDown: false,
                isTimerNeeded: false,
                pointerEvent: ev
            };
            this.pointerMap.set(ev.pointerId, pointerInfo);
        }
        if (this.pointerMap.size > 1) { //pinch
            this.pinchCenter = new Victor(0, 0);
            this.pointerMap.forEach((pInfo) => {
                this.pinchCenter.add(pInfo.pointerdownPoint);
            });
            this.pinchCenter.multiplyScalar(1 / this.pointerMap.size);
            this.pinchRadius = this.pinchCenter.distance(pointerInfo.pointerdownPoint);

        }
        else {
            if (pointerInfo.pointerdownCount > 1) {
                pointerInfo.isDoubleClicked = true;
                pointerInfo.pointerDownAnalyzer && clearTimeout(pointerInfo.pointerDownAnalyzer);
            }
            else {
                pointerInfo.isDoubleClicked = false;
                pointerInfo.isTimerNeeded = true;

                pointerInfo.pointerDownAnalyzer && clearTimeout(pointerInfo.pointerDownAnalyzer);
                pointerInfo.pointerDownAnalyzer = setTimeout((pInfo) => {
                    if (!pInfo.isPointerUp) {
                        this.onPointerDown(pInfo);
                    }
                }, doubleClickTimeDuration, pointerInfo);
            }
        }
    }

    public handlePointerMove(ev: PointerEvent): void {
        let pointerInfo = this.pointerMap.get(ev.pointerId);
        if (pointerInfo) {
            if (this.pointerMap.size > 1) { //pinch
                pointerInfo.pointerdownPoint.x = ev.pageX;
                pointerInfo.pointerdownPoint.y = ev.pageY;
                const centre = new Victor(0, 0);
                this.pointerMap.forEach((pInfo) => {
                    centre.add(pInfo.pointerdownPoint);
                });
                centre.multiplyScalar(1 / this.pointerMap.size);
                const pinchRadius = centre.distance(pointerInfo.pointerdownPoint);
                const swipeVal = this.pinchCenter.distance(centre);

                if (swipeVal > 10) {
                    for (const inputHandler of this.inputHandlers) {
                        inputHandler.handleMultiplePointerEvent(GestureType.SWIPE, { swipeFrom: this.pinchCenter, swipeTo: centre });
                    }
                    this.pinchCenter.copy(centre);
                }
                const pinchVal = this.pinchRadius - pinchRadius;
                this.pinchRadius = pinchRadius;

                if (Math.abs(pinchVal) > 1) {
                    for (const inputHandler of this.inputHandlers) {
                        inputHandler.handleMultiplePointerEvent(GestureType.PINCH, { center: this.pinchCenter, pinchOffset: pinchVal });
                    }
                }
            }
            else {

                if (pointerInfo.pointerdownCount > 0) {//dragged
                    pointerInfo.pointermovePoint.x = ev.pageX;
                    pointerInfo.pointermovePoint.y = ev.pageY;
                    const tolerance = pointerInfo.pointermovePoint.subtract(pointerInfo.pointerdownPoint).length();
                    if (tolerance < clickTolerance && !this.isPointerMoved) { //still pointer down //pointer can come back to original position 
                        this.isPointerMoved = false; //tolerance not reached 
                    }
                    else {
                        //detect single click
                        pointerInfo.pointerUpAnalyzer && clearTimeout(pointerInfo.pointerUpAnalyzer);
                        pointerInfo.pointerDownAnalyzer && clearTimeout(pointerInfo.pointerDownAnalyzer);
                        pointerInfo.isTimerNeeded = false;
                        if (pointerInfo.isPointerUp) {
                            switch (pointerInfo.pointerEvent.button) { //down
                                case PointerEventButtonIDs.PRIMARY: {
                                    for (const inputHandler of this.inputHandlers) {
                                        inputHandler.handlePointerEvent(PointerEventType.PRIMARY_CLICK, pointerInfo.pointerEvent);
                                    }
                                }
                                    break;
                                case PointerEventButtonIDs.SECONDARY: {
                                    //single click
                                    for (const inputHandler of this.inputHandlers) {
                                        inputHandler.handlePointerEvent(PointerEventType.SECONDARY_CLICK, pointerInfo.pointerEvent);
                                    }
                                }
                                    break;
                                case PointerEventButtonIDs.AUXILARY: {
                                    for (const inputHandler of this.inputHandlers) {
                                        inputHandler.handlePointerEvent(PointerEventType.AUXILARY_CLICK, pointerInfo.pointerEvent);
                                    }
                                }
                                    break;
                            }
                            this.pointerMap.delete(ev.pointerId);
                            this.isPointerMoved = true;
                            for (const inputHandler of this.inputHandlers) {
                                inputHandler.handlePointerEvent(PointerEventType.HOVER, ev);
                            }
                        }
                        else {
                            if (!this.isPointerMoved) {
                                this.isPointerDragged = true;
                                switch (pointerInfo.pointerEvent.button) { //down
                                    case PointerEventButtonIDs.PRIMARY: {
                                        for (const inputHandler of this.inputHandlers) {
                                            inputHandler.handlePointerEvent(PointerEventType.PRIMARY_START_DRAG, pointerInfo.pointerEvent);
                                        }
                                    }
                                        break;
                                    case PointerEventButtonIDs.SECONDARY: {
                                        for (const inputHandler of this.inputHandlers) {
                                            inputHandler.handlePointerEvent(PointerEventType.SECONDARY_START_DRAG, pointerInfo.pointerEvent);
                                        }
                                    }
                                        break;
                                    case PointerEventButtonIDs.AUXILARY: {
                                        for (const inputHandler of this.inputHandlers) {
                                            inputHandler.handlePointerEvent(PointerEventType.AUXILARY_START_DRAG, pointerInfo.pointerEvent);
                                        }
                                    }
                                        break;
                                }
                            }
                            this.isPointerMoved = true; //dragged
                            switch (pointerInfo.pointerEvent.button) { //down
                                case PointerEventButtonIDs.PRIMARY: {
                                    for (const inputHandler of this.inputHandlers) {
                                        inputHandler.handlePointerEvent(PointerEventType.PRIMARY_DRAGGED, ev);
                                    }
                                }
                                    break;
                                case PointerEventButtonIDs.SECONDARY: {
                                    for (const inputHandler of this.inputHandlers) {
                                        inputHandler.handlePointerEvent(PointerEventType.SECONDARY_DRAGGED, ev);
                                    }
                                }
                                    break;
                                case PointerEventButtonIDs.AUXILARY: {
                                    for (const inputHandler of this.inputHandlers) {
                                        inputHandler.handlePointerEvent(PointerEventType.AUXILARY_DRAGGED, ev);
                                    }
                                }
                                    break;
                            }

                        }

                        if (pointerInfo.isPointerDown) {
                            switch (pointerInfo.pointerEvent.button) { //down
                                case PointerEventButtonIDs.PRIMARY: {
                                    for (const inputHandler of this.inputHandlers) {
                                        inputHandler.handlePointerEvent(PointerEventType.PRIMARY_MOVED, ev);
                                    }
                                }
                                    break;
                                case PointerEventButtonIDs.SECONDARY: {
                                    for (const inputHandler of this.inputHandlers) {
                                        inputHandler.handlePointerEvent(PointerEventType.SECONDARY_MOVED, ev);
                                    }
                                }
                                    break;
                                case PointerEventButtonIDs.AUXILARY: {
                                    for (const inputHandler of this.inputHandlers) {
                                        inputHandler.handlePointerEvent(PointerEventType.AUXILARY_MOVED, ev);
                                    }
                                }
                                    break;
                            }
                        }
                    }
                }
                else { //hover
                    this.isPointerMoved = true;
                    for (const inputHandler of this.inputHandlers) {
                        inputHandler.handlePointerEvent(PointerEventType.HOVER, ev);
                    }
                }
            }
        }
        else { //hover
            this.isPointerMoved = true;
            for (const inputHandler of this.inputHandlers) {
                inputHandler.handlePointerEvent(PointerEventType.HOVER, ev);
            }
        }
    }

    public handlePointerUp(ev: PointerEvent): void {

        let pointerInfo = this.pointerMap.get(ev.pointerId);
        if (pointerInfo) {
            pointerInfo.isPointerUp = true;
            if (pointerInfo.isTimerNeeded) {
                if (!pointerInfo.pointerUpAnalyzer) {
                    pointerInfo.pointerUpAnalyzer = setTimeout((pInfo: IPointerInfo) => {
                        switch (pInfo.pointerEvent.button) { //down
                            case PointerEventButtonIDs.PRIMARY: {
                                if (pointerInfo.isDoubleClicked) {
                                    //double click
                                    for (const inputHandler of this.inputHandlers) {
                                        inputHandler.handlePointerEvent(PointerEventType.PRIMARY_DOUBLE_CLICK, pointerInfo.pointerEvent);
                                    }
                                }
                                else {
                                    //single click
                                    for (const inputHandler of this.inputHandlers) {
                                        inputHandler.handlePointerEvent(PointerEventType.PRIMARY_CLICK, pointerInfo.pointerEvent);
                                    }
                                }
                            }
                                break;
                            case PointerEventButtonIDs.SECONDARY: {
                                if (pointerInfo.isDoubleClicked) {
                                    //double click
                                    for (const inputHandler of this.inputHandlers) {
                                        inputHandler.handlePointerEvent(PointerEventType.SECONDARY_DOUBLE_CLICK, pointerInfo.pointerEvent);
                                    }
                                }
                                else {
                                    //single click
                                    for (const inputHandler of this.inputHandlers) {
                                        inputHandler.handlePointerEvent(PointerEventType.SECONDARY_CLICK, pointerInfo.pointerEvent);
                                    }
                                }
                            }
                                break;
                            case PointerEventButtonIDs.AUXILARY: {
                                if (pointerInfo.isDoubleClicked) {
                                    //double click
                                    for (const inputHandler of this.inputHandlers) {
                                        inputHandler.handlePointerEvent(PointerEventType.AUXILARY_DOUBLE_CLICK, pointerInfo.pointerEvent);
                                    }
                                }
                                else {
                                    //single click
                                    for (const inputHandler of this.inputHandlers) {
                                        inputHandler.handlePointerEvent(PointerEventType.AUXILARY_CLICK, pointerInfo.pointerEvent);
                                    }
                                }
                            }
                                break;
                        }
                        pointerInfo.pointerDownAnalyzer && clearTimeout(pointerInfo.pointerDownAnalyzer);
                        this.pointerMap.delete(ev.pointerId);
                        pointerInfo.pointerUpAnalyzer = undefined;
                    }, doubleClickTimeDuration, pointerInfo);
                }
            }
            else { //pointer up occured
                if (this.isPointerDragged) {
                    this.isPointerDragged = false;
                    switch (pointerInfo.pointerEvent.button) { //down
                        case PointerEventButtonIDs.PRIMARY: {
                            for (const inputHandler of this.inputHandlers) {
                                inputHandler.handlePointerEvent(PointerEventType.PRIMARY_END_DRAG, ev);
                            }
                        }
                            break;
                        case PointerEventButtonIDs.SECONDARY: {
                            for (const inputHandler of this.inputHandlers) {
                                inputHandler.handlePointerEvent(PointerEventType.SECONDARY_END_DRAG, ev);
                            }
                        }
                            break;
                        case PointerEventButtonIDs.AUXILARY: {
                            for (const inputHandler of this.inputHandlers) {
                                inputHandler.handlePointerEvent(PointerEventType.AUXILARY_END_DRAG, ev);
                            }
                        }
                            break;
                    }
                }
                if (pointerInfo.isPointerDown) {
                    switch (pointerInfo.pointerEvent.button) { //down
                        case PointerEventButtonIDs.PRIMARY: {
                            for (const inputHandler of this.inputHandlers) {
                                inputHandler.handlePointerEvent(PointerEventType.PRIMARY_UP, pointerInfo.pointerEvent);
                            }
                        }
                            break;
                        case PointerEventButtonIDs.SECONDARY: {
                            for (const inputHandler of this.inputHandlers) {
                                inputHandler.handlePointerEvent(PointerEventType.SECONDARY_UP, pointerInfo.pointerEvent);
                            }
                        }
                            break;
                        case PointerEventButtonIDs.AUXILARY: {
                            for (const inputHandler of this.inputHandlers) {
                                inputHandler.handlePointerEvent(PointerEventType.AUXILARY_UP, pointerInfo.pointerEvent);
                            }
                        }
                            break;
                    }
                }

                if (pointerInfo.isPointerDown && !this.isPointerMoved) {
                    switch (pointerInfo.pointerEvent.button) { //down
                        case PointerEventButtonIDs.PRIMARY: {
                            for (const inputHandler of this.inputHandlers) {
                                inputHandler.handlePointerEvent(PointerEventType.PRIMARY_LONG_CLICK, pointerInfo.pointerEvent);
                            }
                        }
                            break;
                        case PointerEventButtonIDs.SECONDARY: {
                            for (const inputHandler of this.inputHandlers) {
                                inputHandler.handlePointerEvent(PointerEventType.SECONDARY_LONG_CLICK, pointerInfo.pointerEvent);
                            }
                        }
                            break;
                        case PointerEventButtonIDs.AUXILARY: {
                            for (const inputHandler of this.inputHandlers) {
                                inputHandler.handlePointerEvent(PointerEventType.AUXILARY_LONG_CLICK, pointerInfo.pointerEvent);
                            }
                        }
                            break;
                    }
                }
                pointerInfo.isPointerDown = false;
                this.pointerMap.delete(ev.pointerId);
            }
        }
    }

    public handlePointerEnter(ev: PointerEvent): void {
    }

    public handlePointerLeave(ev: PointerEvent): void {
        for (const inputHandler of this.inputHandlers) {
            inputHandler.handlePointerEvent(PointerEventType.POINTER_LEAVE, ev);
        }
        this.pointerMap.delete(ev.pointerId);
    }

    public handlePointerCancel(ev: PointerEvent): void {
        this.pointerMap.delete(ev.pointerId);
    }

    public handlePointerOut(ev: PointerEvent): void {
        for (const inputHandler of this.inputHandlers) {
            inputHandler.handlePointerEvent(PointerEventType.POINTER_OUT, ev);
        }
        this.pointerMap.delete(ev.pointerId);
    }

    public handlePointerOver(ev: PointerEvent): void {
    }

    public handleGotPointerCapture(ev: PointerEvent): void {
    }

    public handleLostPointerCapture(ev: PointerEvent): void {
        this.pointerMap.delete(ev.pointerId);
    }
}
