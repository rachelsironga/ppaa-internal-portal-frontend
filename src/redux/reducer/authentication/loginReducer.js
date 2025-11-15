import { loginTypes, coreTypes } from "../../types/authentication";
const initialState = {
    isLoading: false,
    success: false,
    error: null,
    data: null
};

export const loginReducer = (state = initialState, action) => {
    switch (action.type) {
        case loginTypes.LOGIN_REQUEST:
            return {
                ...state,
                isLoading: true,
                success: false,
                error: null,
                data: null
            };
        case loginTypes.LOGIN_SUCCESS:
            return {
                ...state,
                isLoading: false,
                success: true,
                error: null,
                data: null
            };
        case loginTypes.LOGIN_RESET_PASSWORD:
            return {
                ...state,
                isLoading: false,
                success: true,
                error: null,
                data: action.payload
            };
        case loginTypes.LOGIN_NEW_USER:
            return {
                ...state,
                isLoading: false,
                success: true,
                error: null,
                data: action.payload
            };
        case loginTypes.LOGIN_FAILURE:
            return {
                ...state,
                isLoading: false,
                success: false, 
                error: action.payload,
                data: null,
            };
        case coreTypes.RESET:
            return initialState;
        default:
            return state;
    }
}

