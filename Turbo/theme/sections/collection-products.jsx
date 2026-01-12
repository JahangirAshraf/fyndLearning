import React, { useEffect, useState, useMemo } from "react";
import { FDKLink } from "fdk-core/components";
import { useGlobalStore, useFPI } from "fdk-core/utils";
import ProductCard from "@gofynd/theme-template/components/product-card/product-card";
import "@gofynd/theme-template/components/product-card/product-card.css";
import "@gofynd/theme-template/components/core/fy-image/fy-image.css";
import { FEATURED_COLLECTION } from "../queries/collectionsQuery";
import styles from "../styles/sections/collection-products.less";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "../components/carousel";
import { useWindowWidth, useThemeFeature, useAccounts, useWishlist } from "../helper/hooks";


export function Component({ props, globalConfig }) {
    const fpi = useFPI();
    const CONFIGURATION = useGlobalStore(fpi.getters.CONFIGURATION);
    const listingPrice = CONFIGURATION?.app_features?.common?.listing_price?.value || "range";
    const customValues = useGlobalStore(fpi?.getters?.CUSTOM_VALUE);
    const windowWidth = useWindowWidth();
    const { isLoggedIn, openLogin } = useAccounts({ fpi });
    const { toggleWishlist, followedIdList } = useWishlist({ fpi });
    const { isInternational } = useThemeFeature({ fpi });

    const collectionSlug = props?.collection?.value;
    const title = props?.title?.value || "Featured Products";
    const bgColor = props?.bg_color?.value || "#ffffff";
    const layout = props?.layout?.value || "grid";
    const columnsDesktop = Number(props?.columns_desktop?.value || 4);
    const buttonText = props?.button_text?.value || "View All Products";
    const buttonLink = props?.button_link?.value || "";
    const buttonBgColor = props?.button_bg_color?.value || "#000000";
    const buttonTextColor = props?.button_text_color?.value || "#ffffff";

    const [isLoading, setIsLoading] = useState(!!collectionSlug);
    const [error, setError] = useState(null);

    // Get products from FPI custom store
    const collectionData = customValues?.[`collectionProducts-${collectionSlug}`]?.data?.collection;
    const products = collectionData?.products?.items || [];
    const collectionName = collectionData?.name || "";

    // Fetch collection products on mount
    useEffect(() => {
        if (!collectionSlug) {
            setIsLoading(false);
            return;
        }

        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fpi.executeGQL(FEATURED_COLLECTION, {
                    slug: collectionSlug,
                    first: 12,
                    pageNo: 1,
                });
                await fpi.custom.setValue(`collectionProducts-${collectionSlug}`, response);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch collection products:", err);
                setError("Failed to load products. Please try again.");
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [collectionSlug, fpi]);

    // Handle wishlist toggle
    const handleWishlistToggle = (data) => {
        if (!isLoggedIn) {
            openLogin();
            return;
        }
        toggleWishlist(data);
    };

    // Carousel configuration
    const carouselConfig = useMemo(() => ({
        align: "start",
        loop: products.length > columnsDesktop,
        draggable: true,
        containScroll: "trimSnaps",
        slidesToScroll: 1,
        duration: 20,
    }), [products.length, columnsDesktop]);

    // Responsive column calculation
    const getColumnCount = () => {
        if (windowWidth <= 480) return 1;
        if (windowWidth <= 768) return 2;
        return columnsDesktop;
    };

    // Image srcset for optimization
    const imgSrcSet = useMemo(() => {
        if (globalConfig?.img_hd) return [];
        return [
            { breakpoint: { min: 481 }, width: 300 },
            { breakpoint: { max: 480 }, width: 500 },
        ];
    }, [globalConfig?.img_hd]);

    // Loading state UI
    if (isLoading) {
        return (
            <section className={styles.sectionWrapper} style={{ backgroundColor: bgColor }}>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingGrid}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={styles.skeletonCard}>
                                <div className={styles.skeletonImage}></div>
                                <div className={styles.skeletonText}></div>
                                <div className={styles.skeletonPrice}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // Error state UI
    if (error) {
        return (
            <section className={styles.sectionWrapper} style={{ backgroundColor: bgColor }}>
                <div className={styles.errorContainer}>
                    <p className={styles.errorMessage}>{error}</p>
                </div>
            </section>
        );
    }

    // No collection selected state
    if (!collectionSlug) {
        return (
            <section className={styles.sectionWrapper} style={{ backgroundColor: bgColor }}>
                <div className={styles.emptyContainer}>
                    <p>Please select a collection from the theme editor.</p>
                </div>
            </section>
        );
    }

    // Empty products state
    if (products.length === 0) {
        return (
            <section className={styles.sectionWrapper} style={{ backgroundColor: bgColor }}>
                <h2 className={styles.sectionTitle}>{title}</h2>
                <div className={styles.emptyContainer}>
                    <p>No products found in this collection.</p>
                </div>
            </section>
        );
    }

    const slideBasis = `${100 / getColumnCount()}%`;

    return (
        <section className={styles.sectionWrapper} style={{ backgroundColor: bgColor }}>
            {/* Section Title */}
            <h2 className={styles.sectionTitle}>{title}</h2>

            {/* Products Layout - Grid or Carousel */}
            {layout === "grid" ? (
                // Grid Layout
                <div
                    className={styles.productGrid}
                    style={{ "--columns": columnsDesktop }}
                >
                    {products.map((product, index) => (
                        <div key={`${product.uid}_${index}`} className={styles.productItem}>
                            <ProductCard
                                product={product}
                                listingPrice={listingPrice}
                                globalConfig={globalConfig}
                                isWishlistPage={false}
                                isMdOrLarger={windowWidth > 768}
                                showAddToCart={false}
                                followedIdList={followedIdList}
                                onWishlistClick={handleWishlistToggle}
                                imageSrcSet={imgSrcSet}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                // Carousel Layout
                <div className={styles.productCarousel}>
                    <Carousel opts={carouselConfig}>
                        <CarouselContent>
                            {products.map((product, index) => (
                                <CarouselItem
                                    key={`${product.uid}_${index}`}
                                    style={{ flex: `0 0 ${slideBasis}` }}
                                >
                                    <div className={styles.carouselItem}>
                                        <ProductCard
                                            product={product}
                                            listingPrice={listingPrice}
                                            globalConfig={globalConfig}
                                            isWishlistPage={false}
                                            isMdOrLarger={windowWidth > 768}
                                            showAddToCart={false}
                                            followedIdList={followedIdList}
                                            onWishlistClick={handleWishlistToggle}
                                            imageSrcSet={imgSrcSet}
                                        />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className={styles.carouselBtn} />
                        <CarouselNext className={styles.carouselBtn} />
                    </Carousel>
                </div>
            )}

            {/* CTA Button */}
            <div className={styles.ctaContainer}>
                <a
                    href={buttonLink || `/collection/${collectionSlug}`}
                    className={styles.ctaButton}
                    style={{
                        backgroundColor: buttonBgColor,
                        color: buttonTextColor,
                    }}
                >
                    {buttonText}
                </a>
            </div>
        </section>
    );
}

/**
 * Section Settings Configuration
 * Defines all configurable props for theme editor
 */
export const settings = {
    label: "Collection Products",
    props: [
        // Collection Selector
        {
            id: "collection",
            label: "Select Collection",
            type: "collection",
            default: "",
            info: "Choose a collection to display products from",
        },
        // Section Title
        {
            id: "title",
            label: "Section Title",
            type: "text",
            default: "Featured Products",
            info: "Heading displayed above the products",
        },
        // Background Color
        {
            id: "bg_color",
            label: "Background Color",
            type: "color",
            default: "#ffffff",
            info: "Background color of the section",
        },
        // Layout Type
        {
            id: "layout",
            label: "Layout Type",
            type: "select",
            default: "grid",
            info: "Choose between grid or carousel layout",
            options: [
                { text: "Grid (Stack)", value: "grid" },
                { text: "Carousel (Horizontal Scroll)", value: "carousel" },
            ],
        },
        // Columns (Desktop)
        {
            id: "columns_desktop",
            label: "Columns (Desktop)",
            type: "range",
            default: 4,
            min: 2,
            max: 4,
            step: 1,
            info: "Number of product columns on desktop (grid layout)",
        },
        // CTA Button Text
        {
            id: "button_text",
            label: "Button Text",
            type: "text",
            default: "View All Products",
            info: "Text displayed on the CTA button",
        },
        // CTA Button Link
        {
            id: "button_link",
            label: "Button Link",
            type: "url",
            default: "",
            info: "URL the button redirects to (defaults to collection page)",
        },
        // Button Background Color
        {
            id: "button_bg_color",
            label: "Button Background Color",
            type: "color",
            default: "#000000",
            info: "Background color of the CTA button",
        },
        // Button Text Color
        {
            id: "button_text_color",
            label: "Button Text Color",
            type: "color",
            default: "#ffffff",
            info: "Text color of the CTA button",
        },
    ],
    blocks: [],
};
