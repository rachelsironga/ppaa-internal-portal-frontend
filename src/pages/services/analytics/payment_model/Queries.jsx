import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

const PAYMENT_MODES_API_URL = `${API_BASE_URL}/api/analytical/payment-modes`;

const config = {
    headers: {
        "Content-Type": "application/json",
    },
};

const setConfig = (pagination = {}) => ({
    headers: { "Content-Type": "application/json" },
    params: { ...pagination },
});

export const getPaymentModes = async ({
    uid = "",
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${PAYMENT_MODES_API_URL}${uid === "" ? (search !== "" ? `?search=${search}` : "") : `/${uid}`}`,
            uid === "" ? setConfig(pagination) : {}
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching payment modes:", error);
        throw error;
    }
};

export const createUpdatePaymentMode = async (paymentModeData) => {
    try {
        const url = paymentModeData.uid 
            ? `${PAYMENT_MODES_API_URL}/${paymentModeData.uid}/update` 
            : `${PAYMENT_MODES_API_URL}/create`;
        
        const response = await api.post(url, paymentModeData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${paymentModeData.uid ? 'updating' : 'creating'} payment mode:`, error);
        throw error;
    }
};

export const deletePaymentMode = async (uid) => {
    try {
        const response = await api.delete(`${PAYMENT_MODES_API_URL}/${uid}/delete`);
        return response.data;
    } catch (error) {
        console.error("Error deleting payment mode:", error);
        throw error;
    }
};
