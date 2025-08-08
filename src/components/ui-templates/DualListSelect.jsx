import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Select from "react-select";
import { fetchData } from "../../utils/GlobalQueries";

const DualListSelect = ({
  leftTitle = "Available Items",
  rightTitle = "Selected Items",
  leftOptions = [],
  rightOptions = [],
  onAssign,
  onRemove,
  isLoadingLeft = false,
  isLoadingRight = false,
  clearTrigger = 0,
  searchMethod = null,
}) => {
  const [selectedLeft, setSelectedLeft] = useState([]);
  const [selectedRight, setSelectedRight] = useState([]);

  const selectStyles = {
    menu: (base) => ({
      ...base,
      position: "relative",
      zIndex: 9999,
      textAlign: "left",
      padding: "8px",
      minHeight: "300px",
    }),
    groupHeading: (base) => ({
      ...base,
      fontWeight: "bolder",
      fontSize: "0.85rem",
      color: "#6f6c6b",
    }),
    placeholder: (base) => ({
      ...base,
      textAlign: "left",
    }),
    option: (base) => ({
      ...base,
      paddingLeft: "20px",
    }),
  };

  const [onlineLeftOptions, setOnlineLeftOptions] = useState([]);
  const [loadingLeftOnline, setLoadingLeftOnline] = useState(false);

  const handleFetchLeftOptions = async (searchValue = "") => {
    setLoadingLeftOnline(true);
    try {
      // Replace this with your actual API call
      const result = await fetchData({
        url: "/system/system-permissions",
        filter: {
          page: 1,
          page_size: 20,
          paginated: true,
          search: searchValue,
        },
      });

      if (result.status === 200 || result.status === 8000) {
        setOnlineLeftOptions(
          result.data.map((item) => ({
            value: item.uid,
            label: `${item.name} (${item.codename})`,
          }))
        );
      } else {
        setOnlineLeftOptions([]);
      }
    } catch (err) {
      setOnlineLeftOptions([]);
    } finally {
      setLoadingLeftOnline(false);
    }
  };

  const handleSearchLeft = async (searchValue) => {
    if (!searchMethod || searchValue.length < 2) {
      setOnlineLeftOptions([]);
      return;
    }

    setLoadingLeftOnline(true);
    try {
      const results = await searchMethod(searchValue);
      // Expecting results as array of { value, label }
      setOnlineLeftOptions(results || []);
    } catch (err) {
      setOnlineLeftOptions([]);
    } finally {
      setLoadingLeftOnline(false);
    }
  };

  const handleAssign = () => {
    if (onAssign && selectedLeft.length > 0) {
      onAssign(selectedLeft);
      setSelectedLeft([]);
    }
  };

  const handleRemove = () => {
    if (onRemove && selectedRight.length > 0) {
      onRemove(selectedRight);
      setSelectedRight([]);
    }
  };

  const normalize = (items) =>
    (items || []).map((item) => ({
      value: item.value ?? item.id ?? item.uid,
      label: String(item.label ?? item.name ?? item.code ?? ""),
    }));

  useEffect(() => {
    setSelectedLeft([]);
    setSelectedRight([]);
  }, [clearTrigger]);

  return (
    <div className="row">
      <div className="col-sm-5">
        <label className="fw-bold mb-2">{leftTitle}</label>
        <Select
          isLoading={isLoadingLeft || loadingLeftOnline}
          isSearchable
          isMulti
          menuIsOpen
          closeMenuOnSelect={false}
          className="select2-selection fetched-select2"
          options={
            onlineLeftOptions.length > 0
              ? normalize(onlineLeftOptions)
              : normalize(leftOptions)
          }
          value={normalize(selectedLeft)}
          onChange={(selected) => setSelectedLeft(normalize(selected))}
          styles={selectStyles}
          placeholder="Search or select items..."
        />
      </div>

      <div className="col-sm-2 text-center d-flex flex-column justify-content-center">
        <button
          className="btn btn-success btn-sm mb-3"
          onClick={handleAssign}
          title="Assign selected items"
          disabled={selectedLeft.length === 0}
        >
          <i className="bx bx-right-arrow-alt"></i>
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={handleRemove}
          title="Remove selected items"
          disabled={selectedRight.length === 0}
        >
          <i className="bx bx-left-arrow-alt"></i>
        </button>
      </div>

      <div className="col-sm-5">
        <label className="fw-bold mb-2">{rightTitle}</label>
        <Select
          isLoading={isLoadingRight}
          isSearchable
          isMulti
          menuIsOpen
          closeMenuOnSelect={false}
          className="select2-selection fetched-select2"
          options={rightOptions}
          value={selectedRight}
          onChange={setSelectedRight}
          styles={selectStyles}
          placeholder="Selected items..."
        />
      </div>
    </div>
  );
};

DualListSelect.propTypes = {
  leftTitle: PropTypes.string,
  rightTitle: PropTypes.string,
  leftOptions: PropTypes.array.isRequired,
  rightOptions: PropTypes.array.isRequired,
  onAssign: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  isLoadingLeft: PropTypes.bool,
  isLoadingRight: PropTypes.bool,
  clearTrigger: PropTypes.number,
  searchMethod: PropTypes.func,
};

export default DualListSelect;
