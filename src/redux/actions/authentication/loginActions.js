import { GET_ERRORS } from "../../types/error";
import axios from "axios";
import { loginTypes } from "../../types/authentication";
import { API_BASE_URL } from "../../../Costants";
import api from "../../../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../../Costants";


export const login = (userData, navigation) => async (dispatch) => {
  dispatch({
    type: loginTypes.LOGIN_REQUEST,
  });
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const data = JSON.stringify(userData);
  try {
    const response = await api.post(
      `${API_BASE_URL}/user/login`,
      data,
      config
    );
    if (response.status == 200 || response.data.status === 8000) {
      const { access_token, refresh_token } = response.data.data;
      const user = response.data.data.user;

      // Save tokens to localStorage
      localStorage.setItem(ACCESS_TOKEN, access_token);
      localStorage.setItem(REFRESH_TOKEN, refresh_token);

      // Dispatch success action with user data
      dispatch({
        type: loginTypes.LOGIN_SUCCESS,
        payload: { user, access_token, refresh_token },
      });
      navigation("/");
    } else if (response.status == 202 && response.data.status === 8002) {
      dispatch({
        type: loginTypes.LOGIN_FAILURE,
        payload: response.data,
      });
      return;
    }
    else if (response.status == 202 && response.data.status === 8008) {
      // Redirect new user for Reset password change
      dispatch({
        type: loginTypes.LOGIN_RESET_PASSWORD,
        payload: response.data,
      });
      navigation("/auth/user-password-UF56HJUIrZafX2riMPDQFgQG2L06IOKHJDD");
    }
    else if (response.status == 202 && response.data.status === 8007) {
      // Redirect new user for verification password change
      dispatch({
        type: loginTypes.LOGIN_NEW_USER,
        payload: response.data,
      });
      navigation("/auth/new-user-0InEm7BVGIrZafX2riM8DQFgQG2L06ImZlP3oJF");
    }

    else {
      dispatch({
        type: loginTypes.LOGIN_FAILURE,
        payload: response.data,
      });
      return;
    }

  } catch (error) {
    dispatch({
      type: loginTypes.LOGIN_FAILURE,
      payload: error?.response?.data,
    });
  }
};


