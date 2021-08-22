import { ResizeSensor } from "css-element-queries";
import { IPixelInfo } from "../../interfaces";
import { PointerEventType, GestureType } from './data_types';
import { InfiniteGrid } from './infinite-grid';
import { IBox, IDrawData, IInputEvenHandler, IPinchArgs, IPoint, ISwipeArgs } from './interfaces';
import { Box, bresenhamLine, Point } from './utilities';
export class InfiniteCanvas implements IInputEvenHandler {
    private _canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private _iGrid: InfiniteGrid;

    private panStart: IPoint;
    private drawStart: IPoint;
    private drawEnd: IPoint;

    private _boxesToFetch: Map<string, IBox[]>;

    public get boxesToFetchForPan(): Map<string, IBox[]> {
        return this._boxesToFetch;
    }

    public get canvasRect(): DOMRect {
        return this._canvas.getBoundingClientRect();
    }

    private get anchorPoint(): IPoint {
        return this._iGrid.anchorPoint;
    }

    constructor(igrid: InfiniteGrid) {
        this._iGrid = igrid;
        this.panStart = new Point(0, 0);
        this.drawStart = new Point(0, 0);
        this.drawEnd = new Point(0, 0);
        this._boxesToFetch = new Map();
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
        this._canvas.style.cursor = "crosshair";
        this._canvas.width = this._canvas.offsetWidth;
        this._canvas.height = this._canvas.offsetHeight;
        this.ctx = this._canvas.getContext("2d");
        if (!this.ctx) {
            console.error(`Unable to create 2d context`);
        }
        this.ctx.lineWidth = 10;

        const resizeSensor = new ResizeSensor(parent, (size: { width: number; height: number; }) => {
            const canvasData = this.ctx.getImageData(0, 0, this.canvasRect.width, this.canvasRect.height);
            this._canvas.width = Math.floor(size.width);
            this._canvas.height = Math.floor(size.height);
            canvasData && this.ctx.putImageData(canvasData, 0, 0);
            //get remaining data from local cache or database
        });
    }

    private getMappedPixelBoxWithGridInfo(pixelBox: IBox): Map<string, IBox> {
        //map Pixel Box to Grid Box using anchor point
        const originalBox = pixelBox.clone();
        originalBox.translate(this.anchorPoint);
        const gridBoxes = this._iGrid.getMappedGridBoxes(originalBox);
        //map Grid Boxes Back to pixel box
        const result = new Map<string, IBox>();
        const negatedAnchorPoint = this.anchorPoint.negate();
        gridBoxes.forEach((box, gridId) => {
            const commonBox = originalBox.intersect(box);
            if (commonBox) {
                commonBox.translate(negatedAnchorPoint);
                result.set(gridId, commonBox)
            }
        });
        return result;
    }

    //gets pixel from canvas to store in database
    public getUpdatedPixelBatch(event: PointerEvent): Map<string, IPixelInfo[]> {
        const result = new Map<string, IPixelInfo[]>();
        const brushTolerance = 10;
        //creating box for pixel extraction
        let minx = this.drawEnd.x;
        let maxx = Math.floor(event.pageX);
        if (minx > maxx) {
            minx = maxx;
            maxx = this.drawEnd.x;
        }
        let miny = this.drawEnd.y;
        let maxy = Math.floor(event.pageY);
        if (miny > maxy) {
            miny = maxy;
            maxy = this.drawEnd.y;
        }

        const panPixelBox = new Box(new Point(minx - brushTolerance, miny - brushTolerance), new Point(maxx + brushTolerance, maxy + brushTolerance));

        const boxMap = this.getMappedPixelBoxWithGridInfo(panPixelBox);

        boxMap.forEach((box, gridId) => {
            const pixelArray: IPixelInfo[] = [];
            for (let i = box.min.x; i < box.max.x; ++i) {
                for (let j = box.min.y; j < box.max.y; ++j) {
                    const pixel = this.ctx.getImageData(i, j, 1, 1);
                    if (pixel.data["3" as any] as number !== 0) {
                        pixelArray.push({ x: i + this._iGrid.anchorPoint.x, y: j + this._iGrid.anchorPoint.y, rgba: pixel.data.toString() })
                    }
                }
            }
            result.set(gridId, pixelArray);
        });
        this.drawEnd.set(Math.floor(event.pageX), Math.floor(event.pageY));
        return result;
    }

    public putPixelToCanvas(pixel: IPixelInfo) {
        const { x, y, rgba } = pixel;
        const imagedata = new ImageData(new Uint8ClampedArray(rgba.split(",").map((i) => parseInt(i, 10))), 1, 1);
        this.ctx.putImageData(imagedata, x - this.anchorPoint.x, y - this.anchorPoint.y);
    }

    public putImageData(imagedata: ImageData, dx: number, dy: number) {

        this.ctx.putImageData(imagedata, dx - this.anchorPoint.x, dy - this.anchorPoint.y);
    }

    // private paint(event: PointerEvent) {
    //     if (event.buttons > 0) {
    //         this.ctx.fillRect(event.clientX, event.clientY, 5, 5);
    //     }
    // }

    public getDrawnCanvasBox(brushTolerance: number): IDrawData {
        const result: IDrawData = {
            imageData: undefined,
            box: new Box(),
            start: new Point(),
            end: new Point()
        };
        const imageBox = new Box(this.drawStart, this.drawEnd).expandByScalar(brushTolerance);
        result.imageData = this.ctx.getImageData(imageBox.min.x, imageBox.min.y, imageBox.max.x - imageBox.min.x, imageBox.max.y - imageBox.min.y);
        result.box.copy(imageBox);
        result.start.copy(this.drawStart);
        result.end.copy(this.drawEnd);
        return result;
    }

    public handlePointerEvent(eventType: PointerEventType, event: PointerEvent) {
        switch (eventType) {
            //draw
            case PointerEventType.PRIMARY_START_DRAG:
                this.ctx.beginPath();
                this.ctx.moveTo(event.pageX, event.pageY);
                this.drawStart.set(Math.floor(event.pageX), Math.floor(event.pageY))
                this.drawEnd.set(Math.floor(event.pageX), Math.floor(event.pageY));
                break;
            case PointerEventType.PRIMARY_DRAGGED:
                this.drawStart.copy(this.drawEnd);
                if (event.getCoalescedEvents) {
                    for (let coalesced_event of event.getCoalescedEvents()) {
                        this.ctx.lineTo(coalesced_event.pageX, coalesced_event.pageY);
                    }
                } else {
                    this.ctx.lineTo(event.pageX, event.pageY);
                }
                this.ctx.stroke();
                this.drawEnd.set(Math.floor(event.pageX), Math.floor(event.pageY));
                // const points = bresenhamLine(this.drawStart, this.drawEnd, 10);
                // for (const point of points) {
                //     this.ctx.fillRect(point.x, point.y, 1, 1);
                // }
                // this.drawStart.copy(this.drawEnd);

                break;
            case PointerEventType.PRIMARY_END_DRAG:
                break;
            //pan
            case PointerEventType.SECONDARY_START_DRAG:
                this.panStart.set(Math.floor(event.pageX), Math.floor(event.pageY));
                break;
            case PointerEventType.SECONDARY_DRAGGED:
                let panData: ImageData | undefined = undefined;
                this._boxesToFetch.clear();
                const canvasBoxAfterPan = new Box(this.anchorPoint, new Point(this.anchorPoint.x + this._canvas.width, this.anchorPoint.y + this._canvas.height));
                const canvasBoxBeforePan = new Box(new Point(this.anchorPoint.x + this._iGrid.panOffset.x, this.anchorPoint.y + this._iGrid.panOffset.y), new Point(this.anchorPoint.x + this._canvas.width + this._iGrid.panOffset.x, this.anchorPoint.y + this._canvas.height + this._iGrid.panOffset.y));
                const newSubCanvasBoxes = canvasBoxAfterPan.subtract(canvasBoxBeforePan);

                this._iGrid.gridBoxes.forEach((box, id) => {
                    for (const newSubCanvasBox of newSubCanvasBoxes) {
                        const commonBox = box.intersect(newSubCanvasBox);
                        if (commonBox) {
                            const subboxesToFetch = this._boxesToFetch.get(id);
                            if (subboxesToFetch) {
                                subboxesToFetch.push(commonBox);
                            }
                            else {
                                this._boxesToFetch.set(id, [commonBox]);
                            }
                        }
                    }
                });

                if (this._iGrid.panOffset.x >= 0 && this._iGrid.panOffset.y >= 0) { //moving towards bottom-right
                    panData = this.ctx.getImageData(0, 0, this.canvasRect.width - this._iGrid.panOffset.x, this.canvasRect.height - this._iGrid.panOffset.y);
                }
                else if (this._iGrid.panOffset.x >= 0 && this._iGrid.panOffset.y <= 0) { //moving towards top-right
                    panData = this.ctx.getImageData(0, 0 - this._iGrid.panOffset.y, this.canvasRect.width - this._iGrid.panOffset.x, this.canvasRect.height + this._iGrid.panOffset.y);
                }
                else if (this._iGrid.panOffset.x <= 0 && this._iGrid.panOffset.y <= 0) { //moving towards top-left
                    panData = this.ctx.getImageData(0 - this._iGrid.panOffset.x, 0 - this._iGrid.panOffset.y, this.canvasRect.width + this._iGrid.panOffset.x, this.canvasRect.height + this._iGrid.panOffset.y);
                }
                else if (this._iGrid.panOffset.x <= 0 && this._iGrid.panOffset.y >= 0) { //moving towards bottom-left
                    panData = this.ctx.getImageData(0 - this._iGrid.panOffset.x, 0, this.canvasRect.width + this._iGrid.panOffset.x, this.canvasRect.height - this._iGrid.panOffset.y);
                }

                this.ctx.clearRect(0, 0, this.canvasRect.width, this.canvasRect.height);
                panData && this.ctx.putImageData(panData, this._iGrid.panOffset.x > 0 ? this._iGrid.panOffset.x : 0, this._iGrid.panOffset.y > 0 ? this._iGrid.panOffset.y : 0);
                break;
            case PointerEventType.SECONDARY_END_DRAG:
                break;
        }
    }

    public handleMultiplePointerEvent(eventType: GestureType, args: ISwipeArgs | IPinchArgs) {
        throw new Error('Method not implemented.');
    }
}
