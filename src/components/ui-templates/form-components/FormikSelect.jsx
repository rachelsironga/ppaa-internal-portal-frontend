import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import { useField, useFormikContext } from "formik";
import { fetchData } from "../../../utils/GlobalQueries";

const FormikSelect = ({
  name,
  label,
  url,
  isFullPath = false,
  filters = { paginated: true, page: 1, page_size: 10 },
  mapOption = (item) => ({ value: item?.uid, label: item?.name, ...item }),
  staticOptions = [],
  isMulti = false,
  placeholder = "Select...",
  containerClass = "col-md-6 mb-3",
  formatOptionLabel,
  debounceMs = 400,
  minChars = 2,
  isReadOnly = false,
  onSelectObject,
  ...selectProps
}) => {
  const [field, meta] = useField(name);
  const { setFieldValue } = useFormikContext();

  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const latestReqId = useRef(0);
  const hasFetchedInitial = useRef(false);
  const previousFiltersRef = useRef(null);

  // Memoize mapOption to prevent infinite loops
  const stableMapOption = useCallback(mapOption, []);

  // Memoize filters string to detect real changes
  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  // Initialize static options once
  useEffect(() => {
    if (Array.isArray(staticOptions) && staticOptions.length > 0) {
      const mapped = staticOptions.map(stableMapOption).filter(Boolean);
      setOptions(mapped);
    }
  }, [staticOptions, stableMapOption]);

  // Merge helper: ensures previously selected options stay in the list
  const mergeOptions = useCallback((newOpts) => {
    if (!newOpts || newOpts.length === 0) return;
    setOptions((prev) => {
      const merged = [...prev];
      newOpts.forEach((opt) => {
        if (opt && opt.value && !merged.find((x) => x.value === opt.value)) {
          merged.push(opt);
        }
      });
      return merged;
    });
  }, []);

  // Fetch data function
  const doFetch = useCallback(async (searchValue = "") => {
    if (!url) return;
    
    const reqId = ++latestReqId.current;
    setLoading(true);
    
    try {
      const result = await fetchData({
        url,
        isFullPath,
        filter: { ...filters, search: searchValue },
      });
      
      if (reqId !== latestReqId.current) return;

      const ok = result?.status === 200 || result?.status === 8000;
      const data = ok ? result?.data ?? [] : [];
      const mapped = data.map(stableMapOption).filter(Boolean);

      if (mapped.length > 0) {
        mergeOptions(mapped);
      }
    } catch (e) {
      console.error("FormikSelect fetch error:", e);
    } finally {
      if (reqId === latestReqId.current) setLoading(false);
    }
  }, [url, isFullPath, filters, stableMapOption, mergeOptions]);

  // Debounced fetch for search
  const debouncedFetch = useMemo(() => {
    let timeoutId;
    return (query) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => doFetch(query), debounceMs);
    };
  }, [doFetch, debounceMs]);

  // Initial fetch - only when URL or filters actually change
  useEffect(() => {
    if (!url) return;
    
    // Check if filters actually changed
    if (previousFiltersRef.current === filtersString && hasFetchedInitial.current) {
      return;
    }
    
    previousFiltersRef.current = filtersString;
    hasFetchedInitial.current = true;
    doFetch("");
  }, [url, filtersString, isFullPath, doFetch]);

  // Fetch initial value if not in options (for edit mode)
  useEffect(() => {
    const initValue = field.value;
    if (!initValue || !url) return;

    // For multi-select, check if all values exist
    if (Array.isArray(initValue)) {
      if (initValue.length === 0) return;
      const allExist = initValue.every(v => options.find((opt) => opt.value === v));
      if (allExist) return;
    } else {
      const exists = options.find((opt) => opt.value === initValue);
      if (exists) return;
    }

    // Fetch first missing value
    const valueToFetch = Array.isArray(initValue) ? initValue[0] : initValue;
    if (!valueToFetch) return;

    (async () => {
      try {
        const fetchUrl = isFullPath ? `${url}/${valueToFetch}` : `${url}/${valueToFetch}`;
        const res = await fetchData({
          url: fetchUrl,
          isFullPath: true,
        });
        if ((res?.status === 200 || res?.status === 8000) && res.data) {
          const mapped = stableMapOption(res.data);
          if (mapped) mergeOptions([mapped]);
        }
      } catch (err) {
        console.error("Failed to load initial option:", err);
      }
    })();
    // Only depend on field.value and options length to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.value, options.length]);

  // Compute current value for react-select
  const currentValue = useMemo(() => {
    if (isMulti) {
      if (!Array.isArray(field.value) || field.value.length === 0) return [];
      return options.filter((opt) => field.value.includes(opt.value));
    }
    return options.find((opt) => opt.value === field.value) || null;
  }, [field.value, options, isMulti]);

  // Handle selection change
  const handleChange = useCallback((selected) => {
    if (isMulti) {
      const keys = Array.isArray(selected) ? selected.map((s) => s.value) : [];
      setFieldValue(name, keys);
      if (selected && selected.length > 0) mergeOptions(selected);
    } else {
      setFieldValue(name, selected ? selected.value : null);
      if (selected) mergeOptions([selected]);
    }

    if (typeof onSelectObject === "function") {
      onSelectObject(selected);
    }
  }, [isMulti, name, setFieldValue, mergeOptions, onSelectObject]);

  // Handle input change for search
  const handleInputChange = useCallback((inputValue, { action }) => {
    if (action !== "input-change") return inputValue;
    if (!url) return inputValue;
    
    if (minChars && inputValue.length < minChars) {
      return inputValue;
    }
    
    debouncedFetch(inputValue);
    return inputValue;
  }, [url, minChars, debouncedFetch]);

  return (
    <div className={containerClass}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
        </label>
      )}

      <Select
        inputId={name}
        isMulti={isMulti}
        isClearable
        isLoading={loading}
        options={options}
        placeholder={placeholder}
        value={currentValue}
        isDisabled={isReadOnly}
        onChange={handleChange}
        onInputChange={handleInputChange}
        styles={{
          menu: (base) => ({
            ...base,
            position: "absolute",
            zIndex: 9999,
          }),
        }}
        formatOptionLabel={(option, context) =>
          typeof formatOptionLabel === "function"
            ? formatOptionLabel(option, context)
            : option.label
        }
        getOptionValue={(opt) => String(opt?.value ?? "")}
        getOptionLabel={(opt) => String(opt?.label ?? "")}
        {...selectProps}
      />

      {meta.touched && meta.error && (
        <div className="text-danger small">{meta.error}</div>
      )}
    </div>
  );
};

export default FormikSelect;
