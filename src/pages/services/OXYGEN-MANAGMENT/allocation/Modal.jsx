import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { createUpdateOxygenAllocation } from "./Queries";
import { OxygenAllocationContext } from "../../../../utils/context";
import Select from "react-select";
import { getOxygenLocations } from "../locations/Queries";
import { getOxygenVolumes } from "../volumes/Queries";
import { getOxygenSuppliers } from "../suppliers/Queries";

const oxygenAllocationsModal = ({ loadOnlyModal = false }) => {
  const { handleFetchData, selectedOxygenAllocation } = useContext(
    OxygenAllocationContext
  );
  const [errors, setOtherError] = useState({});
  const typeOptions = [
    { value: "WARD", label: "Ward" },
    { value: "STORE", label: "Store" },
  ];

  const [loadingVolumes, setLoadingVolumes] = useState(true);
  const [errorVolumes, setErrorVolumes] = useState(false);
  const [oxygenVolumes, setOxygenVolumes] = useState([]);

  const [loadingLocations, setLoadingLocations] = useState(true);
  const [errorLocations, setErrorLocations] = useState(false);
  const [oxygenLocations, setOxygenLocations] = useState([]);

  const [loadingLocationsFrom, setLoadingLocationsFrom] = useState(true);
  const [errorLocationsFrom, setErrorLocationsFrom] = useState(false);
  const [oxygenLocationsFrom, setOxygenLocationsFrom] = useState([]);

  const [loadingLocationsTo, setLoadingLocationsTo] = useState(true);
  const [errorLocationsTo, setErrorLocationsTo] = useState(false);
  const [oxygenLocationsTo, setOxygenLocationsTo] = useState([]);

  const formatDateForInput = (isoString) => {
    if (!isoString) return "";
    // Remove 'Z', then slice to remove seconds if present
    const d = new Date(isoString);
    // Pad month, day, hours, minutes
    const pad = (n) => n.toString().padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const initialValues = {
    location_from_uid: selectedOxygenAllocation?.location_from?.uid || "",
    location_to_uid: selectedOxygenAllocation?.location_to?.uid || "",
    date: formatDateForInput(selectedOxygenAllocation?.date),
    remarks: selectedOxygenAllocation?.remarks || "",
    allocation_items: selectedOxygenAllocation?.allocation_details?.map(
      (item) => ({
        volume_uid: item.volume.uid || "",
        quantity: item.quantity || "",
      })
    ) || [
      {
        volume_uid: "",
        quantity: "",
      },
    ],
  };

  const validationSchema = Yup.object().shape({
    location_from_uid: Yup.string().required("Location From is required"),
    location_to_uid: Yup.string().required("Location To is required"),
    remarks: Yup.string().nullable(),
    date: Yup.string()
      .required("Date is required")
      .matches(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
        "Date must be in format YYYY-MM-DDTHH:mm"
      )
      .typeError("Date must be a valid date"),
    allocation_items: Yup.array()
      .of(
        Yup.object().shape({
          volume_uid: Yup.string().required("Volume is required"),
          quantity: Yup.number()
            .typeError("Quantity must be a number")
            .required("Required")
            .min(1, "Quantity must be at least 1"),
        })
      )
      .min(1, "At least one item is required"),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectedOxygenAllocation) {
        values.uid = selectedOxygenAllocation.uid;
      }

      delete values.quantity;
      const result = await createUpdateOxygenAllocation(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Data Saved Successfuly", "success", "Complete");
        handleClose();
        resetForm();
        handleFetchData();
      } else if (result.status === 8002) {
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

  const handleClose = () => {
    console.log("Modal closed");
    // setSelectedoxygenAllocation(null);
    const modalElement = document.getElementById("viewCreateDataModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  const handleFetchLocations = async (searchValue = "") => {
    try {
      const result = await getOxygenLocations({
        search: searchValue,
        pagination: {
          page: 1,
          page_size: 10,
          paginated: true,
          with_volumes: true,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        if (loadingLocationsFrom) setOxygenLocationsFrom(result.data || []);
        else setOxygenLocationsTo(result.data || []);
      } else {
        if (loadingLocationsFrom) setOxygenLocationsFrom(result.data || []);
        else setOxygenLocationsTo(result.data || []);
      }
    } catch (err) {
      if (loadingLocationsFrom) setOxygenLocationsFrom(result.data || []);
      else setOxygenLocationsTo(result.data || []);
    } finally {
      setLoadingLocationsFrom(false);
      setLoadingLocationsTo(false);
    }
  };

  useEffect(() => {
    handleFetchLocations();
    if (selectedOxygenAllocation) {
      console.log("Selected Oxygen Allocation:", selectedOxygenAllocation);
      // Fetch volumes only if a specific allocation is selected
      oxygenLocations.map((loc) => {
        if (loc.uid === selectedOxygenAllocation.location_from?.uid) {
          setOxygenVolumes(loc.volumes || []);
        }
      });
    }
  }, [selectedOxygenAllocation]);

  return (
    <>
      {!loadOnlyModal && (
        <button
          aria-label="Click me"
          type="button"
          className="btn btn-primary ms-auto btn-sm"
          data-bs-toggle="modal"
          data-bs-target="#viewCreateDataModal"
        >
          <i className="bx bx-edit-alt me-1"></i> Add Oxygen Allocation
        </button>
      )}

      <div
        className="modal modal-slide-in"
        id="viewCreateDataModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                {selectedOxygenAllocation === null
                  ? "Create New"
                  : "View / Update"}{" "}
                oxygen Allocation{" "}
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
                      <div className="col-sm-6 mb-3">
                        <label htmlFor="LocationFromUID" className="form-label">
                          Location From
                        </label>
                        <Select
                          isLoading={loadingLocationsFrom}
                          className="select2-selection fetched-select2"
                          onChange={(e) => {
                            if (e === null || e.value == "") {
                              setFieldValue("location_from_uid", "");
                              setOxygenVolumes([]);
                            } else {
                              setFieldValue("location_from_uid", e.value);
                              // Find the selected location and set its volumes
                              const selectedLocation = oxygenLocationsFrom.find(
                                (loc) => loc.uid === e.value
                              );
                              setOxygenVolumes(selectedLocation?.volumes || []);

                              // Reset allocation_items to one empty row
                              setFieldValue("allocation_items", [
                                {
                                  volume_uid: "",
                                  quantity: "",
                                },
                              ]);
                            }
                          }}
                          onInputChange={(e) => {
                            setLoadingLocationsFrom(true);
                            handleFetchLocations(e);
                          }}
                          options={oxygenLocationsFrom?.map((item) => ({
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
                            oxygenLocationsFrom
                              ?.map((item) => ({
                                value: item.uid,
                                label: `${item.name} (${item.code})`,
                              }))
                              .find(
                                (option) =>
                                  option.value === values.location_from_uid
                              ) || null
                          }
                          isClearable
                        />
                        <ErrorMessage
                          name="location_from_uid"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                      <div className="col-sm-6 mb-3">
                        <label htmlFor="LocationToUID" className="form-label">
                          Location To
                        </label>
                        <Select
                          isLoading={loadingLocationsTo}
                          className="select2-selection fetched-select2"
                          onChange={(e) => {
                            if (e === null || e.value == "") {
                              setFieldValue("location_to_uid", "");
                            } else {
                              setFieldValue("location_to_uid", e.value);
                            }
                          }}
                          onInputChange={(e) => {
                            setLoadingLocationsTo(true);
                            handleFetchLocations(e);
                          }}
                          options={oxygenLocationsTo?.map((item) => ({
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
                            oxygenLocationsTo
                              ?.map((item) => ({
                                value: item.uid,
                                label: `${item.name} (${item.code})`,
                              }))
                              .find(
                                (option) =>
                                  option.value === values.location_to_uid
                              ) || null
                          }
                          isClearable
                        />
                        <ErrorMessage
                          name="location_to_uid"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col mb-3">
                        <label htmlFor="dateLarge" className="form-label">
                          Allocated at
                        </label>
                        <Field
                          type="datetime-local"
                          name="date"
                          id="nameLarge"
                          className="form-control"
                          placeholder="Enter Date"
                        />
                        <ErrorMessage
                          name="date"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>

                    {/* Allocation Volumes Table */}
                    <FieldArray name="allocation_items">
                      {({ push, remove, form }) => (
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label mb-0">
                              Allocating Volumes
                            </label>
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() =>
                                push({
                                  volume_uid: "",
                                  quantity: "",
                                })
                              }
                            >
                              <i className="bx bx-add-to-queue"></i>&nbsp; Add
                              New
                            </button>
                          </div>
                          <table className="table table-bordered table-sm">
                            <thead>
                              <tr>
                                <th style={{ minWidth: "220px" }}>Volume</th>
                                <th style={{ width: "150px" }}>Quantity</th>
                                <th style={{ width: "60px" }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {form.values.allocation_items.map((item, idx) => (
                                <tr key={idx}>
                                  <td>
                                    <Select
                                      name={`allocation_items.${idx}.volume_uid`}
                                      options={oxygenVolumes
                                        .filter(
                                          (v) =>
                                            // Allow this option if it's not selected in another row,
                                            // or if it's the value for this row (so user can keep their selection)
                                            !form.values.allocation_items.some(
                                              (item, i) =>
                                                i !== idx &&
                                                item.volume_uid === v.volume_uid
                                            )
                                        )
                                        .map((v) => ({
                                          value: v.volume_uid,
                                          label: `${v.volume_name}`,
                                        }))}
                                      value={
                                        oxygenVolumes
                                          .map((v) => ({
                                            value: v.volume_uid,
                                            label: `${v.volume_name}`,
                                          }))
                                          .find(
                                            (opt) =>
                                              opt.value === item.volume_uid
                                          ) || null
                                      }
                                      onChange={(option) =>
                                        form.setFieldValue(
                                          `allocation_items.${idx}.volume_uid`,
                                          option ? option.value : ""
                                        )
                                      }
                                      className="select2-selection"
                                      placeholder="Select Volume"
                                    />
                                    <ErrorMessage
                                      name={`allocation_items.${idx}.volume_uid`}
                                      component="div"
                                      className="text-danger"
                                    />
                                  </td>
                                  <td>
                                    <Field
                                      name={`allocation_items.${idx}.quantity`}
                                      type="number"
                                      className="form-control"
                                      placeholder="Quantity"
                                      min={1}
                                    />
                                    <ErrorMessage
                                      name={`allocation_items.${idx}.quantity`}
                                      component="div"
                                      className="text-danger"
                                    />
                                  </td>
                                  <td>
                                    {idx > 0 && (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-danger"
                                        onClick={() => remove(idx)}
                                      >
                                        <i className="bx bx-trash"></i>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </FieldArray>
                    {/* Show error if no receiving items or location has no volumes */}
                    {values.allocation_items.length === 0 && (
                      <div className="text-danger mb-2">
                        At least one receiving volume is required.
                      </div>
                    )}
                    {values.location_uid && oxygenVolumes.length === 0 && (
                      <div className="text-danger mb-2">
                        The selected location does not have any Registered
                        volumes.
                      </div>
                    )}

                    {errors.non_field_errors &&
                      errors.non_field_errors.length > 0 && (
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
                        data-bs-dismiss="modal"
                      >
                        Close
                      </button>
                      <button
                        aria-label="Click me"
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

export default oxygenAllocationsModal;
