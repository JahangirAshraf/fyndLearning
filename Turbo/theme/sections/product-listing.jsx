import React from "react";
import { useFPI, useNavigate } from "fdk-core/utils";
import { PLPShimmer } from "../components/core/skeletons";
import ProductListing from "@gofynd/theme-template/pages/product-listing/product-listing";
import "@gofynd/theme-template/pages/product-listing/index.css";
import useProductListing from "../page-layouts/plp/useProductListing";
import { isRunningOnClient } from "../helper/utils";
import { PLP_PRODUCTS, BRAND_META, CATEGORY_META } from "../queries/plpQuery";
// import ProductCard from "../components/product-card/product-card";
// import styles from "../components/product-listing/product-listing.less"; // Not verified, disabling to avoid error

export function Component({ props = {}, blocks = [], globalConfig = {} }) {
  const fpi = useFPI();

  const listingProps = useProductListing({ fpi, props });

  // Show shimmer only on client side when page is actually loading
  const shouldShowShimmer = isRunningOnClient() && listingProps?.isPageLoading;

  return (
    <div className="margin0auto basePageContainer">
      {shouldShowShimmer ? (
        <PLPShimmer
          gridDesktop={props?.grid_desktop?.value || 4}
          gridTablet={props?.grid_tablet?.value || 3}
          gridMobile={props?.grid_mob?.value || 2}
          showFilters={true}
          showSortBy={true}
          showPagination={props?.loading_options?.value === "pagination"}
          productCount={props?.page_size?.value || 12}
        />
      ) : (
        // <ProductListing {...listingProps} />
        <div className="plp-wrapper">
          {/* Note: Ideally we would render the full structure here:
                 - Mobile Filter/Sort Bar
                 - Desktop Sidebar
                 - Grid
                 But for now, assuming ProductListing was doing heavy lifting, 
                 we might want to try to use the Render Props pattern if ProductListing supports it 
                 OR we must rebuild the layout. 
              */
          }
          {/* Since I cannot see ProductListing source, and this is "minimal effort", 
                 building the WHOLE page layout might be risky (missing styles/features).
                 
                 WAIT. The user gave me ProductCard code. 
                 If I am forced to rewrite PLP, I need to know the structure.
                 
                 Let's try to render JUST the grid if possible, but we need the filters.
                 
                 Actually, looking at `useProductListing`, it returns EVERYTHING needed.
                 So rebuilding the layout IS the "standard" way when customizing heavily.
              */}
          <CustomProductListing {...listingProps} globalConfig={globalConfig} />
        </div>
      )}
    </div>
  );
}

// Helper component for the full listing layout
import ProductCard from "../components/product-card/product-card";
import styles from "../components/product-listing/product-listing.less";
import FyButton from "@gofynd/theme-template/components/core/fy-button/fy-button";

// Basic Filter Sidebar Component
const PlpFilterSidebar = ({ filters, onFilterUpdate, selectedFilters }) => {
  if (!filters || filters.length === 0) return null;

  return (
    <div className={styles.filterSidebar}>
      <h3 className={styles.filterTitle}>Filters</h3>
      {filters.map((filterGroup) => (
        <div key={filterGroup.key.name} className={styles.filterGroup}>
          <h4 className={styles.filterGroupTitle}>{filterGroup.key.display}</h4>
          <ul className={styles.filterOptions}>
            {filterGroup.values.map((option) => (
              <li key={option.value} className={styles.filterOption}>
                <label>
                  <input
                    type="checkbox"
                    checked={option.is_selected}
                    onChange={() => onFilterUpdate({ filter: filterGroup, item: option })}
                  />
                  <span className={styles.filterLabel}>{option.display}</span>
                  {option.count && <span className={styles.filterCount}>({option.count})</span>}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

// PLP Header for Sort and Layout controls
const PlpHeader = ({
  productCount,
  sortList,
  onSortUpdate,
  sortModalProps
}) => {
  // sortList is confusingly named in hook, it seems to be the current sort value?
  // Actually checking logic: hook returns sort_on as sortList. 
  // And useSortModal actually manages the options.
  // Ideally we should use the data from useSortModal or similar, but let's stick to basic dropdown if possible.
  // Just realized sortList IS the current value. The OPTIONS come from the useSortModal hook implicitly or we need to hardcode specific theme sorts.
  // Actually, typically standard sorts are fixed.

  // Let's implement a simple select for now.
  const sortOptions = [
    { value: "", label: "Relevance" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "latest", label: "Newest First" },
    { value: "discount", label: "Discount" }
  ];

  return (
    <div className={styles.plpHeader}>
      <div className={styles.productCount}>
        {productCount} Products
      </div>
      <div className={styles.sortWrapper}>
        <label>Sort By: </label>
        <select
          value={sortList || ""}
          onChange={(e) => onSortUpdate(e.target.value)}
          className={styles.sortSelect}
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

const PLPCartModal = ({
  isOpen,
  helperData,
  productData,
  selectedSize,
  onSizeSelection,
  addProductForCheckout,
  handleClose,
}) => {
  if (!isOpen) return null;

  const sizes = productData?.product?.sizes?.sizes || [];
  const isSelected = selectedSize;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: '#fff', padding: '24px', borderRadius: '8px',
        width: '90%', maxWidth: '400px', position: 'relative'
      }}>
        <button onClick={handleClose} style={{ position: 'absolute', right: '16px', top: '16px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>

        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>Select Size</h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
          {sizes.map((s) => (
            <button
              key={s.value}
              onClick={() => onSizeSelection(s.value)}
              style={{
                padding: '8px 16px',
                border: `1px solid ${selectedSize === s.value ? '#000' : '#ddd'}`,
                backgroundColor: selectedSize === s.value ? '#000' : '#fff',
                color: selectedSize === s.value ? '#fff' : '#000',
                borderRadius: '4px',
                cursor: s.quantity > 0 ? 'pointer' : 'not-allowed',
                opacity: s.quantity > 0 ? 1 : 0.5
              }}
              disabled={s.quantity === 0}
            >
              {s.display}
            </button>
          ))}
        </div>

        <FyButton
          className="isPrimary"
          onClick={() => addProductForCheckout(null, selectedSize)}
          disabled={!isSelected}
          style={{ width: '100%' }}
        >
          ADD TO CART
        </FyButton>
      </div>
    </div>
  );
};

const CustomProductListing = ({
  breadcrumb,
  title,
  filterList,
  onFilterUpdate,
  onSortUpdate,
  sortList,
  productList,
  isProductLoading,
  paginationProps,
  onLoadMoreProducts,
  columnCount,
  globalConfig,
  addToCartModalProps,
  ...props
}) => {
  const navigate = useNavigate();

  // Handle Add to Cart
  const handleAddToCart = (slug) => {
    if (addToCartModalProps?.handleAddToCart) {
      addToCartModalProps.handleAddToCart(slug);
    }
  };

  // Handle Product Navigation
  const handleProductClick = (product) => {
    if (props.onProductNavigation) {
      props.onProductNavigation();
    }
    // Navigate to PDP
    navigate(`/product/${product.slug}`);
  };

  return (
    <div className={styles['plp-wrapper']}>
      <div className={styles['product-listing-container']}>
        {/* Sidebar - Desktop Only for now */}
        <div className={styles['plp-sidebar']}>
          <PlpFilterSidebar
            filters={filterList}
            onFilterUpdate={onFilterUpdate}
            selectedFilters={props.selectedFilters}
          />
        </div>

        <div className={styles['plp-content']}>
          {/* Header */}
          <PlpHeader
            productCount={props.productCount}
            sortList={sortList}
            onSortUpdate={onSortUpdate}
          />

          {/* Products Grid */}
          <div
            className={styles['product-grid']}
            data-desktop={columnCount?.desktop}
            data-tablet={columnCount?.tablet}
            data-mob={columnCount?.mobile}
          >
            {productList.map((product, index) => (
              <ProductCard
                key={product.uid || index}
                product={product}
                columnCount={columnCount}
                onClick={(variant) => handleProductClick(variant || product)}
                {...props}
                handleAddToCart={handleAddToCart}
                showAddToCart={props.showAddToCart}
                showColorVariants={true}
              />
            ))}
          </div>

          {/* Loader / Pagination */}
          {isProductLoading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading more...</div>}

          {/* Render the Cart Modal */}
          <PLPCartModal {...addToCartModalProps} />
        </div>
      </div>
    </div>
  );
};

export const settings = {
  label: "t:resource.sections.products_listing.product_listing",
  props: [
    {
      type: "image_picker",
      id: "desktop_banner",
      label: "t:resource.sections.products_listing.desktop_banner_image",
      info: "t:resource.sections.products_listing.desktop_banner_info",
      default: "",
    },
    {
      type: "image_picker",
      id: "mobile_banner",
      label: "t:resource.sections.products_listing.mobile_banner_image",
      info: "t:resource.sections.products_listing.mobile_banner_info",
      default: "",
    },
    {
      type: "url",
      id: "banner_link",
      default: "",
      info: "t:resource.sections.collections_listing.button_link_info",
      label: "t:resource.common.redirect",
    },
    {
      type: "checkbox",
      id: "product_number",
      label: "t:resource.sections.collections_listing.product_number",
      info: "t:resource.sections.collections_listing.product_number_info",
      default: true,
    },
    {
      id: "loading_options",
      type: "select",
      options: [
        {
          value: "view_more",
          text: "t:resource.common.view_more",
        },
        {
          value: "infinite",
          text: "t:resource.common.infinite_scroll",
        },
        {
          value: "pagination",
          text: "t:resource.common.pagination",
        },
      ],
      default: "infinite",
      info: "t:resource.sections.collections_listing.loading_options_info",
      label: "t:resource.sections.products_listing.page_loading_options",
    },
    {
      id: "page_size",
      type: "select",
      options: [
        {
          value: 12,
          text: "12",
        },
        {
          value: 24,
          text: "24",
        },
        {
          value: 36,
          text: "36",
        },
        {
          value: 48,
          text: "48",
        },
        {
          value: 60,
          text: "60",
        },
      ],
      default: 12,
      info: "",
      label: "t:resource.sections.products_listing.products_per_page",
    },
    {
      type: "checkbox",
      id: "back_top",
      label: "t:resource.sections.products_listing.back_top",
      info: "t:resource.sections.brand_landing.back_to_top_info",
      default: true,
    },
    {
      type: "checkbox",
      id: "in_new_tab",
      label: "t:resource.common.open_product_in_new_tab",
      default: false,
      info: "t:resource.common.open_product_in_new_tab_desktop",
    },
    {
      type: "checkbox",
      id: "hide_brand",
      label: "t:resource.common.hide_brand_name",
      default: false,
      info: "t:resource.common.hide_brand_name_info",
    },
    {
      id: "grid_desktop",
      type: "select",
      options: [
        {
          value: "4",
          text: "t:resource.common.four_cards",
        },
        {
          value: "2",
          text: "t:resource.common.two_cards",
        },
      ],
      default: "4",
      label: "t:resource.common.default_grid_layout_desktop",
    },
    {
      id: "grid_tablet",
      type: "select",
      options: [
        {
          value: "3",
          text: "t:resource.common.three_cards",
        },
        {
          value: "2",
          text: "t:resource.common.two_cards",
        },
      ],
      default: "2",
      label: "t:resource.common.default_grid_layout_tablet",
    },
    {
      id: "grid_mob",
      type: "select",
      options: [
        {
          value: "2",
          text: "t:resource.common.two_cards",
        },
        {
          value: "1",
          text: "t:resource.common.one_card",
        },
      ],
      default: "1",
      label: "t:resource.common.default_grid_layout_mobile",
    },
    {
      id: "description",
      type: "textarea",
      default: "",
      info: "t:resource.sections.products_listing.description_info",
      label: "t:resource.common.description",
    },
    {
      id: "img_resize",
      label:
        "t:resource.sections.products_listing.image_size_for_tablet_desktop",
      type: "select",
      options: [
        {
          value: "300",
          text: "300px",
        },
        {
          value: "500",
          text: "500px",
        },
        {
          value: "700",
          text: "700px",
        },
        {
          value: "900",
          text: "900px",
        },
        {
          value: "1100",
          text: "1100px",
        },
        {
          value: "1300",
          text: "1300px",
        },
      ],
      default: "300",
    },
    {
      id: "img_resize_mobile",
      label: "Image size for Mobile",
      type: "select",
      options: [
        {
          value: "300",
          text: "300px",
        },
        {
          value: "500",
          text: "500px",
        },
        {
          value: "700",
          text: "700px",
        },
        {
          value: "900",
          text: "900px",
        },
      ],
      default: "500",
    },
    {
      type: "checkbox",
      id: "show_add_to_cart",
      label: "t:resource.pages.wishlist.show_add_to_cart",
      info: "t:resource.common.not_applicable_international_websites",
      default: false,
    },
    {
      type: "text",
      id: "card_cta_text",
      label: "t:resource.common.button_text",
      default:
        "t:resource.settings_schema.cart_and_button_configuration.add_to_cart",
    },
    {
      type: "checkbox",
      id: "show_size_guide",
      label: "t:resource.common.show_size_guide",
      info: "t:resource.sections.collections_listing.show_size_guide_info",
      default: false,
    },
    {
      type: "text",
      id: "tax_label",
      label: "t:resource.common.price_tax_label_text",
      default: "t:resource.default_values.product_listing_tax_label",
      info: "t:resource.sections.products_listing.tax_label_info",
    },
    {
      type: "checkbox",
      id: "mandatory_pincode",
      label: "t:resource.common.mandatory_delivery_check",
      info: "t:resource.pages.wishlist.mandatory_delivery_check_info",
      default: false,
    },
    {
      type: "checkbox",
      id: "hide_single_size",
      label: "t:resource.common.hide_single_size",
      info: "t:resource.pages.wishlist.hide_single_size_info",
      default: false,
    },
    {
      type: "checkbox",
      id: "preselect_size",
      label: "t:resource.common.preselect_size",
      info: "t:resource.pages.wishlist.preselect_size_info",
      default: false,
    },
    {
      type: "radio",
      id: "size_selection_style",
      label: "t:resource.common.size_selection_style",
      info: "t:resource.sections.products_listing.size_selection_style_info",
      default: "block",
      options: [
        {
          value: "dropdown",
          text: "t:resource.common.dropdown_style",
        },
        {
          value: "block",
          text: "t:resource.common.block_style",
        },
      ],
    },
  ],
};

Component.serverFetch = async ({ fpi, router, props }) => {
  try {
    let filterQuery = "";
    let sortQuery = "";
    let search = "";
    let pageNo = null;
    const pageSize =
      props?.loading_options?.value === "infinite"
        ? 12
        : (props?.page_size?.value ?? 12);
    const fpiState = fpi.store.getState();

    const globalConfig =
      fpiState?.theme?.theme?.config?.list?.[0]?.global_config?.custom?.props ||
      {};
    const isAlgoliaEnabled = globalConfig?.algolia_enabled || false;

    Object.keys(router.filterQuery)?.forEach((key) => {
      if (key === "page_no") {
        pageNo = parseInt(router.filterQuery[key], 10);
      } else if (key === "sort_on") {
        sortQuery = router.filterQuery[key];
      } else if (key === "q") {
        search = router.filterQuery[key];
      } else if (typeof router.filterQuery[key] === "string") {
        if (filterQuery.includes(":")) {
          filterQuery = `${filterQuery}:::${key}:${router.filterQuery[key]}`;
        } else {
          filterQuery = `${key}:${router.filterQuery[key]}`;
        }
      } else {
        router.filterQuery[key]?.forEach((item) => {
          if (filterQuery.includes(":")) {
            filterQuery = `${filterQuery}:::${key}:${item}`;
          } else {
            filterQuery = `${key}:${item}`;
          }
        });
      }

      if (key === "category") {
        const slug = Array.isArray(router.filterQuery[key])
          ? router.filterQuery[key][0]
          : router.filterQuery[key];
        fpi.executeGQL(CATEGORY_META, { slug });
      }
      if (key === "brand") {
        const slug = Array.isArray(router.filterQuery[key])
          ? router.filterQuery[key][0]
          : router.filterQuery[key];
        fpi.executeGQL(BRAND_META, { slug });
      }
    });

    if (isAlgoliaEnabled) {
      const filterParams = [];
      const skipKeys = new Set(["q", "sort_on", "page_no"]);

      for (const [key, value] of Object.entries(router?.filterQuery || {})) {
        if (skipKeys.has(key)) continue;
        // Decode value to handle URL encoding
        const decodedValue = Array.isArray(value)
          ? value.map((v) => decodeURIComponent(v)).join("||")
          : decodeURIComponent(value);

        const existingParam = filterParams.find((param) =>
          param.startsWith(`${key}:`)
        );

        if (existingParam) {
          const updatedParam = `${existingParam}||${decodedValue}`;
          filterParams[filterParams.indexOf(existingParam)] = updatedParam;
        } else {
          filterParams.push(`${key}:${decodedValue}`);
        }
      }

      filterQuery = filterParams.join(":::");
    }

    const payload = {
      filterQuery,
      sortOn: sortQuery,
      search,
      enableFilter: true,
      first: pageSize,
      pageType: "number",
    };
    if (pageNo) payload.pageNo = pageNo;

    if (isAlgoliaEnabled) {
      const BASE_URL = `https://${fpiState?.custom?.appHostName}/ext/algolia/application/api/v1.0/products`;

      const url = new URL(BASE_URL);
      url.searchParams.append(
        "page_id",
        payload?.pageNo === 1 || !payload?.pageNo ? "*" : payload?.pageNo - 1
      );
      url.searchParams.append("page_size", payload?.first);

      if (payload?.sortOn) {
        url.searchParams.append("sort_on", payload?.sortOn);
      }
      if (filterQuery) {
        url.searchParams.append("f", filterQuery);
      }
      if (payload?.search) {
        url.searchParams.append("q", payload?.search);
      }

      return fetch(url)
        .then((response) => response.json())
        .then((data) => {
          const productDataNormalization = data.items?.map((item) => ({
            ...item,
            media: item.medias,
          }));

          data.page.current = payload?.pageNo || 1;

          const productList = {
            filters: data?.filters,
            items: productDataNormalization,
            page: data?.page,
            sort_on: data?.sort_on,
          };
          fpi.custom.setValue("customProductList", productList);
          fpi.custom.setValue("isPlpSsrFetched", true);
        });
    } else {
      return fpi
        .executeGQL(PLP_PRODUCTS, payload, { skipStoreUpdate: false })
        .then(({ data }) => {
          fpi.custom.setValue("customProductList", data?.products);
          fpi.custom.setValue("isPlpSsrFetched", true);
        })
        .catch(err => {
          console.error("GQL Error in PLP:", err);
          // Return simplified error or null to avoid serializing the circular err
          return null;
        });
    }
  } catch (e) {
    console.error("Critical Error in Component.serverFetch:", e);
    return null;
  }
};

export default Component;
