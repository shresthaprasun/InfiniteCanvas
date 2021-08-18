import { model, Schema } from "mongoose";

interface IPixelInfo{
    xy: string,
    rgba: string
}

export const PixelInfoSchema = new Schema<IPixelInfo>({
    xy: {
        type: String,
        required: true,
        unique: true
    },
    rgba: {
        type: String,
        required: true
    }
});

export const PixelInfo = model<IPixelInfo>('pixelInfo', PixelInfoSchema);

