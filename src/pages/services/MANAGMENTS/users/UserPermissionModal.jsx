import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { UsersContext } from "../../../../utils/context";
import DualListSelect from "../../../../components/ui-templates/DualListSelect";
import { createUpdateData, fetchData } from "../../../../utils/GlobalQueries";

/** User API returns groups via get_groups() as lowercase names; Group API uses DB casing. */
const normGroupName = (name) => String(name ?? "").trim().toLowerCase();

/** Django group row id: GroupListSerializer uses stringified integer pk in `uid`. */
const groupOptionValue = (group) => {
  const raw = group?.uid ?? group?.id;
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const s = String(raw).trim();
  const n = parseInt(s, 10);
  if (Number.isFinite(n) && String(n) === s) return n;
  return null;
};

/** API may return a bare array or a paginated/wrapped object depending on gateway/version. */
const normalizeListPayload = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

const toastText = (msg, fallback) => {
  if (msg == null || msg === "") return fallback;
  const s = String(msg).trim();
  return s === "" || s === "null" || s === "undefined" ? fallback : s;
};

const parseUserRoleOptionId = (item) => {
  const raw = item?.value ?? item?.id ?? item?.uid;
  if (raw === undefined || raw === null || raw === "") return null;
  const n =
    typeof raw === "number" && Number.isFinite(raw)
      ? raw
      : parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : null;
};

const UserPermissionModal = () => {
  const { selectedObj, setSelectedObj, setTableRefresh, tableRefresh } =
    useContext(UsersContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setOtherError] = useState({});
  const initialValues = {
    user_uid: selectedObj?.guid || "",
    selected_roles: selectedObj?.groups || [],
  };

  const validationSchema = Yup.object().shape({
    user_uid: Yup.string().required("User is required"),
    selected_roles: Yup.array().min(0),
  });

  const [leftOptions, setLeftOptions] = useState([]);
  const [rightOptions, setRightOptions] = useState([]);
  const [clearSelectTrigger, setClearSelectTrigger] = useState(0);
  const rightOptionsRef = useRef([]);

  useEffect(() => {
    rightOptionsRef.current = rightOptions;
  }, [rightOptions]);

  /** Only move rows explicitly chosen in the dual list (avoids moving every row when values are bad or stale). */
  const handleAssign = useCallback((selected) => {
    if (!Array.isArray(selected) || selected.length === 0) return;

    const toAdd = [];
    const pickedIds = new Set();
    for (const item of selected) {
      const id = parseUserRoleOptionId(item);
      if (id == null || pickedIds.has(id)) continue;
      pickedIds.add(id);
      toAdd.push({
        value: id,
        label: String(item?.label ?? item?.name ?? ""),
      });
    }
    if (toAdd.length === 0) return;

    setRightOptions((prevRight) => {
      const next = [...prevRight];
      for (const row of toAdd) {
        if (!next.some((r) => r.value === row.value)) next.push(row);
      }
      return next;
    });
    setLeftOptions((prevLeft) =>
      prevLeft.filter((item) => !pickedIds.has(item.value))
    );
  }, []);

  const handleRemove = useCallback((selected) => {
    if (!Array.isArray(selected) || selected.length === 0) return;

    const removeIds = new Set();
    for (const item of selected) {
      const id = parseUserRoleOptionId(item);
      if (id != null) removeIds.add(id);
    }
    if (removeIds.size === 0) return;

    setRightOptions((prevRight) => {
      const removedRows = prevRight.filter((item) => removeIds.has(item.value));
      const newRight = prevRight.filter((item) => !removeIds.has(item.value));
      setLeftOptions((prevLeft) => {
        const existing = new Set(prevLeft.map((x) => x.value));
        const toLeft = removedRows.filter((r) => !existing.has(r.value));
        return [...prevLeft, ...toLeft];
      });
      return newRight;
    });
  }, []);

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectedObj) {
        values.permitted_user = selectedObj?.guid;
      }

      // Backend expects integer Django Group primary keys.
      const roleIds = rightOptionsRef.current
        .map((item) => parseUserRoleOptionId(item))
        .filter((v) => v != null && Number.isFinite(v));
      values.selected_roles = roleIds;
      const userGuid = (selectedObj?.guid || values.permitted_user || "").trim();
      if (!userGuid) {
        showToast(
          "Missing user id — close the modal and open Edit Permissions again.",
          "warning",
          "Validation Failed"
        );
        setSubmitting(false);
        return;
      }
      const payload = {
        permitted_user: userGuid,
        selected_roles: roleIds,
      };
      if (roleIds.length === 0) {
        showToast(
          "You must assign at least one Role to the user",
          "warning",
          "Validation Failed"
        );
        setSubmitting(false);
        return;
      }

      const result = await createUpdateData({
        url: "/system/roles-list-assign-users",
        formData: payload,
      });

      if (result.status === 200 || result.status === 8000) {
        showToast(
          toastText(result.message, "Roles updated successfully."),
          "success",
          "Complete"
        );
        // Update selectedObj with the response data which contains updated groups
        setSelectedObj(result.data);
        // Trigger refresh in Open.jsx to fetch latest user data
        setTableRefresh((prev) => prev + 1);
        // Small delay to ensure context updates before closing
        setTimeout(() => {
          handleClose();
          resetForm();
        }, 100);
      } else if (result.status === 8002) {
        showToast(
          toastText(
            result.message,
            "Validation failed — check role selection and try again."
          ),
          "warning",
          "Validation Failed"
        );
        setErrors(result.data);
        setOtherError(result.data);
      } else {
        showToast(
          toastText(
            result.message,
            `Could not save roles (status ${result?.status ?? "unknown"}).`
          ),
          "warning",
          "Process Failed"
        );
        handleClose();
        resetForm();
      }
    } catch (error) {
      const apiMsg = error?.response?.data?.message;
      showToast(
        toastText(apiMsg, error?.message || "Something went wrong while saving"),
        "error",
        "Failed"
      );
      handleClose(); // Close the modal after submission
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById(
      "viewCreateAssignUserRoleModal"
    );
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    setIsModalOpen(false);
    setClearSelectTrigger((prev) => prev + 1);
  };

  const handleFetchGroups = async (searchValue = "") => {
    try {
      const result = await fetchData({
        url: "/system/system-groups",
        filter: {
          page: 1,
          page_size: 500,
          paginated: true,
          search: searchValue,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        const rows = normalizeListPayload(result.data);
        const formattedOptions = rows
          .map((group) => ({
            value: groupOptionValue(group),
            label:
              group?.name != null && String(group.name).trim() !== ""
                ? String(group.name)
                : `Role #${groupOptionValue(group) ?? "?"}`,
          }))
          .filter((o) => o.value != null);

        // Only treat current right-hand selection as assigned (not stale selectedObj.groups)
        const assignedIds = new Set(rightOptions.map((g) => g.value));
        const unassignedGroups = formattedOptions.filter(
          (group) => !assignedIds.has(group.value)
        );

        setLeftOptions(unassignedGroups);
        return unassignedGroups;
      }
      setLeftOptions([]);
      return [];
    } catch (err) {
      setLeftOptions([]);
      return [];
    }
  };

  useEffect(() => {
    const modalElement = document.getElementById(
      "viewCreateAssignUserRoleModal"
    );
    if (!modalElement) return;

    const handleShow = () => setIsModalOpen(true);
    const handleHide = () => setIsModalOpen(false);

    modalElement.addEventListener("shown.bs.modal", handleShow);
    modalElement.addEventListener("hidden.bs.modal", handleHide);

    return () => {
      modalElement.removeEventListener("shown.bs.modal", handleShow);
      modalElement.removeEventListener("hidden.bs.modal", handleHide);
    };
  }, []);

  useEffect(() => {
    // When modal opens or selectedObj/tableRefresh changes, populate rightOptions with user's current groups
    if (isModalOpen && selectedObj !== null) {
      // First fetch all groups, then match with user's groups
      const fetchAndSetGroups = async () => {
        try {
          const result = await fetchData({
            url: "/system/system-groups",
            filter: {
              page: 1,
              page_size: 500,
              paginated: true,
              search: "",
            },
          });
          if (result.status === 200 || result.status === 8000) {
            const rows = normalizeListPayload(result.data);
            const allGroups = rows
              .map((group) => ({
                value: groupOptionValue(group),
                label:
                  group?.name != null && String(group.name).trim() !== ""
                    ? String(group.name)
                    : `Role #${groupOptionValue(group) ?? "?"}`,
              }))
              .filter((o) => o.value != null);

            // Match user's groups (lowercase from UserSerializer.get_groups) to Group.name (any casing)
            const userGroupNamesLower = new Set(
              (selectedObj?.groups || []).map(normGroupName)
            );
            const matchedGroups = allGroups.filter((group) =>
              userGroupNamesLower.has(normGroupName(group.label))
            );
            
            // Update rightOptions with matched groups - this ensures removed roles are not shown
            setRightOptions(matchedGroups);
            // Set left options to groups not assigned to user
            const assignedGroupIds = matchedGroups.map((g) => g.value);
            setLeftOptions(allGroups.filter((g) => !assignedGroupIds.includes(g.value)));
          }
        } catch (err) {
          console.error("Error fetching groups:", err);
          setRightOptions([]);
          setLeftOptions([]);
        }
      };
      // Add a small delay to ensure selectedObj is fully updated after tableRefresh
      const timer = setTimeout(() => {
        fetchAndSetGroups();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setRightOptions([]);
      setLeftOptions([]);
    }
    // Use guid (not selectedObj identity) so parent re-renders don't reset the dual list mid-edit
  }, [isModalOpen, selectedObj?.guid, tableRefresh]);

  return (
    <>
      <div
        className="modal modal-slide-in"
        id="viewCreateAssignUserRoleModal"
        tabIndex="-1"
        aria-hidden="true"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                User Role and Permission Assignment
              </h5>
              <button
                onClick={() => handleClose()}
                type="button"
                className="btn-close"
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
              {({
                isSubmitting,
                setSubmitting,
                setErrors,
                resetForm,
              }) => (
                <Form>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-sm-11 text-normal">
                        <p className="text-justify">
                          Use the panel below to manage permissions. All
                          available Role appear on the
                          <strong> left</strong>, and all assigned Role appear
                          on the <strong> right</strong>. Select items and click
                          the{" "}
                          <span className="text-success fw-bold">
                            green arrow
                          </span>{" "}
                          to assign, or click the{" "}
                          <span className="text-danger fw-bold">red arrow</span>{" "}
                          to remove them.
                        </p>
                      </div>
                    </div>
                    <div className="row mb-3">
                      {selectedObj && (
                        <div className="d-flex justify-content-start align-items-center user-name">
                          <div className="avatar-wrapper">
                            <div className="avatar avatar-sm me-4">
                              <img
                                src={
                                  selectedObj.photo && selectedObj.photo !== ""
                                    ? selectedObj.photo
                                    : "../../../assets/img/avatars/1.png"
                                }
                                alt="Avatar"
                                className="rounded-circle"
                                style={{ width: "40px", height: "40px" }}
                              />
                            </div>
                          </div>
                          <div className="d-flex flex-column">
                            <span className="text-heading text-truncate">
                              <span className="fw-medium text-uppercase">
                                {selectedObj.first_name}{" "}
                                {selectedObj.middle_name}{" "}
                                {selectedObj.last_name}
                              </span>
                              &nbsp;
                              <span className="text-secondary">
                                ({selectedObj.pf_number || ""} )
                              </span>
                            </span>
                            <small className="text-primary">
                              {selectedObj.email && selectedObj.email !== ""
                                ? selectedObj.email
                                : "- - -"}
                            </small>
                          </div>
                        </div>
                      )}
                      <Field
                        type="hidden"
                        name="user_uid"
                        id="nameLarge"
                        className="form-control"
                        placeholder="Enter Name"
                      />
                      <ErrorMessage
                        name="user_uid"
                        component="div"
                        className="text-danger"
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-12">
                        <DualListSelect
                          leftTitle="Available Permissions"
                          rightTitle="Assigned Permissions"
                          leftOptions={leftOptions}
                          rightOptions={rightOptions}
                          onAssign={handleAssign}
                          onRemove={handleRemove}
                          clearTrigger={clearSelectTrigger}
                          searchMethod={handleFetchGroups}
                        />
                      </div>
                    </div>

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
                        aria-label="Save role assignment"
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

export default UserPermissionModal;
