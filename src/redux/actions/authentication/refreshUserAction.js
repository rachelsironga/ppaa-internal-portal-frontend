import api from "../../../api";
import { ACCESS_TOKEN, API_BASE_URL } from "../../../Costants";
import { userTypes } from "../../types/authentication";

/** Refetch current user so photo/signature MinIO presigned URLs stay valid. */
export const refreshCurrentUser = () => async (dispatch) => {
  if (!localStorage.getItem(ACCESS_TOKEN)) {
    return null;
  }
  try {
    const { data } = await api.get(`${API_BASE_URL}/user/me`);
    if ((data.status === 200 || data.status === 8000) && data.data) {
      dispatch({
        type: userTypes.USER_UPDATE,
        payload: { user: data.data },
      });
      return data.data;
    }
  } catch {
    /* ignore — user may be offline or token expired */
  }
  return null;
};
