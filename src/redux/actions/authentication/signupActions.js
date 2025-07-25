import { GET_ERRORS } from "../../types/error";
import { signupTypes, loginTypes } from "../../types/authentication";
import { API_BASE_URL } from "../../../Costants";
import api from "../../../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../../Costants";

export const signup = (userData, navigation) => async (dispatch) => {
  dispatch({
    type: signupTypes.SIGNUP_REQUEST,
  });

  const data = JSON.stringify(userData);
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await api.post(
      `${API_BASE_URL}/user/register`, 
      data,
      config
    );
    dispatch({
      type: signupTypes.SIGNUP_SUCCESS,
      payload: response.data,
    });

    // loginuser if successfully registered
    const { access_token, refresh_token } = response.data.data;
    const user = response.data.user;

    // Save tokens to localStorage
    localStorage.setItem(ACCESS_TOKEN, access_token);
    localStorage.setItem(REFRESH_TOKEN, refresh_token);

    // Dispatch success action with user data
    dispatch({
      type: loginTypes.LOGIN_SUCCESS,
      payload: { user, access_token, refresh_token },
    });

    navigation("/");
  } catch (error) {

    dispatch({
      type: signupTypes.SIGNUP_FAILURE,
      payload: error?.response?.data,
    });
  }
};
