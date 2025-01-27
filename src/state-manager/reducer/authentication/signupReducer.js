import { signupTypes } from "../../types/authentication";
const initialState = {
    loading: false,
    success: false,
    error: null,
};

export const signupReducer = (state = initialState, action) => {
    switch (action.type) {
        case signupTypes.SIGNUP_REQUEST:
            return {
                ...state,
                loading: true,
            };
        case signupTypes.SIGNUP_SUCCESS:
            return {
                ...state,
                loading: false,
                success: true,
                error: null,
            };
        case signupTypes.SIGNUP_FAILURE:
            return {
                ...state,
                loading: false,
                success: false,
                error: action.payload,
            };
        default:
            return state;
    }
}

