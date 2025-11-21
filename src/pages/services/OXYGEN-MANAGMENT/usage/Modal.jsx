import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { createUpdateoxygenUsage } from "./Queries";
import { OxygenUsageContext } from "../../../../utils/context";
import Select from "react-select";
import { getOxygenLocations } from "../locations/Queries";
import { getOxygenVolumes } from "../volumes/Queries";
import { getPatientAgeGroups } from "../patientAgeGroups/Queries";

// import { getPatientAgeGroups } from "../usage/Queries";

const OxygenUsagesModal = ({ loadOnlyModal = false }) => {
  const { handleFetchData, selectedOxygenUsage } =
    useContext(OxygenUsageContext);
  const [errors, setOtherError] = useState({});

  const [loadingVolumes, setLoadingVolumes] = useState(true);
  const [errorVolumes, setErrorVolumes] = useState(false);
  const [oxygenVolumes, setOxygenVolumes] = useState([]);

  const [loadingPatientAgeGroups, setLoadingPatientAgeGroups] = useState(true);
  const [errorPatientAgeGroups, setErrorPatientAgeGroups] = useState(false);
  const [patientAgeGroups, setPatientAgeGroups] = useState([]);

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
    location_uid: selectedOxygenUsage?.location?.uid || "",
    date: formatDateForInput(selectedOxygenUsage?.date),
    remarks: selectedOxygenUsage?.remarks || "",
    patient_age_groups: selectedOxygenUsage?.patient_age_groups?.map(
      (item) => ({
        patient_age_group_uid: item.patient_age_group.uid || "",
        oxygen: item.oxygen || 0,
        ventilator: item.ventilator || 0,
        cpap: item.vcpap || 0,
      })
    ) || [
      {
        patient_age_group_uid: "",
        oxygen: 0,
        ventilator: 0,
        cpap: 0,
      },
    ],
  };

  const validationSchema = Yup.object().shape({
    location_uid: Yup.string().required("Location is required"),
    remarks: Yup.string().nullable(),
    date: Yup.string()
      .required("Date is required")
      .matches(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
        "Date must be in format YYYY-MM-DDTHH:mm"
      )
      .typeError("Date must be a valid date"),
    patient_age_groups: Yup.array()
      .of(
        Yup.object().shape({
          patient_age_group_uid: Yup.string().required("Age Group is required"),
        })
      )
      .min(1, "At least one item is required"),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectedOxygenUsage) {
        values.uid = selectedOxygenUsage.uid;
      }

      delete values.quantity;
      const result = await createUpdateoxygenUsage(values);

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
    // setSelectedoxygenUsage(null);
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

  const handleFetchPatientAgeGroup = async (searchValue = "") => {
    setLoadingPatientAgeGroups(true);
    try {
      const result = await getPatientAgeGroups({
        search: searchValue,
        pagination: {
          page: 1,
          page_size: 10,
          paginated: true,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setPatientAgeGroups(result.data || []);
      } else {
        setPatientAgeGroups([]);
      }
    } catch (err) {
      setPatientAgeGroups([]);
    } finally {
      setLoadingPatientAgeGroups(false);
    }
  };

  useEffect(() => {
    handleFetchLocations();
    handleFetchPatientAgeGroup();
    if (selectedOxygenUsage) {
      console.log("Selected Oxygen Recieving:", selectedOxygenUsage);
      // Fetch volumes only if a specific recieving is selected
      patientAgeGroups.map((loc) => {
        console.log("Location UID:", loc.uid);
        console.log(
          "Selected Recieving Location UID:",
          selectedOxygenUsage.location?.uid
        );
      });
    }
  }, [selectedOxygenUsage]);

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
          <i className="bx bx-edit-alt me-1"></i> Add Oxygen Usage
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
                {selectedOxygenUsage === null ? "Create New" : "View / Update"}{" "}
                oxygen Usage{" "}
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
                              // Find the selected location and set its usage
                              const selectedLocation = oxygenLocations.find(
                                (loc) => loc.uid === e.value
                              );
                              setOxygenVolumes(selectedLocation?.volumes || []);

                              // Reset patient_age_groups to one empty row
                              setFieldValue("patient_age_groups", [
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

                    {/* Oxygen Usage Table */}
                    <FieldArray name="patient_age_groups">
                      {({ push, remove, form }) => (
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label mb-0">
                              Patient Age Group
                            </label>
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() =>
                                push({
                                  patient_age_group_uid: "",
                                  oxygen: 0,
                                  ventilator: 0,
                                  cpap: 0,
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
                                <th>Patient Age Group</th>
                                <th style={{ width: "110px" }}>Oxygen</th>
                                <th style={{ width: "110px" }}>Ventilator</th>
                                <th style={{ width: "110px" }}>CPAP</th>
                                <th style={{ width: "50px" }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {form.values.patient_age_groups.map(
                                (item, idx) => (
                                  <tr key={idx}>
                                    <td>
                                      <Select
                                        name={`patient_age_groups.${idx}.patient_age_group_uid`}
                                        options={patientAgeGroups
                                          .filter(
                                            (ag) =>
                                              // Show if not selected in another row, or is the current value
                                              !form.values.patient_age_groups.some(
                                                (item, i) =>
                                                  i !== idx &&
                                                  item.patient_age_group_uid ===
                                                    ag.uid
                                              ) ||
                                              ag.uid ===
                                                item.patient_age_group_uid
                                          )
                                          .map((ag) => ({
                                            value: ag.uid,
                                            label: ag.name,
                                          }))}
                                        value={
                                          patientAgeGroups
                                            .map((ag) => ({
                                              value: ag.uid,
                                              label: ag.name,
                                            }))
                                            .find(
                                              (opt) =>
                                                opt.value ===
                                                item.patient_age_group_uid
                                            ) || null
                                        }
                                        onChange={(option) =>
                                          form.setFieldValue(
                                            `patient_age_groups.${idx}.patient_age_group_uid`,
                                            option ? option.value : ""
                                          )
                                        }
                                        className="select2-selection"
                                        placeholder="Select Age Group"
                                      />
                                      <ErrorMessage
                                        name={`patient_age_groups.${idx}.patient_age_group_uid`}
                                        component="div"
                                        className="text-danger"
                                      />
                                    </td>
                                    <td>
                                      <Field
                                        name={`patient_age_groups.${idx}.oxygen`}
                                        type="number"
                                        className="form-control"
                                        placeholder="Oxygen"
                                        min={0}
                                      />
                                    </td>
                                    <td>
                                      <Field
                                        name={`patient_age_groups.${idx}.ventilator`}
                                        type="number"
                                        className="form-control"
                                        placeholder="Ventilator"
                                        min={0}
                                      />
                                    </td>
                                    <td>
                                      <Field
                                        name={`patient_age_groups.${idx}.cpap`}
                                        type="number"
                                        className="form-control"
                                        placeholder="CPAP"
                                        min={0}
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
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </FieldArray>
                    {/* Show error if no receiving items or location has no volumes */}
                    {values.patient_age_groups.length === 0 && (
                      <div className="text-danger mb-2">
                        At least one receiving volume is required.
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

export default OxygenUsagesModal;
