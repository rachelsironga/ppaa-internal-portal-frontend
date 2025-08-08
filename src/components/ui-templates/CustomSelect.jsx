// components/CustomSelect.js
import React, { useState } from "react";
import PropTypes from "prop-types";
import Select from "react-select";

const normalize = (items) =>
  (items || []).map((item) => ({
    value: item.value ?? item.id ?? item.uid ?? item.code,
    label: String(item.label ?? item.name ?? item.code ?? ""),
  }));

const CustomSelect = ({
  options = [],
  value = [],
  onChange,
  isLoading = false,
  searchMethod = null,
  placeholder = "Search or select items...",
  minSearchLength = 2,
  isMulti = true,
  menuAlwaysOpen = true,
}) => {
  const [onlineOptions, setOnlineOptions] = useState([]);
  const [loadingOnline, setLoadingOnline] = useState(false);

  const handleSearch = async (searchValue) => {
    if (!searchMethod || searchValue.length < minSearchLength) {
      setOnlineOptions([]);
      return;
    }

    setLoadingOnline(true);
    try {
      const results = await searchMethod(searchValue);
      setOnlineOptions(normalize(results || []));
    } catch (err) {
      setOnlineOptions([]);
    } finally {
      setLoadingOnline(false);
    }
  };

  const selectStyles = {
    menu: (base) => ({
      ...base,
      position: "relative",
      zIndex: 9999,
      textAlign: "left",
      padding: "8px",
      minHeight: "200px",
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

  return (
    <Select
      isMulti={isMulti}
      menuIsOpen={menuAlwaysOpen}
      closeMenuOnSelect={false}
      className="select2-selection fetched-select2"
      isLoading={isLoading || loadingOnline}
      options={onlineOptions.length > 0 ? onlineOptions : normalize(options)}
      value={normalize(value)}
      onChange={(selected) => onChange(normalize(selected))}
      onInputChange={handleSearch}
      styles={selectStyles}
      placeholder={placeholder}
    />
  );
};

CustomSelect.propTypes = {
  options: PropTypes.array,
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  searchMethod: PropTypes.func,
  placeholder: PropTypes.string,
  minSearchLength: PropTypes.number,
  isMulti: PropTypes.bool,
  menuAlwaysOpen: PropTypes.bool,
};

export default CustomSelect;
