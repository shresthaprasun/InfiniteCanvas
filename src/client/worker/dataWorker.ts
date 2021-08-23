// worker.js
import { io, Socket } from "socket.io-client";
import { IPixelInfo, IPixelsInGridInfo } from "../../interfaces";
import { CacheManager } from "../viewer/cache-manager";
import { IBox, IDrawData, IPoint, WorkerMessageType } from "../viewer/interfaces";
import { Box, Point } from "../viewer/utilities";

// We alias self to ctx and give it our newly created type
const ctx: Worker = self as any;
//responsible for socketIO and cache manager
class DataHandler {
    private socket: Socket;
    private cacheManager: CacheManager;

    constructor() {
        this.socket = io();
        this.cacheManager = new CacheManager();
    }

    public init(initialGridIds: Set<string>) {
        this.socket.on("connect", () => {
            console.log(`Connected with socket id ${this.socket.id}`);
            initialGridIds.forEach((gridId) => {
                this.socket.emit("fetchGridBox", gridId);
            });
        });

        this.socket.on('pixelEditted', (pixelsInGrid: IPixelsInGridInfo, cb) => {
            if (pixelsInGrid) {
                ctx.postMessage({ type: WorkerMessageType.PUT_PIXEL_ARRAY, pixelsInGrid });
            }
            if (cb) cb();
        });

        this.socket.on('pixelsForPan', (pixelsForPan: IPixelsInGridInfo, cb) => {
            if (pixelsForPan) { //from redis
                this.cacheManager.savePixelArray(pixelsForPan.gridId, pixelsForPan.pixelArray);
                ctx.postMessage({ type: WorkerMessageType.PUT_PIXEL_ARRAY, pixelsInGrid: pixelsForPan });
            }
            if (cb) cb();
        });


    }

    public savePixelArray(gridId: string, pixelArray: IPixelInfo[]): void {
        this.cacheManager.savePixelArray(gridId, pixelArray);
    }

    public getSubBoxOfGrid(gridId: string, box: IBox): IPixelsInGridInfo {
        return this.cacheManager.fetchSubBoxOfGrid(gridId, box);
    }

    //from server
    public fetchSubBoxOfGrid(gridIds: Set<string>): void {
        gridIds.forEach((gridId) => {
            this.socket.emit("fetchGridBox", gridId);
        });
    }

    public fetchImageDataOfSubBoxInGrid(gridId: string, box: IBox): ImageData {
        return this.cacheManager.fetchImageDataOfSubBoxInGrid(gridId, box);
    }

    public deleteGridData(gridId: string) {
        this.cacheManager.deleteGridData(gridId);
    }

    public saveImageData(gridBoxes: Map<string, IBox>, drawData: IDrawData, anchorPoint: IPoint, brushTolerance: number) {
        const translatedBox = drawData.box.clone().translate(anchorPoint);
        gridBoxes.forEach((gridBox, gridId) => {
            const commonBox = gridBox.intersect(translatedBox);
            if (commonBox) {
                const commonCanvasBox = commonBox.translate(anchorPoint.clone().negate())
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
                            pixelArray.push({ x: j + drawData.box.min.x + anchorPoint.x, y: i + drawData.box.min.y + anchorPoint.y, rgba: `${r},${g},${b},${a}` })
                        }
                    }
                }
                this.cacheManager.savePixelArray(gridId, pixelArray);
                this.socket.emit("uploadPixelInfo", { gridId, pixelArray } as IPixelsInGridInfo);
            }
        });
    }
}

const dataHandler = new DataHandler();

// We send a message back to the main thread
ctx.addEventListener("message", (event) => {
    // Get the limit from the event data
    const workerMessageType = event.data.type as WorkerMessageType;
    switch (workerMessageType) {
        case WorkerMessageType.INIT_SOCKET:
            dataHandler.init(event.data.initialGridIds);
            break;
        case WorkerMessageType.SAVE_PIXEL_ARRAY:
            dataHandler.savePixelArray(event.data.gridId, event.data.pixelArray);
            break;
        case WorkerMessageType.GET_SUBBOX_OF_GRID:
            const data = dataHandler.getSubBoxOfGrid(event.data.gridId, new Box(new Point(event.data.box._min._x, event.data.box._min._y), new Point(event.data.box._max._x, event.data.box._max._y)));
            if (data.pixelArray.length > 0) {
                ctx.postMessage({ type: WorkerMessageType.SUB_BOX_DATA, data });
            }
            break;
        case WorkerMessageType.FETCH_SUBBOX_OF_GRID:
            dataHandler.fetchSubBoxOfGrid(event.data.gridIds);            
            break;
        case WorkerMessageType.FETCH_IMAGE_DATA_OF_SUBBOX:
            const subBox = new Box(new Point(event.data.box._min._x, event.data.box._min._y), new Point(event.data.box._max._x, event.data.box._max._y));
            const imagedata = dataHandler.fetchImageDataOfSubBoxInGrid(event.data.gridId, subBox);
            ctx.postMessage({ type: WorkerMessageType.SUB_BOX_IMAGE, imagedata, dx: subBox.min.x, dy: subBox.min.y });
            break;
        case WorkerMessageType.DELETE_GRID_DATA:
            dataHandler.deleteGridData(event.data.gridId);
            break;
        case WorkerMessageType.SAVE_IMAGEDATA:
            const { gridBoxes, drawData, anchorPoint, brushTolerance } = event.data;
            const gridBoxMap = new Map<string, IBox>();
            (gridBoxes as Map<string, any>).forEach((gridBoxData, gridId) => {
                gridBoxMap.set(gridId, new Box(new Point(gridBoxData._min._x, gridBoxData._min._y), new Point(gridBoxData._max._x, gridBoxData._max._y)));
            });
            const anchorPointComposed = new Point(anchorPoint._x, anchorPoint._y);
            const drawDataComposed: IDrawData = {
                box: new Box(new Point(drawData.box._min._x, drawData.box._min._y), new Point(drawData.box._max._x, drawData.box._max._y)),
                start: new Point(drawData.start._x, drawData.start._y),
                end: new Point(drawData.end._x, drawData.end._y),
                imageData: drawData.imageData
            }
            dataHandler.saveImageData(gridBoxMap, drawDataComposed, anchorPointComposed, brushTolerance);
            break;
    }
});