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

const translation = {
    'cockroach': 'cafard',
    'roach': 'cafard',
    'flea': 'puce',
    'bedbugs': 'punaise_de_lit',
}

const imgContainPest = (classified, pestName) => {
    const match = [];
    // console.log('output', classified);
    const regex = new RegExp(pestName, "ig");
    classified.map((out) => {
        console.log(out.label.indexOf(","), out.label.indexOf(", "));
        if (out.label.indexOf(",") !== -1) {
            console.log('in if for regexArray');

            const elementArray = out.label.split(", ");
            console.log('elmentArray', elementArray, 'out', out);
            elementArray.map(element => {
                if (translation[element.replace(" ", "")]?.match(regex)) {
                    match.push({
                        score: out.score,
                        label: out.label,
                        // regex: new RegExp(`^${elm}$`, "ig"),
                    });
                }
            })
        } else {
            console.log('in else for regexArray');
            match.push({
                score: out.score,
                label: out.label,
                // regex: new RegExp(`^${out.label}$`, "ig"),
            });
        }
        // console.log('regexArray l46', regexArray);
        // return regexArray;
    });
    // const match = [];
    // regexArray.map(regex => {
        // console.log('regex', regex);
        // if (regex.regex.test(pestName)) {
            // match.push({
                // match: pestName,
                // score: regex.score,
                // label: regex.label,
            // });
        // }
    // });
    // pests.map((pestName) => {
    //     regexArray.map((regex) => {
    //         if (regex.regex.test(pestName)) {
    //             match.push({
    //                 match: pestName,
    //                 score: regex.score,
    //                 label: regex.label,
    //             });
    //         }
    //     });
    // });
    console.log('match', match);
    return match;
};

export const analyzeImg = async (url, pestName) => {
    let classified = await classify(url);
    console.log('analyzed',classified);
    return imgContainPest(classified, pestName);
};
