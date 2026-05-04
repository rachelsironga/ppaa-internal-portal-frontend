import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { createUpdateoxygenUsage, getUsageReport } from "./Queries";
import { OxygenUsageContext } from "../../../../utils/context";
import Select from "react-select";
import { getOxygenLocations } from "../locations/Queries";
import { getOxygenVolumes } from "../volumes/Queries";
import { getPatientAgeGroups } from "../patientAgeGroups/Queries";
import PDFViewer from "../../../../components/common/PDFViewer";
import ReactLoading from "react-loading";

// import { getPatientAgeGroups } from "../usage/Queries";

const ReportModal = ({ loadOnlyModal = true }) => {
  const { handleFetchData, selectedOxygenUsage } =
    useContext(OxygenUsageContext);
  const [errors, setOtherError] = useState({});

  const [loadingLocations, setLoadingLocations] = useState(true);
  const [errorLocations, setErrorLocations] = useState(false);
  const [oxygenLocations, setOxygenLocations] = useState([]);

  const [loadingReport, setLoadingReport] = useState(false);
  const [errorReport, setErrorReport] = useState(false);
  const [report, setReport] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);

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
    date_from: formatDateForInput(selectedOxygenUsage?.date),
    date_to: formatDateForInput(selectedOxygenUsage?.date),
  };

  const validationSchema = Yup.object().shape({
    location_uid: Yup.string().required("Location is required"),
    date_from: Yup.string()
      .required("Date is required")
      .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in format YYYY-MM-DD")
      .typeError("Date must be a valid date"),

    date_to: Yup.string()
      .required("Date is required")
      .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in format YYYY-MM-DD")
      .typeError("Date must be a valid date"),
  });

  // Handle form submit
  const handleSubmit = async (values, { setSubmitting }) => {
    setPdfBase64(null);
    setLoadingReport(true);
    try {
      // Format dates for backend (YYYY-MM-DD)
      const dateFrom = values.date_from.split("T")[0];
      const dateTo = values.date_to.split("T")[0];

      const result = await getUsageReport({
        filters: {
          location_uid: values.location_uid,
          date_from: dateFrom,
          date_to: dateTo,
        },
      });
      if (
        (result.status === 200 || result.status === 8000) &&
        result.data?.base64
      ) {
        setPdfBase64(result.data.base64);
      } else {
        setPdfBase64(null);
        showToast(
          "No report found for the selected criteria.",
          "warning",
          "No Report"
        );
      }
    } catch (error) {
      setPdfBase64(null);
      showToast("Unable to fetch report.", "error", "Failed");
    } finally {
      setLoadingReport(false);
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

  const handleUsageReport = async () => {
    setLoadingReport(true);
    setErrorReport(null);
    try {
      const result = await getUsageReport({
        pagination: {
          date_from: "2020-01-01",
          date_to: "2025-12-31",
        },
      });
      if (result.status === 200 || result.status === 8000) {
        console.log("Oxygen Usage Report:", result.data);
        setReport(result.data);
        // setSelectedOxygenUsage(result.data);
      } else {
        setErrorReport(true);
        showToast("No Report Found", "warning", "Fetch Completed");
      }
    } catch (err) {
      setErrorReport(true);
      showToast("Unable to Fetch Report", "warning", "Failed");
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    handleFetchLocations();
  }, [selectedOxygenUsage]);

  return (
    <>
      {!loadOnlyModal && (
        <button
          aria-label="Click me"
          type="button"
          className="btn btn-primary ms-auto btn-sm"
          data-bs-toggle="modal"
          data-bs-target="#viewCreateReportModal"
        >
          <i className="bx bx-edit-alt me-1"></i> View Usage Report
        </button>
      )}

      <div
        className="modal modal-slide-in"
        id="viewCreateReportModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                Oxygen Usage Report{" "}
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
                      <div className="col-sm-4 mb-3">
                        <label className="form-label">Locations</label>
                        <Select
                          isLoading={loadingLocations}
                          className="select2-selection fetched-select2"
                          onChange={(e) =>
                            setFieldValue("location_uid", e ? e.value : "")
                          }
                          options={oxygenLocations?.map((item) => ({
                            value: item.uid,
                            label: `${item.name} (${item.code})`,
                          }))}
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
                      <div className="col-sm-3 mb-3">
                        <label className="form-label">Date From</label>
                        <Field
                          type="date"
                          name="date_from"
                          className="form-control"
                        />
                        <ErrorMessage
                          name="date_from"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                      <div className="col-sm-3 mb-3">
                        <label className="form-label">Date To</label>
                        <Field
                          type="date"
                          name="date_to"
                          className="form-control"
                        />
                        <ErrorMessage
                          name="date_to"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                      <div className="col-sm-2 d-flex align-items-end">
                        <button
                          aria-label="Generate Report"
                          type="submit"
                          disabled={isSubmitting || loadingReport}
                          className="btn btn-primary w-100"
                        >
                          {isSubmitting || loadingReport
                            ? "Generating..."
                            : "Generate"}
                        </button>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-12 mb-4">
                        {loadingReport && (
                          <center>
                            <ReactLoading
                              type={"cylon"}
                              color={"#00853f"}
                              height={"30px"}
                              width={"50px"}
                            />
                          </center>
                        )}
                        {!loadingReport && pdfBase64 && (
                          <div style={{ minHeight: "400px" }}>
                            <PDFViewer base64={pdfBase64} />
                          </div>
                        )}
                        {!loadingReport && !pdfBase64 && (
                          <div className="text-muted text-center mt-5">
                            No report to display. Please select criteria and
                            generate.
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="modal-footer text-center align-items-center justify-content-center">
                      <button
                        aria-label="Close"
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleClose}
                        className="btn btn-outline-secondary"
                        data-bs-dismiss="modal"
                        style={{ minWidth: "150px" }}
                      >
                        Close
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

export default ReportModal;
