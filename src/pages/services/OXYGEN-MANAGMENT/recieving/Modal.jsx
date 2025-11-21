import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { createUpdateoxygenRecieving } from "./Queries";
import { OxygenRecievingContext } from "../../../../utils/context";
import Select from "react-select";
import { getOxygenLocations } from "../locations/Queries";
import { getOxygenVolumes } from "../volumes/Queries";
import { getOxygenSuppliers } from "../suppliers/Queries";

const oxygenRecievingsModal = ({ loadOnlyModal = false }) => {
  const { handleFetchData, selectedOxygenRecieving } = useContext(
    OxygenRecievingContext
  );
  const [errors, setOtherError] = useState({});
  const typeOptions = [
    { value: "WARD", label: "Ward" },
    { value: "STORE", label: "Store" },
  ];

  const [loadingVolumes, setLoadingVolumes] = useState(true);
  const [errorVolumes, setErrorVolumes] = useState(false);
  const [oxygenVolumes, setOxygenVolumes] = useState([]);

  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [errorSuppliers, setErrorSuppliers] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  const [loadingLocations, setLoadingLocations] = useState(true);
  const [errorLocations, setErrorLocations] = useState(false);
  const [oxygenLocations, setOxygenLocations] = useState([]);

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
    location_uid: selectedOxygenRecieving?.location?.uid || "",
    receiving_number: selectedOxygenRecieving?.receiving_number || "",
    date: formatDateForInput(selectedOxygenRecieving?.date),
    remarks: selectedOxygenRecieving?.remarks || "",
    receive_items: selectedOxygenRecieving?.receive_details?.map((item) => ({
      volume_uid: item.volume.uid || "",
      supplier_uid: item.supplier.uid || "",
      quantity: item.quantity || "",
    })) || [
      {
        volume_uid: "",
        supplier_uid: "",
        quantity: "",
      },
    ],
  };

  const validationSchema = Yup.object().shape({
    location_uid: Yup.string().required("Location is required"),
    receiving_number: Yup.string().required("Receiving number is required"),
    remarks: Yup.string().nullable(),
    date: Yup.string()
      .required("Date is required")
      .matches(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
        "Date must be in format YYYY-MM-DDTHH:mm"
      )
      .typeError("Date must be a valid date"),
    receive_items: Yup.array()
      .of(
        Yup.object().shape({
          volume_uid: Yup.string().required("Volume is required"),
          supplier_uid: Yup.string().required("Supplier is required"),
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
      if (selectedOxygenRecieving) {
        values.uid = selectedOxygenRecieving.uid;
      }

      delete values.quantity;
      const result = await createUpdateoxygenRecieving(values);

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
    // setSelectedoxygenRecieving(null);
    const modalElement = document.getElementById("viewCreateDataModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  const handleFetchLocations = async (searchValue = "") => {
    setLoadingLocations(true);
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
        setOxygenLocations(result.data || []);
      } else {
        setOxygenLocations([]);
      }
    } catch (err) {
      setOxygenLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleFetchSupplier = async (searchValue = "") => {
    setLoadingSuppliers(true);
    try {
      const result = await getOxygenSuppliers({
        search: searchValue,
        pagination: {
          page: 1,
          page_size: 10,
          paginated: true,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setSuppliers(result.data || []);
      } else {
        setSuppliers([]);
      }
    } catch (err) {
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  useEffect(() => {
    handleFetchLocations();
    handleFetchSupplier();
    if (selectedOxygenRecieving) {
      console.log("Selected Oxygen Recieving:", selectedOxygenRecieving);
      // Fetch volumes only if a specific recieving is selected
      oxygenLocations.map((loc) => {
        console.log("Location UID:", loc.uid);
        console.log(
          "Selected Recieving Location UID:",
          selectedOxygenRecieving.location?.uid
        );
        if (loc.uid === selectedOxygenRecieving.location?.uid) {
          setOxygenVolumes(loc.volumes || []);
        }
      });
    }
  }, [selectedOxygenRecieving]);

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
          <i className="bx bx-edit-alt me-1"></i> Add oxygen Recieving
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
                {selectedOxygenRecieving === null
                  ? "Create New"
                  : "View / Update"}{" "}
                oxygen Recievings{" "}
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
                        <label htmlFor="LocationUID" className="form-label">
                          Locations
                        </label>
                        <Select
                          isLoading={loadingLocations}
                          className="select2-selection fetched-select2"
                          onChange={(e) => {
                            if (e === null || e.value == "") {
                              setFieldValue("location_uid", "");
                              setOxygenVolumes([]);
                            } else {
                              setFieldValue("location_uid", e.value);
                              // Find the selected location and set its volumes
                              const selectedLocation = oxygenLocations.find(
                                (loc) => loc.uid === e.value
                              );
                              setOxygenVolumes(selectedLocation?.volumes || []);

                              // Reset receive_items to one empty row
                              setFieldValue("receive_items", [
                                {
                                  volume_uid: "",
                                  supplier_uid: "",
                                  quantity: "",
                                },
                              ]);
                            }
                          }}
                          onInputChange={(e) => {
                            handleFetchLocations(e);
                          }}
                          options={oxygenLocations?.map((item) => ({
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
                            oxygenLocations
                              ?.map((item) => ({
                                value: item.uid,
                                label: `${item.name} (${item.code})`,
                              }))
                              .find(
                                (option) => option.value === values.location_uid
                              ) || null
                          }
                          isClearable
                        />
                        <ErrorMessage
                          name="location_uid"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-sm-6 mb-3">
                        <label
                          htmlFor="receivingNumberLarge"
                          className="form-label"
                        >
                          Receiving Number
                        </label>
                        <Field
                          type="text"
                          name="receiving_number"
                          id="receivingNumberLarge"
                          className="form-control"
                          placeholder="Enter Receiving Number"
                        />
                        <ErrorMessage
                          name="receiving_number"
                          component="div"
                          className="text-danger"
                        />
                      </div>

                      <div className="col-sm-6 mb-3">
                        <label htmlFor="dateLarge" className="form-label">
                          Recieved at
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

                    {/* Receiving Volumes Table */}
                    <FieldArray name="receive_items">
                      {({ push, remove, form }) => (
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label mb-0">
                              Receiving Volumes
                            </label>
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() =>
                                push({
                                  volume_uid: "",
                                  supplier_uid: "",
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
                                <th style={{ width: "220px" }}>Volume</th>
                                <th>Supplier</th>
                                <th style={{ width: "150px" }}>Quantity</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {form.values.receive_items.map((item, idx) => (
                                <tr key={idx}>
                                  <td>
                                    <Select
                                      name={`receive_items.${idx}.volume_uid`}
                                      options={oxygenVolumes
                                        .filter(
                                          (v) =>
                                            // Allow this option if it's not selected in another row,
                                            // or if it's the value for this row (so user can keep their selection)
                                            !form.values.receive_items.some(
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
                                          `receive_items.${idx}.volume_uid`,
                                          option ? option.value : ""
                                        )
                                      }
                                      className="select2-selection"
                                      placeholder="Select Volume"
                                    />
                                    <ErrorMessage
                                      name={`receive_items.${idx}.volume_uid`}
                                      component="div"
                                      className="text-danger"
                                    />
                                  </td>
                                  <td>
                                    <Select
                                      name={`receive_items.${idx}.supplier_uid`}
                                      className="select2-selection fetched-select2"
                                      onChange={(e) => {
                                        if (e === null || e.value == "") {
                                          setFieldValue(
                                            `receive_items.${idx}.supplier_uid`,
                                            ""
                                          );
                                        } else {
                                          setFieldValue(
                                            `receive_items.${idx}.supplier_uid`,
                                            e.value
                                          );
                                        }
                                      }}
                                      onInputChange={(e) => {
                                        handleFetchSupplier(e);
                                      }}
                                      options={suppliers?.map((item) => ({
                                        value: item.uid,
                                        label: `${item.name} (${item.email_address})`,
                                      }))}
                                      styles={{
                                        menu: (base) => ({
                                          ...base,
                                          position: "absolute",
                                          zIndex: 9999,
                                        }),
                                      }}
                                      value={
                                        suppliers
                                          ?.map((item) => ({
                                            value: item.uid,
                                            label: `${item.name} (${item.email_address})`,
                                          }))
                                          .find(
                                            (option) =>
                                              option.value === item.supplier_uid
                                          ) || null
                                      }
                                      isClearable
                                    />

                                    <ErrorMessage
                                      name={`receive_items.${idx}.supplier_uid`}
                                      component="div"
                                      className="text-danger"
                                    />
                                  </td>
                                  <td>
                                    <Field
                                      name={`receive_items.${idx}.quantity`}
                                      type="number"
                                      className="form-control"
                                      placeholder="Quantity"
                                      min={1}
                                    />
                                    <ErrorMessage
                                      name={`receive_items.${idx}.quantity`}
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
                    {values.receive_items.length === 0 && (
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

export default oxygenRecievingsModal;
