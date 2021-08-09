import { PointerEventType, GestureType } from "./data_types";
import { IBox, IInputEvenHandler, IPinchArgs, IPoint, ISwipeArgs } from "./interfaces";
import { Box, Point } from "./utilities";

const GRID_SIZE = 1024
const TOLERANCE = 50

//In canvas x increases from left to right
//          y increases from top to bottom
// Anchor point will be bottom left point of the standard coordinate system or top left of the canvas, min point in general

export class InfiniteGrid implements IInputEvenHandler {
    private _anchorPoint: IPoint;
    private canvasBox: IBox;
    private _relativeGridBoxes: Map<string, IBox>;

    private _gridAdded: Set<string>;
    private _gridRemoved: Set<string>;

    private panStart: IPoint;
    private _panOffset: IPoint;

    // public set anchorPoint(point: IPoint) {
    //     this._anchorPoint.copy(point);
    //     this.calculateRelativeGridBoxes();
    // }

    public get anchorPoint(): IPoint {
        return this._anchorPoint;
    }

    public get gridBoxes(): Map<string, IBox> { return this._relativeGridBoxes; }
    public get gridAdded(): Set<string> { return this._gridAdded; } //useful for local data storage
    public get gridRemoved(): Set<string> { return this._gridRemoved; }
    public get panOffset(): IPoint { return this._panOffset; }




    constructor(anchorPoint: IPoint) {
        this._anchorPoint = anchorPoint;
        this.canvasBox = new Box();
        this._relativeGridBoxes = new Map();
        this._gridAdded = new Set();
        this._gridRemoved = new Set();
        this.panStart = new Point();
        this._panOffset = new Point();
    }

    init(anchorPoint: IPoint, canvasWidth: number, canvasHeight: number) {
        this._anchorPoint.copy(anchorPoint);
        this.canvasBox.max.set(canvasWidth, canvasHeight)
        this.calculateRelativeGridBoxes();
    }


    //get grid boxes with tolerance for given canvasBox
    private calculateRelativeGridBoxes(): void {
        const currentGridBoxes = new Set(Array.from(this._relativeGridBoxes.keys()));
        this.gridAdded.clear();
        this.gridRemoved.clear();
        this._relativeGridBoxes.clear();
        this._relativeGridBoxes = this.getMappedGridBoxes(this.canvasBox);
        this._relativeGridBoxes.forEach((_, boxId) => {
            if (!currentGridBoxes.has(boxId)) {
                this._gridAdded.add(boxId);
            }
        })

        currentGridBoxes.forEach((boxId) => {
            if (!this._relativeGridBoxes.has(boxId)) {
                this._gridRemoved.add(boxId);
            }
        })
    }

    public getMappedGridBoxes(pixelBox: IBox): Map<string, IBox> {
        const resultGridBoxes = new Map<string, IBox>();
        let leftEdge = 0;
        let rightEdge = 0;
        let topEdge = 0;
        let bottomEdge = 0;

        const boxWidth = pixelBox.max.x - pixelBox.min.x;
        const boxHeight = pixelBox.max.y - pixelBox.min.y;

        //Boundary check
        if (this._anchorPoint.x - boxWidth - TOLERANCE === Number.NEGATIVE_INFINITY || this._anchorPoint.x - boxWidth - TOLERANCE <= Number.MIN_SAFE_INTEGER) {
            leftEdge = Number.MIN_SAFE_INTEGER - 1;
        }

        if (this._anchorPoint.x + boxWidth + TOLERANCE === Number.POSITIVE_INFINITY || this._anchorPoint.x + boxWidth + TOLERANCE >= Number.MAX_SAFE_INTEGER) {
            rightEdge = Number.MAX_SAFE_INTEGER + 1;
        }

        if (this._anchorPoint.y + boxHeight + TOLERANCE === Number.POSITIVE_INFINITY || this._anchorPoint.y + boxHeight + TOLERANCE >= Number.MAX_SAFE_INTEGER) {
            topEdge = Number.MAX_SAFE_INTEGER + 1;
        }

        if (this._anchorPoint.x - boxHeight - TOLERANCE === Number.NEGATIVE_INFINITY || this._anchorPoint.y - boxHeight - TOLERANCE <= Number.MIN_SAFE_INTEGER) {
            bottomEdge = Number.MIN_SAFE_INTEGER - 1;
        }

        const minGridPointX = Math.floor(leftEdge / GRID_SIZE) * GRID_SIZE;
        const minGridPointY = Math.floor(bottomEdge / GRID_SIZE) * GRID_SIZE;

        for (let x = minGridPointX; x < rightEdge; x += GRID_SIZE) {
            for (let y = minGridPointY; y < topEdge; y += GRID_SIZE) {
                const box = new Box(new Point(x, y), new Point(x + GRID_SIZE, y + GRID_SIZE))
                resultGridBoxes.set(box.Id, box);
            }
        }
        return resultGridBoxes;
    }

    public handlePointerEvent(eventType: PointerEventType, event: PointerEvent) {
        switch (eventType) {
            //pan
            case PointerEventType.SECONDARY_START_DRAG:
                this.panStart.set(Math.floor(event.pageX), Math.floor(event.pageY));
                break;
            case PointerEventType.SECONDARY_DRAGGED:
                const pageX = Math.floor(event.pageX);
                const pageY = Math.floor(event.pageY);
                this._panOffset.set(pageX - this.panStart.x, pageY - this.panStart.y);
                this._anchorPoint.set(this._anchorPoint.x - this._panOffset.x, this._anchorPoint.y - this._panOffset.y);
                this.calculateRelativeGridBoxes();

                this.panStart.set(pageX, pageY);
                break;
            case PointerEventType.SECONDARY_END_DRAG:
                break;
        }
    }

    public handleMultiplePointerEvent(eventType: GestureType, args: ISwipeArgs | IPinchArgs) {
        throw new Error("Method not implemented.");
    }


}