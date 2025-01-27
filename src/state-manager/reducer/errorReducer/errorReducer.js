import { GET_ERRORS } from "../../types/error";

const initialState = {
    msh: {},
    status: null,
};
export const errorReducer = (state = initialState, action) => {
    switch (action.type) {
        case GET_ERRORS:
            return {
                msg: action.payload.msg,
                status: action.payload.status,
            };
        default:
            return state;
    }
}

