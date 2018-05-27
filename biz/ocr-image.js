"use strict";

const path = require("path");
const fs = require("fs");

const gm = require("gm").subClass({ imageMagick: true });
const tessorc = require("tesseractocr");

const {
    temp_ocr_img_dir: TEMP_FOLDER
} = global.CONFIG;

async function recognizeImage(oRequest) {
    let recognize = tessorc.withOptions({
        language: "num2"
    });
    let fileName = `${TEMP_FOLDER}/${Date.now()}.tif`;

    return new Promise((resolve, reject) => {
        gm(oRequest)
        .resize(120, 44)
        .colorspace("gray")
        .normalize()
        .threshold("40%")
        .crop(88, 24, 14, 10)
        .extent(120, 44, "-14-10")
        .write(fileName, err => {
            if (err) {
                reject(err);
            }
            recognize(fileName, (err, text) => {
                text = text.replace(/o|O/g, "0").replace(/i|I/g, "1").replace(/z|Z/g, "2").replace(/\s/g, "").replace(/[a-z]/gi, "");
                resolve(text);

                let target = path.resolve(TEMP_FOLDER, text + ".tif");
                fs.createReadStream(fileName).pipe(fs.createWriteStream(target));
            });
        });
    });
}

module.exports = recognizeImage;