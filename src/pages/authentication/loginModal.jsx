import axios from "axios";
import React from "react";
import { createRoot } from "react-dom/client"; // Import createRoot
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
            const [errorMessage, setErrorMessage] = React.useState(false);
            const [errorCount, setErrorCount] = React.useState(1);
            const passwordRef = React.useRef(null);

            if (!user) {
                reject(true)
                closeModal();
            }



            React.useEffect(() => {
                passwordRef.current.focus();
                // Focus input when modal appears
                if (passwordRef.current) {
                    passwordRef.current.focus();
                }
            }, []);


            const handleLogin = async () => {
                if (loading) return;
                setLoading(true);



                try {
                    const username = user?.data?.username;
                    if (!username) {
                        reject(true)
                        closeModal();
                    }
                    const password = document.getElementById("refresh_password_modal").value;
                    if (password === "") {
                        setLoading(false);
                        setErrorMessage("Please enter your password");
                        return;
                    }
                    // Make the API call to verify the password
                    const response = await axios.post(`${API_BASE_URL}/user/login`, {
                        username,
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
                    setLoading(false);

                    if (error.status === 401) {
                        if (errorCount === 2) {
                            closeModal();
                            reject(true);
                        } else {
                            setErrorCount(errorCount + 1);
                            setErrorMessage(
                                <div>
                                    Invalid password. Try again. <br /> <small>(Last attempt)</small>
                                </div>
                            );
                        }

                    } else {
                        closeModal();
                        reject(true);
                    }

                }
            };

            return (
                <div className="modal-backdrop" style={{
                    backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 99999999, position: "fixed",
                }}>
                    <div key={3456354} className="modal modal-slide-in" style={{ display: "block" }} role="dialog"
                        aria-labelledby="loginModalTitle"
                        aria-describedby="loginModalDescription">
                        <div className="modal-dialog modal-sm modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title"> </h5>
                                    {/* <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => {
                                            closeModal();
                                            reject(true);
                                        }}
                                        aria-label="Close"
                                    ></button> */}
                                </div>
                                <div className="modal-body">
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        height: "100%", // Ensure the parent div has a height
                                    }}>
                                        <img
                                            src={user?.data?.photo !== "" ? user?.data?.photo : "../assets/img/avatars/1.png"}
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
                                    <form className="content-centered text-center align-items-center" id="loginVerifyForm">
                                        <input
                                            type="password"
                                            className="form-control mb-3"
                                            id="refresh_password_modal"
                                            placeholder="Enter your password"
                                            ref={passwordRef}
                                            autoFocus
                                            required
                                            aria-label="Enter your password"
                                            aria-describedby="refresh_password_modal"
                                        />
                                        <div className="me-1">
                                            {errorMessage && (
                                                <div className="text-danger text-center" role="alert">
                                                    {errorMessage}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-primary mt-2"
                                            style={{ width: "200px" }}
                                            onClick={handleLogin}
                                            disabled={loading || errorCount > 2}
                                        >
                                            {loading ? "Verifying..." : "Verify"}
                                        </button>
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