import React, { useEffect, useMemo, useRef, useState } from "react";
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

  const [options, setOptions] = useState(() =>
    Array.isArray(staticOptions) ? staticOptions.map(mapOption) : []
  );
  const [loading, setLoading] = useState(false);
  const latestReqId = useRef(0);

  // merge helper: ensures previously selected options stay in the list
  const mergeOptions = (newOpts) => {
    setOptions((prev) => {
      const merged = [...prev];
      newOpts.forEach((opt) => {
        if (!merged.find((x) => x.value === opt.value)) {
          merged.push(opt);
        }
      });
      return merged;
    });
  };

  const doFetch = async (searchValue = "") => {
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
      const mapped = data.map(mapOption).filter(Boolean);

      mergeOptions(mapped);
    } catch (e) {
      if (reqId === latestReqId.current) setOptions([]);
    } finally {
      if (reqId === latestReqId.current) setLoading(false);
    }
  };

  const debouncedFetch = useMemo(() => {
    let t;
    return (q) => {
      clearTimeout(t);
      t = setTimeout(() => doFetch(q), debounceMs);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, debounceMs, JSON.stringify(filters), isFullPath]);

  useEffect(() => {
    if (url) doFetch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, JSON.stringify(filters), isFullPath]);

  useEffect(() => {
    const initValue = field.value;

    if (!initValue) return;

    const exists = options.find((opt) => opt.value === initValue);
    if (exists) return;

    // 🔑 Fetch single option by id if not already in options
    (async () => {
      try {
        const res = await fetchData({
          url: isFullPath ? url : `${url}/${initValue}`,
          isFullPath,
        });
        if ((res?.status === 200 || res?.status === 8000) && res.data) {
          const mapped = mapOption(res.data);
          mergeOptions([mapped]);
        }
      } catch (err) {
        console.error("Failed to load initial option:", err);
      }
    })();
  }, [field.value, options, url, isFullPath, mapOption]);

  // Formik only stores uid(s)
  const currentValue = useMemo(() => {
    if (isMulti) {
      if (!Array.isArray(field.value)) return [];
      return options.filter((opt) => field.value.includes(opt.value));
    }
    return options.find((opt) => opt.value === field.value) || null;
  }, [field.value, options, isMulti]);

  return (
    <div className={containerClass}>
      {label ? (
        <label htmlFor={name} className="form-label">
          {label}
        </label>
      ) : null}

      <Select
        inputId={name}
        isMulti={isMulti}
        isClearable
        isLoading={loading}
        options={options}
        placeholder={placeholder}
        value={currentValue}
        isDisabled={isReadOnly}
        onChange={(selected) => {
          if (isMulti) {
            const keys = Array.isArray(selected)
              ? selected.map((s) => s.value)
              : [];
            setFieldValue(name, keys);
            mergeOptions(selected || []);
          } else {
            setFieldValue(name, selected ? selected.value : null);
            if (selected) mergeOptions([selected]);
          }

          /** 🔑 fire optional callback with selected object(s) */
          if (typeof onSelectObject === "function") {
            onSelectObject(selected);
          }
        }}
        onInputChange={(inputValue, { action }) => {
          if (action !== "input-change") return inputValue;
          if (!url) return inputValue;
          if (minChars && inputValue.length < minChars) {
            setOptions(staticOptions.map(mapOption));
            return inputValue;
          }
          debouncedFetch(inputValue);
          return inputValue;
        }}
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

      {meta.touched && meta.error ? (
        <div className="text-danger">{meta.error}</div>
      ) : null}
    </div>
  );
};

export default FormikSelect;
