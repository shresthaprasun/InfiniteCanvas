import { io, Socket } from "socket.io-client";
import { IBoxInGridToFetch, IPixelsInGridInfo } from "../../interfaces";
import { PointerEventType, GestureType } from "./data_types";
import { InfiniteCanvas } from "./infinite-canvas";
import { InfiniteGrid } from "./infinite-grid";
import { IInputEvenHandler, IPinchArgs, ISwipeArgs } from "./interfaces";

export enum SocketIOEvent {
    CONNECT = "connect",
    UPLOAD_PIXEL_INFO = "uploadPixelInfo"
}

export class SocketIO implements IInputEvenHandler {
    private socket: Socket;
    private iCanvas: InfiniteCanvas;
    private iGrid: InfiniteGrid;

    constructor(iCanvas: InfiniteCanvas, igrid: InfiniteGrid) {
        this.socket = io();
        this.iCanvas = iCanvas;
        this.iGrid = igrid;
    }

    public init() {
        this.socket.on("connect", () => {
            console.log(`Connected with socket id ${this.socket.id}`);
        });

        this.socket.on('pixelEditted', (pixelsInGrid: IPixelsInGridInfo, cb) => {
            if (pixelsInGrid) {
                for (const pixel of pixelsInGrid.pixelArray) {
                    this.iCanvas.putPixelToCanvas(pixel);
                }
            }
            if (cb) cb();
        });

        this.socket.on('pixelsForPan', function (msg, cb) {
            if (msg && msg["x"] && msg["y"] && msg["color"]) {
                for (let i = 0; i < msg["x"].length; ++i) {
                    const imagedata = new ImageData(new Uint8ClampedArray(msg["color"][i]), 1, 1);
                    this.ctx.putImageData(imagedata, msg["x"][i] - this.anchorPoint.x, msg["y"][i] - this.anchorPoint.y);
                }
            }
            if (cb) cb();
        });
    }

    public handlePointerEvent(eventType: PointerEventType, event: PointerEvent) {
        switch (eventType) {
            //upload the data
            case PointerEventType.PRIMARY_START_DRAG:
                break;
            case PointerEventType.PRIMARY_DRAGGED:
                break;
            case PointerEventType.PRIMARY_END_DRAG:
                const pixelBoxMap = this.iCanvas.getUpdatedPixelBatch(event);
                pixelBoxMap.forEach((pixelArray, gridId) => {
                    this.socket.emit("uploadPixelInfo", { gridId, pixelArray } as IPixelsInGridInfo);
                })
                break;
            //pan fetch the data
            case PointerEventType.SECONDARY_START_DRAG:
                break;
            case PointerEventType.SECONDARY_DRAGGED:
                break;
            case PointerEventType.SECONDARY_END_DRAG:
                this.iGrid.gridAdded.forEach((gridId) => {
                    const box = this.iGrid.gridBoxes.get(gridId);
                    box && this.socket.emit("fetchPixelsInGridBox", { gridId, xmin: box.min.x, xmax: box.max.x, ymin: box.min.y, ymax: box.max.y } as IBoxInGridToFetch);
                })
                break;
        }
    }

    public handleMultiplePointerEvent(eventType: GestureType, args: ISwipeArgs | IPinchArgs) {
        throw new Error("Method not implemented.");
    }

}