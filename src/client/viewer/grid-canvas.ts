import { ResizeSensor } from "css-element-queries";
import { PointerEventType, GestureType } from "./data_types";
import { InfiniteGrid } from "./infinite-grid";
import { IInputEvenHandler, IPinchArgs, ISwipeArgs } from "./interfaces";

export class GridCanvas implements IInputEvenHandler {
    private iGrid: InfiniteGrid;
    private _canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(iGrid: InfiniteGrid) {
        this.iGrid = iGrid;
    }

    private get canvasRect(): DOMRect {
        return this._canvas.getBoundingClientRect();
    }

    public init(parent: HTMLElement) {
        this._canvas = document.createElement("canvas");
        parent.appendChild(this._canvas);
        this._canvas.setAttribute("touch-action", "none");
        this._canvas.style.position = "absolute";
        this._canvas.style.top = "0";
        this._canvas.style.left = "0";
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.style.border = "1px solid black";
        this._canvas.style.touchAction = "none";
        this._canvas.width = this._canvas.offsetWidth;
        this._canvas.height = this._canvas.offsetHeight;
        this.ctx = this._canvas.getContext("2d");
        if (!this.ctx) {
            console.error(`Unable to create 2d context`);
        }
        this.ctx.lineWidth = 5;
        this.ctx.font = '48px serif';

        const resizeSensor = new ResizeSensor(parent, (size: { width: number; height: number; }) => {
            const canvasData = this.ctx.getImageData(0, 0, this.canvasRect.width, this.canvasRect.height);
            this._canvas.width = Math.floor(size.width);
            this._canvas.height = Math.floor(size.height);
            canvasData && this.ctx.putImageData(canvasData, 0, 0);
            //get remaining data from local cache or database
        });
        this.drawGrid();
        
    }

    private drawGrid(){
        this.iGrid.gridBoxes.forEach((box, gridId) => {
            const gridBox = box.clone();
            let anchorPoint = this.iGrid.anchorPoint.clone();
            anchorPoint = anchorPoint.negate();
            gridBox.translate(anchorPoint);
            this.ctx.fillText(`(${box.min.x},${box.min.y})`, gridBox.min.x, gridBox.min.y);
            this.ctx.beginPath();
            this.ctx.moveTo(gridBox.min.x, gridBox.min.y);
            this.ctx.lineTo(gridBox.min.x, gridBox.max.y);
            this.ctx.stroke();

            this.ctx.moveTo(gridBox.max.x, gridBox.min.y);
            this.ctx.lineTo(gridBox.max.x, gridBox.max.y);
            this.ctx.stroke();

            this.ctx.moveTo(gridBox.min.x, gridBox.min.y);
            this.ctx.lineTo(gridBox.max.x, gridBox.min.y);
            this.ctx.stroke();

            this.ctx.moveTo(gridBox.min.x, gridBox.max.y);
            this.ctx.lineTo(gridBox.max.x, gridBox.max.y);
            this.ctx.stroke();

        });
    }

    public handlePointerEvent(eventType: PointerEventType, event: PointerEvent) {
        switch (eventType) {
            //pan
            case PointerEventType.SECONDARY_START_DRAG:
                break;
            case PointerEventType.SECONDARY_DRAGGED:
                this.ctx.clearRect(0,0, this.canvasRect.width, this.canvasRect.height);
                this.drawGrid();
                break;
            case PointerEventType.SECONDARY_END_DRAG:
                break;
        }
    }

    public handleMultiplePointerEvent(eventType: GestureType, args: ISwipeArgs | IPinchArgs) {
        throw new Error("Method not implemented.");
    }


}