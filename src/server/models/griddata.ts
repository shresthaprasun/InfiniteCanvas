import { model, Schema } from "mongoose";
import { IPixelInfo } from "../../interfaces";

interface IGridData{
    anchor: string,
    data: IPixelInfo[]
}

export const GridDataSchema = new Schema<IGridData>({
    anchor: {
        type: String,
        required: true,
        unique: true        
    },
    data: [{type: Schema.Types.ObjectId, ref:'pixelInfo'}]
});

export const GridData = model<IGridData>('gridData', GridDataSchema);