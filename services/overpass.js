// import osmtogeojson from "osmtogeojson";
import querystring from "querystring";

const overpassQuery = (latitude, longitude, distance) => {
    return `
    [out:json];
    (
        nwr["type"="associatedStreet"](around:${distance},${latitude},${longitude});
        way["highway"="residential"]["name"]["addr:housenumber"](around:${distance},${latitude},${longitude});
    );
    out center;
    (
        nwr["name"](around:${distance},${latitude},${longitude});
        nwr["amenity"](around:${distance},${latitude},${longitude});
        nwr["building"](around:${distance},${latitude},${longitude});
        nwr["addr:housenumber"][!"communication:*"](around:${distance},${latitude},${longitude});
    );
    out center;
`;
};

const overpassUrl = "https://overpass-api.de/api/interpreter";

const fetchOverpass = async (coordinates, distance) => {
    console.log(JSON.stringify({ coordinates, distance }));
    const query = overpassQuery(coordinates.latitude, coordinates.longitude, distance);
    console.log("query", query);
    const requestInit = {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        },
        body: querystring.stringify({ data: query }),
    };

    console.log("here", requestInit);
    let result = await fetch(overpassUrl, requestInit);
    let decoded = await result.json();
    console.log("decoded", decoded);
    // console.log(makeResultDisplayable(decoded));
    // return toGeoJSON(decoded);
    return makeResultDisplayable(decoded).map((item) => {
        return {
            label: displayableItemName(item),
            value: uniqKey(item),
            key: uniqKey(item),
            data: item,
        };
    });
};

const uniqKey = (item) => {
    return `${displayableItemName(item).replace(" ", "_")}_${item.id}`;
};

const makeResultDisplayable = (arrayOfObjectFromOverpass) => {
    console.log("makingResultDisplayable");
    console.log("elements count : ", arrayOfObjectFromOverpass.elements.length);
    const relations = arrayOfObjectFromOverpass.elements
        .filter((item) => {
            return item.type === "relation";
        })
        .map((item) => {
            const itemInfo = {
                id: item.id,
                type: item.type,
                ...item.tags,
            };
            // console.log(itemInfo);
            return item;
        });
    let keyedNodes = {};
    arrayOfObjectFromOverpass.elements
        .filter((item) => {
            return item.type === "node" && item.tags && item.tags["addr:housenumber"];
        })
        .map((item) => {
            // console.log(item);
            keyedNodes[item.id] = item;
            return item;
        });
    // console.log("keyedNodes count : ", keyedNodes.length);

    const amenityNodes = arrayOfObjectFromOverpass.elements
        .filter((item) => {
            console.log(item);
            return (
                item.tags &&
                item.tags["name"] &&
                item.tags["type"] !== "relation" &&
                item.tags["type"] !== "associatedStreet" &&
                !item.tags["highway"] &&
                !item.tags["power"]
            );
        })
        .map((item, index) => {
            // console.log(item);
            keyedNodes[`amenities-${index}`] = item;
            return item;
        });
    // keyedNodes["amenities"] = amenityNodes;
    // console.log("amenityNodes count : ", amenityNodes);

    const relationsNodes = {};
    relations.map((item) => {
        const members = item.members
            .filter((i) => i.type === "node")
            .map((i) => {
                const property = keyedNodes[i.ref];
                return property;
            });
        relationsNodes[item.tags.name] = members;
    });

    const nodesWithStreet = [];
    for (let street in relationsNodes) {
        if (Object.hasOwn(relationsNodes, street)) {
            nodesWithStreet.push(
                relationsNodes[street].map((nod) => {
                    if (nod) {
                        nod["street"] = street;
                        return nod;
                    }
                })
            );
        }
    }
    return [...amenityNodes, ...nodesWithStreet].flat(Infinity).filter((i) => i);
};

// const toGeoJSON = (data) => {
//     // console.log(data);
//     return osmtogeojson(data, {
//         // flatProperties: options.flatProperties || false
//     });
// };

const displayableItemName = (item) => {
    // console.log(item);
    if (item?.street) {
        return `${item?.tags["name"] ? item?.tags["name"] + ", " : ""}${item.tags["addr:housenumber"]} ${item.street}`;
    } else if (item?.tags["amenity"] || item?.tags["name"]) {
        let resultText = item.tags["name"] ?? "";
        if (item.tags["addr:housenumber"] || item.tags["contact:housenumber"]) {
            resultText += ", ";
            resultText +=
                typeof item.tags["addr:housenumber"] !== "undefined"
                    ? item.tags["addr:housenumber"]
                    : item.tags["contact:housenumber"];
        }

        if (item.tags["addr:street"] || item.tags["contact:street"]) {
            resultText += " ";
            resultText +=
                typeof item.tags["addr:street"] !== "undefined"
                    ? item.tags["addr:street"]
                    : item.tags["contact:street"];
        }
        return resultText;
    } else {
        console.log("item in else", item);
    }
};

export { fetchOverpass };
