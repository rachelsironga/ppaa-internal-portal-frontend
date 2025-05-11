import axios from "axios";
import React from "react";
import { createRoot } from "react-dom/client"; // Import createRoot
import { API_BASE_URL } from "../../Costants";
import { Provider, useSelector } from "react-redux";
import store from "../../redux/store";

const showLoginDialog = () => {
    return new Promise((resolve, reject) => {
        // Create a container for the modal
        const modalContainer = document.createElement("div");
        document.body.appendChild(modalContainer);


        // Create a root for the modal
        const root = createRoot(modalContainer);

        // Function to close the modal
        const closeModal = () => {
            root.unmount(); // Unmount the component
            document.body.removeChild(modalContainer);
        };

        // Modal Component
        const Modal = () => {
            const [loading, setLoading] = React.useState(false);
            const user = useSelector((state) => state.userReducer);
            if (!user) {
                reject(true)
                closeModal();
            }

            const handleLogin = async () => {
                if (loading) return;
                setLoading(true);

                try {
                    const email = user?.data?.email;
                    if (!email) {
                        reject(true)
                        closeModal();
                    }
                    const password = document.getElementById("password").value;

                    const response = await axios.post(`${API_BASE_URL}/user/login`, {
                        email,
                        password,
                    });
                    setLoading(false);

                    if (response.status === 200) {
                        localStorage.setItem("accessToken", response.data.data.access_token);
                        localStorage.setItem("refreshToken", response.data.data.refresh_token);
                        closeModal();
                        resolve(true);
                    } else {
                        reject(true)
                        closeModal();
                    }
                } catch (error) {
                    closeModal();
                    reject(true);
                }
            };

            return (
                <div className="modal-backdrop" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
                    <div className="modal modal-slide-in" style={{ display: "block" }} role="dialog"
                        aria-labelledby="loginModalTitle"
                        aria-describedby="loginModalDescription">
                        <div className="modal-dialog modal-sm modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title"> </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => {
                                            closeModal();
                                            reject(true);
                                        }}
                                        aria-label="Close"
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        height: "100%", // Ensure the parent div has a height
                                    }}>
                                        <img
                                            src={user?.data?.profile_image ?? "../assets/img/avatars/1.png"}
                                            alt="user-avatar"
                                            className="d-block rounded"
                                            height="100"
                                            width="100"
                                            aria-label="Account image"
                                            id="uploadedAvatar"
                                        />
                                    </div>
                                    <h5 className="text-muted text-center mt-4">VERIFY YOU IDENTITY</h5>
                                    <p className="text-center">Hello. <strong>{user?.data?.first_name}</strong>, Your session has expired. Please Enter your Password</p>
                                    <form className="content-centered text-center align-items-center">
                                        <div className="mb-3">
                                            <input
                                                type="password"
                                                className="form-control"
                                                id="password"
                                                placeholder="Enter your password"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-primary mt-2"
                                            style={{ width: "200px" }}
                                            onClick={handleLogin}
                                            disabled={loading}
                                        >
                                            {loading ? "Signing in..." : "Sign In"}                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };
        // Render the modal into the container
        root.render(
            <Provider store={store}>
                <Modal />
            </Provider>);
    });

};

export default showLoginDialog;