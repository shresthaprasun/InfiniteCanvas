import { io, Socket } from "socket.io-client";
import { IBoxInGridToFetch, IPixelInfo, IPixelsInGridInfo } from "../../interfaces";
import { PointerEventType, GestureType } from "./data_types";
import { InfiniteCanvas } from "./infinite-canvas";
import { InfiniteGrid } from "./infinite-grid";
import { IDrawData, IInputEvenHandler, IPinchArgs, ISwipeArgs, WorkerMessageType } from "./interfaces";
import DataWorker from "worker-loader!../worker/dataWorker";
import { bresenhamLine } from "./utilities";



export class SocketIO implements IInputEvenHandler {
    private socket: Socket;
    private iCanvas: InfiniteCanvas;
    private iGrid: InfiniteGrid;

    private worker: DataWorker;

    constructor(iCanvas: InfiniteCanvas, igrid: InfiniteGrid) {
        this.socket = io();
        this.iCanvas = iCanvas;
        this.iGrid = igrid;
        this.worker = new DataWorker();
    }

    public init() {
        this.socket.on("connect", () => {
            console.log(`Connected with socket id ${this.socket.id}`);
            this.iGrid.gridAdded.forEach((gridId) => { //sync the data?
                this.socket.emit("fetchGridBox", gridId);
            });
        });

        this.socket.on('pixelEditted', (pixelsInGrid: IPixelsInGridInfo, cb) => {
            if (pixelsInGrid) {
                for (const pixel of pixelsInGrid.pixelArray) {
                    this.iCanvas.putPixelToCanvas(pixel);
                }
            }
            if (cb) cb();
        });

        this.socket.on('pixelsForPan', (pixelsForPan: IPixelsInGridInfo, cb) => {
            if (pixelsForPan) { //from redis
                // save in cache
                console.log(pixelsForPan);
                this.worker.postMessage({ type: WorkerMessageType.SAVE_PIXEL_ARRAY, gridId: pixelsForPan.gridId, pixelArray: pixelsForPan.pixelArray });
                this.updatePanData(pixelsForPan);
            }
            if (cb) cb();
        });

        this.worker.onmessage = (message) => {
            if (message.data.type === WorkerMessageType.SUB_BOX_DATA) {
                if (message.data.data.pixelArray.length > 0) {
                    this.updatePanData(message.data.data);
                }
            }
            else if (message.data.type === WorkerMessageType.SUB_BOX_IMAGE) {
                if (message.data.imagedata) {
                    this.updatePanImageData(message.data.imagedata, message.data.dx, message.data.dy);
                }
            }
        };
    }

    private updatePanData(pixelsForPan: IPixelsInGridInfo) {
        for (const pixelInfo of pixelsForPan.pixelArray) {
            this.iCanvas.putPixelToCanvas(pixelInfo);
        }
    }

    private updatePanImageData(imageData: ImageData, dx: number, dy: number) {
        this.iCanvas.putImageData(imageData, dx, dy);
    }

    public handlePointerEvent(eventType: PointerEventType, event: PointerEvent) {
        switch (eventType) {
            //upload the data
            case PointerEventType.PRIMARY_START_DRAG:
                break;
            case PointerEventType.PRIMARY_DRAGGED:
                //through worker

                const brushTolerance = 10;
                const drawData: IDrawData = this.iCanvas.getDrawnCanvasBox(brushTolerance);
                const translatedBox = drawData.box.clone().translate(this.iGrid.anchorPoint);
                const gridBoxes = this.iGrid.getMappedGridBoxes(translatedBox, 0);
                // if (gridBoxes.size === 1) {
                //     gridBoxes.forEach((gridBox, gridId) => {
                //         // const commonBox = gridBox.intersect(translatedBox);
                //         // if (commonBox) {
                //         const pixelArray: IPixelInfo[] = [];
                //         const tracedPoints = bresenhamLine(drawData.start, drawData.end, brushTolerance);
                //         for (const tracedPoint of tracedPoints) {
                //             const row_index = (tracedPoint.y - drawData.box.min.y);
                //             const col_index = (tracedPoint.x - drawData.box.min.x);
                //             if (row_index >= 0 && row_index < drawData.imageData.height && col_index >= 0 && col_index < drawData.imageData.width) {
                //                 const a = drawData.imageData.data[(row_index * drawData.imageData.width + col_index) * 4 + 3];
                //                 if (a !== 0) {
                //                     const r = drawData.imageData.data[(row_index * drawData.imageData.width + col_index) * 4];
                //                     const g = drawData.imageData.data[(row_index * drawData.imageData.width + col_index) * 4 + 1];
                //                     const b = drawData.imageData.data[(row_index * drawData.imageData.width + col_index) * 4 + 2];
                //                     tracedPoint.translate(this.iGrid.anchorPoint);
                //                     // x -> column, y -> row
                //                     pixelArray.push({ x: tracedPoint.x, y: tracedPoint.y, rgba: `${r},${g},${b},${a}` })
                //                 }
                //             }
                //         }



                //         // const pixelArray: IPixelInfo[] = [];
                //         // for (let i = 0; i < drawData.imageData.height; ++i) { //row
                //         //     for (let j = 0; j < drawData.imageData.width; ++j) { // col
                //         //         const a = drawData.imageData.data[(i * drawData.imageData.width + j) * 4 + 3];
                //         //         if (a !== 0) {
                //         //             const r = drawData.imageData.data[(i * drawData.imageData.width + j) * 4];
                //         //             const g = drawData.imageData.data[(i * drawData.imageData.width + j) * 4 + 1];
                //         //             const b = drawData.imageData.data[(i * drawData.imageData.width + j) * 4 + 2];
                //         //             // x -> column, y -> row
                //         //             pixelArray.push({ x: j + drawData.box.min.x + this.iGrid.anchorPoint.x, y: i + drawData.box.min.y + this.iGrid.anchorPoint.y, rgba: `${r},${g},${b},${a}` })
                //         //         }
                //         //     }
                //         // }
                //         // const pixelMap = new Map<string, IPixelInfo[]>();
                //         // pixelMap.set(gridId, pixelArray);
                //         this.worker.postMessage({ type: WorkerMessageType.SAVE_PIXEL_ARRAY, gridId, pixelArray });
                //         this.socket.emit("uploadPixelInfo", { gridId, pixelArray } as IPixelsInGridInfo);
                //         // }
                //     })
                // }
                // else {
                // get the line intersection 
                // box and two points and do same as above
                gridBoxes.forEach((gridBox, gridId) => {
                    const commonBox = gridBox.intersect(translatedBox);
                    if (commonBox) {
                        const commonCanvasBox = commonBox.translate(this.iGrid.anchorPoint.clone().negate())
                        // const pixelArray: IPixelInfo[] = [];
                        // const tracedPoints = bresenhamLine(drawData.start, drawData.end, brushTolerance);
                        // for (const tracedPoint of tracedPoints) {
                        //     const row_index = (tracedPoint.y - drawData.box.min.y);
                        //     const col_index = (tracedPoint.x - drawData.box.min.x);
                        //     if (row_index >= 0 && row_index < drawData.imageData.height && col_index >= 0 && col_index < drawData.imageData.width) {
                        //         const a = drawData.imageData.data[(row_index * drawData.imageData.width + col_index) * 4 + 3];
                        //         if (a !== 0) {
                        //             const r = drawData.imageData.data[(row_index * drawData.imageData.width + col_index) * 4];
                        //             const g = drawData.imageData.data[(row_index * drawData.imageData.width + col_index) * 4 + 1];
                        //             const b = drawData.imageData.data[(row_index * drawData.imageData.width + col_index) * 4 + 2];
                        //             tracedPoint.translate(this.iGrid.anchorPoint);
                        //             // x -> column, y -> row
                        //             pixelArray.push({ x: tracedPoint.x, y: tracedPoint.y, rgba: `${r},${g},${b},${a}` })
                        //         }
                        //     }
                        // }

                        const height = commonCanvasBox.max.y - commonCanvasBox.min.y;
                        const width = commonCanvasBox.max.x - commonCanvasBox.min.x;
                        const minXOffset = commonCanvasBox.min.x - drawData.box.min.x;
                        const minYOffset = commonCanvasBox.min.y - drawData.box.min.y;


                        const pixelArray: IPixelInfo[] = [];
                        for (let i = minXOffset; i < minXOffset + height; ++i) { //row
                            for (let j = minYOffset; j < minYOffset + width; ++j) { // col
                                const a = drawData.imageData.data[(i * drawData.imageData.width + j) * 4 + 3];
                                if (a !== 0) {
                                    const r = drawData.imageData.data[(i * drawData.imageData.width + j) * 4];
                                    const g = drawData.imageData.data[(i * drawData.imageData.width + j) * 4 + 1];
                                    const b = drawData.imageData.data[(i * drawData.imageData.width + j) * 4 + 2];
                                    // x -> column, y -> row
                                    pixelArray.push({ x: j + drawData.box.min.x + this.iGrid.anchorPoint.x, y: i + drawData.box.min.y + this.iGrid.anchorPoint.y, rgba: `${r},${g},${b},${a}` })
                                }
                            }
                        }
                        // const pixelMap = new Map<string, IPixelInfo[]>();
                        // pixelMap.set(gridId, pixelArray);
                        this.worker.postMessage({ type: WorkerMessageType.SAVE_PIXEL_ARRAY, gridId, pixelArray });
                        this.socket.emit("uploadPixelInfo", { gridId, pixelArray } as IPixelsInGridInfo);
                    }
                });
                // }
                break;
            case PointerEventType.PRIMARY_END_DRAG:
                break;
            case PointerEventType.SECONDARY_START_DRAG:
                break;
            case PointerEventType.SECONDARY_DRAGGED:
                //Worker
                this.iCanvas.boxesToFetchForPan.forEach((boxes, gridId) => {
                    for (const box of boxes) {
                        this.worker.postMessage({ type: WorkerMessageType.FETCH_IMAGE_DATA_OF_SUBBOX, gridId, box });
                    }
                });
                this.iGrid.gridRemoved.forEach((gridId) => {
                    this.worker.postMessage({ type: WorkerMessageType.DELETE_GRID_DATA, gridId });
                })
                this.iGrid.gridAdded.forEach((gridId) => {
                    this.socket.emit("fetchGridBox", gridId);
                });
                break;
            case PointerEventType.SECONDARY_END_DRAG:
                break;
        }
    }

    public handleMultiplePointerEvent(eventType: GestureType, args: ISwipeArgs | IPinchArgs) {
        throw new Error("Method not implemented.");
    }

}