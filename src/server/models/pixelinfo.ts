import { model, Schema } from "mongoose";

// export const PixelInfoSchema = new Schema({
//     x: {
//         type: Number,
//         required: true
//     },
//     y: {
//         type: Number,
//         required: true
//     },
//     rgba: {
//         type: Buffer,
//         required: true
//     }
// });

export const PixelInfoSchema = new Schema({
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

export const GridDataSchema = new Schema({
    anchor: {
        type: String,
        required: true,
        unique: true        
    },
    data: [PixelInfoSchema]
});


export const PixelInfo = model('pixelInfo', PixelInfoSchema);
export const GridData = model('gridData', GridDataSchema);
