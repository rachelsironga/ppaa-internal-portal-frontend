import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

const BLOCKS_API_URL = `${API_BASE_URL}/api/analytical/blocks`;

const config = {
    headers: {
        "Content-Type": "application/json",
    },
};

const setConfig = (pagination = {}) => ({
    headers: { "Content-Type": "application/json" },
    params: { ...pagination },
});

export const getBlocks = async ({
    uid = "",
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${BLOCKS_API_URL}${uid === "" ? (search !== "" ? `?search=${search}` : "") : `/${uid}`}`,
            uid === "" ? setConfig(pagination) : {}
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching blocks:", error);
        throw error;
    }
};

export const createUpdateBlock = async (blockData) => {
    try {
        const url = blockData.uid 
            ? `${BLOCKS_API_URL}/${blockData.uid}/update` 
            : `${BLOCKS_API_URL}/create`;
        
        const response = await api.post(url, blockData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${blockData.uid ? 'updating' : 'creating'} block:`, error);
        throw error;
    }
};

export const deleteBlock = async (uid) => {
    try {
        const response = await api.delete(`${BLOCKS_API_URL}/${uid}/delete`);
        return response.data;
    } catch (error) {
        console.error("Error deleting block:", error);
        throw error;
    }
};
