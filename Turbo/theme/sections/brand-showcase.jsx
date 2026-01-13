import React from "react";
import styles from "../styles/sections/brand-showcase.less"; // We'll create this next

export function Component({ props, blocks }) {
    const { title } = props;

    return (
        <section className={styles.section_container}>
            {title?.value && <h2 className={styles.title}>{title.value}</h2>}

            <div className={styles.brand_grid}>
                {blocks.map((block, index) => {
                    // Identify the block type (important if you have multiple types)
                    if (block.type === "brand_item") {
                        const { image, brand_name, link } = block.props;

                        return (
                            <div key={index} className={styles.brand_card}>
                                <a href={link?.value || "#"}>
                                    {/* Fynd images come with a URL property */}
                                    <img
                                        src={image?.value || "https://placehold.co/200"}
                                        alt={brand_name?.value}
                                    />
                                    <p>{brand_name?.value}</p>
                                </a>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        </section>
    );
}

export default Component;


export const settings = {
    label: "Brand Showcase",
    props: [
        {
            id: "title",
            label: "Section Title",
            type: "text",
            default: "Our Brands",
        },
    ],
    blocks: [
        {
            type: "brand_item", // Unique ID for this type of block
            name: "Brand Logo", // Name shown in "Add Block" button
            props: [
                {
                    id: "image",
                    label: "Brand Logo",
                    type: "image_picker",
                },
                {
                    id: "brand_name",
                    label: "Brand Name",
                    type: "text",
                    default: "Brand Name",
                },
                {
                    id: "link",
                    label: "Brand Link",
                    type: "url",
                },
            ],
        },
    ],
};