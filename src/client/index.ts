import { Viewer } from "./viewer/viewer";

if(window){
    (<any>window).VIEWER = new Viewer();
}

