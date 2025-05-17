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
    } else {
      dispatch({
        type: loginTypes.LOGIN_FAILURE,
        payload: response.data.data,
      });
      return;
    }

  } catch (error) {
    dispatch({
      type: loginTypes.LOGIN_FAILURE,
      payload: error?.response?.data.data,
    });
  }
};
