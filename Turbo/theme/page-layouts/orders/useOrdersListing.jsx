import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ORDER_LISTING, ORDER_BY_ID } from "../../queries/ordersQuery";
import { ADD_TO_CART } from "../../queries/pdpQuery";
import { CART_ITEMS_COUNT } from "../../queries/wishlistQuery";
import { fetchCartDetails } from "../cart/useCart";
import { useGlobalStore, useGlobalTranslation } from "fdk-core/utils";
import dayjs from "dayjs";
import { useSnackbar, useThemeConfig } from "../../helper/hooks";
import { translateDynamicLabel } from "../../helper/utils";

const useOrdersListing = (fpi, manualOrderId) => {
  const { t } = useGlobalTranslation("translation");
  const location = useLocation();
  const params = useParams();
  const orderId = manualOrderId || params?.orderId;
  const { showSnackbar } = useSnackbar();
  const { globalConfig, pageConfig } = useThemeConfig({ fpi, page: "orders" });
  const ORDERLIST = useGlobalStore(fpi.getters.SHIPMENTS);
  const [orders, setOrders] = useState({});
  const [orderShipments, setOrderShipments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [linkOrderDetails, setLinkOrderDetails] = useState("");
  const getDateRange = function (days) {
    const fromDate = dayjs().subtract(days, "days").format("MM-DD-YYYY");
    const toDate = dayjs().add(1, "days").format("MM-DD-YYYY");
    return {
      fromDate,
      toDate,
    };
  };

  useEffect(() => {
    if (orderId) {
      setIsLoading(true);
      try {
        const values = {
          orderId: orderId,
        };
        fpi
          .executeGQL(ORDER_BY_ID, values)
          .then((res) => {
            setOrderShipments(res?.data?.order || {});
            setLinkOrderDetails({
              data: res?.data?.order || null,
              error: res?.errors?.length ? res?.errors[0]?.message : null,
              amount:
                res?.data?.order?.breakup_values?.[
                res?.data?.order?.breakup_values?.length - 1
                ],
              orderId: orderId,
            });
            if (res?.errors?.[0]?.message) {
              showSnackbar(res?.errors[0]?.message, "error");
            }
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (error) {
        console.log({ error });
        setIsLoading(false);
      }
    } else if (!params?.shipmentId) {
      // If no orderId and not on a shipment detail page, listing hook will handle loading
    } else {
      // If on shipment detail page and no orderId yet, we stop this hook's loading
      // as it will restart once orderId is passed from parent
      setIsLoading(false);
    }
  }, [orderId, params?.shipmentId]);

  useEffect(() => {
    // Only fetch order listing if not on a detail page
    if (orderId || params?.shipmentId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams(location.search);
      let values = {
        pageNo: 1,
        pageSize: 50,
      };
      const selected_date_filter = queryParams.get("selected_date_filter");
      if (selected_date_filter) {
        const dateObj = getDateRange(selected_date_filter);
        values = { ...values, ...dateObj };
      }
      const status = queryParams.get("status") || "";
      if (status) values.status = Number(status);
      console.log("filters", selected_date_filter, status)
      fpi
        .executeGQL(ORDER_LISTING, values)
        .then((res) => {
          if (res?.data?.orders) {
            console.log(res);
            const data = res?.data?.orders;
            setOrders(data);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } catch (error) {
      console.log({ error });
      setIsLoading(false);
    }
  }, [location.search, orderId, params?.shipmentId]);

  const handelBuyAgain = (orderInfo) => {
    const itemsPayload = orderInfo?.bags_for_reorder?.map(
      ({ __typename, ...rest }) => rest
    );
    const payload = {
      buyNow: false,
      areaCode: "",
      addCartRequestInput: {
        items: itemsPayload,
      },
    };
    fpi.executeGQL(ADD_TO_CART, payload).then((outRes) => {
      if (outRes?.data?.addItemsToCart?.success) {
        fpi.executeGQL(CART_ITEMS_COUNT, null).then((res) => {
          showSnackbar(
            translateDynamicLabel(outRes?.data?.addItemsToCart?.message, t) ||
            t("resource.common.add_to_cart_success"),
            "success"
          );
        });
        fetchCartDetails(fpi);
      } else {
        showSnackbar(
          translateDynamicLabel(outRes?.data?.addItemsToCart?.message, t) ||
          t("resource.common.add_cart_failure"),
          "error"
        );
      }
    });
  };
  return {
    isLoading,
    orders,
    orderShipments,
    pageConfig,
    globalConfig,
    handelBuyAgain,
    linkOrderDetails,
  };
};

export default useOrdersListing;
