import React, { useState } from "react";
import AsyncSelect from "react-select/async";
import debounce from "lodash/debounce";

const AsyncSelectWrapper = ({
  name,
  value,
  onChange,
  fetchOptions,
  defaultOptions = [],
  ...props
}) => {
  const [options, setOptions] = useState(defaultOptions);

  const loadOptions = debounce(async (inputValue, callback) => {
    try {
      const items = await fetchOptions(inputValue);
      setOptions(items);
      callback(
        items.map((item) => ({
          value: item.uid,
          label: item.name,
        }))
      );
    } catch (error) {
      callback([]);
    }
  }, 300);

  return (
    <AsyncSelect
      cacheOptions
      options={options.map((item) => ({
        value: item.uid,
        label: item.name,
      }))}
      loadOptions={loadOptions}
      onChange={(selectedOption) => {
        onChange(name, selectedOption?.value || "");
      }}
      value={
        options
          .map((item) => ({ value: item.uid, label: item.name }))
          .find((option) => option.value === value) || null
      }
      {...props}
    />
  );
};

export default AsyncSelectWrapper;
