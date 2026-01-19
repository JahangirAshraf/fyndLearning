import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useGlobalStore } from "fdk-core/utils";
import { isRunningOnClient } from "../../helper/utils";
import { useThemeConfig, useWindowWidth } from "../../helper/hooks";

function filterActiveNavigation(navigation = []) {
  return navigation.reduce((acc, item) => {
    if (!item?.active) return acc;

    const subNav = !!item?.sub_navigation?.length
      ? filterActiveNavigation(item?.sub_navigation || [])
      : item?.sub_navigation || [];
    acc.push({ ...item, sub_navigation: subNav });
    return acc;
  }, []);
}

const useHeader = (fpi) => {
  const location = useLocation();
  const FOLLOWED_IDS = useGlobalStore(fpi.getters.FOLLOWED_LIST);
  const wishlistIds = FOLLOWED_IDS?.items?.map((m) => m?.uid);
  const wishlistCount = FOLLOWED_IDS?.page?.item_total;
  const NAVIGATION = useGlobalStore(fpi.getters.NAVIGATION);
  const CART_ITEMS = useGlobalStore(fpi.getters.CART);
  const CONTACT_INFO = useGlobalStore(fpi.getters.CONTACT_INFO);
  const SUPPORT_INFO = useGlobalStore(fpi.getters.SUPPORT_INFORMATION);
  const CONFIGURATION = useGlobalStore(fpi.getters.CONFIGURATION);
  const loggedIn = useGlobalStore(fpi.getters.LOGGED_IN);
  const BUY_NOW = useGlobalStore(fpi.getters.BUY_NOW_CART_ITEMS);
  const { globalConfig } = useThemeConfig({ fpi });
  const HeaderNavigation = useMemo(() => {
    const { navigation = [] } =
      NAVIGATION?.items?.find((item) =>
        item.orientation.landscape.includes("top")
      ) || {};
    console.log("NAVIGATION", NAVIGATION);
    const filtered = filterActiveNavigation(navigation);

    // ENHANCED TEST: Injecting dynamic source/destination into all links
    return filtered.map((item) => {
      const newItem = JSON.parse(JSON.stringify(item));
      if (!newItem.action) newItem.action = { page: { type: "home", query: {} } };
      if (!newItem.action.page) newItem.action.page = { type: newItem.action.type || "home", query: {} };
      if (!newItem.action.page.query) newItem.action.page.query = {};

      // nav_from = Current Page (encoded)
      newItem.action.page.query.nav_from = [location.pathname.replace(/\//g, "_") || "home"];
      // nav_to = Destination Type
      newItem.action.page.query.nav_to = [newItem.action.page.type || "custom"];

      return newItem;
    });
  }, [NAVIGATION, location.pathname]);

  const windowWidth = useWindowWidth();
  const isMobile = useMemo(() => {
    return windowWidth > 0 && windowWidth <= 768;
  }, [windowWidth]);

  const FooterNavigation = useMemo(() => {
    const allGroups = NAVIGATION?.items || [];

    // DEBUG: Log all available groups
    console.log("📦 ALL NAVIGATION GROUPS:", allGroups.map(g => ({ name: g.name, slug: g.slug })));

    // 1. Try to find a group assigned to "bottom" orientation
    const bottomGroups = allGroups.filter((item) =>
      item.orientation?.landscape?.includes("bottom")
    );

    // 2. On mobile: prefer "mobile" group, on desktop: use first bottom group
    let selectedGroup;
    if (isMobile) {
      const mobileGroup = allGroups.find(group =>
        group.slug?.toLowerCase() === "mobile-footer"
        // group.name?.toLowerCase().includes("mobile") ||
        // group.slug?.toLowerCase().includes("mobile") ||
        // group.display?.toLowerCase().includes("mobile")
      );
      console.log("📱 isMobile:", isMobile, "| Found mobile group:", mobileGroup?.name || "NONE");
      selectedGroup = mobileGroup || bottomGroups[0] || {};
    } else {
      selectedGroup = bottomGroups[0] || {};
    }

    console.log("✅ SELECTED GROUP:", selectedGroup?.name || "NONE");
    const { navigation = [] } = selectedGroup;

    // Flatten sub_navigation for mobile to get actual links
    if (isMobile) {
      const flattenedLinks = navigation.flatMap(parent =>
        parent.sub_navigation && parent.sub_navigation.length > 0
          ? parent.sub_navigation
          : [parent]
      );
      return filterActiveNavigation(flattenedLinks);
    }

    return filterActiveNavigation(navigation);
  }, [NAVIGATION, isMobile]);

  const [buyNowParam, setBuyNowParam] = useState(null);
  useEffect(() => {
    if (isRunningOnClient()) {
      const queryParams = new URLSearchParams(location.search);
      setBuyNowParam((prev) => {
        if (prev === queryParams.get("buy_now")) return prev;
        return queryParams.get("buy_now");
      });
    }
  }, []);

  const cartItemCount = useMemo(() => {
    const bNowCount = BUY_NOW?.cart?.user_cart_items_count || 0;
    if (bNowCount && buyNowParam) {
      return bNowCount;
    } else {
      return CART_ITEMS?.cart_items?.user_cart_items_count || 0;
    }
  }, [CART_ITEMS, BUY_NOW, buyNowParam]);

  return {
    HeaderNavigation,
    FooterNavigation,
    cartItemCount,
    globalConfig,
    appInfo: CONFIGURATION.application,
    contactInfo: CONTACT_INFO,
    supportInfo: SUPPORT_INFO,
    wishlistIds,
    wishlistCount,
    loggedIn,
    isMobile,
  };
};

export default useHeader;
