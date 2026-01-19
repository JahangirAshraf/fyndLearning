import React, { useMemo, useState, useCallback } from "react";
import { currencyFormat, formatLocale } from "../../helper/utils";
import { useViewport } from "../../helper/hooks";
import FyImage from "../core/fy-image/fy-image";
// import SvgWrapper from "../core/svgWrapper/SvgWrapper"; // Replaced with direct/inline imports
import styles from "./product-card.less";
import FyButton from "@gofynd/theme-template/components/core/fy-button/fy-button";
import { useGlobalStore, useFPI, useGlobalTranslation } from "fdk-core/utils";
// import ForcedLtr from "../forced-ltr/forced-ltr"; // Inline definition
import WishlistIcon from "../../assets/images/wishlist-plp.svg";
import ItemCloseIcon from "../../assets/images/item-close.svg";
import { GET_QUICK_VIEW_PRODUCT_DETAILS } from "../../queries/plpQuery";

const ForcedLtr = ({ text }) => (
    <span style={{ direction: "ltr", unicodeBidi: "isolate" }}>{text}</span>
);

const ProductCard = ({
    product,
    customClass = [],
    listingPrice = "range",
    imgSrcSet = [
        { breakpoint: { min: 1024 }, width: 600 },
        { breakpoint: { min: 768 }, width: 300 },
        { breakpoint: { min: 481 }, width: 300 },
        { breakpoint: { max: 390 }, width: 300 },
        { breakpoint: { max: 480 }, width: 300 },
    ],
    aspectRatio = 0.8,
    isBrand = true,
    isPrice = true, // Default true
    isSaleBadge = true,
    isWishlistIcon = true,
    isImageFill = false,
    showImageOnHover = false,
    customImageContainerClass = "",
    imageBackgroundColor = "",
    customeProductDescContainerClass = "",

    imagePlaceholder = "",
    columnCount = { desktop: 4, tablet: 3, mobile: 1 },
    // WishlistIconComponent = () => <SvgWrapper svgSrc="wishlist-plp" />,
    // isRemoveIcon = false,
    // RemoveIconComponent = () => (
    //   <SvgWrapper svgSrc="item-close" className={styles.removeIcon} />
    // ),
    actionButtonText,
    followedIdList = [],
    onWishlistClick = () => { },
    handleAddToCart = () => { },
    // onRemoveClick = () => {},
    centerAlign = false,
    showAddToCart = false,
    showBadge = true,
    showColorVariants = true, // Force true for this requirement
    isSlider = false,
    onClick = () => { },
}) => {
    const { t } = useGlobalTranslation("translation");
    const fpi = useFPI();
    const i18nDetails = useGlobalStore(fpi?.getters?.i18N_DETAILS) || {};
    const locale = i18nDetails?.language?.locale || "en";
    const countryCode = i18nDetails?.countryCode || "IN";
    const isMobile = useViewport(0, 768);

    const getListingPrice = (key, customPriceSource = null) => {
        // Tie-breaker: Check if price exists at top level, or inside sizes, or fallback to product
        let activePrice = customPriceSource?.price || customPriceSource?.sizes?.price || product.price;

        if (!activePrice) return "";

        let price = "";
        const priceDetails = activePrice[key];

        // Ensure we have valid price objects
        if (!priceDetails) return "";

        switch (listingPrice) {
            case "min":
                price = currencyFormat(
                    priceDetails.min,
                    priceDetails.currency_symbol,
                    formatLocale(locale, countryCode, true)
                );
                break;
            case "max":
                price = currencyFormat(
                    priceDetails.max,
                    priceDetails.currency_symbol,
                    formatLocale(locale, countryCode, true)
                );
                break;
            case "range":
                price =
                    priceDetails.min !== priceDetails.max
                        ? `${currencyFormat(
                            priceDetails.min,
                            priceDetails.currency_symbol,
                            formatLocale(locale, countryCode, true)
                        )} - ${currencyFormat(
                            priceDetails.max,
                            priceDetails.currency_symbol,
                            formatLocale(locale, countryCode, true)
                        )}`
                        : currencyFormat(
                            priceDetails.min,
                            priceDetails.currency_symbol,
                            formatLocale(locale, countryCode, true)
                        );
                break;
            default:
                break;
        }
        return price;
    };

    // =================== OPTIMIZED COLOR VARIANT FUNCTIONALITY ===================

    // Memoized variant processing for better performance
    const colorVariants = useMemo(() => {
        const variants = product.variants?.find(
            (variant) =>
                variant.display_type?.toLowerCase() === "color" ||
                variant.display_type?.toLowerCase() === "image" ||
                variant.key === "color"
        );

        if (!variants?.items?.length) {
            return { items: [], count: 0, defaultVariant: null, hasVariants: false };
        }

        const defaultVariant = variants.items.find(
            (variant) => product.slug === variant.slug
        );

        return {
            items: variants.items.filter(i => i.is_available), // Ensure availability if needed, or just all
            count: variants.items.length,
            defaultVariant,
            hasVariants: true,
        };
    }, [product.variants, product.slug]);

    // Optimized state management for selected variant
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [variantDataCache, setVariantDataCache] = useState({}); // Local cache for full variant details

    // Current active variant with fallback
    const currentShade = selectedVariant || colorVariants.defaultVariant;

    // Use cached full data if available, otherwise fallback to currentShade or product
    const currentData = useMemo(() => {
        const cachedData = variantDataCache[currentShade?.slug];
        return cachedData || currentShade || product;
    }, [currentShade?.slug, variantDataCache, product]);

    // Optimized image processing with memoization
    const getProductImages = useCallback(
        (variant = null) => {
            // Priority: variant medias -> product media -> empty array
            if (variant?.medias?.length) {
                return variant.medias.filter((media) => media.type === "image");
            }
            return product?.media?.filter((media) => media.type === "image") || [];
        },
        [product?.media]
    );

    // Memoized image data to prevent unnecessary recalculations
    const imageData = useMemo(() => {
        const currentImages = getProductImages(currentShade);
        const fallbackImages = getProductImages();

        return {
            url: currentImages[0]?.url || fallbackImages[0]?.url || imagePlaceholder,
            alt:
                currentImages[0]?.alt ||
                fallbackImages[0]?.alt ||
                `${product?.brand?.name} | ${product?.name}`,
            hoverUrl: currentImages[1]?.url || fallbackImages[1]?.url || "",
            hoverAlt:
                currentImages[1]?.alt ||
                fallbackImages[1]?.alt ||
                `${product?.brand?.name} | ${product?.name}`,
        };
    }, [
        currentShade,
        getProductImages,
        imagePlaceholder,
        product?.brand?.name,
        product?.name,
    ]);

    // Optimized variant display order with memoization
    const orderedVariants = useMemo(() => {
        if (!colorVariants.hasVariants) return [];

        const { items, defaultVariant } = colorVariants;
        if (!defaultVariant) return items;

        const otherVariants = items.filter((v) => v.uid !== defaultVariant?.uid);

        return [defaultVariant, ...otherVariants];
    }, [colorVariants]);

    // =================== END OPTIMIZED VARIANT FUNCTIONALITY ===================

    const hasDiscount =
        getListingPrice("effective", currentData) !== getListingPrice("marked", currentData);

    const isFollowed = useMemo(() => {
        return !!followedIdList?.includes(product?.uid);
    }, [followedIdList, product]);

    const handleWishlistClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        onWishlistClick({ product, isFollowed });
    };

    // const handleRemoveClick = (e) => {
    //   e.stopPropagation();
    //   e.preventDefault();
    //   onRemoveClick({ product, isFollowed });
    // };

    const gridClass = useMemo(
        () =>
            `${columnCount?.mobile === 2 ? styles["mob-grid-2-card"] : styles["mob-grid-1-card"]} ${columnCount?.tablet === 2 ? styles["tablet-grid-2-card"] : styles["tablet-grid-3-card"]} ${columnCount?.desktop === 2 ? styles["desktop-grid-2-card"] : styles["desktop-grid-4-card"]}`,
        [columnCount?.desktop, columnCount?.tablet, columnCount?.mobile]
    );

    const handleAddToCartClick = (event) => {
        event?.preventDefault();
        event?.stopPropagation();
        handleAddToCart(currentData?.slug || product?.slug);
    };

    // Optimized variant click handler with useCallback
    const handleVariantClick = useCallback(
        async (event, variant) => {
            event?.preventDefault();
            event?.stopPropagation();

            // Only update if different variant is selected
            if (variant.uid !== currentShade?.uid) {
                setSelectedVariant(variant);

                // Check cache first
                if (variant.slug && !variantDataCache[variant.slug]) {
                    try {
                        const { data } = await fpi.executeGQL(GET_QUICK_VIEW_PRODUCT_DETAILS, {
                            slug: variant.slug
                        });
                        if (data?.product) {
                            setVariantDataCache(prev => ({
                                ...prev,
                                [variant.slug]: data.product
                            }));
                        }
                    } catch (err) {
                        console.error("Error fetching variant details:", err);
                    }
                }
            }
        },
        [currentShade?.uid, variantDataCache, fpi]
    );

    const handleCardClick = (e) => {
        if (onClick) {
            onClick(currentData);
        }
    };

    return (
        <div
            className={`${styles.productCard} ${!product.sellable ? styles.disableCursor : ""
                } ${styles[customClass[0]] || ''} ${styles[customClass[1]] || ''} ${styles[customClass[2]] || ''
                } ${styles.animate} ${gridClass} ${isSlider ? styles.sliderCard : ""}`}
            onClick={handleCardClick}
        >
            <div className={`${styles.imageContainer} ${customImageContainerClass}`}>
                {!isMobile && showImageOnHover && imageData.hoverUrl && (
                    <FyImage
                        src={imageData.hoverUrl}
                        alt={imageData.hoverAlt}
                        aspectRatio={aspectRatio}
                        isImageFill={isImageFill}
                        backgroundColor={imageBackgroundColor}
                        isFixedAspectRatio={true}
                        customClass={`${styles.productImage} ${styles.hoverImage}`}
                        sources={imgSrcSet}
                        defer={true}
                    />
                )}
                <FyImage
                    src={imageData.url}
                    alt={imageData.alt}
                    aspectRatio={aspectRatio}
                    isImageFill={isImageFill}
                    backgroundColor={imageBackgroundColor}
                    isFixedAspectRatio={true}
                    customClass={`${styles.productImage} ${styles.mainImage}`}
                    sources={imgSrcSet}
                    defer={false}
                />
                {isWishlistIcon && (
                    <button
                        className={`${styles.wishlistBtn} ${isFollowed ? styles.active : ""}`}
                        onClick={handleWishlistClick}
                        title={t("resource.product.wishlist_icon")}
                    >
                        <WishlistIcon className={isFollowed ? styles.active : ""} />
                    </button>
                )}
                {/* {isRemoveIcon && (
          <button
            className={`${styles.wishlistBtn} ${isFollowed ? styles.active : ""}`}
            onClick={handleRemoveClick}
            title={t("resource.product.wishlist_icon")}
          >
             <ItemCloseIcon />
          </button>
        )} */}
                {!product.sellable ? (
                    <div className={`${styles.badge} ${styles.outOfStock}`}>
                        <span className={`${styles.text} ${styles.captionNormal}`}>
                            {t("resource.common.out_of_stock")}
                        </span>
                    </div>
                ) : product.teaser_tag && showBadge ? (
                    <div className={styles.badge}>
                        <span className={`${styles.text} ${styles.captionNormal}`}>
                            {product?.teaser_tag?.substring(0, 14)}
                        </span>
                    </div>
                ) : isSaleBadge && showBadge && (currentData?.discount || currentData?.sizes?.discount || product.discount) && product.sellable ? (
                    <div className={`${styles.badge} ${styles.sale}`}>
                        <span className={`${styles.text} ${styles.captionNormal}`}>
                            {t("resource.common.sale")}
                        </span>
                    </div>
                ) : null}
            </div>
            <div
                className={`${styles.productDescContainer} ${customeProductDescContainerClass}`}
            >
                <div className={styles.productDesc}>
                    {isBrand && product.brand && (
                        <h3 className={styles.productBrand}>{product.brand.name}</h3>
                    )}
                    <h5
                        className={`${styles.productName} ${styles.b2} ${centerAlign ? styles.centerAlign : ""}`}
                        title={currentData?.name || product.name}
                    >
                        {currentData?.name || product.name}
                    </h5>
                    {isPrice && (
                        <div
                            className={`${styles.productPrice} ${centerAlign ? styles.center : ""}`}
                        >
                            {(currentData?.price?.effective || product?.price?.effective) && (
                                <span
                                    className={`${styles["productPrice--sale"]} ${styles.h4}`}
                                >
                                    <ForcedLtr text={getListingPrice("effective", currentData)} />
                                </span>
                            )}
                            {hasDiscount && (
                                <span
                                    className={`${styles["productPrice--regular"]} ${styles.captionNormal}`}
                                >
                                    <ForcedLtr text={getListingPrice("marked", currentData)} />
                                </span>
                            )}
                            {(currentData?.discount || currentData?.sizes?.discount || product.discount) && (
                                <span
                                    className={`${styles["productPrice--discount"]} ${styles.captionNormal}   ${centerAlign ? styles["productPrice--textCenter"] : ""}`}
                                >
                                    ({currentData?.discount || currentData?.sizes?.discount || product.discount})
                                </span>
                            )}
                        </div>
                    )}

                    {/* OPTIMIZED COLOR VARIANTS SECTION - IMAGE SUPPORT */}
                    {colorVariants.hasVariants && showColorVariants && (
                        <div className={styles.productVariants}>
                            <div className={styles.colorVariants}>
                                {orderedVariants.slice(0, 4).map((variant) => {
                                    const isSelected = currentShade?.uid === variant.uid;
                                    const variantImage = variant.medias?.[0]?.url;

                                    return (
                                        <div
                                            key={variant.uid}
                                            className={`${styles.colorDot} ${isSelected ? styles.currentColor : ""}`}
                                            style={!variantImage ? { "--color": `#${variant.color || "ccc"}` } : {}}
                                            title={variant.color_name || "Color variant"}
                                            onClick={(e) => handleVariantClick(e, variant)}
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`Select ${variant.color_name || "color variant"}`}
                                        >
                                            {variantImage && <img src={variantImage} alt={variant.color_name} />}
                                        </div>
                                    );
                                })}

                                {colorVariants.count > 4 && (
                                    <span className={styles.moreColors}>
                                        +{colorVariants.count - 4}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {showAddToCart && (
                    <FyButton
                        variant="outlined"
                        className={styles.addToCart}
                        onClick={handleAddToCartClick}
                    >
                        {actionButtonText ?? t("resource.common.add_to_cart")}
                    </FyButton>
                )}
            </div>
        </div>
    );
};

export default ProductCard;
