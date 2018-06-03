const request = require("request");
const fs = require("fs");
const gm = require("gm").subClass({ imageMagick: true });
const path = require("path");

const FOLDER_SRC_IMAGE = "../training/src_images";
const FOLDER_GRAY_IMAGE = "../training/gray_images";
const URL_VERIFY_CODE = "http://xyz.hospital.com/GetNewVerifyCode";
let counter = 100;

// 建立文件夹
createFolders();
// 批量下载, 如果下载完成, 会执行批量图片处理
batchConvert();

// 批量下载, 100张图片
function batchDownload() {
    let url = URL_VERIFY_CODE + "?" + Date.now();

    request({
        method: "GET",
        url: url,
        encoding: null  // 必须设置null, 否则会被当作字符处理
    }, function(err, resp, body) {
        let name = (Math.random() + "").slice(2);
        fs.writeFileSync(path.resolve(FOLDER_SRC_IMAGE, name + ".jpg"), body);

        console.log(name + ".jpg is downloaded.");
        counter -= 1;

        // 随机延迟0.5到1秒, 再进行下一次下载
        if (counter !== 0) {
            let delay = Math.round(Math.random() * 500 + 500);

            console.log("Will delay " + delay + "ms");
            setTimeout(batchDownload, delay);
        } else {
            // 下载完成, 处理图像
            batchConvert();
        }
    });
}

// 批量对图片进行降噪和格式转换
function batchConvert() {
    let images = fs.readdirSync(FOLDER_SRC_IMAGE);

    for (let image of images) {
        let imgName = image.slice(0, image.lastIndexOf("."));
        let srcImage = path.resolve(FOLDER_SRC_IMAGE, image);
        let grayImage = path.resolve(FOLDER_GRAY_IMAGE, imgName + ".tif");

        gm(srcImage)
            .resize(120, 44)
            .colorspace("gray")
            .normalize()
            .threshold("40%")
            .crop(88, 24, 14, 10)
            .extent(120, 44, "-14-10")
            .stream("TIF", function(err, stdout, stderr) {
                let wStream = fs.createWriteStream(grayImage);
                stdout.pipe(wStream);
            });
    }
}

function createFolders() {
    if (!fs.existsSync(FOLDER_SRC_IMAGE)) {
        fs.mkdirSync(FOLDER_SRC_IMAGE);
    }

    if (!fs.existsSync(FOLDER_GRAY_IMAGE)) {
        fs.mkdirSync(FOLDER_GRAY_IMAGE);
    }
}