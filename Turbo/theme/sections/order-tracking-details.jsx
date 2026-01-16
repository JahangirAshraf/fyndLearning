import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useGlobalStore } from "fdk-core/utils";
import { GET_SHIPMENT_DETAILS } from "../queries/shipmentQuery";
import OrderTrack from "@gofynd/theme-template/pages/order/order-tracking-details/order-tracking-details";
import "@gofynd/theme-template/pages/order/order-tracking-details/order-tracking-details.css";

export function Component(props) {
  const { fpi, shipmentData, orderData } = props;

  const {
    isLoading: isOrderLoading,
    orderShipments = {},
    linkOrderDetails
  } = orderData || {};

  const {
    isLoading: isShipmentLoading,
    invoiceDetails
  } = shipmentData || {};

  const isLoading = isOrderLoading || isShipmentLoading;
  const params = useParams();
  const [selectedShipmentBag, setSelectedShipmentBag] =
    useState(orderShipments);
  const [isLocalShipmentLoading, setIsLocalShipmentLoading] = useState(false);

  const { fulfillment_option } = useGlobalStore(fpi.getters.APP_FEATURES);

  const getShipmentDetails = () => {
    if (params?.shipmentId) {
      setIsLocalShipmentLoading(true);
      try {
        const values = {
          shipmentId: params.shipmentId || "",
        };
        fpi
          .executeGQL(GET_SHIPMENT_DETAILS, values)
          .then((res) => {
            if (res?.data?.shipment) {
              const data = res?.data?.shipment?.detail;
              setSelectedShipmentBag(data);
            }
          })
          .finally(() => {
            setIsLocalShipmentLoading(false);
          });
      } catch (error) {
        console.log({ error });
        setIsLocalShipmentLoading(false);
      }
    }
  };
  return (
    <OrderTrack
      invoiceDetails={invoiceDetails}
      isLoading={isLoading}
      orderShipments={orderShipments}
      getShipmentDetails={getShipmentDetails}
      selectedShipment={selectedShipmentBag}
      isShipmentLoading={isLocalShipmentLoading}
      availableFOCount={fulfillment_option?.count || 1}
      linkOrderDetails={linkOrderDetails}
    ></OrderTrack>
  );
}
``;
export const settings = {
  label: "Order Tracking Details",
};

export default Component;
