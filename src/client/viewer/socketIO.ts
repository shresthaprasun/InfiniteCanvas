import { io, Socket } from "socket.io-client";
import { IBoxInGridToFetch, IPixelsInGridInfo } from "../../interfaces";
import { CacheManager } from "./cache-manager";
import { PointerEventType, GestureType } from "./data_types";
import { InfiniteCanvas } from "./infinite-canvas";
import { InfiniteGrid } from "./infinite-grid";
import { IInputEvenHandler, IPinchArgs, ISwipeArgs, WorkerMessageType } from "./interfaces";
import DataWorker from "worker-loader!../worker/dataWorker";
// export enum SocketIOEvent {
//     CONNECT = "connect",
//     UPLOAD_PIXEL_INFO = "uploadPixelInfo"
// }



export class SocketIO implements IInputEvenHandler {
    private socket: Socket;
    private iCanvas: InfiniteCanvas;
    private iGrid: InfiniteGrid;

    private worker: DataWorker;


    // private cacheManager: CacheManager;

    constructor(iCanvas: InfiniteCanvas, igrid: InfiniteGrid) {
        this.socket = io();
        this.iCanvas = iCanvas;
        this.iGrid = igrid;
        this.worker = new DataWorker();
        // this.cacheManager = new CacheManager();
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

                // this.cacheManager.savePixelArray(pixelsForPan.gridId, pixelsForPan.pixelArray);
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
                const pixelBoxMap = this.iCanvas.getUpdatedPixelBatch(event);
                pixelBoxMap.forEach((pixelArray, gridId) => {
                    this.worker.postMessage({ type: WorkerMessageType.SAVE_PIXEL_ARRAY, gridId, pixelArray });
                    // this.cacheManager.savePixelArray(gridId, pixelArray);
                    this.socket.emit("uploadPixelInfo", { gridId, pixelArray } as IPixelsInGridInfo);
                });
                break;
            case PointerEventType.PRIMARY_END_DRAG:
                break;
            //pan fetch the data
            case PointerEventType.SECONDARY_START_DRAG:
                break;
            case PointerEventType.SECONDARY_DRAGGED:
                //Worker
                console.log("boxes to fetch", this.iCanvas.boxesToFetchForPan);
                this.iCanvas.boxesToFetchForPan.forEach((boxes, gridId) => {                    
                    for (const box of boxes) {
                        // this.worker.postMessage({ type: WorkerMessageType.FETCH_SUBBOX_OF_GRID, gridId, box });
                        this.worker.postMessage({ type: WorkerMessageType.FETCH_IMAGE_DATA_OF_SUBBOX, gridId, box });

                        // const data = this.cacheManager.fetchSubBoxOfGrid(gridId, box);
                        // if (data.pixelArray.length > 0) {
                        //     this.updatePanData(data);
                        // }
                    }
                });
                this.iGrid.gridRemoved.forEach((gridId) => {
                    this.worker.postMessage({ type: WorkerMessageType.DELETE_GRID_DATA, gridId });

                    // this.cacheManager.deleteGridData(gridId);
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