import { coreTypes, signupTypes } from "../../types/authentication";
const initialState = {
    isLoading: false,
    success: false,
    error: null,
};

export const signupReducer = (state = initialState, action) => {
    switch (action.type) {
        case signupTypes.SIGNUP_REQUEST:
            return {
                ...state,
                isLoading: true,
                success: false,
                error: null,
            };
        case signupTypes.SIGNUP_SUCCESS:
            return {
                ...state,
                isLoading: false,
                success: true,
                error: null,
            };
        case signupTypes.SIGNUP_FAILURE:
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

