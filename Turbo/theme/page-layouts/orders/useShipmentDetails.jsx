import { useEffect, useState, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  GET_SHIPMENT_DETAILS,
  SHIPMENT_REASONS,
  SHIPMENT_INVOICE,
  UPDATE_SHIPMENT_STATUS,
  UPDATE_DEFAULT_BENEFICIARY,
} from "../../queries/shipmentQuery";
import { useSnackbar } from "../../helper/hooks";
import { useNavigate, useGlobalTranslation } from "fdk-core/utils";

const useShipmentDetails = (fpi) => {
  const { t } = useGlobalTranslation("translation");
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { showSnackbar } = useSnackbar();
  const [shipmentDetails, setShipmentDetails] = useState({});
  const [invoiceDetails, setInvoiceDetails] = useState({});
  const [reasonsList, setReasonsList] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [showPolling, setShowPolling] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchShipmentDetails = useCallback(async () => {
    if (Object.keys(shipmentDetails).length > 0 || isFetching) {
      return;
    }

    setIsFetching(true);
    const values = {
      shipmentId: params.shipmentId || "",
    };

    try {
      const res = await fpi.executeGQL(GET_SHIPMENT_DETAILS, values);
      if (res?.data?.shipment?.detail) {
        setShipmentDetails(res?.data?.shipment?.detail);
        if (res?.data?.shipment?.invoice_detail) {
          setInvoiceDetails(res?.data?.shipment?.invoice_detail);
        }
        setShowPolling(false);
        setIsLoading(false);
      } else {
        setAttempts((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error fetching shipment details:", error);
      setAttempts((prev) => prev + 1);
    } finally {
      setIsFetching(false);
    }
  }, [params.shipmentId, shipmentDetails, fpi, isFetching]);

  useEffect(() => {
    if (params.shipmentId) {
      setShipmentDetails({});
      setAttempts(0);
      setShowPolling(false);
      setIsLoading(true);
    }
  }, [params.shipmentId]);

  useEffect(() => {
    if (params.shipmentId && !isFetching) {
      if (attempts < 5 && Object.keys(shipmentDetails).length === 0) {
        fetchShipmentDetails();
      } else if (attempts >= 5) {
        setShowPolling(true);
        setIsLoading(false);
      }
    }
  }, [params.shipmentId, attempts, fetchShipmentDetails, shipmentDetails, isFetching]);

  function getBagReasons(bagObj) {
    setIsLoading(true);
    try {
      fpi
        .executeGQL(SHIPMENT_REASONS, bagObj)
        .then((res) => {
          if (res?.data?.shipment) {
            const data = res?.data?.shipment?.shipment_bag_reasons;
            setReasonsList(data);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log({ error });
      setIsLoading(false);
    }
  }

  function getInvoice(bagObj) {
    try {
      fpi.executeGQL(SHIPMENT_INVOICE, bagObj).then((res) => {
        if (res?.data?.shipment) {
          const data = res?.data?.shipment?.invoice_detail;
          setInvoiceDetails(data);
        }
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log({ error });
    }
  }

  async function updateShipment(payload, type) {
    setIsLoading(true);
    try {
      // First call UPDATE_DEFAULT_BENEFICIARY if beneficiary_id exists
      if (payload.beneficiary_id) {
        try {
          const beneficiaryPayload = {
            setDefaultBeneficiaryRequestInput: {
              beneficiary_id: payload.beneficiary_id,
              order_id: payload.order_id,
              shipment_id: payload.shipmentId,
            },
          };

          const beneficiaryRes = await fpi.executeGQL(
            UPDATE_DEFAULT_BENEFICIARY,
            beneficiaryPayload
          );

          if (beneficiaryRes?.data?.updateDefaultBeneficiary?.success) {
            // eslint-disable-next-line no-console
            console.log("Default beneficiary updated successfully");
          } else {
            const errorMessage =
              beneficiaryRes?.errors?.[0]?.message ||
              "Failed to update default beneficiary";
            showSnackbar(errorMessage, "error");
            setIsLoading(false);
            return;
          }
        } catch (beneficiaryError) {
          const errorMessage =
            beneficiaryError?.message || "Failed to update default beneficiary";
          showSnackbar(errorMessage, "error");
          setIsLoading(false);
          return;
        }
      }

      // Proceed with UPDATE_SHIPMENT_STATUS only if beneficiary update succeeded or no beneficiary to update
      const res = await fpi.executeGQL(UPDATE_SHIPMENT_STATUS, payload);
      if (
        res?.data?.updateShipmentStatus?.statuses[0]?.shipments[0]?.status ===
        200
      ) {
        const newShipmentId =
          res?.data?.updateShipmentStatus?.statuses[0]?.shipments[0]
            ?.final_state?.shipment_id;

        if (type === "return") {
          showSnackbar(t("resource.order.return_accepted"), "success");
        }

        if (newShipmentId) {
          setTimeout(() => {
            setIsLoading(false);
            navigate(`/profile/orders/shipment/${newShipmentId}`);
          }, 500);
        } else {
          setIsLoading(false);
        }
      }
    } catch (error) {
      setIsLoading(false);
      // eslint-disable-next-line no-console
      console.log({ error });
    }
  }

  const refetchShipmentDetails = async () => {
    setIsLoading(true);
    try {
      const values = {
        shipmentId: params.shipmentId,
      };
      const res = await fpi.executeGQL(GET_SHIPMENT_DETAILS, values);
      if (res?.data?.shipment) {
        const data = res?.data?.shipment?.detail;
        setShipmentDetails({ ...data });
      }
    } catch (error) {
      console.log({ error });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    shipmentDetails,
    invoiceDetails,
    reasonsList,
    getBagReasons,
    getInvoice,
    updateShipment,
    refetchShipmentDetails,
    showPolling,
    attempts,
  };
};

export default useShipmentDetails;
