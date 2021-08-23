import { IPixelsInGridInfo } from "../../interfaces";
import { PointerEventType, GestureType } from "./data_types";
import { InfiniteCanvas } from "./infinite-canvas";
import { InfiniteGrid } from "./infinite-grid";
import { IDrawData, IInputEvenHandler, IPinchArgs, ISwipeArgs, WorkerMessageType } from "./interfaces";
import DataWorker from "worker-loader!../worker/dataWorker";

export class WorkerHandler implements IInputEvenHandler {
    private iCanvas: InfiniteCanvas;
    private iGrid: InfiniteGrid;
    private worker: DataWorker;

    constructor(iCanvas: InfiniteCanvas, igrid: InfiniteGrid) {
        this.iCanvas = iCanvas;
        this.iGrid = igrid;
        this.worker = new DataWorker();
    }

    public init() {
        this.worker.postMessage({ type: WorkerMessageType.INIT_SOCKET, initialGridIds: this.iGrid.gridAdded });        

        this.worker.onmessage = (message) => {
            switch (message.data.type) {
                case WorkerMessageType.SUB_BOX_DATA:
                    if (message.data.data.pixelArray.length > 0) {
                        this.updatePanData(message.data.data);
                    }
                    break;
                case WorkerMessageType.SUB_BOX_IMAGE:
                    if (message.data.imagedata) {
                        this.updatePanImageData(message.data.imagedata, message.data.dx, message.data.dy);
                    }
                    break;
                case WorkerMessageType.PUT_PIXEL_ARRAY:
                    this.updatePanData(message.data.pixelsInGrid);
                    break;
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
            case PointerEventType.PRIMARY_START_DRAG:
                break;
            case PointerEventType.PRIMARY_DRAGGED:
                const brushTolerance = 10;
                const drawData: IDrawData = this.iCanvas.getDrawnCanvasBox(brushTolerance);
                const translatedBox = drawData.box.clone().translate(this.iGrid.anchorPoint);
                const gridBoxes = this.iGrid.getMappedGridBoxes(translatedBox, 0);
                this.worker.postMessage({ type: WorkerMessageType.SAVE_IMAGEDATA, gridBoxes, drawData, anchorPoint: this.iGrid.anchorPoint });
                break;
            case PointerEventType.PRIMARY_END_DRAG:
                break;
            case PointerEventType.SECONDARY_START_DRAG:
                break;
            case PointerEventType.SECONDARY_DRAGGED:
                this.iCanvas.boxesToFetchForPan.forEach((boxes, gridId) => {
                    for (const box of boxes) {
                        this.worker.postMessage({ type: WorkerMessageType.FETCH_IMAGE_DATA_OF_SUBBOX, gridId, box });
                    }
                });
                this.iGrid.gridRemoved.forEach((gridId) => {
                    this.worker.postMessage({ type: WorkerMessageType.DELETE_GRID_DATA, gridId });
                });
                if (this.iGrid.gridAdded.size > 0) {
                    this.worker.postMessage({ type: WorkerMessageType.FETCH_SUBBOX_OF_GRID, gridIds: this.iGrid.gridAdded });
                }
                break;
            case PointerEventType.SECONDARY_END_DRAG:
                break;
        }
    }

    public handleMultiplePointerEvent(eventType: GestureType, args: ISwipeArgs | IPinchArgs) {
        throw new Error("Method not implemented.");
    }

}