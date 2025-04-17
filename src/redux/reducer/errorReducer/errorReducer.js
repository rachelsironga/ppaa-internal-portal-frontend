import { coreTypes } from "../../types/authentication";
import { GET_ERRORS } from "../../types/error";

const initialState = {
    msg: {},
    status: null,
};
export const errorReducer = (state = initialState, action) => {
    switch (action.type) {
        case GET_ERRORS:
            return {
                msg: action.payload.msg,
                status: action.payload.status,
            };
        case coreTypes.RESET:
            return initialState;
        default:
            return state;
    }
}

