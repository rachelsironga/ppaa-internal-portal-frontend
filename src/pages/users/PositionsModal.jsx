import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import showToast from "../../helpers/ToastHelper";
import { UsersContext } from "../../utils/context";
import Select from "react-select";
import { getDepartments } from "../department/Queries";
import { getDirectories } from "../directory/Queries";
import { getPositionalLevels } from "../positional_level/Queries";
import { createUpdatePositions } from "./Queries";


const PositionsModal = () => {
    const { debounceTimeout,
        setDebounceTimeout,
        handleFetchData,
        selectedUser,
        setSelectedUser,
        isModalOpen,
        setIsModalOpen, } = useContext(UsersContext)
    const [errors, setOtherError] = useState({});

    const [loadingDirectories, setLoadingDirectories] = useState(true);
    const [errorDirectory, setErrorDirectory] = useState(null);
    const [directories, setDirectories] = useState(null);


    const [loadingDepartments, setLoadingDepartments] = useState(true);
    const [errorDepartments, setErrorDepartments] = useState(null);
    const [departments, setDepartments] = useState(null);

    const [loadingLevels, setLoadingLevels] = useState(true);
    const [errorLevels, setErrorLevels] = useState(null);
    const [levels, setLevels] = useState(null);


    const initialValues = {
        user_uid: selectedUser?.guid || "",
        level_uid: selectedUser?.position?.level_uid || "",
        department_uid: selectedUser?.position?.department_uid || "",
        directory_uid: selectedUser?.position?.directory_uid || "",
        description: selectedUser?.position?.description || "",
        is_active: true,
    };

    const validationSchema = Yup.object().shape({
        level_uid: Yup.string().required("Position is required"),
        directory_uid: Yup.string().required("Directory is required")
    });

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            if (selectedUser) {
                values.user_uid = selectedUser?.guid;
            }

            const result = await createUpdatePositions(values);

            if (result.status === 200 || result.status === 8000) {
                showToast("Data Saved Successfuly", "success", "Complete");
                handleClose();
                resetForm();
                handleFetchData();
            }
            else if (result.status === 8002) {
                console.log("Validation error:", result.data);
                showToast(`${result.message}`, "warning", "Validation Failed");
                setErrors(result.data);
                setOtherError(result.data);
            } else {
                showToast(`${result.message}`, "warning", "Process Failed");
                handleClose();
                resetForm();
            }



        } catch (error) {
            console.log("Error submitting form:", error);
            showToast("Something went wrong while saving", "error", "Failed");
            handleClose(); // Close the modal after submission
            resetForm();
        } finally {
            setSubmitting(false);
        }
    };


    const handleFetchDirectories = async (searchValue = "") => {
        setLoadingDirectories(true);
        try {
            const result = await getDirectories({
                search: searchValue,
                pagination: {
                    page: 1,
                    page_size: 10,
                    paginated: true,
                },
            });
            if (result.status === 200 || result.status === 8000) {
                setDirectories(result.data);
            } else {
                setDirectories(null);
            }
        } catch (err) {
            setDirectories(null);
        } finally {
            setLoadingDirectories(false);
        }
    };

    const handleFetchDepartments = async (searchValue = "") => {
        setLoadingDepartments(true);
        try {
            const result = await getDepartments({
                search: searchValue,
                pagination: {
                    page: 1,
                    page_size: 10,
                    paginated: true,
                },
            });
            if (result.status === 200 || result.status === 8000) {
                setDepartments(result.data);
            } else {
                setDepartments(null);
            }
        } catch (err) {
            setDepartments(null);
        } finally {
            setLoadingDepartments(false);
        }
    };

    const handleFetchLevels = async (searchValue = "") => {
        setLoadingLevels(true);
        try {
            const result = await getPositionalLevels({
                search: searchValue,
                pagination: {
                    page: 1,
                    page_size: 10,
                    paginated: true,
                },
            });
            if (result.status === 200 || result.status === 8000) {
                setLevels(result.data);
            } else {
                setLevels(null);
            }
        } catch (err) {
            setLevels(null);
        } finally {
            setErrorLevels(false);
        }
    };


    useEffect(() => {
        if (isModalOpen) {
            handleFetchDirectories();
            handleFetchDepartments();
            handleFetchLevels();
        }
    }, [isModalOpen]);


    const handleClose = () => {
        console.log("Modal closed");
        const modalElement = document.getElementById("viewCreateUserPossitionModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
        setIsModalOpen(false);
    };




    return (
        <>

            <div className="modal modal-slide-in" id="viewCreateUserPossitionModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel3">
                                Change <span className="text-primary">{selectedUser?.first_name} {selectedUser?.last_name}</span> Position</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={handleClose}
                                data-bs-dismiss="modal"
                                aria-label="Close"></button>
                        </div>
                        <Formik
                            enableReinitialize
                            initialValues={initialValues}
                            validationSchema={validationSchema}
                            onSubmit={handleSubmit}
                        >
                            {({ isSubmitting, values, setFieldValue }) => (
                                <Form>
                                    <div className="modal-body">
                                        <p className="align-justify text-muted"> If you Made Changes here. User will be Asigned by new Position</p>
                                        <div className="row">
                                            <div className="col mb-3">
                                                <label htmlFor="levelUid" className="form-label">
                                                    Position
                                                </label>
                                                <Select
                                                    isLoading={loadingDirectories}
                                                    className="select2-selection fetched-select2"
                                                    onChange={(e) => {
                                                        console.log("Selected Position:", e);
                                                        if (e === null || e.value == "") {
                                                            setFieldValue("level_uid", "");
                                                        } else {
                                                            setFieldValue("level_uid", e.value);
                                                        }
                                                    }}
                                                    onInputChange={(e) => {
                                                        handleFetchLevels(e);
                                                    }}
                                                    options={levels?.map((item) => ({
                                                        value: item.uid,
                                                        label: `${item.name} (${item.code})`,
                                                    }))}
                                                    styles={{
                                                        menu: (base) => ({
                                                            ...base,
                                                            position: "absolute",
                                                            zIndex: 9999,
                                                        }),
                                                    }}
                                                    value={
                                                        levels
                                                            ?.map((item) => ({
                                                                value: item.uid,
                                                                label: `${item.name} (${item.code})`,
                                                            }))
                                                            .find(
                                                                (option) => option.value === values.level_uid
                                                            ) || null
                                                    }
                                                    isClearable
                                                />
                                                <Field type="hidden" name="level_uid" id="levelUidLarge" />
                                                <ErrorMessage name="level_uid" component="div" className="text-danger" />
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col mb-3">
                                                <label htmlFor="levelUid" className="form-label">
                                                    Directory
                                                </label>
                                                <Select
                                                    isLoading={loadingDirectories}
                                                    className="select2-selection fetched-select2"
                                                    onChange={(e) => {
                                                        console.log("Selected Directory:", e);
                                                        if (e === null || e.value == "") {
                                                            setFieldValue("directory_uid", "");
                                                        } else {
                                                            setFieldValue("directory_uid", e.value);
                                                        }
                                                    }}
                                                    onInputChange={(e) => {
                                                        handleFetchDirectories(e);
                                                    }}
                                                    options={directories?.map((item) => ({
                                                        value: item.uid,
                                                        label: `${item.name} (${item.code})`,
                                                    }))}
                                                    styles={{
                                                        menu: (base) => ({
                                                            ...base,
                                                            position: "absolute",
                                                            zIndex: 9999,
                                                        }),
                                                    }}
                                                    value={
                                                        directories
                                                            ?.map((item) => ({
                                                                value: item.uid,
                                                                label: `${item.name} (${item.code})`,
                                                            }))
                                                            .find(
                                                                (option) => option.value === values.directory_uid
                                                            ) || null
                                                    }
                                                    isClearable
                                                />
                                                <Field type="hidden" name="directory_uid" id="directoryUidLarge" />
                                                <ErrorMessage name="directory_uid" component="div" className="text-danger" />
                                            </div>
                                            <div className="col mb-3">
                                                <label htmlFor="departmentUid" className="form-label">
                                                    Department
                                                </label>
                                                <Select
                                                    isLoading={loadingDepartments}
                                                    className="select2-selection fetched-select2"
                                                    onChange={(e) => {
                                                        console.log("Selected Department:", e);
                                                        if (e === null || e.value == "") {
                                                            setFieldValue("department_uid", "");
                                                        } else {
                                                            setFieldValue("department_uid", e.value);
                                                        }
                                                    }}
                                                    onInputChange={(e) => {
                                                        handleFetchDepartments(e);
                                                    }}
                                                    options={departments?.map((item) => ({
                                                        value: item.uid,
                                                        label: `${item.name} (${item.code})`,
                                                    }))}
                                                    styles={{
                                                        menu: (base) => ({
                                                            ...base,
                                                            position: "absolute",
                                                            zIndex: 9999,
                                                        }),
                                                    }}
                                                    value={
                                                        departments
                                                            ?.map((item) => ({
                                                                value: item.uid,
                                                                label: `${item.name} (${item.code})`,
                                                            }))
                                                            .find(
                                                                (option) => option.value === values.department_uid
                                                            ) || null
                                                    }
                                                    isClearable
                                                />
                                                <Field type="hidden" name="department_uid" id="departmentUidLarge" />
                                                <ErrorMessage name="department_uid" component="div" className="text-danger" />
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col mb-3">
                                                <label htmlFor="descriptionLarge" className="form-label">Description</label>
                                                <Field as="textarea" name="description" id="descriptionLarge" className="form-control" rows="3" placeholder="Enter Description" />
                                                <ErrorMessage name="description" component="div" className="text-danger" />
                                            </div>
                                        </div>

                                        {errors.non_field_errors && errors.non_field_errors.length > 0 && (
                                            <div className="text-danger">
                                                {errors.non_field_errors.map((error, index) => (
                                                    <div key={index}>{error}</div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="modal-footer">
                                            <button
                                                aria-label="Click me"
                                                type="button"
                                                disabled={isSubmitting}
                                                onClick={handleClose}
                                                className="btn btn-outline-secondary"
                                                data-bs-dismiss="modal">
                                                Close
                                            </button>
                                            <button
                                                aria-label="Click me"
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="btn btn-primary">
                                                {isSubmitting ? "Assigning..." : "Assign Position"}
                                            </button>
                                        </div>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PositionsModal;
