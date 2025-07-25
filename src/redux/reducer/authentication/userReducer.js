const initialState = {
    data: null,
    isLoading: false,
    error: null,
};

export const userReducer = (state = initialState, action) => {
    switch (action.type) {
        case "LOGIN_REQUEST":
            return { ...state, isLoading: true, error: null };
        case "LOGIN_SUCCESS":
            return {
                ...state,
                data: action.payload.user,
                access_token: action.payload.access_token,
                refresh_token: action.payload.refresh_token,
                isLoading: false,
                error: null,
            };
        case "USER_UPDATE":
            return {
                ...state,
                data: {
                    ...state.data,
                    ...action.payload.user,
                },
                isLoading: false,
                error: null,
            };
        case "LOGIN_FAILURE":
            return {
                ...state,
                data: null,
                access_token: null,
                refresh_token: null,
                isLoading: false,
                error: action.payload,
            };
        case 'LOGOUT':
            return initialState;
        default:
            return state;
    }
};
