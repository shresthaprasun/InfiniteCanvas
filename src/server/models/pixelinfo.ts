import { model, Schema } from "mongoose";

export const PixelInfoSchema = new Schema({
    x: {
        type: Number,
        required: true
    },
    y: {
        type: Number,
        required: true
    },
    rgba: {
        type: Buffer,
        required: true
    }
})
export const PixelInfo = model('pixelInfo', PixelInfoSchema);