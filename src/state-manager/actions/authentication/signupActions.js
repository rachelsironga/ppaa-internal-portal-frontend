import { GET_ERRORS } from "../../types/error";
import axios from "axios";
import { signupTypes } from "../../types/authentication";
import { API_BASE_URL } from "../../../Costants";

export const signup = (userData, history) => async (dispatch) => {
  dispatch({
    type: signupTypes.SIGNUP_REQUEST,
  });
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const data = JSON.stringify(userData);
  console.log("data==============>", data);
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/users/`,
      data,
      config
    );
    dispatch({
      type: signupTypes.SIGNUP_SUCCESS,
      payload: response.data,
    });
    history.push("/auth/login");
  } catch (error) {
    console.log("error==============>");
    console.log(error);
    const err = { msg: error.response.data, status: error.response.status };
    console.log("error==============>", err);

    dispatch({
      type: signupTypes.SIGNUP_FAILURE,
    });
    dispatch({
      type: GET_ERRORS,
      payload: err,
    });
  }
};
