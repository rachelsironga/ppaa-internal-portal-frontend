import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { createUpdateOxygenLocationUsage } from "./Queries";
import { OxygenLocationUsageContext } from "../../../../utils/context";
import Select from "react-select";
import { getOxygenLocationUsages } from "../locations/Queries";

const ModalLocationUsage = () => {
  const {
    handleFetchData,
    selectedLocationUsage,
    selectOxygenLocation,
    setSelectedOxygenLocation,
  } = useContext(OxygenLocationUsageContext);
  const [errors, setOtherError] = useState({});

  const [loadingVolumes, setLoadingVolumes] = useState(true);
  const [errorVolumes, setErrorVolumes] = useState(false);
  const [oxygenVolumes, setOxygenVolumes] = useState([]);

  const initialValues = {
    location_uid: selectOxygenLocation?.uid || "",
    volume_uid: selectedLocationUsage?.volume_uid || "",
    quantity: selectedLocationUsage?.quantity || "",
  };

  const validationSchema = Yup.object().shape({
    location_uid: Yup.string().required("Location is required"),
    volume_uid: Yup.string().required("Cylinder Volume is required"),
    quantity: Yup.string().required("Quantity is required"),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectedLocationUsage) {
        values.uid = selectedLocationUsage.uid;
      }
      const result = await createUpdateOxygenLocationUsage(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Data Saved Successfully", "success", "Complete");
        handleClose();
        resetForm();
        handleFetchData();
      } else if (result.status === 8002) {
        showToast(`${result.message}`, "warning", "Validation Failed");
        setErrors(result.data);
        setOtherError(result.data);
      } else {
        showToast(`${result.message}`, "warning", "Process Failed");
        handleClose();
        resetForm();
      }
    } catch (error) {
      showToast("Something went wrong while saving", "error", "Failed");
      handleClose();
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedOxygenLocation(null);
    const modalElement = document.getElementById("viewCreateVolumeModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  const handleFetchVolumes = async (searchValue = "") => {
    setLoadingVolumes(true);
    try {
      const result = await getOxygenLocationUsages({
        search: searchValue,
        pagination: {
          page: 1,
          page_size: 10,
          paginated: true,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setOxygenVolumes(result.data || []);
      } else {
        setOxygenVolumes([]);
      }
    } catch (err) {
      setOxygenVolumes([]);
    } finally {
      setLoadingVolumes(false);
    }
  };

  useEffect(() => {
    handleFetchVolumes();
  }, []);

  return (
    <>
      <button
        aria-label="Click me"
        type="button"
        className="btn btn-primary ms-auto btn-sm"
        data-bs-toggle="modal"
        data-bs-target="#viewCreateVolumeModal"
      >
        <i className="bx bx-edit-alt me-1"></i> Add Location Volume
      </button>

      <div
        className="modal modal-slide-in"
        id="viewCreateVolumeModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-md" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                {selectedLocationUsage === null
                  ? "Create New"
                  : "View / Update"}{" "}
                Oxygen Location Volume
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
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
                    <div className="row">
                      <div className="col mb-3">
                        <label htmlFor="levelUid" className="form-label">
                          Cylinder Volumes
                        </label>
                        <Select
                          isLoading={loadingVolumes}
                          onChange={(e) => {
                            setFieldValue("volume_uid", e?.value || "");
                          }}
                          onInputChange={(e) => {
                            handleFetchVolumes(e);
                          }}
                          options={oxygenVolumes
                            ?.filter((item) => {
                              const existingVolumes =
                                selectOxygenLocation?.volumes || [];
                              return !existingVolumes.some(
                                (volume) => volume.volume_uid === item.uid
                              );
                            })
                            .map((item) => ({
                              value: item.uid,
                              label: `${item.name} (${item.volume})`,
                            }))}
                          className="select2-selection fetched-select2"
                          styles={{
                            menu: (base) => ({
                              ...base,
                              position: "absolute",
                              zIndex: 9999,
                            }),
                          }}
                          name="volume_uid"
                          value={
                            oxygenVolumes
                              ?.map((item) => ({
                                value: item.uid,
                                label: `${item.name} (${item.volume})`,
                              }))
                              .find(
                                (option) => option.value === values.volume_uid
                              ) || null
                          }
                        />
                        <ErrorMessage
                          name="volume_uid"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col mb-3">
                        <label htmlFor="quantityLarge" className="form-label">
                          Quantity
                        </label>
                        <Field
                          type="number"
                          name="quantity"
                          id="quantityLarge"
                          className="form-control"
                          placeholder="Enter Quantity"
                        />
                        <ErrorMessage
                          name="quantity"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>

                    {errors.non_field_errors?.length > 0 && (
                      <div className="text-danger">
                        {errors.non_field_errors.map((error, index) => (
                          <div key={index}>{error}</div>
                        ))}
                      </div>
                    )}

                    <div className="modal-footer">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleClose}
                        className="btn btn-outline-secondary"
                        data-bs-dismiss="modal"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary"
                      >
                        {isSubmitting ? "Saving..." : "Save"}
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

export default ModalLocationUsage;
