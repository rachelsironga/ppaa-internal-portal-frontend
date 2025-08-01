import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Select from "react-select";

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

  useEffect(() => {
    setSelectedLeft([]);
    setSelectedRight([]);
  }, [clearTrigger]);

  return (
    <div className="row">
      <div className="col-sm-5">
        <label className="fw-bold mb-2">{leftTitle}</label>
        <Select
          isLoading={isLoadingLeft}
          isSearchable
          isMulti
          menuIsOpen
          closeMenuOnSelect={false}
          className="select2-selection fetched-select2"
          options={leftOptions}
          value={selectedLeft}
          onChange={setSelectedLeft}
          styles={selectStyles}
          placeholder="Select items..."
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
};

export default DualListSelect;
