import { loginTypes, coreTypes } from "../../types/authentication";
const initialState = {
    isLoading: false,
    success: false,
    error: null,
};

export const loginReducer = (state = initialState, action) => {
    switch (action.type) {
        case loginTypes.LOGIN_REQUEST:
            return {
                ...state,
                isLoading: true,
                success: false,
                error: null
            };
        case loginTypes.LOGIN_SUCCESS:
            return {
                ...state,
                isLoading: false,
                success: true,
                error: null,
            };
        case loginTypes.LOGIN_FAILURE:
            return {
                ...state,
                isLoading: false,
                success: false, 
                error: action.payload,
            };
        case coreTypes.RESET:
            return initialState;
        default:
            return state;
    }
}

