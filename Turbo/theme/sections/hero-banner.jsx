import React from "react";

export function Component({ props, blocks }) {
    const descValue = props?.description?.value;
    const imSRC = props?.imageUploader?.value;
    const collectionValue = props?.collectionSelection?.value;
    if (!descValue || !imSRC || !collectionValue) return null;



    return <>
    <p>{descValue}</p>;
    <img src={imSRC}alt="img"/>
    <p>{collectionValue}</p>
    </> 
}

export const settings = {
label: "Section Description",
props: [
        {
            id: "description",
            label: "Description",
            type: "text",
            default: "",
            info: "Description text of the section",
        },

        {
            id: "imageUploader",
            label: "Image Upload",
            type: "image_picker",
            default: "",
            info: "Upload or select an image.",
        },

        {
            id: "collectionSelection",
            label: "Choose Collection",
            type: "collection",
            default: "",
            info: "Select a collection from the dropdown.",
        },
    ],
        blocks: [],
};