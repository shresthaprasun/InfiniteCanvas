import { ResizeSensor } from "css-element-queries";
import { IPixelInfo } from "../../interfaces";
import { PointerEventType, GestureType } from './data_types';
import { InfiniteGrid } from './infinite-grid';
import { IBox, IInputEvenHandler, IPinchArgs, IPoint, ISwipeArgs } from './interfaces';
import { Box, Point } from './utilities';
export class InfiniteCanvas implements IInputEvenHandler {
    private _canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private _iGrid: InfiniteGrid;

    private panStart: IPoint;
    private moveTo: IPoint;

    private boxesToFetch: Map<string, IBox[]>;

    public get canvasRect(): DOMRect {
        return this._canvas.getBoundingClientRect();
    }

    private get anchorPoint(): IPoint {
        return this._iGrid.anchorPoint;
    }

    constructor(igrid: InfiniteGrid) {
        this._iGrid = igrid;
        this.panStart = new Point(0, 0);
        this.moveTo = new Point(0, 0);
        this.boxesToFetch = new Map();
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
        const negatedAnchorPoint = this.anchorPoint.negate();
        gridBoxes.forEach((box, gridId) => {
            box.translate(negatedAnchorPoint);
        });
        return gridBoxes;
    }

    //gets pixel from canvas to store in database
    public getUpdatedPixelBatch(event: PointerEvent): Map<string, IPixelInfo[]> {
        const result = new Map<string, IPixelInfo[]>();
        const brushTolerance = 10;
        //creating box for pixel extraction
        let minx = this.moveTo.x;
        let maxx = Math.floor(event.pageX);
        if (minx > maxx) {
            minx = maxx;
            maxx = this.moveTo.x;
        }
        let miny = this.moveTo.y;
        let maxy = Math.floor(event.pageY);
        if (miny > maxy) {
            miny = maxy;
            maxy = this.moveTo.y;
        }

        const panPixelBox = new Box(new Point(minx - brushTolerance, miny - brushTolerance), new Point(maxx + brushTolerance, maxy + brushTolerance));

        const boxMap = this.getMappedPixelBoxWithGridInfo(panPixelBox);

        boxMap.forEach((box, gridId) => {
            const pixelArray: IPixelInfo[] = [];
            for (let i = box.min.x; i < box.max.x; ++i) {
                for (let j = box.min.y; j < box.max.y; ++j) {
                    const pixel = this.ctx.getImageData(i, j, 1, 1);
                    if (pixel.data["3"] as number !== 0) {
                        pixelArray.push({ x: i + this._iGrid.anchorPoint.x, y: j + this._iGrid.anchorPoint.y, rgba: pixel.data.toString()})
                    }
                }
            }
            result.set(gridId, pixelArray);
        });
        this.moveTo.set(Math.floor(event.pageX), Math.floor(event.pageY));
        return result;
    }

    public putPixelToCanvas(pixel: IPixelInfo) {
        const { x, y, rgba } = pixel;
        console.log("putting pixel in canvas", rgba);
        const imagedata = new ImageData(new Uint8ClampedArray(rgba.split(",").map((i)=>parseInt(i,10))), 1, 1);
        this.ctx.putImageData(imagedata, x - this.anchorPoint.x, y - this.anchorPoint.y);
    }

    public handlePointerEvent(eventType: PointerEventType, event: PointerEvent) {
        switch (eventType) {
            //draw
            case PointerEventType.PRIMARY_START_DRAG:
                this.ctx.beginPath();
                this.ctx.moveTo(event.pageX, event.pageY);
                this.moveTo.set(Math.abs(event.pageX), Math.abs(event.pageY));
                break;
            case PointerEventType.PRIMARY_DRAGGED:
                this.ctx.lineTo(event.pageX, event.pageY);
                this.ctx.stroke();
                break;
            case PointerEventType.PRIMARY_END_DRAG:
                break;
            //pan
            case PointerEventType.SECONDARY_START_DRAG:
                this.panStart.set(Math.floor(event.pageX), Math.floor(event.pageY));
                break;
            case PointerEventType.SECONDARY_DRAGGED:
                let panData: ImageData | undefined = undefined;
                this.boxesToFetch.clear();
                const canvasBoxAfterPan = new Box(this.anchorPoint, new Point(this.anchorPoint.x + this._canvas.width, this.anchorPoint.y + this._canvas.height));
                const canvasBoxBeforePan = new Box(new Point(this.anchorPoint.x + this._iGrid.panOffset.x, this.anchorPoint.y + this._iGrid.panOffset.y), new Point(this.anchorPoint.x + this._canvas.width - this._iGrid.panOffset.x, this.anchorPoint.y + this._canvas.height - this._iGrid.panOffset.y));
                const newSubCanvasBoxes = canvasBoxAfterPan.subtract(canvasBoxBeforePan);

                this._iGrid.gridBoxes.forEach((box, id) => {
                    for (const newSubCanvasBox of newSubCanvasBoxes) {
                        const subboxes = box.subtract(newSubCanvasBox);
                        const subboxesToFetch = this.boxesToFetch.get(id);
                        if (subboxesToFetch) {
                            subboxesToFetch.push(...subboxes);
                        }
                        else {
                            this.boxesToFetch.set(id, subboxes);
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


// let boxToBefetchedAlongWidth: IBox = new Box();
// let boxToBeFetchedAlongHeight: IBox = new Box();

// if (this._iGrid.panOffset.x >= 0 && this._iGrid.panOffset.y >= 0) { //moving towards bottom-right
//     panData = this.ctx.getImageData(0, 0, this.canvas.width - this._iGrid.panOffset.x, this.canvas.height - this._iGrid.panOffset.y);
//     if (this._iGrid.panOffset.y >= 1) {
//         boxToBefetchedAlongWidth.min.copy(this.anchorPoint);
//         boxToBefetchedAlongWidth.max.set(this.anchorPoint.x + this.canvas.width, this.anchorPoint.y + this._iGrid.panOffset.y);
//     }
//     if (this._iGrid.panOffset.x >= 1) {
//         boxToBeFetchedAlongHeight.min.set(this.anchorPoint.x, this.anchorPoint.y + this._iGrid.panOffset.y);
//         boxToBeFetchedAlongHeight.max.set(this.anchorPoint.x + this._iGrid.panOffset.x, this.anchorPoint.y + this.canvas.height);
//     }
//     //logic is reverse but follows same principle
//     // _________________
//     // |   ________|_\_|___ panning and shifted out of this.canvas
//     // |  |        | \ |  |dataToSaveAlongHeight
//     // |  |        | \ |  |
//     // |__|________|_\_|  |
//     // |/_|/_/_/_/_/_/_|  |dataToSaveAlongWidth
//     //    |_______________|
// }
// else if (this._iGrid.panOffset.x >= 0 && this._iGrid.panOffset.y <= 0) { //moving towards top-right
//     panData = this.ctx.getImageData(0, 0 - this._iGrid.panOffset.y, this.canvas.width - this._iGrid.panOffset.x, this.canvas.height + this._iGrid.panOffset.y);
//     if (this._iGrid.panOffset.y <= -1) {
//         boxToBefetchedAlongWidth.min.set(this.anchorPoint.x, this.anchorPoint.y + this.canvas.height + this._iGrid.panOffset.y)
//         boxToBefetchedAlongWidth.max.set(this.anchorPoint.x + this.canvas.width, this.anchorPoint.y + this.canvas.height);

//     }
//     if (this._iGrid.panOffset.x >= 1) {
//         boxToBeFetchedAlongHeight.min.copy(this.anchorPoint);
//         boxToBeFetchedAlongHeight.max.set(this.anchorPoint.x + this._iGrid.panOffset.x, this.anchorPoint.y + this.canvas.height + this._iGrid.panOffset.y)
//     }
// }
// else if (this._iGrid.panOffset.x <= 0 && this._iGrid.panOffset.y <= 0) { //moving towards top-left
//     panData = this.ctx.getImageData(0 - this._iGrid.panOffset.x, 0 - this._iGrid.panOffset.y, this.canvas.width + this._iGrid.panOffset.x, this.canvas.height + this._iGrid.panOffset.y);
//     if (this._iGrid.panOffset.y <= -1) {
//         boxToBefetchedAlongWidth.min.set(this.anchorPoint.x,this.anchorPoint.y + this.canvas.height + this._iGrid.panOffset.y);
//         boxToBefetchedAlongWidth.max.set(this.anchorPoint.x + this.canvas.width, this.anchorPoint.y + this.canvas.height)

//     }
//     if (this._iGrid.panOffset.x <= -1) {
//         boxToBeFetchedAlongHeight.min.set(this.anchorPoint.x + this.canvas.width + this._iGrid.panOffset.x, this.anchorPoint.y)
//         boxToBeFetchedAlongHeight.max.set(this.anchorPoint.x + this.canvas.width, this.anchorPoint.y + this.canvas.height + this._iGrid.panOffset.y);

//     }
// }
// else if (this._iGrid.panOffset.x <= 0 && this._iGrid.panOffset.y >= 0) { //moving towards bottom-left
//     panData = this.ctx.getImageData(0 - this._iGrid.panOffset.x, 0, this.canvas.width + this._iGrid.panOffset.x, this.canvas.height - this._iGrid.panOffset.y);
//     if (this._iGrid.panOffset.y >= 1) {
//         boxToBefetchedAlongWidth.min.copy(this.anchorPoint);
//         boxToBefetchedAlongWidth.max.set(this.anchorPoint.x + this.canvas.width, this.anchorPoint.y + this._iGrid.panOffset.y);

//     }
//     if (this._iGrid.panOffset.x <= -1) {
//         boxToBeFetchedAlongHeight.min.set(this.anchorPoint.x + this.canvas.width + this._iGrid.panOffset.x, this.anchorPoint.y + this._iGrid.panOffset.y);
//         boxToBeFetchedAlongHeight.max.set(this.anchorPoint.x + this.canvas.width, this.anchorPoint.y + this.canvas.height);
//     }
// }