import { pipeline } from "@xenova/transformers";

// console.log(env.backends.onnx);

// env.localModelPath = "/hugginface/";
// env.allowRemoteModels = false;
// env.allowLocalModels = true;
// env.backends.onnx.wasm.wasmPaths = "../hugginface/";

// fetch("https://bugs.verfasor.com/api")
//     .then((res) => res.json())
//     .then((data) => {
//         const result = data.map((i) => i["CommonName"]);
//         console.log(JSON.stringify(result));
//     });

import pests from "../dataset/pests.json" with { type: "json" };

const classify = async (imageUrl) => {
    const classifier = await pipeline("image-classification", "Xenova/dinov2-small-imagenet1k-1-layer");
    const output = await classifier(imageUrl);
    console.log('classifier output', output);
    return output;
};

const imgContainPest = (output) => {
    let regexArray = [];
    output.map((out) => {
        if (out.label.indexOf(",") !== -1) {
            out.label.split(", ").map((elm) => {
                regexArray.push({
                    score: out.score,
                    label: out.label,
                    regex: new RegExp(`^${elm}$`, "ig"),
                });
            });
        } else {
            regexArray.push({
                score: out.score,
                label: out.label,
                regex: new RegExp(`^${out.label}$`, "ig"),
            });
        }
    });
    const match = [];
    pests.map((pestName) => {
        regexArray.map((regex) => {
            if (regex.regex.test(pestName)) {
                match.push({
                    match: pestName,
                    score: regex.score,
                    label: regex.label,
                });
            }
        });
    });
    return match;
};

export const analyzeImg = async (url) => {
    let analyzed = await classify(url);
    return imgContainPest(analyzed);
};
