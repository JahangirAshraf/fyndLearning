import React from "react";
import { useGlobalStore } from "fdk-core/utils";
import { SectionRenderer } from "fdk-core/components";
import ProfileRoot from "../../components/profile/profile-root";

import useShipmentDetails from "../orders/useShipmentDetails";
import useOrdersListing from "../orders/useOrdersListing";
import { Component as OrderDetails } from "../../sections/order-details";
import { Component as OrderTrackingDetails } from "../../sections/order-tracking-details";

function ProfileMyOrderShipmentPage({ fpi }) {
  const page = useGlobalStore(fpi.getters.PAGE) || {};
  const THEME = useGlobalStore(fpi.getters.THEME);

  const mode = THEME?.config?.list.find(
    (f) => f.name === THEME?.config?.current
  );

  const globalConfig = mode?.global_config?.custom?.props;

  // Single source for shipment data
  const shipmentDetailsData = useShipmentDetails(fpi);
  const { shipmentDetails } = shipmentDetailsData;

  // Single source for order data
  const orderListingData = useOrdersListing(fpi, shipmentDetails?.order_id);

  const DEFAULT_BLOCKS = [
    { type: "order_header" },
    { type: "shipment_items" },
    { type: "shipment_medias" },
    { type: "shipment_tracking" },
    { type: "shipment_address" },
    { type: "payment_details_card" },
    { type: "shipment_breakup" },
  ];

  return (
    <ProfileRoot fpi={fpi}>
      {page?.value === "shipment-details" && (
        <>
          {/* <OrderTrackingDetails
            fpi={fpi}
            shipmentData={shipmentDetailsData}
            orderData={orderListingData}
          /> */}
          <OrderDetails
            fpi={fpi}
            blocks={DEFAULT_BLOCKS}
            globalConfig={globalConfig}
            shipmentData={shipmentDetailsData}
            orderData={orderListingData}
          />
        </>
      )}
    </ProfileRoot>
  );
}

export default ProfileMyOrderShipmentPage;
