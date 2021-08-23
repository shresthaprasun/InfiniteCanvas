import { GridCanvas } from "./grid-canvas";
import { InfiniteCanvas } from "./infinite-canvas";
import { InfiniteGrid } from "./infinite-grid";
import { InputManager } from "./input-manager";
import { IPoint } from "./interfaces";
import { WorkerHandler } from "./worker-handler";
import { Point } from "./utilities";

//for canvas and input handling
export class Viewer {
    private iGrid: InfiniteGrid;
    private anchorPoint: IPoint;
    private socket: WorkerHandler;
    private icanvas: InfiniteCanvas;
    private gridCanvas: GridCanvas;
    private inputManager: InputManager;

    constructor() {
        this.anchorPoint = new Point();
        this.iGrid = new InfiniteGrid(this.anchorPoint);
        this.icanvas = new InfiniteCanvas(this.iGrid);
        this.socket = new WorkerHandler(this.icanvas, this.iGrid);
        this.gridCanvas = new GridCanvas(this.iGrid);
        this.inputManager = new InputManager([this.iGrid, this.icanvas, this.socket, this.gridCanvas]);
    }

    init(div: HTMLElement, anchorPoint: number[] = [0,0]): void {
        // div.append(this.icanvas.canvas);
        this.anchorPoint.set(anchorPoint[0], anchorPoint[1]);
        // window.history.pushState({"app":"infiniteCanvas"},"anchorPoint",`/${this.anchorPoint.x}_${this.anchorPoint.y}/`)
        this.icanvas.init(div);
        this.iGrid.init(this.anchorPoint, this.icanvas.canvasRect.width, this.icanvas.canvasRect.height);
        this.gridCanvas.init(div);
        this.socket.init();
        // const socket = SocketIO.io();
        // socket.on("connect", function (): void {
        //     socket.emit("connect", { data: "connected to the SocketServer..." });
        // });

        div.oncontextmenu = (event: MouseEvent): void => {
            event.preventDefault();
        };


        div.addEventListener("pointerdown", (event: PointerEvent): void => {
            event.preventDefault();
            this.inputManager.handlePointerDown(event);
        });

        div.addEventListener("pointerenter", (event: PointerEvent): void => {
            event.preventDefault();
            this.inputManager.handlePointerEnter(event);
        });

        div.addEventListener("pointermove", (event: PointerEvent): void => {
            event.preventDefault();
            this.inputManager.handlePointerMove(event);              
        });

        div.addEventListener("pointerup", (event: PointerEvent): void => {
            event.preventDefault();
            this.inputManager.handlePointerUp(event);

        });

        div.addEventListener("pointerleave", (event: PointerEvent): void => {
            event.preventDefault();
            this.inputManager.handlePointerLeave(event);
        });       

    }
}